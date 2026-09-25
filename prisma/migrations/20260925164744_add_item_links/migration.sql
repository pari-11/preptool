-- CreateEnum
CREATE TYPE "ItemLinkType" AS ENUM ('SameProblem', 'HarderVariant', 'SameInsight', 'Prerequisite', 'FreeForm');

-- CreateEnum
CREATE TYPE "LinkCreator" AS ENUM ('User', 'System');

-- CreateTable
CREATE TABLE "ItemLink" (
    "id" TEXT NOT NULL,
    "from_type" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_type" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "link_type" "ItemLinkType" NOT NULL,
    "label" TEXT,
    "created_by" "LinkCreator" NOT NULL DEFAULT 'User',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemLink_from_type_from_id_idx" ON "ItemLink"("from_type", "from_id");

-- CreateIndex
CREATE INDEX "ItemLink_to_type_to_id_idx" ON "ItemLink"("to_type", "to_id");
