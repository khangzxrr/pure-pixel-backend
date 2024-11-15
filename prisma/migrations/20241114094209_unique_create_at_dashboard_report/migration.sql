/*
  Warnings:

  - A unique constraint covering the columns `[createdAt]` on the table `DashboardReport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DashboardReport_createdAt_key" ON "DashboardReport"("createdAt");
