# Stakeholders Sponsorship Platform

Next.js sponsorship platform for an event organizer and sponsor candidates.

Core flow:

1. Admin manages packages and candidate sponsors.
2. Admin sends a personal magic-link invite.
3. Sponsor accepts or declines the proposal.
4. Sponsor submits onboarding details.
5. Admin confirms/publishes the sponsor.
6. Published, non-hidden sponsors appear on the public sponsors page.

## Local Development

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Default local admin:

- Email: `admin@stakeholders.local`
- Password: `admin1234`

Local development uses SQLite via `prisma/schema.prisma`.

## Checks

```bash
npx prisma validate
env DATABASE_URL=postgresql://user:pass@localhost:5432/stakeholders npx prisma validate --schema prisma-postgres/schema.prisma
npm run typecheck
npm run lint
npm run build
```

`npm run build` needs network access while the app uses `next/font/google`.

## Production Path

Production is prepared for Neon/Postgres through a separate Prisma schema:

- SQLite local schema: `prisma/schema.prisma`
- Postgres production schema: `prisma-postgres/schema.prisma`
- Postgres migrations: `prisma-postgres/migrations`

Useful production commands:

```bash
npm run db:migrate:postgres
npm run db:seed:postgres
npm run build:postgres
```

For Vercel, set the build command to `npm run build:postgres`.

See [docs/QA.md](./docs/QA.md) and [docs/RELEASE.md](./docs/RELEASE.md).
