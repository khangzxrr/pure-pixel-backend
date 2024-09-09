-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_categoryId_fkey";

-- AlterTable
ALTER TABLE "Photo" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
