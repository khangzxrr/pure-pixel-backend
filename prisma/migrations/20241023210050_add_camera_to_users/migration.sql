-- CreateTable
CREATE TABLE "CameraOnUsers" (
    "cameraId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraOnUsers_pkey" PRIMARY KEY ("cameraId","userId")
);

-- CreateTable
CREATE TABLE "_CameraToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CameraToUser_AB_unique" ON "_CameraToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CameraToUser_B_index" ON "_CameraToUser"("B");

-- AddForeignKey
ALTER TABLE "CameraOnUsers" ADD CONSTRAINT "CameraOnUsers_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraOnUsers" ADD CONSTRAINT "CameraOnUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CameraToUser" ADD CONSTRAINT "_CameraToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CameraToUser" ADD CONSTRAINT "_CameraToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
