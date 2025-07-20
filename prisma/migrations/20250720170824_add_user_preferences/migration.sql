-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "discogsUsername" TEXT,
    "avatar" TEXT,
    "avatarType" TEXT NOT NULL DEFAULT 'generated',
    "displayView" TEXT NOT NULL DEFAULT 'grid',
    "recordsPerPage" INTEGER NOT NULL DEFAULT 20,
    "showGenreChart" BOOLEAN NOT NULL DEFAULT true,
    "showDecadeChart" BOOLEAN NOT NULL DEFAULT true,
    "showArtistChart" BOOLEAN NOT NULL DEFAULT true,
    "discogsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "avatarType", "createdAt", "discogsUsername", "email", "googleId", "id", "password", "updatedAt", "username") SELECT "avatar", "avatarType", "createdAt", "discogsUsername", "email", "googleId", "id", "password", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
