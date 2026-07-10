import { randomBytes } from "node:crypto";

export const TOKEN_BYTES = 32; // 256 bits of entropy
export const TOKEN_TTL_HOURS = 7 * 24; // 7 days

export function generateMagicToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function tokenExpiry(issuedAt: Date = new Date()): Date {
  return new Date(issuedAt.getTime() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
}

// Once a sponsor accepts and submits details, the same token becomes their
// ongoing portal key (docs/PLAN.md §16 Phase E/F): they return to track status,
// upload materials and pay. Give it a long, renewable window rather than the
// short 7-day invite window.
export const PORTAL_TTL_DAYS = 180;

export function portalExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + PORTAL_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= Date.now();
}