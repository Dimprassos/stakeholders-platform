"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  createSponsorSession,
  clearSponsorSession,
  ensurePortalToken,
} from "@/lib/sponsor-auth";
import {
  findSponsorAccountsByEmail,
  isSponsorAccountStatus,
  normalizeContactEmail,
} from "@/lib/sponsor-identity";
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

export async function sponsorLogoutAction(): Promise<void> {
  await clearSponsorSession();
  redirect("/sponsor/login");
}
