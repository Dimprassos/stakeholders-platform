-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
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
    "mapUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "websiteUrl" TEXT,
    "twitterUrl" TEXT,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "faq" TEXT NOT NULL DEFAULT '[]',
    "deadlines" TEXT NOT NULL DEFAULT '[]',
    "termsText" TEXT,
    "privacyText" TEXT,
    "cancellationText" TEXT,
    "themeMode" TEXT NOT NULL DEFAULT 'LIGHT',
    "brandColor" TEXT,
    "brandInkColor" TEXT,
    "brandAccentColor" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("createdAt", "endDate", "id", "isActive", "isDefault", "name", "senderEmail", "slug", "startDate", "tagline", "updatedAt", "venue") SELECT "createdAt", "endDate", "id", "isActive", "isDefault", "name", "senderEmail", "slug", "startDate", "tagline", "updatedAt", "venue" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
