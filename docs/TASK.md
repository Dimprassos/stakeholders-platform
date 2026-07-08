# TASK — current working state

> **What this file is:** the *live, tactical* board — what's being worked on **now**
> and the **next 1–3 steps**, pulled from [`PLAN.md`](./PLAN.md). It does **not**
> restate the plan: strategy & the full roadmap live in `PLAN.md`; shipped history in
> [`../CHANGELOG.md`](../CHANGELOG.md); verification in [`QA.md`](./QA.md).
> **Update this every work session.**
>
> **Project in one line:** an admin defines sponsorship **packages**, emails candidates a
> personal **magic link** → sponsor **accepts** → **onboarding form** → shown on the
> **public page**. Full brief: `PLAN.md §1–2` · original notes archived at the bottom.
>
> **Multi-agent:** Claude + GLM/Codex both work here — keep *Last touched* current so we
> don't collide or duplicate work.

**Status:** Phase 4 — **demo deployed, live & verified** (v1 §12 funnel green local + prod
read-path). Only optional upgrades remain (see Next up). · **Updated:** 2026-07-08 · **By:** Claude
**Last verified:** 2026-07-08 (Claude) — local funnel read-paths all green: `/`, `/packages`,
`/sponsors` (publish-control hides non-published), `/become-a-sponsor`, `/admin/login` → 200;
invite proposal renders with correct **"on board" spacing** + package + accept/decline;
onboarding form page → 200 with legal/VAT/website/logo fields.

---

## Now / in progress
> Working the **v2 Roadmap** from `PLAN.md §16` (built from your `QA.md` feedback,
> 2026-07-08). Decided: build real features (not a thin subset), multi-event **IN**,
> priority order → **Phase A first** (below, DONE), see "Queued" for B–G.

- ✅✅✅ **Phase A (multi-event) COMPLETE — merged to `main`, pushed, live** (Dimitris,
  2026-07-08). `multi-event-foundation` branch fast-forward merged (`919c218`).

- 🔴→✅ **Incident: two GitHub remotes, Vercel deployed the wrong one** (found + fixed
  2026-07-08). `origin` = `stakeholders-platform.git` (all real work, incl. today's
  multi-event + Neon migration). Vercel's actual production project clones a **different**
  repo, `sponsor` = `stakeholders-platform_sponsor.git`, which was stuck 16 commits
  behind at `f608c1a` (pre-Postgres-prep). Both repos' deployments share the **same
  Neon DB**. After the Neon migration dropped `Setting`, the stale `sponsor`-repo code
  (still querying `Setting`) started 500ing on every dynamic public page (`/packages`,
  `/sponsors`, `/become-a-sponsor`) — `/` looked fine only because it was a stale static
  prerender from an earlier build, not a live query. **Fix:** `git push sponsor main` to
  sync it to `origin`'s `919c218`. Vercel rebuilt + deployed the correct (Event-based)
  code. **Verified live:** all public routes → 200; `/` shows the Event-sourced name;
  `/packages` shows all 4 real packages.
  **Repoint attempt (2026-07-08):** Dimitris reconnected Vercel's Git integration to
  `Dimprassos/stakeholders-platform` (dashboard now shows "Connected just now"), but a
  dashboard **"Redeploy"** on an existing entry still cloned `_sponsor` — likely reusing
  that deployment's original source metadata rather than the live connection. Testing
  now with a genuine fresh push to confirm the reconnect actually takes effect for new
  commits. This doc update + push is that test — check the resulting build log's
  `Cloning github.com/...` line. **Until confirmed**, keep pushing to both remotes:
  `git push origin main && git push sponsor main`. See [[multi-agent-project]] in memory.

- ✅ **Phase A Step 1** (committed) — `Event` model + `eventId` on all funnel entities;
  `Setting` dropped (identity on `Event`); migration `20260708113333_multi_event_foundation`;
  seed makes a default event.
- ✅ **Phase A Step 2 — query-scoping + admin event switcher** (Claude, 2026-07-08). Public
  pages scope to the default event (`getCurrentEventId`); admin pages/creates scope to the
  selected event (`getAdminEventId`, `admin_event` cookie). New `/admin/events` (list /
  create / switch / make-default) + header **event switcher**. Verified: typecheck/lint;
  **event isolation** — a 2nd event's package/sponsor does NOT leak to public `/packages`,
  `/sponsors`, `/become-a-sponsor`. Admin switcher UI = **your browser test** (behind login).
- ⏭️ **Step 3** — public per-slug events (`/e/[slug]/…`) if we want multiple public events
  (currently public = default event only).
- ✅ **Prod migration DONE** (Dimitris ran it, 2026-07-08): hand-written
  `prisma-postgres/migrations/20260708120000_multi_event_foundation/` (nullable →
  backfill → NOT NULL, so it's safe on existing rows) — creates `Event`, seeds one
  default event **from the existing `Setting` values** (so nothing was lost), backfills
  `eventId` on every row, drops `Setting`. Applied to Neon via `npm run db:migrate:postgres`
  — "All migrations have been successfully applied." Structurally verified beforehand
  against `prisma migrate diff` (1:1 match).
- ✅ **Found + fixed a real (pre-existing) bug while dry-running the Vercel build:**
  `(public)/page.tsx` was the only public page missing `export const dynamic =
  "force-dynamic"` → Next tried to statically prerender `/` at **build time**, hitting
  Prisma before any DB is configured. Fixed to match every sibling page. **Verified:**
  ran the exact Vercel command (`npm run build:postgres`) locally end-to-end — compiles,
  typechecks, all routes render correctly (`/` now `ƒ` dynamic) — strong confidence the
  Vercel deploy will succeed. Restored local sqlite client after (`npm run db:generate`);
  typecheck/lint green; local dev server healthy.
- **Recommended next:** a quick **prod smoke-check** on the live Vercel URL (deploy just
  triggered) — confirm the new build is up and public pages still render correctly.

## Queued — v2 Roadmap phases B–G (`PLAN.md §16.2`, after Phase A)
> Full detail (capability map + tags) lives in `PLAN.md §16.1`; this is just the
> phase order so it's visible without opening PLAN.md.

- **Phase B** 🟢 — event content & branding: rich event fields (FAQ, deadlines,
  terms, privacy/cancellation policy, social, map, currency, language) + B&W/custom
  theme + logo/banner/hero.
- **Phase C** 🟢🟡 — CRM depth: sponsor profile + organizer notes, deliverables
  checklist (logo/banner/video/booth received…), task management.
- **Phase D** 🟡🔴 — communication: inbound email replies/threads, notifications
  & reminders, then chat.
- **Phase E** 🔴 — sponsor accounts & portal (login, dashboard, status tracking).
- **Phase F** 🔴 — payments & contracts (Stripe, invoices/receipts, e-signature).
- **Phase G** 🟡 — analytics (conversion funnel, revenue, pending, unread, availability).

## Next up (from PLAN.md — reorder as you like)
1. **Email deliverability — permanent fix (optional upgrade).** Invites now send via a
   single-sender ESP (API key) and reach Gmail, but a free-domain sender risks
   spam/promotions. Real fix = buy a domain + authenticate it (SPF/DKIM/DMARC).
   — `PLAN.md §5 D8`, `§13`.
2. **Verify v1 success criteria (`PLAN.md §12`).** Full local funnel verified ✓
   (Dimitris, 2026-07-08): send invite → accept → submit onboarding → **logo upload**
   (dev path: file written to `public/uploads/logos/`, `logoUrl` saved, renders on
   `/sponsors`) → publish → appears on public page. Prod logo also confirmed working
   via **pasted hosted URL** (Dimitris). **Prod read-path smoke-check green** ✓
   (Claude, 2026-07-08): all public pages + sitemap/robots → 200 on the live Vercel
   URL, and absolute URLs use the **prod domain** (so `NEXT_PUBLIC_SITE_URL` is right →
   invite links render correctly). Prod write-paths (login → invite → email delivery →
   logo-via-URL) already confirmed through Dimitris's own usage. **§12 effectively
   closed for a demo.**

   > **Logo mechanism (by design):** direct **file upload works in dev only**; in prod
   > it is deliberately rejected (`src/app/invite/[token]/actions.ts` guards on
   > `NODE_ENV === "production"` → "paste a hosted logo URL"). So prod logos = **pasted
   > URL**. This is a valid v1 choice, not a bug — see optional upgrade below.
3. ~~**Answer open questions** (`PLAN.md §15`): real tiers/prices, event details,
   branding, prospect list.~~ **Resolved 2026-07-08:** project is a **demo** — real
   data is intentionally not required, so the existing sample/placeholder content
   (Stakeholders Summit 2026, 4 packages, warm-gold branding, sample sponsors) stays.
4. **(Optional, later) Enable direct logo file-upload in prod** — needs object storage
   (Vercel Blob or S3) instead of local disk, then lift the `NODE_ENV` guard in
   `src/app/invite/[token]/actions.ts`. `PLAN.md §5 D9`. Only if paste-URL isn't enough.

## Discovered during work
- **Admin header showed a raw CUID** (Dimitris, 2026-07-08) — top-right rendered
  `session.userId` (the JWT only carries `userId`/`role`). **Fixed**: layout now fetches
  and shows the admin's **email** (`admin/(cms)/layout.tsx`). typecheck/lint green.
- ~~Package slots didn't work~~ **shipped** `809bcca` (derived counter + hard-block).
  Note: `slotsTaken` column now vestigial (left to avoid a 2-schema migration).
- **Slot guard over-blocked status changes** (Dimitris, 2026-07-08: couldn't change a
  CONFIRMED sponsor's status). The guard fired on *any* move into a holding status, so
  an existing holder on a full package (the seed over-books Founding Partner 2/1) got
  blocked. **Fixed**: guard now only fires on a **non-holding → holding** transition
  (new slot consumed); `assignPackage` skips same-package no-ops. Root cause confirmed
  via DB diagnostic; typecheck/lint green — pending your re-test.
- **Publish only when Confirmed** (Dimitris, 2026-07-08) — publishing was allowed on any
  status and the public `/sponsors` query didn't require CONFIRMED → non-confirmed
  sponsors could leak publicly. **Fixed** (pending your browser click-test of the admin
  UI): (1) `/sponsors` query now requires `status: "CONFIRMED"` — **verified** a
  force-published INVITE_SENT sponsor stays hidden; (2) `togglePublishAction` refuses to
  publish unless CONFIRMED; (3) admin Published toggle disabled unless CONFIRMED;
  (4) leaving CONFIRMED auto-unpublishes. typecheck/lint green.
- **Form validation polish (VAT/ΑΦΜ + phone + max-length caps)** — **implemented**
  (pending your browser check). New `src/lib/validation.ts`: phone (international E.164-ish
  + normalize), VAT **smart** (Greek ΑΦΜ mod-11 checksum for bare-9-digit / EL·GR, generic
  format for other EU), plus length caps. Wired into the interest form (`src/lib/interest`
  + `interest-form.tsx`) and onboarding (`invite/[token]/actions.ts` + `onboarding-form.tsx`)
  with inline errors + `maxLength`/`inputMode`/placeholders. Verified: 19/20 unit checks
  (the 1 fail was a typo in the test's expected value); typecheck/lint green.

## Blocked / decisions pending
- Email permanent fix waits on a **domain purchase** — your call; optional for now.

## Just landed (full history in `../CHANGELOG.md`)
- `6aa70c5` invite greeting spacing fix · `436ed1b` Vercel-aware SITE_URL for invite links.

---

<details>
<summary>Original brief (archived — kept verbatim, superseded by PLAN.md §1–2)</summary>

```
The task is the following Project (notes i was able to take)
        Project
-----------------------------------------------
platform with 2 stake holders(admin + sponsors)
-----------------------------------------------
->informs sponsors about packages,
->admin sends e-mails to potential sponsors(asking if they want some package),
->CMS(organizer view) sees a list of people who submit a form(?),
->Show the sponsors in a page like apexathens.

I am guessing its gonna have to be something similar with apexathens2026.com
```

</details>

---
_Last touched: 2026-07-08 · Claude_
