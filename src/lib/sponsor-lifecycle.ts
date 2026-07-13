/**
 * The single source of truth for what may be done to a sponsor at each stage of
 * the pipeline (see docs/AUDIT-sponsor-lifecycle.md).
 *
 * Both layers read this table: every server action calls `can()` and refuses
 * with the reason, and every UI renders the button disabled with the same reason
 * as its tooltip. A rule is written here once — never re-implement one at a call
 * site, or the two layers drift and the lifecycle goes back to being a label in
 * a dropdown.
 *
 * Package capacity is deliberately NOT a rule here: it needs a DB query and it
 * is a property of the package, not of the sponsor's stage. Actions pair `can()`
 * with `isPackageFull()` from `@/lib/slots`.
 */

export type SponsorAction =
  | "invite"
  | "assignPackage"
  | "contract"
  | "payment"
  | "confirm"
  | "publish"
  | "decline";

export type LifecycleSponsor = {
  status: string;
  packageId?: string | null;
  contactEmail?: string | null;
};

export type LifecycleVerdict = { ok: true } | { ok: false; reason: string };

export const SPONSOR_STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  INVITE_SENT: "Invite sent",
  ACCEPTED: "Accepted",
  DETAILS_SUBMITTED: "Details submitted",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
};

/** Stages at which the candidate has said yes — billable, contractable. */
const ENGAGED = ["ACCEPTED", "DETAILS_SUBMITTED", "CONFIRMED"];

const DECLINED_REASON =
  "This candidate declined. Set their status back to Lead to re-open them.";

const ALLOWED: LifecycleVerdict = { ok: true };
const deny = (reason: string): LifecycleVerdict => ({ ok: false, reason });

function label(status: string): string {
  return SPONSOR_STATUS_LABEL[status] ?? status;
}

export function can(
  sponsor: LifecycleSponsor,
  action: SponsorAction,
): LifecycleVerdict {
  const { status } = sponsor;

  // Declining is the one thing always available, and a declined candidate is
  // frozen until an admin explicitly re-opens them (status → Lead).
  if (action === "decline") return ALLOWED;
  if (status === "DECLINED") return deny(DECLINED_REASON);

  switch (action) {
    case "invite":
      // Re-sending is how an expired link gets replaced, so INVITE_SENT stays
      // open. Past that, a fresh invite would demote a candidate who has
      // already responded back to "Invite sent".
      if (status !== "LEAD" && status !== "INVITE_SENT") {
        return deny(
          `This candidate has already responded (${label(status)}) — a new invite would reset them to Invite sent.`,
        );
      }
      if (!sponsor.packageId) {
        return deny("Assign a package before sending an invite.");
      }
      if (!sponsor.contactEmail) {
        return deny("Add a contact email before sending an invite.");
      }
      return ALLOWED;

    case "assignPackage":
      return ALLOWED;

    case "contract":
      return ENGAGED.includes(status)
        ? ALLOWED
        : deny(
            `A contract can only be sent after the candidate accepts — this one is still at “${label(status)}”.`,
          );

    case "payment":
      return ENGAGED.includes(status)
        ? ALLOWED
        : deny(
            `Payment can only be requested after the candidate accepts — this one is still at “${label(status)}”.`,
          );

    case "confirm":
      return ENGAGED.includes(status)
        ? ALLOWED
        : deny(
            `Only a candidate who has accepted can be confirmed — this one is still at “${label(status)}”.`,
          );

    case "publish":
      return status === "CONFIRMED"
        ? ALLOWED
        : deny("Only a Confirmed sponsor can be published — confirm them first.");
  }
}

/** The reason `action` is unavailable, or `null` when it is allowed. */
export function blockedReason(
  sponsor: LifecycleSponsor,
  action: SponsorAction,
): string | null {
  const verdict = can(sponsor, action);
  return verdict.ok ? null : verdict.reason;
}

/** Query-string name carrying a refusal reason back to the admin UI. */
export const BLOCKED_PARAM = "blocked";

/** Where a server action sends the admin when `can()` refused. */
export function blockedUrl(path: string, reason: string): string {
  return `${path}?${BLOCKED_PARAM}=${encodeURIComponent(reason)}`;
}
