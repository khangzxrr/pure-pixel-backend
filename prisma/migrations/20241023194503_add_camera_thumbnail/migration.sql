/*
  Warnings:

  - Added the required column `thumbnail` to the `Camera` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `CameraMaker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CameraMaker" ADD COLUMN     "thumbnail" TEXT NOT NULL;
