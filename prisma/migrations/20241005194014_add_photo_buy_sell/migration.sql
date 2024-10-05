-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "fee" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PhotoSell" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "afterPhotoUrl" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "PhotoSell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoBuy" (
    "id" TEXT NOT NULL,
    "photoSellId" TEXT NOT NULL,
    "userToUserTransactionId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoId" TEXT,

    CONSTRAINT "PhotoBuy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoBuy_userToUserTransactionId_key" ON "PhotoBuy"("userToUserTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoBuy_photoSellId_buyerId_key" ON "PhotoBuy"("photoSellId", "buyerId");

-- AddForeignKey
ALTER TABLE "PhotoSell" ADD CONSTRAINT "PhotoSell_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSell" ADD CONSTRAINT "PhotoSell_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoBuy" ADD CONSTRAINT "PhotoBuy_photoSellId_fkey" FOREIGN KEY ("photoSellId") REFERENCES "PhotoSell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoBuy" ADD CONSTRAINT "PhotoBuy_userToUserTransactionId_fkey" FOREIGN KEY ("userToUserTransactionId") REFERENCES "UserToUserTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoBuy" ADD CONSTRAINT "PhotoBuy_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoBuy" ADD CONSTRAINT "PhotoBuy_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
