import { prisma } from "@/lib/prisma";

/**
 * Statuses that occupy a package slot. A slot is "taken" by any candidate that
 * has been actively engaged (everything except an untouched LEAD or a DECLINED
 * one). This is derived live from the sponsor rows — the `Package.slotsTaken`
 * column is NOT maintained and must not be relied upon.
 */
export const SLOT_HOLDING_STATUSES: string[] = [
  "INVITE_SENT",
  "ACCEPTED",
  "DETAILS_SUBMITTED",
  "CONFIRMED",
];

/** Taken-slot counts per package id, derived from live sponsor rows. */
export async function slotsTakenByPackage(
  packageIds: string[],
): Promise<Map<string, number>> {
  const ids = packageIds.filter(Boolean);
  if (ids.length === 0) return new Map();
  const grouped = await prisma.sponsor.groupBy({
    by: ["packageId"],
    where: { packageId: { in: ids }, status: { in: SLOT_HOLDING_STATUSES } },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (row.packageId) map.set(row.packageId, row._count._all);
  }
  return map;
}

/** Taken-slot count for a single package. */
export async function slotsTaken(packageId: string): Promise<number> {
  return prisma.sponsor.count({
    where: { packageId, status: { in: SLOT_HOLDING_STATUSES } },
  });
}

/**
 * Whether moving a sponsor into a holding status on this package would exceed
 * its capacity. `excludeSponsorId` skips the sponsor being updated so one that
 * already holds the slot isn't counted against itself. Packages with no
 * `slotsTotal` are treated as unlimited.
 */
export async function isPackageFull(
  packageId: string,
  excludeSponsorId?: string,
): Promise<boolean> {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: { slotsTotal: true },
  });
  if (!pkg || pkg.slotsTotal == null) return false;
  const taken = await prisma.sponsor.count({
    where: {
      packageId,
      status: { in: SLOT_HOLDING_STATUSES },
      ...(excludeSponsorId ? { id: { not: excludeSponsorId } } : {}),
    },
  });
  return taken >= pkg.slotsTotal;
}
