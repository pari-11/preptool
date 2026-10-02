import { notFound } from 'next/navigation';
import { QUIZ_CATEGORIES, getApproachReview, isQuizCategory } from '@/lib/quiz';
import { ReviewWorkspace } from './ReviewWorkspace';

export const dynamic = 'force-dynamic';

// Where the user reads every stored question for an approach, one pattern at a time if they like,
// to decide which patterns to keep (spec 011 D14). Options are shown in their stored order here
// with the correct one marked; the quiz itself shuffles them. The page itself is just the data;
// ReviewWorkspace owns the split layout and the click-to-highlight behaviour.
export default async function QuizReviewPage({
  params,
  searchParams,
}: {
  params: { problemId: string; approachId: string };
  searchParams: { pattern?: string };
}) {
  const category = isQuizCategory(searchParams.pattern) ? searchParams.pattern : null;
  const review = await getApproachReview(params.approachId, category);
  if (!review || review.problemId !== params.problemId) notFound();

  const chips = QUIZ_CATEGORIES.filter((c) => review.counts.has(c.key)).map((c) => ({
    key: c.key,
    label: c.label,
    hint: c.hint,
    count: review.counts.get(c.key) ?? 0,
  }));

  return (
    <ReviewWorkspace
      problemId={review.problemId}
      approachId={review.approachId}
      problemTitle={review.problemTitle}
      approachName={review.approachName}
      total={review.total}
      chips={chips}
      category={category}
      code={review.code}
      questions={review.questions.map((q) => ({
        id: q.id,
        category: q.category,
        text: q.text,
        snippet: q.snippet,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        highlight: q.highlight,
        verified: q.verified,
      }))}
    />
  );
}
