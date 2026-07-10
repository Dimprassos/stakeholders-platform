import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SLOT_HOLDING_STATUSES } from "@/lib/slots";
import { tierRank } from "@/lib/format";

// Analytics for the admin dashboard (docs/PLAN.md §16 Phase G). Everything is
// derived from data we already hold — sponsor statuses, package prices, slots,
// submissions and tasks — so there is no new schema or tracking. Cached per
// request. Candidate counts are small (one event), so we pull the rows and
// aggregate in-process rather than issuing many groupBy queries.

/** Outreach funnel order (LEAD is the pre-outreach base; DECLINED is a branch). */
const PIPELINE: { status: string; label: string }[] = [
  { status: "LEAD", label: "Leads" },
  { status: "INVITE_SENT", label: "Invited" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "DETAILS_SUBMITTED", label: "Details submitted" },
  { status: "CONFIRMED", label: "Confirmed" },
];

/** Statuses whose package price counts toward committed revenue. */
const COMMITTED = ["CONFIRMED"];
/** Accepted but not yet confirmed — likely to close. */
const PIPELINE_REVENUE = ["ACCEPTED", "DETAILS_SUBMITTED"];
/** Invited, awaiting a response. */
const POTENTIAL_REVENUE = ["INVITE_SENT"];

export type FunnelStage = {
  status: string;
  label: string;
  /** Sponsors currently at this stage or beyond (excludes DECLINED). */
  reached: number;
  /** Conversion from the previous stage, 0–1, or null for the first stage. */
  stepRate: number | null;
};

export type RevenueByCurrency = {
  currency: string;
  committedCents: number;
  pipelineCents: number;
  potentialCents: number;
  /** Actually collected via paid payments (docs/PLAN.md §16 Phase F). */
  collectedCents: number;
};

export type TierBreakdown = {
  tier: string;
  currency: string;
  confirmed: number;
  committedCents: number;
};

export type PackageFill = {
  id: string;
  name: string;
  tier: string;
  currency: string;
  priceCents: number;
  slotsTotal: number | null;
  taken: number;
  confirmed: number;
  committedCents: number;
};

export type Analytics = {
  totalCandidates: number;
  declined: number;
  funnel: FunnelStage[];
  /** Invited → Confirmed, 0–1, or null when nobody has been invited. */
  inviteToConfirmed: number | null;
  revenue: RevenueByCurrency[];
  tiers: TierBreakdown[];
  packages: PackageFill[];
  pending: {
    awaitingReview: number;
    newSubmissions: number;
    unreadReplies: number;
    openTasks: number;
    overdueTasks: number;
  };
};

type SponsorRow = {
  status: string;
  packageId: string | null;
  package: { priceCents: number; currency: string; tier: string } | null;
};

function bump(map: Map<string, RevenueByCurrency>, currency: string): RevenueByCurrency {
  let row = map.get(currency);
  if (!row) {
    row = {
      currency,
      committedCents: 0,
      pipelineCents: 0,
      potentialCents: 0,
      collectedCents: 0,
    };
    map.set(currency, row);
  }
  return row;
}

export const getAnalytics = cache(async (eventId: string): Promise<Analytics> => {
  const today = new Date().toISOString().slice(0, 10);

  const [
    sponsors,
    packages,
    paidPayments,
    newSubmissions,
    unreadReplies,
    openTasks,
    overdueTasks,
  ] = await Promise.all([
      prisma.sponsor.findMany({
        where: { eventId },
        select: {
          status: true,
          packageId: true,
          package: { select: { priceCents: true, currency: true, tier: true } },
        },
      }) as Promise<SponsorRow[]>,
      prisma.package.findMany({
        where: { eventId },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          tier: true,
          currency: true,
          priceCents: true,
          slotsTotal: true,
        },
      }),
      prisma.payment.findMany({
        where: { eventId, status: "PAID" },
        select: { amountCents: true, currency: true },
      }),
      prisma.submission.count({ where: { eventId, status: "NEW" } }),
      prisma.outreach.count({
        where: { eventId, direction: "INBOUND", readAt: null },
      }),
      prisma.task.count({ where: { eventId, done: false } }),
      prisma.task.count({
        where: { eventId, done: false, dueDate: { not: null, lt: today } },
      }),
    ]);

  // ── Funnel ──────────────────────────────────────────────────────────────
  const statusCount = new Map<string, number>();
  for (const s of sponsors) {
    statusCount.set(s.status, (statusCount.get(s.status) ?? 0) + 1);
  }
  const declined = statusCount.get("DECLINED") ?? 0;

  const funnel: FunnelStage[] = PIPELINE.map((stage, i) => {
    // "Reached" = at this stage or any later pipeline stage.
    const reached = PIPELINE.slice(i).reduce(
      (sum, s) => sum + (statusCount.get(s.status) ?? 0),
      0,
    );
    return { status: stage.status, label: stage.label, reached, stepRate: null };
  });
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].reached;
    funnel[i].stepRate = prev > 0 ? funnel[i].reached / prev : null;
  }
  // Everyone at "Invited" or beyond is the denominator for invite → confirmed.
  const invited = funnel[1].reached;
  const confirmed = statusCount.get("CONFIRMED") ?? 0;
  const inviteToConfirmed = invited > 0 ? confirmed / invited : null;

  // ── Revenue (by currency) ───────────────────────────────────────────────
  const revenueMap = new Map<string, RevenueByCurrency>();
  for (const s of sponsors) {
    if (!s.package) continue;
    const row = bump(revenueMap, s.package.currency);
    if (COMMITTED.includes(s.status)) row.committedCents += s.package.priceCents;
    else if (PIPELINE_REVENUE.includes(s.status)) row.pipelineCents += s.package.priceCents;
    else if (POTENTIAL_REVENUE.includes(s.status)) row.potentialCents += s.package.priceCents;
  }
  for (const p of paidPayments) {
    bump(revenueMap, p.currency).collectedCents += p.amountCents;
  }
  const revenue = [...revenueMap.values()].sort(
    (a, b) => b.committedCents - a.committedCents,
  );

  // ── By tier (committed only) ────────────────────────────────────────────
  const tierMap = new Map<string, TierBreakdown>();
  for (const s of sponsors) {
    if (!s.package || !COMMITTED.includes(s.status)) continue;
    const { tier, currency, priceCents } = s.package;
    let row = tierMap.get(tier);
    if (!row) {
      row = { tier, currency, confirmed: 0, committedCents: 0 };
      tierMap.set(tier, row);
    }
    row.confirmed += 1;
    row.committedCents += priceCents;
  }
  const tiers = [...tierMap.values()].sort((a, b) => tierRank(a.tier) - tierRank(b.tier));

  // ── Package availability + revenue ──────────────────────────────────────
  // Count holders/confirmed per package id from the sponsor rows already loaded.
  const takenByPkg = new Map<string, number>();
  const confirmedByPkg = new Map<string, number>();
  for (const s of sponsors) {
    if (!s.packageId) continue;
    if (SLOT_HOLDING_STATUSES.includes(s.status)) {
      takenByPkg.set(s.packageId, (takenByPkg.get(s.packageId) ?? 0) + 1);
    }
    if (s.status === "CONFIRMED") {
      confirmedByPkg.set(s.packageId, (confirmedByPkg.get(s.packageId) ?? 0) + 1);
    }
  }
  const packageFill: PackageFill[] = packages.map((p) => {
    const confirmedCount = confirmedByPkg.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.name,
      tier: p.tier,
      currency: p.currency,
      priceCents: p.priceCents,
      slotsTotal: p.slotsTotal,
      taken: takenByPkg.get(p.id) ?? 0,
      confirmed: confirmedCount,
      committedCents: confirmedCount * p.priceCents,
    };
  });

  return {
    totalCandidates: sponsors.length,
    declined,
    funnel,
    inviteToConfirmed,
    revenue,
    tiers,
    packages: packageFill,
    pending: {
      awaitingReview: statusCount.get("DETAILS_SUBMITTED") ?? 0,
      newSubmissions,
      unreadReplies,
      openTasks,
      overdueTasks,
    },
  };
});
