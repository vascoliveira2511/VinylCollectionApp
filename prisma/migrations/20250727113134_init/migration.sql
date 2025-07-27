-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "discogsUsername" TEXT,
    "avatar" TEXT,
    "avatarType" TEXT NOT NULL DEFAULT 'generated',
    "discogsAccessToken" TEXT,
    "discogsAccessTokenSecret" TEXT,
    "displayView" TEXT NOT NULL DEFAULT 'grid',
    "recordsPerPage" INTEGER NOT NULL DEFAULT 20,
    "showGenreChart" BOOLEAN NOT NULL DEFAULT true,
    "showDecadeChart" BOOLEAN NOT NULL DEFAULT true,
    "showArtistChart" BOOLEAN NOT NULL DEFAULT true,
    "discogsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "color" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vinyl" (
    "id" SERIAL NOT NULL,
    "discogsId" INTEGER,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "imageUrl" TEXT,
    "genres" TEXT NOT NULL,
    "condition" TEXT,
    "sleeveCondition" TEXT,
    "rating" INTEGER,
    "description" TEXT,
    "trackList" TEXT,
    "label" TEXT,
    "format" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "purchaseCurrency" TEXT,
    "purchaseLocation" TEXT,
    "catalogNumber" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER,

    CONSTRAINT "Vinyl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteVinyl" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "vinylId" INTEGER NOT NULL,

    CONSTRAINT "FavoriteVinyl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" SERIAL NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "vinylId" INTEGER NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinylComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "isReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "discogsId" INTEGER NOT NULL,

    CONSTRAINT "VinylComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVinylStatus" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "discogsId" INTEGER NOT NULL,

    CONSTRAINT "UserVinylStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- CreateIndex
CREATE INDEX "Collection_userId_type_idx" ON "Collection"("userId", "type");

-- CreateIndex
CREATE INDEX "Vinyl_userId_idx" ON "Vinyl"("userId");

-- CreateIndex
CREATE INDEX "Vinyl_collectionId_idx" ON "Vinyl"("collectionId");

-- CreateIndex
CREATE INDEX "Friend_senderId_idx" ON "Friend"("senderId");

-- CreateIndex
CREATE INDEX "Friend_receiverId_idx" ON "Friend"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_senderId_receiverId_key" ON "Friend"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "FavoriteVinyl_userId_idx" ON "FavoriteVinyl"("userId");

-- CreateIndex
CREATE INDEX "FavoriteVinyl_vinylId_idx" ON "FavoriteVinyl"("vinylId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteVinyl_userId_vinylId_key" ON "FavoriteVinyl"("userId", "vinylId");

-- CreateIndex
CREATE INDEX "Recommendation_senderId_idx" ON "Recommendation"("senderId");

-- CreateIndex
CREATE INDEX "Recommendation_receiverId_idx" ON "Recommendation"("receiverId");

-- CreateIndex
CREATE INDEX "Recommendation_vinylId_idx" ON "Recommendation"("vinylId");

-- CreateIndex
CREATE INDEX "VinylComment_userId_idx" ON "VinylComment"("userId");

-- CreateIndex
CREATE INDEX "VinylComment_discogsId_idx" ON "VinylComment"("discogsId");

-- CreateIndex
CREATE INDEX "VinylComment_discogsId_isReview_idx" ON "VinylComment"("discogsId", "isReview");

-- CreateIndex
CREATE INDEX "UserVinylStatus_userId_idx" ON "UserVinylStatus"("userId");

-- CreateIndex
CREATE INDEX "UserVinylStatus_discogsId_idx" ON "UserVinylStatus"("discogsId");

-- CreateIndex
CREATE INDEX "UserVinylStatus_userId_status_idx" ON "UserVinylStatus"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserVinylStatus_userId_discogsId_key" ON "UserVinylStatus"("userId", "discogsId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinyl" ADD CONSTRAINT "Vinyl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinyl" ADD CONSTRAINT "Vinyl_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteVinyl" ADD CONSTRAINT "FavoriteVinyl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteVinyl" ADD CONSTRAINT "FavoriteVinyl_vinylId_fkey" FOREIGN KEY ("vinylId") REFERENCES "Vinyl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_vinylId_fkey" FOREIGN KEY ("vinylId") REFERENCES "Vinyl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinylComment" ADD CONSTRAINT "VinylComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVinylStatus" ADD CONSTRAINT "UserVinylStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
