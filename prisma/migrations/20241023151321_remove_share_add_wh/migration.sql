/*
  Warnings:

  - You are about to drop the column `sharePayload` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `shareStatus` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `height` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PhotoStatus" ADD VALUE 'VERIFYING';

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "sharePayload",
DROP COLUMN "shareStatus",
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "ShareStatus";
