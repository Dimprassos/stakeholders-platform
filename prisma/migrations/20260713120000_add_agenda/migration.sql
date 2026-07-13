-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "dayLabel" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SESSION',
    "location" TEXT,
    "speaker" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgendaItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgendaItem_eventId_idx" ON "AgendaItem"("eventId");

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "agendaNote" TEXT;
