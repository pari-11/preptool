-- CreateEnum
CREATE TYPE "QuizFeedbackReason" AS ENUM ('TooEasy', 'Repetitive', 'WrongAnswer', 'UnclearWording', 'ExplanationOff', 'HighlightOff', 'Other');

-- CreateTable
CREATE TABLE "QuizQuestionFeedback" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "reason" "QuizFeedbackReason" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "QuizQuestionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizQuestionFeedback_question_id_idx" ON "QuizQuestionFeedback"("question_id");

-- AddForeignKey
ALTER TABLE "QuizQuestionFeedback" ADD CONSTRAINT "QuizQuestionFeedback_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
