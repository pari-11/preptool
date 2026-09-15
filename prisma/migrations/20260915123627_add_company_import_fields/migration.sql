-- Make roadmap-specific fields optional so companywise-only problems can exist without a roadmap placement
ALTER TABLE "Problem" ALTER COLUMN "stage_id" DROP NOT NULL;
ALTER TABLE "Problem" ALTER COLUMN "roadmap_order" DROP NOT NULL;
ALTER TABLE "Problem" ALTER COLUMN "tier" DROP NOT NULL;

-- Add companywise import fields
ALTER TABLE "Problem" ADD COLUMN "acceptance_rate" DOUBLE PRECISION;
ALTER TABLE "Problem" ADD COLUMN "frequency" DOUBLE PRECISION;

-- Dedup key for import (one Problem row per LeetCode URL)
CREATE UNIQUE INDEX "Problem_source_link_key" ON "Problem"("source_link");
