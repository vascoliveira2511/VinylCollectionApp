-- CreateTable
CREATE TABLE "Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vinyl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discogsId" INTEGER,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "imageUrl" TEXT,
    "genres" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER,
    CONSTRAINT "Vinyl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vinyl_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vinyl" ("artist", "createdAt", "discogsId", "genres", "id", "imageUrl", "title", "updatedAt", "userId", "year") SELECT "artist", "createdAt", "discogsId", "genres", "id", "imageUrl", "title", "updatedAt", "userId", "year" FROM "Vinyl";
DROP TABLE "Vinyl";
ALTER TABLE "new_Vinyl" RENAME TO "Vinyl";
CREATE INDEX "Vinyl_userId_idx" ON "Vinyl"("userId");
CREATE INDEX "Vinyl_collectionId_idx" ON "Vinyl"("collectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");
