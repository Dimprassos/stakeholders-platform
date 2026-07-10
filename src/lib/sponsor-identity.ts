import "server-only";

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

export async function findSponsorsByContactEmail(eventId: string, email: string) {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return [];

  // Keep this provider-neutral: SQLite and Postgres differ on case-insensitive
  // filters, so fetch candidate emails for the event and compare normalized.
  const rows = await prisma.sponsor.findMany({
    where: { eventId, contactEmail: { not: null } },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      status: true,
      passwordHash: true,
      updatedAt: true,
      magicToken: true,
      tokenExpiresAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.filter((row) => normalizeContactEmail(row.contactEmail) === normalized);
}
