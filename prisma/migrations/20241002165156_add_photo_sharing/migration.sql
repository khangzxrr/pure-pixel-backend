-- CreateTable
CREATE TABLE "PhotoSharing" (
    "id" TEXT NOT NULL,
    "watermark" BOOLEAN NOT NULL,
    "sharePhotoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "originalPhotoId" TEXT NOT NULL,

    CONSTRAINT "PhotoSharing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoSharing" ADD CONSTRAINT "PhotoSharing_originalPhotoId_fkey" FOREIGN KEY ("originalPhotoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
