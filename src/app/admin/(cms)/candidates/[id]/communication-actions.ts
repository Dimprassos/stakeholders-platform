"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function ownedSponsor(sponsorId: string) {
  if (!sponsorId) return null;
  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: {
      id: true,
      eventId: true,
      companyName: true,
      contactEmail: true,
    },
  });
  return sponsor;
}

/** Log a sponsor's inbound email/reply manually (Phase D first slice). */
export async function logInboundReplyAction(formData: FormData): Promise<void> {
  const sponsorId = str(formData, "sponsorId");
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  const sponsor = await ownedSponsor(sponsorId);
  if (!sponsor) return;
  if (!body) redirect(`/admin/candidates/${sponsorId}?commerr=body`);

  await prisma.outreach.create({
    data: {
      eventId: sponsor.eventId,
      sponsorId: sponsor.id,
      prospectEmail: sponsor.contactEmail,
      subject: subject || `Reply from ${sponsor.companyName}`,
      body,
      direction: "INBOUND",
      status: "REPLIED",
      receivedAt: new Date(),
    },
  });

  revalidatePath(`/admin/candidates/${sponsor.id}`);
  revalidatePath("/admin/email-center");
  redirect(`/admin/candidates/${sponsor.id}?replyLogged=1`);
}

export async function markReplyReadAction(formData: FormData): Promise<void> {
  const messageId = str(formData, "messageId");
  if (!messageId) return;
  const eventId = await getAdminEventId();
  const message = await prisma.outreach.findFirst({
    where: { id: messageId, eventId, direction: "INBOUND" },
    select: { id: true, sponsorId: true },
  });
  if (!message) return;
  await prisma.outreach.update({
    where: { id: message.id },
    data: { readAt: new Date() },
  });
  if (message.sponsorId) revalidatePath(`/admin/candidates/${message.sponsorId}`);
  revalidatePath("/admin/email-center");
  // Unread replies feed the reminders list and the topbar badge.
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function markSponsorRepliesReadAction(formData: FormData): Promise<void> {
  const sponsorId = str(formData, "sponsorId");
  const sponsor = await ownedSponsor(sponsorId);
  if (!sponsor) return;
  await prisma.outreach.updateMany({
    where: {
      eventId: sponsor.eventId,
      sponsorId: sponsor.id,
      direction: "INBOUND",
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath(`/admin/candidates/${sponsor.id}`);
  revalidatePath("/admin/email-center");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}
