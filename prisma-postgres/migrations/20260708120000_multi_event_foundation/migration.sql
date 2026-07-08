-- Multi-event foundation (docs/PLAN.md §16 Phase A) — production (Postgres/Neon).
-- Hand-written (not `prisma migrate dev`) because it must preserve EXISTING data:
--   1. Create Event, seed one default Event from the current Setting values
--      (falls back to the same defaults src/lib/event.ts uses if a key/row is
--      missing, so this is safe to run against a never-seeded database too).
--   2. Add eventId to Package/Sponsor/Submission/Outreach/EmailTemplate as
--      NULLABLE, backfill every existing row to the new default Event, THEN
--      make it NOT NULL — a single NOT NULL ADD COLUMN fails on existing rows.
--   3. Add the eventId indexes + foreign keys.
--   4. Drop Setting (its data has already been copied onto the default Event).
-- Structurally verified equivalent to `prisma migrate diff --to-schema-datamodel
-- prisma-postgres/schema.prisma` (see docs/TASK.md for the verification note).

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "venue" TEXT,
    "senderEmail" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- Seed the default Event from the current Setting rows.
INSERT INTO "Event" ("id", "slug", "name", "tagline", "startDate", "endDate", "venue", "senderEmail", "isDefault", "isActive", "updatedAt")
VALUES (
    'c6f48117-6caf-4160-97cb-b42d3bfe0d03',
    'default-event',
    COALESCE((SELECT "value" FROM "Setting" WHERE "key" = 'eventName'), 'Stakeholders Summit 2026'),
    (SELECT "value" FROM "Setting" WHERE "key" = 'tagline'),
    (SELECT "value" FROM "Setting" WHERE "key" = 'eventStartDate'),
    (SELECT "value" FROM "Setting" WHERE "key" = 'eventEndDate'),
    (SELECT "value" FROM "Setting" WHERE "key" = 'venue'),
    (SELECT "value" FROM "Setting" WHERE "key" = 'senderEmail'),
    true,
    true,
    CURRENT_TIMESTAMP
);

-- AlterTable: Package (nullable -> backfill -> required)
ALTER TABLE "Package" ADD COLUMN "eventId" TEXT;
UPDATE "Package" SET "eventId" = 'c6f48117-6caf-4160-97cb-b42d3bfe0d03';
ALTER TABLE "Package" ALTER COLUMN "eventId" SET NOT NULL;

-- AlterTable: Sponsor
ALTER TABLE "Sponsor" ADD COLUMN "eventId" TEXT;
UPDATE "Sponsor" SET "eventId" = 'c6f48117-6caf-4160-97cb-b42d3bfe0d03';
ALTER TABLE "Sponsor" ALTER COLUMN "eventId" SET NOT NULL;

-- AlterTable: Submission
ALTER TABLE "Submission" ADD COLUMN "eventId" TEXT;
UPDATE "Submission" SET "eventId" = 'c6f48117-6caf-4160-97cb-b42d3bfe0d03';
ALTER TABLE "Submission" ALTER COLUMN "eventId" SET NOT NULL;

-- AlterTable: Outreach
ALTER TABLE "Outreach" ADD COLUMN "eventId" TEXT;
UPDATE "Outreach" SET "eventId" = 'c6f48117-6caf-4160-97cb-b42d3bfe0d03';
ALTER TABLE "Outreach" ALTER COLUMN "eventId" SET NOT NULL;

-- AlterTable: EmailTemplate
ALTER TABLE "EmailTemplate" ADD COLUMN "eventId" TEXT;
UPDATE "EmailTemplate" SET "eventId" = 'c6f48117-6caf-4160-97cb-b42d3bfe0d03';
ALTER TABLE "EmailTemplate" ALTER COLUMN "eventId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Package_eventId_idx" ON "Package"("eventId");
CREATE INDEX "Sponsor_eventId_idx" ON "Sponsor"("eventId");
CREATE INDEX "Submission_eventId_idx" ON "Submission"("eventId");
CREATE INDEX "Outreach_eventId_idx" ON "Outreach"("eventId");
CREATE INDEX "EmailTemplate_eventId_idx" ON "EmailTemplate"("eventId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable (its values have already been copied onto the default Event above)
DROP TABLE "Setting";
