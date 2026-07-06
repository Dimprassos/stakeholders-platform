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

/** `benefits` is stored as a JSON string (SQLite has no arrays). Parse it safely. */
export function parseBenefits(json: string): string[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
