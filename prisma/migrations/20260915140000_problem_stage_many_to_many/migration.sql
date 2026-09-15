-- Problem no longer has a single stage_id/roadmap_order/tier/is_priority; these move to
-- a ProblemStage join table so a problem can be drilled under more than one stage/technique.
ALTER TABLE "Problem" DROP CONSTRAINT IF EXISTS "Problem_stage_id_fkey";
ALTER TABLE "Problem" DROP COLUMN IF EXISTS "stage_id";
ALTER TABLE "Problem" DROP COLUMN IF EXISTS "roadmap_order";
ALTER TABLE "Problem" DROP COLUMN IF EXISTS "tier";
ALTER TABLE "Problem" DROP COLUMN IF EXISTS "is_priority";

-- LeetCode's own numeric problem ID, the cross-source match key between the companywise
-- import and the roadmap import.
ALTER TABLE "Problem" ADD COLUMN "leetcode_id" INTEGER;
CREATE UNIQUE INDEX "Problem_leetcode_id_key" ON "Problem"("leetcode_id");

CREATE TABLE "ProblemStage" (
    "problem_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "roadmap_order" INTEGER NOT NULL,
    "tier" "Tier",
    "is_priority" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProblemStage_pkey" PRIMARY KEY ("problem_id","stage_id")
);

ALTER TABLE "ProblemStage" ADD CONSTRAINT "ProblemStage_problem_id_fkey"
  FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemStage" ADD CONSTRAINT "ProblemStage_stage_id_fkey"
  FOREIGN KEY ("stage_id") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
