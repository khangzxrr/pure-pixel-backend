-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expertises" TEXT[],
ADD COLUMN     "mail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phonenumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "socialLinks" TEXT[];
