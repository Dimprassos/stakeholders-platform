"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateMagicToken, tokenExpiry } from "@/lib/magic-token";
import { sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { renderTemplate } from "@/lib/template";
import { isPackageFull } from "@/lib/slots";
import { getAdminEventId, getEventSettings } from "@/lib/event";
import { can } from "@/lib/sponsor-lifecycle";

export type InviteState = { ok: boolean; message?: string; previewUrl?: string };

export async function sendInviteAction(
  sponsorId: string,
): Promise<InviteState> {
  if (!sponsorId) return { ok: false, message: "Missing sponsor id." };

  // Scope to the admin's current event, like every other candidate action.
  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    include: { package: true },
  });
  if (!sponsor) return { ok: false, message: "Sponsor not found." };

  const verdict = can(sponsor, "invite");
  if (!verdict.ok) return { ok: false, message: verdict.reason };
  // `can()` guarantees both of these; narrow them for TypeScript.
  if (!sponsor.package || !sponsor.contactEmail) {
    return { ok: false, message: "Assign a package and a contact email first." };
  }

  // Slot guard: sending an invite moves the candidate to INVITE_SENT, which
  // occupies a slot. Refuse if the package is already full.
  if (await isPackageFull(sponsor.package.id, sponsor.id)) {
    const total = sponsor.package.slotsTotal;
    return {
      ok: false,
      message: `"${sponsor.package.name}" is fully booked${
        total != null ? ` (${total}/${total} slots taken)` : ""
      }. Free a slot or assign another package before inviting.`,
    };
  }

  const token = generateMagicToken();
  const issuedAt = new Date();
  const expiresAt = tokenExpiry(issuedAt);

  const { name: event } = await getEventSettings();

  const link = `${SITE_URL}/invite/${token}`;
  const fields: Record<string, string> = {
    event,
    companyName: sponsor.companyName,
    packageName: sponsor.package.name,
    contactName: sponsor.contactName ?? "there",
    link,
  };

  const template = await prisma.emailTemplate.findUnique({
    where: { id: "default-invite" },
  });
  const subject = template
    ? renderTemplate(template.subject, fields)
    : `Sponsorship invitation — ${event}`;
  const text = template
    ? renderTemplate(template.body, fields)
    : `Review your package and accept/decline: ${link}`;

  // Persist the token BEFORE sending, so the link in the recipient's inbox is
  // always one that works. If the send then fails we put the record back exactly
  // as it was, rather than leaving the candidate marked as invited.
  const previous = {
    status: sponsor.status,
    magicToken: sponsor.magicToken,
    tokenIssuedAt: sponsor.tokenIssuedAt,
    tokenExpiresAt: sponsor.tokenExpiresAt,
  };
  await prisma.sponsor.update({
    where: { id: sponsorId },
    data: {
      magicToken: token,
      tokenIssuedAt: issuedAt,
      tokenExpiresAt: expiresAt,
      status: "INVITE_SENT",
    },
  });

  let previewUrl: string | undefined;
  try {
    const result = await sendMail({
      to: sponsor.contactEmail,
      subject,
      text,
    });
    previewUrl = result.previewUrl;
  } catch (err) {
    await prisma.sponsor.update({ where: { id: sponsorId }, data: previous });
    return {
      ok: false,
      message: `Email send failed: ${(err as Error).message}`,
    };
  }

  // Log the outreach only once the email is actually on its way.
  await prisma.outreach.create({
    data: {
      eventId: sponsor.eventId,
      sponsorId,
      templateId: template?.id ?? null,
      prospectEmail: sponsor.contactEmail,
      subject,
      body: text,
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Invite sent to ${sponsor.contactEmail}.`,
    previewUrl,
  };
}
