/*
  Warnings:

  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `eventId` to the `EmailTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Outreach` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Sponsor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Setting";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "venue" TEXT,
    "senderEmail" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailTemplate" ("body", "createdAt", "id", "name", "subject", "updatedAt") SELECT "body", "createdAt", "id", "name", "subject", "updatedAt" FROM "EmailTemplate";
DROP TABLE "EmailTemplate";
ALTER TABLE "new_EmailTemplate" RENAME TO "EmailTemplate";
CREATE INDEX "EmailTemplate_eventId_idx" ON "EmailTemplate"("eventId");
CREATE TABLE "new_Outreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "prospectEmail" TEXT,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Outreach_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Outreach_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Outreach_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Outreach" ("body", "createdAt", "id", "prospectEmail", "sentAt", "sponsorId", "status", "subject", "templateId") SELECT "body", "createdAt", "id", "prospectEmail", "sentAt", "sponsorId", "status", "subject", "templateId" FROM "Outreach";
DROP TABLE "Outreach";
ALTER TABLE "new_Outreach" RENAME TO "Outreach";
CREATE INDEX "Outreach_eventId_idx" ON "Outreach"("eventId");
CREATE TABLE "new_Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "slotsTotal" INTEGER,
    "slotsTaken" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Package_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Package" ("benefits", "createdAt", "currency", "displayOrder", "id", "isActive", "name", "priceCents", "slotsTaken", "slotsTotal", "tier", "updatedAt") SELECT "benefits", "createdAt", "currency", "displayOrder", "id", "isActive", "name", "priceCents", "slotsTaken", "slotsTotal", "tier", "updatedAt" FROM "Package";
DROP TABLE "Package";
ALTER TABLE "new_Package" RENAME TO "Package";
CREATE INDEX "Package_eventId_idx" ON "Package"("eventId");
CREATE TABLE "new_Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "packageId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isHiddenFromPublic" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "magicToken" TEXT,
    "tokenIssuedAt" DATETIME,
    "tokenExpiresAt" DATETIME,
    "legalName" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sponsor_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sponsor" ("billingAddress", "companyName", "contactEmail", "contactName", "createdAt", "description", "displayOrder", "id", "isHiddenFromPublic", "isPublished", "legalName", "logoUrl", "magicToken", "packageId", "status", "tokenExpiresAt", "tokenIssuedAt", "updatedAt", "vatNumber", "websiteUrl") SELECT "billingAddress", "companyName", "contactEmail", "contactName", "createdAt", "description", "displayOrder", "id", "isHiddenFromPublic", "isPublished", "legalName", "logoUrl", "magicToken", "packageId", "status", "tokenExpiresAt", "tokenIssuedAt", "updatedAt", "vatNumber", "websiteUrl" FROM "Sponsor";
DROP TABLE "Sponsor";
ALTER TABLE "new_Sponsor" RENAME TO "Sponsor";
CREATE UNIQUE INDEX "Sponsor_magicToken_key" ON "Sponsor"("magicToken");
CREATE INDEX "Sponsor_eventId_idx" ON "Sponsor"("eventId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "packageInterestId" TEXT,
    "message" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_packageInterestId_fkey" FOREIGN KEY ("packageInterestId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("companyName", "consentGiven", "contactName", "createdAt", "email", "id", "message", "packageInterestId", "phone", "status") SELECT "companyName", "consentGiven", "contactName", "createdAt", "email", "id", "message", "packageInterestId", "phone", "status" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_eventId_idx" ON "Submission"("eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
