"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId, getEventSettingsById } from "@/lib/event";
import { sendMail } from "@/lib/email";
import { renderTemplate } from "@/lib/template";
import { SITE_URL } from "@/lib/site";
import { normalizeSubject } from "@/lib/communication";
import type { ComposeState, TemplateFormState } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Create (no `id`) or update (with `id`) an email template for the admin's
 * current event (Phase D — Email Center). Both paths are scoped by event so one
 * event can't edit another's templates.
 */
export async function saveTemplateAction(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const id = str(formData, "id");
  const name = str(formData, "name");
  const subject = str(formData, "subject");
  const body = str(formData, "body");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  else if (name.length > 120) errors.name = "Max 120 characters.";
  if (!subject) errors.subject = "Subject is required.";
  else if (subject.length > 200) errors.subject = "Max 200 characters.";
  if (!body) errors.body = "Body is required.";
  else if (body.length > 5000) errors.body = "Max 5000 characters.";
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const eventId = await getAdminEventId();

  if (id) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { id, eventId },
      select: { id: true },
    });
    if (!existing) return { ok: false, message: "Template not found." };
    await prisma.emailTemplate.update({ where: { id }, data: { name, subject, body } });
  } else {
    await prisma.emailTemplate.create({ data: { eventId, name, subject, body } });
  }

  revalidatePath("/admin/email-center");
  return { ok: true, message: id ? "Template saved." : "Template created." };
}

/**
 * Delete a template. Its sent-history stays intact — Outreach.templateId is
 * `onDelete: SetNull`, so past logs just show "Custom" afterwards.
 */
export async function deleteTemplateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const eventId = await getAdminEventId();
  const existing = await prisma.emailTemplate.findFirst({
    where: { id, eventId },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/admin/email-center");
}

/**
 * Compose and send a one-off email to a candidate (by id) or any address, with
 * merge fields rendered server-side, and log it as a SENT Outreach. Reuses the
 * same transport as invites (Ethereal in dev → preview URL; SMTP in prod).
 */
export async function sendComposedEmailAction(
  _prev: ComposeState,
  formData: FormData,
): Promise<ComposeState> {
  const eventId = await getAdminEventId();
  const sponsorId = str(formData, "sponsorId");
  const manualEmail = str(formData, "email");
  const templateId = str(formData, "templateId");
  const subjectRaw = str(formData, "subject");
  const bodyRaw = str(formData, "body");

  const errors: Record<string, string> = {};
  if (!subjectRaw) errors.subject = "Subject is required.";
  if (!bodyRaw) errors.body = "Body is required.";

  // Resolve recipient: a candidate (scoped to the event) takes precedence, else
  // a manually typed address.
  let to = "";
  let sponsor: {
    id: string;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    package: { name: string } | null;
  } | null = null;
  if (sponsorId) {
    sponsor = await prisma.sponsor.findFirst({
      where: { id: sponsorId, eventId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactEmail: true,
        package: { select: { name: true } },
      },
    });
    if (!sponsor) errors.recipient = "Recipient not found.";
    else if (!sponsor.contactEmail) errors.recipient = "This candidate has no email on file.";
    else to = sponsor.contactEmail;
  } else if (manualEmail) {
    if (!EMAIL_RE.test(manualEmail)) errors.email = "Enter a valid email address.";
    else to = manualEmail;
  } else {
    errors.recipient = "Choose a candidate or enter an email.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Sponsor-facing merge field: use the composing event, not the default (P0-1).
  const { name: event } = await getEventSettingsById(eventId);
  const fields: Record<string, string> = {
    event,
    companyName: sponsor?.companyName ?? "",
    contactName: sponsor?.contactName ?? "there",
    packageName: sponsor?.package?.name ?? "",
    link: SITE_URL,
  };
  const subject = renderTemplate(subjectRaw, fields);
  const text = renderTemplate(bodyRaw, fields);

  // Only link a template we can confirm belongs to this event (avoids FK errors).
  let linkedTemplateId: string | null = null;
  if (templateId) {
    const tpl = await prisma.emailTemplate.findFirst({
      where: { id: templateId, eventId },
      select: { id: true },
    });
    linkedTemplateId = tpl?.id ?? null;
  }

  let previewUrl: string | undefined;
  try {
    const result = await sendMail({ to, subject, text });
    previewUrl = result.previewUrl;
  } catch (err) {
    return { ok: false, message: `Email send failed: ${(err as Error).message}` };
  }

  await prisma.outreach.create({
    data: {
      eventId,
      sponsorId: sponsor?.id ?? null,
      templateId: linkedTemplateId,
      prospectEmail: to,
      subject,
      body: text,
      direction: "OUTBOUND",
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath("/admin/email-center");
  return { ok: true, message: `Email sent to ${to}.`, previewUrl };
}

export async function markThreadReadAction(formData: FormData): Promise<void> {
  const sponsorId = str(formData, "sponsorId");
  const subjectKey = str(formData, "subjectKey");
  const returnTo = str(formData, "returnTo");
  if (!sponsorId || !subjectKey) return;

  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: { id: true },
  });
  if (!sponsor) return;

  const unread = await prisma.outreach.findMany({
    where: { eventId, sponsorId, direction: "INBOUND", readAt: null },
    select: { id: true, subject: true },
  });
  const ids = unread
    .filter((m) => normalizeSubject(m.subject) === subjectKey)
    .map((m) => m.id);

  if (ids.length > 0) {
    await prisma.outreach.updateMany({
      where: { id: { in: ids } },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/admin/email-center");
  revalidatePath(`/admin/candidates/${sponsorId}`);
  if (returnTo.startsWith("/admin/email-center/threads/")) redirect(returnTo);
}
