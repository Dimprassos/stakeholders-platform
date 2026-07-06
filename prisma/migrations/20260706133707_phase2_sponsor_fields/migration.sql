-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Sponsor_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sponsor" ("companyName", "contactEmail", "contactName", "createdAt", "description", "displayOrder", "id", "isPublished", "logoUrl", "packageId", "status", "updatedAt", "websiteUrl") SELECT "companyName", "contactEmail", "contactName", "createdAt", "description", "displayOrder", "id", "isPublished", "logoUrl", "packageId", "status", "updatedAt", "websiteUrl" FROM "Sponsor";
DROP TABLE "Sponsor";
ALTER TABLE "new_Sponsor" RENAME TO "Sponsor";
CREATE UNIQUE INDEX "Sponsor_magicToken_key" ON "Sponsor"("magicToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
