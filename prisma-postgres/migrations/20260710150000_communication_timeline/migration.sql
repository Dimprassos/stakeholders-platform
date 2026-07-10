-- AlterTable
ALTER TABLE "Outreach" ADD COLUMN "direction" TEXT NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE "Outreach" ADD COLUMN "receivedAt" TIMESTAMP(3);
ALTER TABLE "Outreach" ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Outreach_sponsorId_idx" ON "Outreach"("sponsorId");
