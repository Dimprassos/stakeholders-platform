"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPackageFull, SLOT_HOLDING_STATUSES } from "@/lib/slots";
import { getAdminEventId } from "@/lib/event";
import { DELIVERABLE_TYPES } from "@/lib/deliverables";
import type { CandidateFormState } from "./types";
import { PIPELINE_STATUSES } from "./types";

const AddCandidateSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required." }),
  contactName: z.string().optional(),
  contactEmail: z.string().email({ message: "Enter a valid email." }).or(z.literal("")),
  packageId: z.string().optional(),
});

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function toErrors(result: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.issues) {
    const name = typeof issue.path[0] === "string" ? issue.path[0] : String(issue.path[0]);
    if (!errors[name]) errors[name] = issue.message;
  }
  return errors;
}

export async function addCandidateAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const raw = {
    companyName: str(formData, "companyName"),
    contactName: str(formData, "contactName"),
    contactEmail: str(formData, "contactEmail"),
    packageId: str(formData, "packageId"),
  };

  const parsed = AddCandidateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: toErrors(parsed.error),
    };
  }

  try {
    await prisma.sponsor.create({
      data: {
        eventId: await getAdminEventId(),
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName || null,
        contactEmail: parsed.data.contactEmail || null,
        packageId: parsed.data.packageId || null,
        status: "LEAD",
      },
    });
  } catch {
    return { ok: false, message: "Something went wrong while adding the candidate." };
  }

  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  return { ok: true, message: "Candidate added." };
}

function slotFullRedirect(packageName: string): never {
  redirect(`/admin/candidates?slotFull=${encodeURIComponent(packageName)}`);
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  if (!PIPELINE_STATUSES.includes(status as never)) return;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { status: true, packageId: true, package: { select: { name: true } } },
  });
  if (!sponsor) return;

  // Slot guard: only a transition that NEWLY occupies a slot (from a non-holding
  // LEAD/DECLINED into a holding status) can over-book. Shuffling an existing
  // holder between holding statuses doesn't consume an extra slot, so allow it.
  const newlyHolds =
    !SLOT_HOLDING_STATUSES.includes(sponsor.status) &&
    SLOT_HOLDING_STATUSES.includes(status);
  if (
    newlyHolds &&
    sponsor.packageId &&
    (await isPackageFull(sponsor.packageId, id))
  ) {
    slotFullRedirect(sponsor.package?.name ?? "package");
  }

  await prisma.sponsor.update({
    where: { id },
    // Leaving CONFIRMED must not leave a stale public listing behind.
    data: status === "CONFIRMED" ? { status } : { status, isPublished: false },
  });
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}

export async function assignPackageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  if (!id) return;

  // Slot guard: only when an existing slot-holder moves onto a DIFFERENT, full
  // package (re-selecting the same package is a no-op; an untouched LEAD /
  // DECLINED one can be parked on any package freely).
  if (packageId) {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      select: { status: true, packageId: true },
    });
    if (
      sponsor &&
      sponsor.packageId !== packageId &&
      SLOT_HOLDING_STATUSES.includes(sponsor.status) &&
      (await isPackageFull(packageId, id))
    ) {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        select: { name: true },
      });
      slotFullRedirect(pkg?.name ?? "package");
    }
  }

  await prisma.sponsor.update({
    where: { id },
    data: { packageId: packageId || null },
  });
  revalidatePath("/admin/candidates");
}

export async function updateSponsorNotesAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const id = str(formData, "id");
  if (!id) return { ok: false, message: "Missing sponsor." };

  const eventId = await getAdminEventId();
  // Scope to the admin's current event so one event can't edit another's records.
  const sponsor = await prisma.sponsor.findFirst({
    where: { id, eventId },
    select: { id: true },
  });
  if (!sponsor) return { ok: false, message: "Sponsor not found." };

  const notes = str(formData, "notes");
  if (notes.length > 5000) {
    return { ok: false, message: "Notes are too long (max 5000 characters)." };
  }

  await prisma.sponsor.update({
    where: { id },
    data: { notes: notes || null },
  });
  revalidatePath(`/admin/candidates/${id}`);
  return { ok: true, message: "Notes saved." };
}

export async function saveDeliverablesAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const id = str(formData, "id");
  if (!id) return { ok: false, message: "Missing sponsor." };

  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id, eventId },
    select: { id: true },
  });
  if (!sponsor) return { ok: false, message: "Sponsor not found." };

  // Rebuild the checklist from the submitted checkboxes (only known keys).
  const state: Record<string, boolean> = {};
  for (const { key } of DELIVERABLE_TYPES) {
    if (formData.get(`dlv_${key}`) === "on") state[key] = true;
  }

  await prisma.sponsor.update({
    where: { id },
    data: { deliverables: JSON.stringify(state) },
  });
  revalidatePath(`/admin/candidates/${id}`);
  return { ok: true, message: "Deliverables saved." };
}

export async function addTaskAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const sponsorId = str(formData, "sponsorId");
  const title = str(formData, "title");
  const dueDate = str(formData, "dueDate");
  if (!sponsorId) return { ok: false, message: "Missing sponsor." };
  if (!title) {
    return { ok: false, message: "Add a task title.", errors: { title: "Title is required." } };
  }
  if (title.length > 200) {
    return { ok: false, message: "Task title is too long (max 200 characters)." };
  }

  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: { id: true },
  });
  if (!sponsor) return { ok: false, message: "Sponsor not found." };

  await prisma.task.create({
    data: { eventId, sponsorId, title, dueDate: dueDate || null },
  });
  revalidatePath(`/admin/candidates/${sponsorId}`);
  return { ok: true, message: "Task added." };
}

/** Toggle a task's done state. Scoped to the admin's current event. */
export async function toggleTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("taskId") ?? "");
  if (!id) return;
  const eventId = await getAdminEventId();
  const task = await prisma.task.findFirst({
    where: { id, eventId },
    select: { id: true, done: true, sponsorId: true },
  });
  if (!task) return;
  await prisma.task.update({ where: { id }, data: { done: !task.done } });
  revalidatePath(`/admin/candidates/${task.sponsorId}`);
}

/** Delete a task. Scoped to the admin's current event. */
export async function deleteTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("taskId") ?? "");
  if (!id) return;
  const eventId = await getAdminEventId();
  const task = await prisma.task.findFirst({
    where: { id, eventId },
    select: { id: true, sponsorId: true },
  });
  if (!task) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/admin/candidates/${task.sponsorId}`);
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { isPublished: true, status: true },
  });
  if (!sponsor) return;

  // Only a CONFIRMED sponsor may be published. Un-publishing is always allowed.
  if (!sponsor.isPublished && sponsor.status !== "CONFIRMED") {
    redirect("/admin/candidates?publishNeedsConfirm=1");
  }

  await prisma.sponsor.update({
    where: { id },
    data: { isPublished: !sponsor.isPublished },
  });
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}