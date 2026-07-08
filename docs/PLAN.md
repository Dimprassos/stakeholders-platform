# PLAN — Sponsorship Platform

> **Status:** Draft v0.2 (hybrid) · **Owner:** Dimitris · **Last updated:** 2026-07-06
> Scope sources: [`docs/TASK.md`](./TASK.md), [`Project.txt`](../Project.txt), and
> [`others_project.txt`](../others_project.txt). Reference site: **apexathens2026.com**.
>
> **Direction (decided):** *Hybrid* — keep **our stack** (Next.js + Prisma + Tailwind,
> already scaffolded in Phase 0) and adopt the **magic-link sponsor flow** and
> **Ethereal dev email** from `others_project.txt`. The "enhanced" enterprise
> features from that doc (SSE live updates, CSV/XLSX import, draft-survival,
> carousels, multi-event, full accessibility/text-size matrix) are **deferred**
> to later optional phases.

> **Current implementation note (2026-07-07):** The repo has advanced beyond this
> planning snapshot. Phases 0-3 are implemented, Phase 4 UI polish/content is in
> progress, and the remaining launch work is deployment prep: Postgres migration,
> SMTP credentials, production URL/env vars, and a decision on production logo
> storage. See [`docs/QA.md`](./QA.md) and [`docs/RELEASE.md`](./RELEASE.md).

---

## 1. One-line summary

A web platform where an **organizer (admin)** defines sponsorship **packages**,
adds **candidate** companies, and emails each a **personal magic link**. The
sponsor opens the link, sees their proposed package, **accepts**, and completes an
**onboarding form** (details + logo). The admin tracks everyone in a **CMS
pipeline**, and confirmed sponsors appear on a **public showcase page**
(apexathens-style).

---

## 2. Problem & context

Selling event sponsorships is today ad-hoc (emails + spreadsheets). We want one
system covering the full funnel via **admin-initiated magic-link invitations**:

```
Admin defines package
      → Admin adds candidate + assigns a package
      → Admin sends invite email (personal magic link)
      → Sponsor opens link → sees package → Accept / Decline
      → Sponsor fills onboarding form (details + logo)
      → Admin sees status in CMS pipeline
      → Confirmed + visible sponsor shown on public page
```

A public **"Become a sponsor"** interest form also feeds the same candidate
pipeline (self-serve entry point), but the primary path is admin-initiated.

Two stakeholders:
- **Admin / Organizer** — internal. Runs the CMS (login required).
- **Sponsor (candidate → confirmed)** — external. **No account**; interacts via a
  personal, expiring magic link + email, and appears on the public page once live.

---

## 3. Goals / Non-goals

### Goals (v1)
- Public **Sponsorship packages** page (tiers, benefits, pricing).
- Public **Sponsors showcase** page (published sponsors grouped by tier).
- Public **"Become a sponsor" interest form** → creates a candidate.
- **Admin CMS**: login, dashboard, packages CRUD, candidate pipeline (CRM table).
- **Magic-link outreach**: admin sends a personal invite email per candidate.
- **Sponsor magic-link flow**: view proposal → accept/decline → onboarding form
  (legal name, billing, VAT, website, **logo upload**).
- **Publish control**: only `CONFIRMED` + not-hidden sponsors show publicly;
  sponsor can toggle "hide from public page".

### Non-goals for v1 (deferred — see §10 Phase 5+)
- Sponsor self-service **login/portal** (magic links only).
- Online **payments / invoicing**.
- **Multi-event / multi-tenant** (single event in v1).
- **SSE live updates**, **CSV/XLSX bulk import**, **draft-survival auto-save**.
- **Public registration/ticketing** (out of scope entirely).
- Full **accessibility/theme/text-size/reduced-motion matrix** & mobile carousels
  (we still do sensible responsive + a11y basics — just not the full matrix).

---

## 4. Stakeholders & roles

| Role | Access | Can do |
|------|--------|--------|
| **Admin / Organizer** | Authenticated CMS | Manage packages & candidates; send invite emails; review onboarding; publish sponsors |
| **Candidate (prospect)** | Email + magic link | Open proposal, accept/decline, submit onboarding form + logo |
| **Confirmed sponsor** | Public + magic link | Appears on public page; can hide/unhide self |
| **Visitor** | Public | Browse packages & sponsors pages; submit interest form |

> v1 = **single admin** role. Sponsors never log in — auth is the **expiring
> magic token** tied to their candidate record.

---

## 5. Key decisions (status)

| # | Decision | Choice | Notes |
|---|----------|--------|-------|
| D1 | Tech stack | **Next.js 16 + TypeScript** (full-stack) | ✅ scaffolded (Phase 0) |
| D2 | CMS approach | **Custom admin in Next.js** | ✅ |
| D3 | ORM | **Prisma 6** | ✅ pinned to v6 (v7 needs driver adapters + `prisma.config.ts`; crashed on Windows) |
| D4 | **Database** | **SQLite (dev)** — chosen 2026-07-06 | Migrate to Neon Postgres for prod. Needs `benefits` as JSON text (not `String[]`). |
| D5 | Admin auth | Auth.js *or* JWT (credentials) | Decide at Phase 2 |
| D6 | Sponsor auth | **Crypto magic token** (expiring) | From other plan — good fit |
| D7 | Email (dev) | **Nodemailer + Ethereal** | Zero-setup local preview |
| D8 | Email (prod) | **Resend** | Needs verified domain later |
| D9 | Logo storage | Local `uploads/` (dev) → object storage (prod) | multer-style upload; store path/URL |
| D10 | Hosting | Vercel + managed Postgres | For prod |
| D11 | Language | English (v1) | EL later if needed |

> **D4 decided = SQLite for dev.** Queued for when we resume: switch the Prisma
> provider to `sqlite`, change `benefits` from `String[]` to JSON text, then run
> the first migration + seed. Migrate to **Neon Postgres** for production.
> *(On hold — awaiting the user's review of Phase 0.)*

---

## 6. Tech stack (confirmed)

- **Framework:** Next.js 16 (App Router) + TypeScript. *(Note: Next 16 has breaking
  changes vs older docs — see root `AGENTS.md`; guides in `node_modules/next/dist/docs/`.)*
- **DB / ORM:** Prisma 6 → SQLite (dev) / PostgreSQL (prod) — pending D4.
- **UI:** Tailwind CSS v4 (+ small component set as needed).
- **Forms/validation:** React Hook Form + Zod.
- **Admin auth:** Auth.js or JWT credentials.
- **Sponsor auth:** expiring crypto magic token.
- **Email:** Nodemailer + Ethereal (dev), Resend (prod).
- **File upload:** logo upload to local `uploads/` (dev) → object storage (prod).
- **Tooling:** ESLint, Prettier, `tsc` typecheck; Vitest + Playwright later.

---

## 7. Core features

### 7.1 Public site
- **Packages page** — tiers, benefits, pricing, "Become a sponsor" CTA.
- **Sponsors showcase** — published sponsors grouped by tier (logos → website).
- **Interest form** — company, contact, email, package interest, message, GDPR
  consent; honeypot + rate limit; creates a candidate (`status = LEAD`).

### 7.2 Admin CMS (auth-protected)
- **Login** + session.
- **Dashboard** — pipeline counts (invited / accepted / details-submitted / declined).
- **Packages** — CRUD (name, tier, price, benefits, slots, order, active).
- **Candidate pipeline (CRM table)** — company, email, assigned package, status;
  add candidate; **"Send invite"** action per row.
- **Onboarding review** — view submitted sponsor details + logo; publish/unpublish.
- **Email templates** — subject/body with merge fields (later: live preview).

### 7.3 Magic-link outreach & sponsor flow
- Admin **sends invite** → generate expiring token, set `status = INVITE_SENT`,
  email a personal link (`/invite/{token}`).
- **Proposal page** (`/invite/:token`) — validate token + expiry, show event +
  assigned package; **Accept / Decline** (floating action area).
- **Onboarding form** (`/invite/:token/form`) — legal name, billing, VAT, website,
  **logo upload**; sets `status = DETAILS_SUBMITTED`; "hide from public" toggle.
- **Success** screen.

---

## 8. Data model (revised for magic-link flow)

Builds on the current Prisma schema (`prisma/schema.prisma`). Changes to apply
when we start Phase 2/3:

```
User(id, email, passwordHash, role)                       // admin  [exists]

Package(id, name, tier, priceCents, currency,
        benefits, slotsTotal, slotsTaken,
        displayOrder, isActive)                            // [exists]

Sponsor(id, companyName, contactName, contactEmail,        // candidate + sponsor
        packageId?, status, isPublished, displayOrder,
        // + magic-link fields (ADD):
        magicToken?, tokenExpiresAt?,
        // + onboarding fields (ADD / already partial):
        legalName?, billingAddress?, vatNumber?,
        websiteUrl?, logoUrl?, description?,
        isHiddenFromPublic)                                // [extend existing]
  status ∈ {LEAD, INVITE_SENT, ACCEPTED, DETAILS_SUBMITTED, CONFIRMED, DECLINED}

Submission(id, companyName, contactName, email, phone,     // public interest form
           packageInterestId?, message, consentGiven,
           status)                                          // [exists]

EmailTemplate(id, name, subject, body)                     // [exists]
Outreach(id, sponsorId?, templateId?, subject, body,       // sent-email log
         status, sentAt)                                    // [exists]
Setting(key, value)                                         // event details [exists]
```

> `Sponsor` stays the single funnel entity (candidate → confirmed) with
> onboarding fields folded in, rather than a separate `sponsor_details` table —
> simpler for v1. Public page shows `isPublished && !isHiddenFromPublic`.

---

## 9. Architecture

```
                 ┌───────────────────── Next.js app ─────────────────────┐
Visitors  ─────▶ │ Public routes    Admin routes(auth)   /invite/:token  │
Admin     ─────▶ │ /packages         /admin/*            (magic token)    │
Sponsors  ─────▶ │ /sponsors                                              │
                 │            Route handlers /api/*                        │
                 └──────┬──────────────┬───────────────┬──────────────────┘
                    Prisma          Admin session    Nodemailer/Ethereal (dev)
                        │           + magic token       Resend (prod)
                   SQLite / Postgres                 Logo upload → uploads/ (dev)
```

---

## 10. Roadmap / milestones

### Phase 0 — Foundations ✅ (done)
- git init (branch `main`); Next.js 16 + TS + Tailwind + ESLint scaffold (builds).
- Prisma 6 + initial schema + client singleton + seed script; `.env` / `.env.example`.
- npm scripts (`dev`, `build`, `typecheck`, `db:*`); landing placeholder.

### Phase 1 — Database live + public pages
- ✅ D4 = SQLite; provider switched; first migration `init` applied + seed works
  (4 packages / 3 sponsors / 5 settings). *(SQLite has no enums/arrays → statuses
  are `String`, `benefits` is a JSON string.)*
- ✅ Public pages built + verified: `/packages` + `/sponsors` (from DB, only
  `isPublished` shown, grouped by tier) + `/become-a-sponsor` (form → server
  action → `Submission`, honeypot + validation + GDPR consent). Shared header/footer.
- ⏭️ **Next (Phase 2):** Admin CMS — auth, dashboard, packages/sponsors CRUD,
  submissions inbox.

### Phase 2 — Admin CMS core
- Admin auth; dashboard; packages CRUD; candidate pipeline (CRM table);
  onboarding review + publish/unpublish.

### Phase 3 — Magic-link engine + email
- Token generation + expiry; invite email via Nodemailer/Ethereal; templates.
- Sponsor proposal → accept/decline → onboarding form + logo upload;
  "hide from public" toggle.

### Phase 4 — Polish & launch
- Responsive + a11y basics, SEO, seed real content, deploy (Vercel + Neon).
- Fill [`docs/QA.md`](./QA.md), [`docs/RELEASE.md`](./RELEASE.md), [`CHANGELOG.md`](../CHANGELOG.md).

### Phase 5+ — Later (from the "enhanced" plan, optional)
- SSE live dashboard, CSV/XLSX import, draft-survival auto-save.
- Multi-event, sponsor portal login, payments/invoicing.
- Full accessibility/theme/text-size/reduced-motion matrix, mobile carousels.

---

## 11. Non-functional requirements

- **Security:** hashed passwords, protected admin routes, expiring single-use-ish
  magic tokens, server-side validation (Zod), rate limiting + honeypot on public form.
- **GDPR:** consent on the form, privacy policy, minimal PII, unsubscribe/suppression.
- **A11y (basics for v1):** semantic HTML, keyboard nav, alt text, contrast.
- **SEO:** SSR public pages, metadata, sitemap, OG tags.
- **Responsive:** mobile-first public pages (full table-to-card/carousel matrix later).

---

## 12. Success criteria (v1)

- [ ] Admin logs in, creates a package, adds a candidate, sends an invite.
- [ ] Invite email is viewable (Ethereal link in dev).
- [ ] Sponsor opens magic link, accepts, submits onboarding + logo.
- [ ] Admin sees status change to DETAILS_SUBMITTED and can publish.
- [ ] Published, non-hidden sponsor appears on the public page.
- [ ] Public interest form creates a candidate visible in the CMS.
- [ ] Deployed to a live URL.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| DB not chosen blocks progress | Decide D4 now; SQLite gets us moving immediately |
| Next 16 breaking changes vs training data | Follow root `AGENTS.md`; read `node_modules/next/dist/docs/` |
| Email deliverability (prod) | Ethereal in dev; verify domain (SPF/DKIM) before Resend prod |
| Magic-link security | Expiry + sufficient entropy (32-byte token); invalidate on use/expire |
| Scope creep from "enhanced" features | Keep §3 non-goals explicit; enhanced = Phase 5+ |

---

## 14. Immediate next steps

1. ✅ **D4 decided: SQLite (dev).** *(On hold for the user's Phase 0 review.)*
2. When resumed: switch Prisma to `sqlite`, adjust `benefits`, run first
   **migration + seed**, verify with a query.
3. Start **Phase 1** public pages against seeded data.

---

## 15. Open questions

1. ~~D4: SQLite or Neon?~~ → **Resolved: SQLite for dev.**
2. Real **tiers/prices** for packages (seed currently uses Platinum/Gold/Silver/Bronze in EUR)?
3. Is there a specific **event** (name/dates/venue) to seed into settings?
4. Do you have **branding** (logo/colors) or should we propose a look?
5. Any existing **prospect list** to add as candidates later?

---

## 16. v2 Roadmap — Sponsor CRM expansion (stakeholder feedback)

> **Source:** stakeholder feedback captured in [`docs/QA.md`](./QA.md), 2026-07-08.
> **Scope shift:** from a v1 *sponsor-registration flow* → a full **Sponsor CRM /
> Management Portal** covering the whole sponsorship lifecycle (first contact →
> event completion). This section is a **roadmap for review** — nothing here is
> committed to build yet; we pick 1–2 items to start.

**Legend:** ✅ exists · 🟢 quick win (contained) · 🟡 medium · 🔴 major subsystem.

### 16.1 Capability map (feedback → current state)

| Capability | Tag | Notes / current state |
|---|---|---|
| Two registration paths (public form + personalized email link) | ✅ | `Submission` form + magic-link invite already do this |
| Application workflow states | ✅/🟢 | pipeline `LEAD→INVITE_SENT→ACCEPTED→DETAILS_SUBMITTED→CONFIRMED/DECLINED`; can add Review/Rejected/Waiting-for-payment/Active |
| Package select + slots + logo upload | ✅ | done |
| Email templates + send log | ⚠️ | `EmailTemplate` + `Outreach` exist (outbound only) |
| **Event branding** (B&W / custom + logo + banner/hero) | 🟢 | new; no `Event` model yet (single event via `Setting`) |
| **Rich event fields** (desc, times, map, website, social, contact, language, currency, deadlines, FAQ, terms, privacy/cancellation policy) | 🟢 | new; mostly content fields |
| **Deliverables tracking** (logo/banner/video/booth/speaker/social received) | 🟢 | new; checklist per sponsor |
| **Sponsor profile** (contacts, history, past sponsorships, organizer notes) | 🟢 | new; extend `Sponsor` |
| **Analytics dashboard** (funnel, revenue, pending, unread, availability) | 🟡 | new; some counts derivable already |
| **Document repository** (Prospectus, Contracts, Invoices, PDFs) | 🟡 | new; needs object storage (see D9) |
| **Notifications & reminders** (deadlines, payments, new messages) | 🟡 | new |
| **Task management** ("send logo", deadlines) | 🟡 | new |
| **Email Center — inbound replies + threads** | 🔴 | new; needs inbound mail handling |
| **Multi-event** (everything scoped to `eventId`) | 🔴 | **foundational** — add `Event` model; scope Package/Sponsor/Submission/Template/Outreach/Settings by event |
| **Sponsor accounts / portal login** | 🔴 | new; today sponsors are magic-link only, no accounts |
| **Chat** (sponsor ↔ organizer, real-time) | 🔴 | new |
| **Payments** (online, invoices, receipts, balance, history) | 🔴 | new; needs a provider (Stripe) |
| **Contracts + e-signature** (send / accept / sign) | 🔴 | new |

### 16.2 Proposed phasing (priority order)

> **Gate first:** **Phase A (multi-event)** is foundational — if the product needs
> multiple events, do it before the rest (it changes the schema everywhere and is
> painful to retrofit). If the demo stays single-event, skip A and start at B.

- **Phase A — Multi-event foundation** 🔴 *(decision pending)*
  `Event` model; scope all entities by `eventId`; admin event switcher.
- **Phase B — Event content & branding** 🟢 *(cheap, high-visibility)*
  rich event fields + B&W/custom theme + logo/banner/hero.
- **Phase C — CRM depth** 🟢🟡
  sponsor profile + organizer notes; deliverables checklist; task management.
- **Phase D — Communication** 🟡🔴
  inbound email replies + threads; notifications/reminders; then chat.
- **Phase E — Sponsor accounts & portal** 🔴
  account/login, portal dashboard, application-status tracking.
- **Phase F — Payments & contracts** 🔴
  Stripe payments + invoices/receipts; contracts + e-signature.
- **Phase G — Analytics** 🟡
  conversion funnel, revenue, pending payments, unread, availability.

### 16.3 Recommended demo subset (if staying "demo")

Highest value-per-effort, builds on what exists: **B (branding + event fields)**,
**C (deliverables + sponsor notes)**, and a slice of **G (basic funnel/revenue
dashboard)**. Defer the 🔴 subsystems (multi-event, accounts, payments, chat,
e-signature) unless the demo specifically must show them.

> **Decided 2026-07-08 (Dimitris):** more than a thin demo subset — build real,
> working features in phases. **Multi-event is IN**, and we proceed in **priority
> order → Phase A (multi-event) first**, then B, C, … See §16.4 for the Phase A plan.
