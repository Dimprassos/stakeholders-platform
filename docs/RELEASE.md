# Release Notes / Deploy Runbook

Last updated: 2026-07-07

## Current Status

The app is ready for local demo and staging review. Public pages, admin CMS, magic-link invites, onboarding, logo upload in development, SEO metadata, sitemap/robots, responsive polish and warm gold branding are implemented.

Production deployment still needs provider setup and one infrastructure decision: persistent logo storage. Until object storage is added, production hides direct logo file uploads and asks sponsors for hosted logo URLs.

## Required Production Services

- Hosting: Vercel or another Node.js Next.js host.
- Database: Neon Postgres or equivalent managed Postgres.
- Email: SMTP provider such as Resend SMTP.
- Storage: object storage for production logo uploads, deferred for now.

## Required Environment Variables

- `DATABASE_URL`: production Postgres connection string.
- `AUTH_SECRET`: generated with `openssl rand -base64 32`.
- `EMAIL_FROM`: verified sender, for example `Stakeholders <sponsorships@your-domain>`.
- `SMTP_HOST`: SMTP host from the email provider.
- `SMTP_PORT`: usually `465` or `587`.
- `SMTP_USER`: SMTP username.
- `SMTP_PASS`: SMTP password/API key.
- `NEXT_PUBLIC_SITE_URL`: deployed origin with no trailing slash.

## Database Release Steps

Local development uses `prisma/schema.prisma` with SQLite. Production uses the
separate `prisma-postgres/schema.prisma` schema and migrations so local dev does
not break while preparing Neon.

Before real production launch:

1. Create a Neon database.
2. Set `DATABASE_URL` to the Neon connection string.
3. Apply the Postgres migrations:

```bash
npm run db:migrate:postgres
```

4. Seed only intentional production data:

```bash
npm run db:seed:postgres
```

5. After any Postgres command that generates `@prisma/client`, run the local
   SQLite generator again before returning to local SQLite work:

```bash
npm run db:generate
```

Do not point the SQLite schema at a Postgres URL. Use the `*:postgres` scripts.

## Vercel Deploy Checklist

1. Push the final branch to GitHub.
2. Import the repo in Vercel.
3. Set the environment variables above for Production and Preview.
4. The repo includes `vercel.json`, which sets the Vercel build command to:

```bash
npm run build:postgres
```

   If the Vercel UI overrides this value, set it manually to the same command.

5. Deploy Preview first.
6. Run the QA smoke checklist against the Preview URL.
7. Set `NEXT_PUBLIC_SITE_URL` to the final production URL.
8. Promote/deploy Production.

## Pre-Deploy Verification

Run locally before deploying:

```bash
npm run db:seed
npm run typecheck
npm run lint
npm run build
```

Then start the production build and smoke test public/admin routes:

```bash
npm run start
```

## Launch Blockers

- Production Postgres migration must be completed.
- Real SMTP credentials and a verified sending domain must be configured.
- Decide whether production sponsor logos will use hosted URLs only for v1 or object storage upload support.
- Replace demo content with final event tiers, prices, venue, dates and sponsor names.
