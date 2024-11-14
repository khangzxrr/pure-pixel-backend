-- CreateTable
CREATE TABLE "DashboardReport" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardReport_pkey" PRIMARY KEY ("id")
);
