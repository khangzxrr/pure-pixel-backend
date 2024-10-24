/*
  Warnings:

  - A unique constraint covering the columns `[timestamp]` on the table `PopularCameraTimeline` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timestamp` to the `PopularCameraTimeline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PopularCameraTimeline" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PopularCameraTimeline_timestamp_key" ON "PopularCameraTimeline"("timestamp");
