-- AlterTable
ALTER TABLE "ProblemStage" ADD COLUMN     "is_solved" BOOLEAN NOT NULL DEFAULT false;

-- Carry existing problem-level solved state onto each placement.
UPDATE "ProblemStage" ps SET "is_solved" = p."is_solved" FROM "Problem" p WHERE p."id" = ps."problem_id";
