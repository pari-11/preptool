-- CreateEnum
CREATE TYPE "ReviewEventType" AS ENUM ('Solved', 'Revised', 'Revisited');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "last_reviewed_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReviewLog" ADD COLUMN     "event_type" "ReviewEventType" NOT NULL DEFAULT 'Solved';

-- Backfill: every existing ReviewLog row predates this column and was a solve (bulk entry, the
-- only other producer, is gone), so the default above is already correct for them.
-- last_reviewed_date starts equal to last_solved_date so the review queue's due dates don't jump
-- the moment this migration lands — a Revise event moves it forward from here.
UPDATE "Problem" SET "last_reviewed_date" = "last_solved_date" WHERE "last_solved_date" IS NOT NULL;
