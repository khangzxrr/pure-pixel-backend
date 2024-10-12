-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'WAITING_FEEDBACK', 'RESPONSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('USER', 'PHOTO', 'BOOKING', 'COMMENT');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportStatus" "ReportStatus" NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportResponse" ADD CONSTRAINT "ReportResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
