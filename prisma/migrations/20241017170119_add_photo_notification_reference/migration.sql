/*
  Warnings:

  - The values [COMMENT] on the enum `NotificationReferenceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationReferenceType_new" AS ENUM ('BOOKING', 'CHAT', 'UPGRADE_PACKAGE', 'PHOTO_SELL', 'PHOTO_BUY', 'PHOTO');
ALTER TABLE "Notification" ALTER COLUMN "referenceType" TYPE "NotificationReferenceType_new" USING ("referenceType"::text::"NotificationReferenceType_new");
ALTER TYPE "NotificationReferenceType" RENAME TO "NotificationReferenceType_old";
ALTER TYPE "NotificationReferenceType_new" RENAME TO "NotificationReferenceType";
DROP TYPE "NotificationReferenceType_old";
COMMIT;
