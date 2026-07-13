"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId, getEventSettings } from "@/lib/event";
import { sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { isTokenExpired } from "@/lib/magic-token";
import { can, blockedUrl } from "@/lib/sponsor-lifecycle";

// Admin contract actions (docs/PLAN.md §16 Phase F). Draft → send (emails the
// sponsor a link) → the sponsor signs from their portal. All scoped to the
// current event.

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function ownedContract(contractId: string) {
  if (!contractId) return null;
  const eventId = await getAdminEventId();
  return prisma.contract.findFirst({
    where: { id: contractId, eventId },
    select: { id: true, sponsorId: true, status: true },
  });
}

/**
 * The sponsor this contract work is for, in the admin's current event, once the
 * lifecycle allows contracting. Redirects with the reason when it doesn't.
 */
async function contractableSponsor(sponsorId: string, eventId: string) {
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: { id: true, status: true },
  });
  if (!sponsor) return null;
  const verdict = can(sponsor, "contract");
  if (!verdict.ok) {
    redirect(blockedUrl(`/admin/candidates/${sponsorId}`, verdict.reason));
  }
  return sponsor;
}

async function contractSendRedirect(contractId: string, eventId: string): Promise<string | null> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, eventId },
    include: {
      sponsor: {
        select: {
          id: true,
          status: true,
          companyName: true,
          contactName: true,
          contactEmail: true,
          magicToken: true,
          tokenExpiresAt: true,
        },
      },
    },
  });
  if (!contract || contract.status === "SIGNED") return null;
  const sponsor = contract.sponsor;

  // Guard here too: `sendContractAction` reaches this with only a contract id,
  // so this is the only place its sponsor's status is known.
  const verdict = can(sponsor, "contract");
  if (!verdict.ok) {
    return blockedUrl(`/admin/candidates/${sponsor.id}`, verdict.reason);
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "SENT" },
  });

  const canEmail =
    !!sponsor.contactEmail &&
    !!sponsor.magicToken &&
    !isTokenExpired(sponsor.tokenExpiresAt);
  let previewParam = "";
  if (canEmail) {
    const { name: event } = await getEventSettings();
    const link = `${SITE_URL}/invite/${sponsor.magicToken}`;
    const subject = `Contract to sign — ${event}`;
    const text =
      `Hi ${sponsor.contactName ?? "there"},\n\n` +
      `Your sponsorship agreement for ${event} is ready to review and sign.\n\n` +
      `Open your sponsor portal to read and sign it:\n${link}\n\n` +
      `Thank you,\n${event}`;
    let previewUrl: string | undefined;
    try {
      const result = await sendMail({ to: sponsor.contactEmail!, subject, text });
      previewUrl = result.previewUrl;
    } catch {
      revalidatePath(`/admin/candidates/${sponsor.id}`);
      return `/admin/candidates/${sponsor.id}?contractSent=fail`;
    }
    await prisma.outreach.create({
      data: {
        eventId,
        sponsorId: sponsor.id,
        prospectEmail: sponsor.contactEmail,
        subject,
        body: text,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    if (previewUrl) previewParam = `&preview=${encodeURIComponent(previewUrl)}`;
  }

  revalidatePath(`/admin/candidates/${sponsor.id}`);
  return `/admin/candidates/${sponsor.id}?contractSent=${
    canEmail ? "1" : "noemail"
  }${previewParam}`;
}

export async function saveContractAction(formData: FormData): Promise<void> {
  const sponsorId = str(formData, "sponsorId");
  const contractId = str(formData, "contractId");
  const title = str(formData, "title") || "Sponsorship Agreement";
  const body = str(formData, "body");

  const eventId = await getAdminEventId();
  const sponsor = await contractableSponsor(sponsorId, eventId);
  if (!sponsor) return;
  if (!body) redirect(`/admin/candidates/${sponsorId}?conerr=body`);

  if (contractId) {
    const existing = await ownedContract(contractId);
    if (!existing || existing.status !== "DRAFT") return;
    await prisma.contract.update({
      where: { id: contractId },
      data: { title, body },
    });
  } else {
    await prisma.contract.create({
      data: { eventId, sponsorId, title, body, status: "DRAFT" },
    });
  }
  revalidatePath(`/admin/candidates/${sponsorId}`);
  redirect(`/admin/candidates/${sponsorId}?consaved=1`);
}

export async function saveAndSendContractAction(formData: FormData): Promise<void> {
  const sponsorId = str(formData, "sponsorId");
  const contractId = str(formData, "contractId");
  const title = str(formData, "title") || "Sponsorship Agreement";
  const body = str(formData, "body");

  const eventId = await getAdminEventId();
  const sponsor = await contractableSponsor(sponsorId, eventId);
  if (!sponsor) return;
  if (!body) redirect(`/admin/candidates/${sponsorId}?conerr=body`);

  let idToSend = contractId;
  if (contractId) {
    const existing = await ownedContract(contractId);
    if (!existing || existing.status !== "DRAFT") return;
    await prisma.contract.update({
      where: { id: contractId },
      data: { title, body, status: "DRAFT" },
    });
  } else {
    const created = await prisma.contract.create({
      data: { eventId, sponsorId, title, body, status: "DRAFT" },
      select: { id: true },
    });
    idToSend = created.id;
  }

  const to = await contractSendRedirect(idToSend, eventId);
  if (to) redirect(to);
}

export async function sendContractAction(formData: FormData): Promise<void> {
  const contractId = str(formData, "contractId");
  const eventId = await getAdminEventId();
  const to = await contractSendRedirect(contractId, eventId);
  if (to) redirect(to);
}

/** Move a SENT contract back to DRAFT so it can be edited/re-sent. */
export async function reopenContractAction(formData: FormData): Promise<void> {
  const contractId = str(formData, "contractId");
  const contract = await ownedContract(contractId);
  if (!contract || contract.status === "SIGNED") return;
  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "DRAFT" },
  });
  revalidatePath(`/admin/candidates/${contract.sponsorId}`);
}

export async function deleteContractAction(formData: FormData): Promise<void> {
  const contractId = str(formData, "contractId");
  const contract = await ownedContract(contractId);
  // Keep signed contracts for the audit trail; only unsigned ones can be removed.
  if (!contract || contract.status === "SIGNED") return;
  await prisma.contract.delete({ where: { id: contract.id } });
  revalidatePath(`/admin/candidates/${contract.sponsorId}`);
}
