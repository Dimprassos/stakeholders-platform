// Sponsor deliverables checklist (docs/PLAN.md §16 Phase C — CRM depth).
// A fixed set of trackable deliverables; per-sponsor "done" state is stored as a
// JSON object `{ [key]: true }` on Sponsor.deliverables (SQLite has no arrays —
// same JSON-as-text convention as Package.benefits / Event.faq).

export const DELIVERABLE_TYPES = [
  { key: "LOGO", label: "Logo received" },
  { key: "BANNER", label: "Banner received" },
  { key: "VIDEO", label: "Video received" },
  { key: "BOOTH", label: "Booth confirmed" },
  { key: "SPEAKER", label: "Speaker confirmed" },
  { key: "SOCIAL", label: "Social posts completed" },
] as const;

export type DeliverableKey = (typeof DELIVERABLE_TYPES)[number]["key"];

export const DELIVERABLE_KEYS = DELIVERABLE_TYPES.map((d) => d.key);

/** Parse the stored JSON map, keeping only known keys set to `true`. */
export function parseDeliverables(json: string): Record<string, boolean> {
  try {
    const value = JSON.parse(json);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const out: Record<string, boolean> = {};
    for (const { key } of DELIVERABLE_TYPES) {
      if (value[key] === true) out[key] = true;
    }
    return out;
  } catch {
    return {};
  }
}

/** How many deliverables are marked done, out of the total. */
export function deliverableProgress(state: Record<string, boolean>): {
  done: number;
  total: number;
} {
  const done = DELIVERABLE_KEYS.filter((k) => state[k]).length;
  return { done, total: DELIVERABLE_KEYS.length };
}
