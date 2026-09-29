-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "neetcode_link" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Problem_neetcode_link_key" ON "Problem"("neetcode_link");
