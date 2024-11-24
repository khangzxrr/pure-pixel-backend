/*
  Warnings:

  - The values [ONLY_FOLLOWER] on the enum `NewsfeedVisibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NewsfeedVisibility_new" AS ENUM ('PUBLIC', 'ONLY_FOLLOWING', 'ONLY_ME');
ALTER TABLE "Newsfeed" ALTER COLUMN "visibility" TYPE "NewsfeedVisibility_new" USING ("visibility"::text::"NewsfeedVisibility_new");
ALTER TYPE "NewsfeedVisibility" RENAME TO "NewsfeedVisibility_old";
ALTER TYPE "NewsfeedVisibility_new" RENAME TO "NewsfeedVisibility";
DROP TYPE "NewsfeedVisibility_old";
COMMIT;
