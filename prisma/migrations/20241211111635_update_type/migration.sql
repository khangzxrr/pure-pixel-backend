/*
  Warnings:

  - The values [BOOKING,PHOTO_SELL,PHOTO_BUY,PHOTO,PHOTO_BUY_FAIL_REFUND] on the enum `NotificationReferenceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationReferenceType_new" AS ENUM ('CHAT', 'UPGRADE_PACKAGE', 'PHOTO_BAN', 'PHOTO_UNBAN', 'BAN', 'CUSTOMER_PHOTO_BUY', 'PHOTOGRAPHER_PHOTO_SELL', 'DUPLICATED_PHOTO', 'PHOTO_NEW_PRICE_UPDATED', 'CUSTOMER_BOOKING_REQUEST', 'PHOTOGRAPHER_BOOKING_NEW_REQUEST', 'CUSTOMER_BOOKING_CANCEL', 'CUSTOMER_BOOKING_PHOTO_ADD', 'CUSTOMER_BOOKING_PHOTO_REMOVE', 'CUSTOMER_BOOKING_ACCEPT', 'CUSTOMER_BOOKING_BILL_UPDATE');
ALTER TABLE "Notification" ALTER COLUMN "referenceType" TYPE "NotificationReferenceType_new" USING ("referenceType"::text::"NotificationReferenceType_new");
ALTER TYPE "NotificationReferenceType" RENAME TO "NotificationReferenceType_old";
ALTER TYPE "NotificationReferenceType_new" RENAME TO "NotificationReferenceType";
DROP TYPE "NotificationReferenceType_old";
COMMIT;
