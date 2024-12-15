/*
  Warnings:

  - The values [PHOTO_NEW_PRICE_UPDATED,CUSTOMER_BOOKING_CLEAN_UP,PHOTOGRAPHER_BOOKING_CLEAN_UP] on the enum `NotificationReferenceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationReferenceType_new" AS ENUM ('CHAT', 'UPGRADE_PACKAGE', 'PHOTO_BAN', 'PHOTO_UNBAN', 'BAN', 'PHOTO_COMMENT', 'CUSTOMER_PHOTO_BUY', 'PHOTOGRAPHER_PHOTO_SELL', 'DUPLICATED_PHOTO', 'CUSTOMER_BOOKING_REQUEST', 'CUSTOMER_BOOKING_CANCEL', 'CUSTOMER_BOOKING_PHOTO_ADD', 'CUSTOMER_BOOKING_PHOTO_REMOVE', 'CUSTOMER_BOOKING_ACCEPT', 'CUSTOMER_BOOKING_BILL_UPDATE', 'CUSTOMER_BOOKING_PAID', 'CUSTOMER_BOOKING_NOTE_UPDATE', 'PHOTOGRAPHER_NEW_BOOKING_REVIEW', 'PHOTOGRAPHER_BOOKING_NEW_REQUEST');
ALTER TABLE "Notification" ALTER COLUMN "referenceType" TYPE "NotificationReferenceType_new" USING ("referenceType"::text::"NotificationReferenceType_new");
ALTER TYPE "NotificationReferenceType" RENAME TO "NotificationReferenceType_old";
ALTER TYPE "NotificationReferenceType_new" RENAME TO "NotificationReferenceType";
DROP TYPE "NotificationReferenceType_old";
COMMIT;
