-- CreateTable
CREATE TABLE "PhotoshootDetail" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptions" TEXT[],
    "photoshootPackageId" TEXT NOT NULL,

    CONSTRAINT "PhotoshootDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoshootReview" (
    "id" TEXT NOT NULL,
    "star" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoshootPackageId" TEXT NOT NULL,

    CONSTRAINT "PhotoshootReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoshootPackage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PhotoshootPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoshootDetail" ADD CONSTRAINT "PhotoshootDetail_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoshootReview" ADD CONSTRAINT "PhotoshootReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoshootReview" ADD CONSTRAINT "PhotoshootReview_photoshootPackageId_fkey" FOREIGN KEY ("photoshootPackageId") REFERENCES "PhotoshootPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoshootPackage" ADD CONSTRAINT "PhotoshootPackage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
