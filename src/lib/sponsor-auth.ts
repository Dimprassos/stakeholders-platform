import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  generateMagicToken,
  portalExpiry,
  isTokenExpired,
} from "@/lib/magic-token";
import {
  SPONSOR_SESSION_COOKIE,
  encodeSponsorSession,
  decodeSponsorSession,
  sponsorSessionMaxAgeSeconds,
} from "@/lib/sponsor-session";

// Sponsor account auth helpers (docs/PLAN.md §16 Phase E), mirroring lib/auth.ts
// for admins but keyed to a Sponsor row.

export async function createSponsorSession(sponsorId: string): Promise<void> {
  const token = await encodeSponsorSession({ sponsorId });
  const expires = new Date(Date.now() + sponsorSessionMaxAgeSeconds * 1000);
  const cookieStore = await cookies();
  cookieStore.set(SPONSOR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function clearSponsorSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SPONSOR_SESSION_COOKIE);
}

/** The logged-in sponsor's id, or null. Cached per request. */
export const getCurrentSponsorId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SPONSOR_SESSION_COOKIE)?.value;
  const session = await decodeSponsorSession(token);
  return session?.sponsorId ?? null;
});

/**
 * The logged-in sponsor (with package), or null. Also returns null if the
 * session points at a sponsor that no longer exists — callers redirect to login.
 */
export const getCurrentSponsor = cache(async () => {
  const id = await getCurrentSponsorId();
  if (!id) return null;
  return prisma.sponsor.findUnique({ where: { id }, include: { package: true } });
});

/**
 * Return a valid magic token for this sponsor, minting a fresh one only if the
 * current token is missing or expired. The account portal uses this so the
 * token-based portal actions (pay, update details) always have a live token.
 */
export async function ensurePortalToken(sponsor: {
  id: string;
  magicToken: string | null;
  tokenExpiresAt: Date | null;
}): Promise<string> {
  if (sponsor.magicToken && !isTokenExpired(sponsor.tokenExpiresAt)) {
    return sponsor.magicToken;
  }
  const token = generateMagicToken();
  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { magicToken: token, tokenIssuedAt: new Date(), tokenExpiresAt: portalExpiry() },
  });
  return token;
}
