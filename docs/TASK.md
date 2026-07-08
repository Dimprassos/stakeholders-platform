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
- _(nothing mid-change — working tree is clean apart from docs housekeeping)_

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
