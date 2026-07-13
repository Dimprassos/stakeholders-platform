import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SPONSOR_ACCOUNT_STATUSES = [
  "ACCEPTED",
  "DETAILS_SUBMITTED",
  "CONFIRMED",
] as const;

export function normalizeContactEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

export function isSponsorAccountStatus(status: string): boolean {
  return (SPONSOR_ACCOUNT_STATUSES as readonly string[]).includes(status);
}

const SPONSOR_IDENTITY_SELECT = {
  id: true,
  eventId: true,
  companyName: true,
  contactEmail: true,
  status: true,
  passwordHash: true,
  updatedAt: true,
  magicToken: true,
  tokenExpiresAt: true,
} as const;

// Keep this provider-neutral: SQLite and Postgres differ on case-insensitive
// filters, so narrow with the given `where`, then compare emails normalized in JS.
async function findSponsorRowsByEmail(where: Prisma.SponsorWhereInput, email: string) {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return [];

  const rows = await prisma.sponsor.findMany({
    where: { ...where, contactEmail: { not: null } },
    select: SPONSOR_IDENTITY_SELECT,
    orderBy: { updatedAt: "desc" },
  });

  return rows.filter((row) => normalizeContactEmail(row.contactEmail) === normalized);
}

/** Sponsors in a single event sharing this contact email (duplicate detection). */
export async function findSponsorsByContactEmail(eventId: string, email: string) {
  return findSponsorRowsByEmail({ eventId }, email);
}

/**
 * Sponsor accounts (password set) with this contact email across ALL events.
 * Login is email+password and is not scoped to a "current" event, so it must
 * search globally — otherwise sponsors outside the default event can't sign in.
 */
export async function findSponsorAccountsByEmail(email: string) {
  return findSponsorRowsByEmail({ passwordHash: { not: null } }, email);
}

/**
 * Sponsors with this contact email who can reach a portal — with or without a
 * password. Backs the passwordless "email me a sign-in link" flow, so a sponsor
 * who never set a password and lost their invite email isn't locked out.
 */
export async function findPortalSponsorsByEmail(email: string) {
  return findSponsorRowsByEmail(
    { status: { in: [...SPONSOR_ACCOUNT_STATUSES] } },
    email,
  );
}
