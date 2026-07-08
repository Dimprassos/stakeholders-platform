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

**Status:** Phase 4 (Polish & launch) — deployed & live · **Updated:** 2026-07-08 · **By:** Claude
**Last verified:** 2026-07-08 (Claude) — local funnel read-paths all green: `/`, `/packages`,
`/sponsors` (publish-control hides non-published), `/become-a-sponsor`, `/admin/login` → 200;
invite proposal renders with correct **"on board" spacing** + package + accept/decline;
onboarding form page → 200 with legal/VAT/website/logo fields.

---

## Now / in progress
- _(nothing mid-change — working tree is clean apart from docs housekeeping)_

## Next up (from PLAN.md — reorder as you like)
1. **Email deliverability — permanent fix (optional upgrade).** Invites now send via a
   single-sender ESP (API key) and reach Gmail, but a free-domain sender risks
   spam/promotions. Real fix = buy a domain + authenticate it (SPF/DKIM/DMARC).
   — `PLAN.md §5 D8`, `§13`.
2. **Verify v1 success criteria (`PLAN.md §12`).** Full local funnel verified ✓
   (Dimitris, 2026-07-08): send invite → accept → submit onboarding → **logo upload**
   (stored to `public/uploads/logos/`, `logoUrl` saved, renders on `/sponsors`) →
   publish → appears on public page. Remaining: only a quick smoke-check on the
   **live Vercel URL**.
3. **Answer open questions** (`PLAN.md §15`): real tiers/prices, event name/dates/venue,
   branding (logo/colors), any existing prospect list to seed.

## Discovered during work
- _(none open)_

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
