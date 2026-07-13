"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  createSponsorSession,
  clearSponsorSession,
  ensurePortalToken,
} from "@/lib/sponsor-auth";
import {
  findPortalSponsorsByEmail,
  findSponsorAccountsByEmail,
  isSponsorAccountStatus,
  normalizeContactEmail,
} from "@/lib/sponsor-identity";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import type { SponsorLoginState } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function loginSponsorAction(
  _prev: SponsorLoginState,
  formData: FormData,
): Promise<SponsorLoginState> {
  const email = normalizeContactEmail(str(formData, "email")) ?? "";
  const password = str(formData, "password");

  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Login is not tied to a "current" event — search accounts across all events.
  const candidates = (await findSponsorAccountsByEmail(email)).filter(
    (s) => s.passwordHash && isSponsorAccountStatus(s.status),
  );

  const validSponsors = [];
  for (const candidate of candidates) {
    if (
      candidate.passwordHash &&
      (await bcrypt.compare(password, candidate.passwordHash))
    ) {
      validSponsors.push(candidate);
    }
  }

  if (validSponsors.length === 0) {
    return { ok: false, message: "Invalid email or password." };
  }
  if (validSponsors.length > 1) {
    return {
      ok: false,
      message:
        "This email is linked to more than one active sponsor account. Use the sponsor's personal link or ask the organizer to merge the duplicate records.",
    };
  }

  const sponsor = validSponsors[0];
  await ensurePortalToken(sponsor);
  await createSponsorSession(sponsor.id);
  redirect("/portal");
}

/**
 * Passwordless recovery: email the sponsor their personal portal link.
 *
 * A sponsor who never set a password and lost their invite email would
 * otherwise be locked out of a portal they may already have paid for. The
 * response is always the same regardless of whether the email matched, so this
 * can't be used to probe who is a sponsor.
 */
export async function requestSponsorLinkAction(
  _prev: SponsorLoginState,
  formData: FormData,
): Promise<SponsorLoginState> {
  const email = normalizeContactEmail(str(formData, "email")) ?? "";
  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: { email: "Enter a valid email address." },
    };
  }

  const neutral: SponsorLoginState = {
    ok: true,
    message:
      "If that email belongs to a sponsor, we've sent the sign-in link. Check your inbox.",
  };

  const sponsors = await findPortalSponsorsByEmail(email);
  if (sponsors.length === 0) return neutral;

  const links: string[] = [];
  for (const sponsor of sponsors) {
    const token = await ensurePortalToken(sponsor);
    links.push(`${sponsor.companyName}: ${SITE_URL}/invite/${token}`);
  }

  const subject = "Your sponsor portal link";
  const text = [
    "Here is your personal link to the sponsor portal:",
    "",
    ...links,
    "",
    "The link keeps you signed in — no password needed. You can set a password",
    "from the portal if you'd rather sign in with one next time.",
    "",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  try {
    await sendMail({ to: email, subject, text });
  } catch {
    // Never reveal delivery problems here — they'd leak whether the email matched.
    return neutral;
  }

  // Log it like every other outbound email, so the organizer sees it in the Email Center.
  await prisma.outreach.createMany({
    data: sponsors.map((s) => ({
      eventId: s.eventId,
      sponsorId: s.id,
      prospectEmail: email,
      subject,
      body: text,
      direction: "OUTBOUND",
      status: "SENT",
      sentAt: new Date(),
    })),
  });

  return neutral;
}

export async function sponsorLogoutAction(): Promise<void> {
  await clearSponsorSession();
  redirect("/sponsor/login");
}
