-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "is_premium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" TEXT;
