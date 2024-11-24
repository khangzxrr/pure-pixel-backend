/*
  Warnings:

  - Added the required column `reportId` to the `ReportResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReportResponse" ADD COLUMN     "reportId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ReportResponse" ADD CONSTRAINT "ReportResponse_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
