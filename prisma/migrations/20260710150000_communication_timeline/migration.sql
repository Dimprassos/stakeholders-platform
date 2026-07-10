-- AlterTable
ALTER TABLE "Outreach" ADD COLUMN "direction" TEXT NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE "Outreach" ADD COLUMN "receivedAt" DATETIME;
ALTER TABLE "Outreach" ADD COLUMN "readAt" DATETIME;

-- CreateIndex
CREATE INDEX "Outreach_sponsorId_idx" ON "Outreach"("sponsorId");
