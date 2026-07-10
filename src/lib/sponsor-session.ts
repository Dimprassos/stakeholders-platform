import { SignJWT, jwtVerify } from "jose";

// Sponsor login sessions (docs/PLAN.md §16 Phase E). Separate cookie/namespace
// from the admin session so the two actors never collide. Signed with the same
// AUTH_SECRET (HS256) as the admin session.

export const SPONSOR_SESSION_COOKIE = "sponsor_session";
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type SponsorSessionPayload = {
  sponsorId: string;
};

function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encodeSponsorSession(
  payload: SponsorSessionPayload,
): Promise<string> {
  return new SignJWT({ sponsorId: payload.sponsorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getEncodedKey());
}

export async function decodeSponsorSession(
  token: string | undefined | null,
): Promise<SponsorSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    const sponsorId = typeof payload.sponsorId === "string" ? payload.sponsorId : undefined;
    if (!sponsorId) return null;
    return { sponsorId };
  } catch {
    return null;
  }
}

export const sponsorSessionMaxAgeSeconds = SESSION_DURATION_SECONDS;
