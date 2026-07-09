-- Organizer CRM (docs/PLAN.md §16 Phase C) — production (Postgres/Neon).
-- Single nullable column, applies cleanly to existing rows with no backfill.
-- Mirrors prisma/migrations/20260709090241_add_sponsor_notes.

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "notes" TEXT;
