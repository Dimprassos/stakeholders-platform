-- Sponsor deliverables checklist (docs/PLAN.md §16 Phase C) — production (Postgres/Neon).
-- Single column with a DEFAULT, applies cleanly to existing rows with no backfill.
-- Mirrors prisma/migrations/20260709091053_add_sponsor_deliverables.

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "deliverables" TEXT NOT NULL DEFAULT '{}';
