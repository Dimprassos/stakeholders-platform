# QA Checklist

Last updated: 2026-07-07

## Automated Checks

Run before every commit or deploy:

```bash
npx prisma validate
env DATABASE_URL=postgresql://user:pass@localhost:5432/stakeholders npx prisma validate --schema prisma-postgres/schema.prisma
npm run typecheck
npm run lint
npm run build
```

Notes:
- `npm run build` needs network access while using `next/font/google`; otherwise it can fail fetching Geist fonts.
- `npm run db:seed` may need an unsandboxed shell locally because `tsx` creates an IPC pipe under `/tmp`.

## Public Pages

- `/` renders event identity, date/venue, CTAs and highlight cards.
- `/packages` renders active packages ordered by `displayOrder`, with benefits, pricing and slot counts.
- `/sponsors` renders only sponsors where `isPublished=true` and `isHiddenFromPublic=false`, grouped by package tier.
- `/become-a-sponsor` accepts valid interest form submissions and rejects missing required fields.
- Header active states and CTA styling are visible in light and dark mode.

## Admin CMS

- `/admin/login` rejects invalid credentials.
- Valid admin credentials open `/admin`.
- Unauthenticated `/admin/*` requests redirect to `/admin/login`.
- Dashboard counts match sponsor statuses.
- Packages can be created, edited, activated/deactivated and deleted when unassigned.
- Candidates can be added and filtered by status.
- Submissions appear in the admin inbox after public form submission.
- Onboarding review can confirm/publish and unpublish sponsors.

## Magic-Link Sponsor Flow

- Admin can send an invite to a candidate with a package and email.
- Dev email returns an Ethereal preview URL.
- `/invite/[token]` rejects invalid or expired tokens.
- Candidate can accept the invitation.
- Candidate cannot submit onboarding before accepting.
- Candidate can decline; declined tokens are invalidated.
- Onboarding accepts legal name, billing address, VAT, website, description and hidden-from-public preference.
- Dev onboarding supports PNG/JPG/WEBP logo file upload up to 2 MB.
- Production onboarding hides local file upload and accepts hosted logo URLs only until object storage is connected.
- Submitted onboarding changes sponsor status to `DETAILS_SUBMITTED` and invalidates the token.

## Release Smoke

After `npm run build`, run a production server and verify:

```bash
npm run start
```

Smoke routes:
- `/`
- `/packages`
- `/sponsors`
- `/become-a-sponsor`
- `/admin/login`

## Known Gaps

- No automated browser suite yet.
- Production database migration to Postgres is not implemented in this repo state.
- Production object storage for uploaded logos is not implemented; hosted logo URLs are the production-safe path.
- `docs/RELEASE.md` must be completed with the actual deploy URL and provider credentials before launch.
