-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "last_solved_date" TIMESTAMP(3),
ADD COLUMN     "user_note" TEXT;

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "stage_id" TEXT,
    "solved_at" TIMESTAMP(3),
    "confidence_at_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewLog_problem_id_idx" ON "ReviewLog"("problem_id");

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
