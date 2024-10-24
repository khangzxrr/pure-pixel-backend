-- CreateTable
CREATE TABLE "PopularCameraTimeline" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopularCameraTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopularCameraDataPoint" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "userCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopularCameraDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PopularCameraDataPoint_cameraId_timelineId_key" ON "PopularCameraDataPoint"("cameraId", "timelineId");

-- AddForeignKey
ALTER TABLE "PopularCameraDataPoint" ADD CONSTRAINT "PopularCameraDataPoint_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopularCameraDataPoint" ADD CONSTRAINT "PopularCameraDataPoint_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "PopularCameraTimeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
