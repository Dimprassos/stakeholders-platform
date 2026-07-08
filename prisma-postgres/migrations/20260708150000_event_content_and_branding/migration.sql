-- Event content & branding (docs/PLAN.md §16 Phase B) — production (Postgres/Neon).
-- All new columns are nullable or have a DEFAULT, so this applies cleanly to
-- existing rows with no backfill step needed (unlike Phase A's Event migration).
-- Structurally generated via `prisma migrate diff` against the schema change.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "brandAccentColor" TEXT,
ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "brandInkColor" TEXT,
ADD COLUMN     "cancellationText" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "deadlines" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "faq" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "privacyText" TEXT,
ADD COLUMN     "termsText" TEXT,
ADD COLUMN     "themeMode" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
