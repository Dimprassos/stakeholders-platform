"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPackageFull, SLOT_HOLDING_STATUSES } from "@/lib/slots";
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

  // Slot guard: moving a candidate into a holding status must not over-book a
  // full package (a slot is held by every status except LEAD / DECLINED).
  if (SLOT_HOLDING_STATUSES.includes(status)) {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      select: { packageId: true, package: { select: { name: true } } },
    });
    if (
      sponsor?.packageId &&
      (await isPackageFull(sponsor.packageId, id))
    ) {
      slotFullRedirect(sponsor.package?.name ?? "package");
    }
  }

  await prisma.sponsor.update({ where: { id }, data: { status } });
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}

export async function assignPackageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  if (!id) return;

  // Slot guard: only relevant when the candidate already holds a slot (an
  // untouched LEAD / DECLINED one can be parked on any package freely).
  if (packageId) {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      select: { status: true },
    });
    if (
      sponsor &&
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

export async function togglePublishAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!sponsor) return;
  await prisma.sponsor.update({
    where: { id },
    data: { isPublished: !sponsor.isPublished },
  });
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}