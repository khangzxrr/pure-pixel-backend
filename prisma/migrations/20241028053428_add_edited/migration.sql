/*
  Warnings:

  - The values [EDITED] on the enum `PhotoType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PhotoType_new" AS ENUM ('RAW', 'BOOKING');
ALTER TABLE "Photo" ALTER COLUMN "photoType" TYPE "PhotoType_new" USING ("photoType"::text::"PhotoType_new");
ALTER TYPE "PhotoType" RENAME TO "PhotoType_old";
ALTER TYPE "PhotoType_new" RENAME TO "PhotoType";
DROP TYPE "PhotoType_old";
COMMIT;
