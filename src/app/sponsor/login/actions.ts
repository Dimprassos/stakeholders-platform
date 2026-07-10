"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSponsorSession,
  clearSponsorSession,
  ensurePortalToken,
} from "@/lib/sponsor-auth";
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
  const email = str(formData, "email");
  const password = str(formData, "password");

  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Sponsors are keyed by contact email; only those who set a password can log in.
  const sponsor = await prisma.sponsor.findFirst({
    where: { contactEmail: email, passwordHash: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, passwordHash: true, magicToken: true, tokenExpiresAt: true },
  });

  const valid = sponsor?.passwordHash
    ? await bcrypt.compare(password, sponsor.passwordHash)
    : false;
  if (!sponsor || !valid) {
    return { ok: false, message: "Invalid email or password." };
  }

  await ensurePortalToken(sponsor);
  await createSponsorSession(sponsor.id);
  redirect("/portal");
}

export async function sponsorLogoutAction(): Promise<void> {
  await clearSponsorSession();
  redirect("/sponsor/login");
}
