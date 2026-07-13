# AUDIT — Sponsor lifecycle is not enforced

> **Raised by Dimitris, 2026-07-13.** Written down so it survives session resets.
> **Status: RESOLVED 2026-07-13** — the guard in §3 is built and verified; see
> §5 for the checklist and §6 for how it was proven.

## 1. The systemic finding

The sponsor lifecycle
(`LEAD → INVITE_SENT → ACCEPTED → DETAILS_SUBMITTED → CONFIRMED` / `DECLINED`)
exists **only as a label in a dropdown**. It is not a rule. Almost no server
action checks what state the sponsor is in before acting, and the UI renders
every button regardless of state.

This is **one design defect that surfaces in many places** — not a list of
unrelated bugs. Patching each button individually will keep reproducing it.

Symptoms the user hit:
- Request a **payment** from a `LEAD` who never accepted.
- Send a **contract** for signature to a `LEAD`.
- **Send invite** to a `DECLINED` candidate — silently resurrects them.
- Set `DECLINED` in admin, but their **magic link keeps working**.

## 2. Evidence (read from the code, 2026-07-13)

| Action | File | Event-scoped? | Sponsor-status guard? | Consequence |
|---|---|---|---|---|
| `createPaymentAction` | `candidates/[id]/payment-actions.ts` | ✅ | ❌ **none** | Payment request to a `LEAD` |
| `saveContractAction` / `sendContractAction` | `candidates/[id]/contract-actions.ts` | ✅ | ❌ **none** | Contract to a `LEAD` |
| `sendInviteAction` | `candidates/invite-actions.ts` | ❌ | ❌ **none** | Re-invites `DECLINED` |
| `setStatusAction` | `candidates/actions.ts` | ❌ | partial (slots) | Declined kept a live token *(FIXED)* |
| `assignPackageAction` | `candidates/actions.ts` | ❌ | partial (slots) | — |
| `togglePublishAction` | `candidates/actions.ts` | ❌ | ✅ `CONFIRMED` only | *the one that is right* |

Related defects found in the same pass:

- **`sendInviteAction` sends the email BEFORE persisting the token.** If the
  following `$transaction` fails, the recipient holds a link that will never
  work. Persist first, then send.
- **Event scoping is inconsistent.** `communication-actions.ts` and
  `agenda/actions.ts` scope every lookup by `eventId`; `setStatusAction`,
  `assignPackageAction`, `sendInviteAction` and `togglePublishAction` do
  `findUnique({ where: { id } })` with no event check. Single-admin today, so
  not privilege escalation — but it lets one event's page mutate another
  event's sponsor, and it is an inconsistency waiting to become a hole.

## 3. The fix — one source of truth

Create `src/lib/sponsor-lifecycle.ts`:

```ts
export type SponsorAction =
  | "invite" | "assignPackage" | "contract" | "payment" | "publish" | "decline";

export function can(
  sponsor: { status: string; packageId: string | null; contactEmail: string | null },
  action: SponsorAction,
): { ok: true } | { ok: false; reason: string };
```

Rules (single table, both layers read it):

| Action | Allowed only when |
|---|---|
| Send invite | `LEAD` · has package · has email · package not full |
| Assign package | not `DECLINED` |
| Contract create/send | `ACCEPTED` \| `DETAILS_SUBMITTED` \| `CONFIRMED` |
| Request payment | `ACCEPTED` \| `DETAILS_SUBMITTED` \| `CONFIRMED` |
| Publish | `CONFIRMED` |
| Decline | always → **must revoke `magicToken` / `tokenExpiresAt`** |

Then wire it into **both** layers, so what you see is what is allowed:

- **Every server action** calls `can()` and refuses with the reason. (Required:
  a crafted POST can hit an action with no UI involved.)
- **Every UI** renders the button **disabled, with the reason as the tooltip /
  helper text** instead of hiding the rule.

## 4. Already fixed (2026-07-13, uncommitted at time of writing)

- `setStatusAction` now **revokes `magicToken` / `tokenIssuedAt` /
  `tokenExpiresAt`** when moving to `DECLINED`, matching the sponsor-side
  `declineAction`. Previously a rejected candidate kept a working portal and
  could still accept, submit details and **pay**.
- `add-candidate-form.tsx`: the success screen replaced the form and `state.ok`
  could never be cleared, so "Add another" just re-rendered the same screen and
  a full page reload (F5) was the only way back. The form now stays mounted and
  resets itself after each successful add.

## 5. Implementation checklist — done 2026-07-13

- [x] `src/lib/sponsor-lifecycle.ts` with `can()` + the rule table above.
- [x] Guard `createPaymentAction`, `saveContractAction`, `saveAndSendContractAction`,
      `sendContractAction`, `sendInviteAction`, `assignPackageAction`.
- [x] Scope by `eventId` in `setStatusAction`, `assignPackageAction`,
      `sendInviteAction`, `togglePublishAction`.
- [x] `sendInviteAction`: persist token **before** sending the email — and roll the
      record back to its previous status/token if the send then fails, so a failed
      invite leaves neither a dead link nor a candidate falsely marked as invited.
- [x] Add a DECLINED guard to `sendInviteAction`. Re-opening is explicit: set the
      status back to Lead.
- [x] UI: disable buttons + show the reason (candidates table, candidate detail).
      Refusals from a server action come back as `?blocked=<reason>` and render as
      a banner on the candidates, candidate-detail and onboarding pages.
- [x] Verified end-to-end — see §6.

### Deviations from §3, deliberate

- **Invite is allowed from `INVITE_SENT`, not just `LEAD`.** Re-sending is how an
  expired link gets replaced; restricting to `LEAD` would leave a candidate whose
  token lapsed with no way to get a new one. The button reads *Resend invite*
  there. Anything past `INVITE_SENT` is refused, because `sendInviteAction` sets
  the status back to `INVITE_SENT` and would demote a candidate who has already
  responded.
- **`can()` does not check package capacity**, though §3's table lists it under
  Send invite. Capacity needs a DB query and is a property of the *package*, not
  the sponsor's stage. It stays in `isPackageFull()` (`@/lib/slots`), which the
  actions call alongside `can()`.
- **A `confirm` rule was added** (not in §3). `confirmSponsorAction` in
  `onboarding/actions.ts` was a second, entirely unguarded and unscoped write that
  sets `CONFIRMED` + `isPublished` — the same class of hole, missed by §2's table.
  `onboarding/actions.ts` also had a **second `togglePublishAction`** with no status
  guard at all; both are now guarded and event-scoped.
- **The onboarding page's "Publish only" button is gone** from the *Awaiting review*
  section. Publish requires `CONFIRMED`, so on a `DETAILS_SUBMITTED` row that button
  could never succeed — "Confirm & publish" is the way out of that stage.

## 6. How this was verified (2026-07-13)

Against the dev server, with a minted admin session:

- **The rule table** — `can()` evaluated over all 6 statuses × 7 actions; the
  matrix matches §3 exactly.
- **The UI layer** — a `LEAD`'s detail page renders no payment form, a disabled
  contract textarea, and both refusal reasons; the candidates table disables the
  invite on a `LEAD` with no email and explains why.
- **The server layer** — server-action ids were harvested from the live pages and
  the payment/contract actions were POSTed directly at a `LEAD`, with no UI
  involved. Both were refused and wrote nothing. **Control:** the identical POST
  aimed at a `CONFIRMED` sponsor *does* create the payment — without that control
  the refusals would have proven nothing, and an earlier version of this harness
  was in fact silently failing to reach the actions at all.
- **The decline path** — declining a `CONFIRMED` sponsor from the admin table
  nulls `magicToken`/`tokenExpiresAt`, un-publishes them, and their previously
  working portal link then renders "This invite link is no longer valid" and
  exposes nothing. The table then refuses to re-invite them.

Not exercised: the SMTP-failure rollback in `sendInviteAction` (it needs a forced
send failure); reviewed by reading only.
