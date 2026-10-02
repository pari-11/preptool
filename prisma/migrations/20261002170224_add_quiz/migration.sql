-- CreateEnum
CREATE TYPE "QuizApproachOrigin" AS ENUM ('Standard', 'User');

-- CreateEnum
CREATE TYPE "QuizQuestionOrigin" AS ENUM ('Seeded', 'Generated', 'UserEdited');

-- CreateEnum
CREATE TYPE "QuizCategory" AS ENUM ('Intuition', 'CodeReading', 'Tracing', 'EdgeCase', 'Complexity', 'Counterfactual', 'FinalUnderstanding');

-- CreateTable
CREATE TABLE "QuizApproach" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" "QuizApproachOrigin" NOT NULL DEFAULT 'Standard',
    "code" TEXT,
    "solution_link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizApproach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "approach_id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "set_label" TEXT,
    "category" "QuizCategory" NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "snippet" TEXT,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "origin" "QuizQuestionOrigin" NOT NULL DEFAULT 'Seeded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "approach_id" TEXT NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question_count" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizApproach_problem_id_name_key" ON "QuizApproach"("problem_id", "name");

-- CreateIndex
CREATE INDEX "QuizQuestion_approach_id_position_idx" ON "QuizQuestion"("approach_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_approach_id_source_key_key" ON "QuizQuestion"("approach_id", "source_key");

-- CreateIndex
CREATE INDEX "QuizAttempt_approach_id_finished_at_idx" ON "QuizAttempt"("approach_id", "finished_at");

-- AddForeignKey
ALTER TABLE "QuizApproach" ADD CONSTRAINT "QuizApproach_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_approach_id_fkey" FOREIGN KEY ("approach_id") REFERENCES "QuizApproach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_approach_id_fkey" FOREIGN KEY ("approach_id") REFERENCES "QuizApproach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
