// Small display helpers shared across the public pages.

export const TIER_ORDER = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;
export type Tier = (typeof TIER_ORDER)[number];

/** Sort rank for a tier string (unknown tiers sort last). */
export function tierRank(tier: string): number {
  const i = TIER_ORDER.indexOf(tier as Tier);
  return i === -1 ? TIER_ORDER.length : i;
}

/** Human label for a tier, e.g. "PLATINUM" -> "Platinum". */
export function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/** Format an integer amount of cents as a currency string, e.g. 1000000 -> "€10,000". */
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format a start/end date (ISO `yyyy-mm-dd`) as a human range, e.g.
 * "21–23 October 2026", or "30 October – 2 November 2026" across months.
 * Dates are treated as UTC to avoid timezone off-by-one shifts.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  if (!start) return null;
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return null;
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });
  const monthYear = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const dayMonth = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const e = end ? new Date(end) : null;
  if (!e || Number.isNaN(e.getTime())) {
    return `${day.format(s)} ${monthYear.format(s)}`;
  }
  const sameMonth =
    s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  if (sameMonth) {
    return `${day.format(s)}–${day.format(e)} ${monthYear.format(s)}`;
  }
  return `${dayMonth.format(s)} – ${dayMonth.format(e)} ${e.getUTCFullYear()}`;
}

/** `benefits` is stored as a JSON string (SQLite has no arrays). Parse it safely. */
export function parseBenefits(json: string): string[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
