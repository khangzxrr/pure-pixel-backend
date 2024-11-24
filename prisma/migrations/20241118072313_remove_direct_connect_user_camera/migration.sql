/*
  Warnings:

  - You are about to drop the `_CameraToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CameraToUser" DROP CONSTRAINT "_CameraToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_CameraToUser" DROP CONSTRAINT "_CameraToUser_B_fkey";

-- DropTable
DROP TABLE "_CameraToUser";
