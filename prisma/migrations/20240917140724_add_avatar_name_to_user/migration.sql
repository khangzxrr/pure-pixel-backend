/*
  Warnings:

  - Added the required column `avatar` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT NOT NULL DEFAULT 'https://s3-hcm-r1.s3cloud.vn/sftpgo/avatar%2Favatar.png',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
