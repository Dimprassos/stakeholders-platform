"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateMagicToken, tokenExpiry } from "@/lib/magic-token";
import { sendMail } from "@/lib/email";
import { renderTemplate } from "@/lib/template";

export type InviteState = { ok: boolean; message?: string; previewUrl?: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getSettingValue(
  settings: { key: string; value: string }[],
  key: string,
  fallback = "",
): string {
  return settings.find((s) => s.key === key)?.value ?? fallback;
}

export async function sendInviteAction(
  sponsorId: string,
): Promise<InviteState> {
  if (!sponsorId) return { ok: false, message: "Missing sponsor id." };

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    include: { package: true },
  });
  if (!sponsor) return { ok: false, message: "Sponsor not found." };
  if (!sponsor.packageId || !sponsor.package) {
    return {
      ok: false,
      message: "Assign a package before sending an invite.",
    };
  }
  if (!sponsor.contactEmail) {
    return { ok: false, message: "Candidate has no contact email." };
  }

  const token = generateMagicToken();
  const issuedAt = new Date();
  const expiresAt = tokenExpiry(issuedAt);

  const settings = await prisma.setting.findMany();
  const event = getSettingValue(settings, "eventName", "our event");

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

  let previewUrl: string | undefined;
  try {
    const result = await sendMail({
      to: sponsor.contactEmail,
      subject,
      text,
    });
    previewUrl = result.previewUrl;
  } catch (err) {
    return {
      ok: false,
      message: `Email send failed: ${(err as Error).message}`,
    };
  }

  // Persist token + log the outreach.
  await prisma.$transaction([
    prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        magicToken: token,
        tokenIssuedAt: issuedAt,
        tokenExpiresAt: expiresAt,
        status: "INVITE_SENT",
      },
    }),
    prisma.outreach.create({
      data: {
        sponsorId,
        templateId: template?.id ?? null,
        prospectEmail: sponsor.contactEmail,
        subject,
        body: text,
        status: "SENT",
        sentAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Invite sent to ${sponsor.contactEmail}.`,
    previewUrl,
  };
}