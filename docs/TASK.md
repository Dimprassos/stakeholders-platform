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

**Status:** **Phase C (CRM depth) local implementation verified + Neon migrated**
(2026-07-09). Phases A + B live; Phase C notes/deliverables/task management is implemented
locally and ready for push/deploy + browser smoke test. · **Updated:** 2026-07-09 · **By:** Codex
**Last verified:** 2026-07-09 (Claude) — prod routes all 200 incl. new `/faq`; no 500s after
the Neon migration `20260708150000_event_content_and_branding` + push (`main` = `4cfe3c8`).
Sequence held correctly: migrate Neon → push → Vercel deploy (avoided the Phase A incident).
**Local verified:** 2026-07-09 (Codex) — Prisma validate (SQLite + Postgres schema), local
SQLite migration applied, Prisma client generated, `npm run typecheck`, `npm run lint`,
`npm run build`, and a temporary Task create/toggle/delete smoke test all passed.
**Prod DB migrated:** 2026-07-09 (Dimitris) — Neon applied
`20260709090300_add_sponsor_notes`, `20260709091100_add_sponsor_deliverables`, and
`20260709093000_add_tasks` successfully.

---

## Now / in progress
- **Phase C — CRM depth handoff** (Codex, 2026-07-09): latest
  `old_sessions/claude_session_last.md` stopped while adding task management to the sponsor
  detail page. Current local work includes sponsor profile detail, private organizer notes,
  deliverables checklist, and task UI/actions. See `PLAN.md §16.2`.
- **Migration gap resolved locally:** added matching SQLite/Postgres `Task` migrations after
  the existing notes/deliverables migrations.
- **Neon migration applied:** Phase C production database changes are now live in Neon.

## Next up — Phase C+
1. Browser-verify `/admin/candidates/[id]`: notes save, deliverables save, task add/toggle/delete.
2. Commit + push the Phase C code/migrations.
3. Let Vercel deploy, then smoke-test admin candidate detail in prod.

Phases D–G remain queued in `PLAN.md §16.2` after Phase C is verified.

### Smaller open items (optional, low priority)
- **Email permanent fix**: buy + authenticate a domain (SPF/DKIM/DMARC) so invites don't
  risk spam via a free-domain sender. Optional for a demo. `PLAN.md §5 D8`, `§13`.
- **Prod logo file-upload**: needs object storage (Vercel Blob/S3); paste-URL already
  works fine in prod. `PLAN.md §5 D9`. Only if paste-URL isn't enough.

## Discovered during work (resolved; kept as history)
- Admin header showed a raw CUID instead of email → fixed.
- Package slots weren't enforced (counter never wrote, no cap) → derived live counter +
  hard-block, `809bcca`.
- Slot guard initially over-blocked status changes on existing holders → fixed to only
  fire on non-holding → holding transitions.
- Sponsors could be published without being CONFIRMED → 3-layer fix (query defense +
  action guard + disabled UI) + auto-unpublish on leaving CONFIRMED.
- Form validation gaps (phone, VAT/ΑΦΜ, no length caps) → `src/lib/validation.ts`
  (international phone, Greek ΑΦΜ checksum + generic EU VAT, length caps), wired into
  interest + onboarding forms.

## Blocked / decisions pending
- Phase C prod deploy now waits only on commit/push + Vercel deploy.
- Email permanent fix waits on a **domain purchase** — your call; optional for now.

## Just landed (full history in `../CHANGELOG.md`)
- **Phase B — event content & branding, DEPLOYED to prod** (2026-07-09; built 2026-07-08).
  `Event` model extended: FAQ + key dates (JSON-as-text, same convention as
  `Package.benefits`), terms/privacy/cancellation text, social links, map, currency,
  language, and branding (`themeMode` LIGHT/DARK/CUSTOM + brand colors + logo/banner).
  New admin **`/admin/events/[id]` edit page** (create stays minimal; richer fields are
  edited after creation) with grouped sections + image upload (dev file / prod pasted
  URL, same pattern as sponsor logos — refactored into a shared `src/lib/uploads.ts`).
  Public: new **`/faq`** page (key dates + FAQ + policies); header shows event logo;
  footer shows social links, map, FAQ link; homepage shows a banner if set; `<html lang>`
  now follows the event's language; theme override via a `data-theme` attribute (LIGHT/
  DARK) or inline custom-brand CSS vars, scoped to the public route group only (admin
  stays neutral). New package's currency now defaults from the event.
  **Verified:** typecheck/lint green; all public routes → 200 incl. new `/faq`; FAQ/
  deadlines/policies/social/map all render from seeded content; **DARK and CUSTOM theme
  both confirmed rendering correctly** (`data-theme="dark"` / inline `--brand` vars);
  content round-trip (text ⇄ JSON) verified; found + fixed a build-time-prerender risk
  in the **root layout** (now reads the event for `<html lang>`, so needs
  `force-dynamic` too — same class of bug as the earlier `/` fix, caught proactively this
  time) — confirmed via a full local `build:postgres` dry run (all routes compile,
  including new ones). Postgres migration **prepared** (`prisma-postgres/migrations/
  20260708150000_event_content_and_branding/`, safe — all columns nullable or defaulted,
  no backfill needed) but **NOT yet applied to Neon**.
  **Bug found via your click-test + fixed:** `themeMode` defaulted to `"LIGHT"`, which
  the layout treated as an explicit choice and **force-applied** `data-theme="light"` to
  every visitor — silently overriding anyone whose OS/browser was in dark mode (a
  regression from the pre-Phase-B behavior, which always followed `prefers-color-scheme`).
  Added a 4th mode, **`AUTO`** (respects OS preference, unchanged from before) and made
  it the default; `LIGHT`/`DARK` are now only applied when an organizer *deliberately*
  picks one. New sqlite migration `20260708144100_theme_mode_default_auto`; the
  not-yet-applied postgres migration was edited in place (still pending, safe to do pre-
  apply). **Re-verified:** AUTO → no `data-theme` forced ✓; DARK still forces correctly ✓.
  **Still needed from you:** (1) re-check `/admin/events/[id]` in the browser now that
  the default no longer hijacks your OS theme; (2) approve running the Neon migration
  when ready to deploy Phase B.
- **Phase A — multi-event foundation, complete & live** (2026-07-08): `Event` model +
  `eventId` scoping across all funnel entities; admin event switcher (`/admin/events`);
  Neon prod migration (data-preserving, `Setting` → `Event`); fixed a pre-existing
  build-time prerender bug on `/`. Merged to `main`, deployed.
- **Incident, found & fixed same day**: Vercel's Git integration was wired to a stale
  second repo (`stakeholders-platform_sponsor`, 16 commits behind) instead of `origin`
  (`stakeholders-platform`) — caused prod 500s after the Neon migration. Repointed
  Vercel to `origin` and verified via a real push (build log confirms correct repo).
  Single-remote `git push` is sufficient again.
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
_Last touched: 2026-07-09 · Codex_
