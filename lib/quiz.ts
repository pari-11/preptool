import type { QuizCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asHighlight, describeLines, resolveHighlight, type HighlightSpec } from '@/lib/quizHighlight';

// Spec 011. The quiz tables are read here; the only write is the finished attempt.

export { QUIZ_CATEGORIES, categoryLabel, isQuizCategory } from '@/lib/quizCategories';

// The size of a "quick" quiz. 55 questions in one sitting is too many, so the picker offers a
// random sample (still shown easiest to hardest) or the full set.
export const QUICK_QUIZ_SIZE = 10;

function asOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

// Fisher-Yates. Runs on the server for every request, so a reload reshuffles.
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type QuizProblemSummary = {
  id: string;
  title: string;
  leetcodeId: number | null;
  approachCount: number;
  questionCount: number;
  lastAttempt: { correct: number; total: number; at: Date } | null;
};

// Problems that have at least one quiz approach, for the Quiz page.
export async function listQuizProblems(): Promise<QuizProblemSummary[]> {
  const problems = await prisma.problem.findMany({
    where: { quiz_approaches: { some: {} } },
    select: {
      id: true,
      title: true,
      leetcode_id: true,
      quiz_approaches: {
        select: {
          _count: { select: { questions: true } },
          attempts: { orderBy: { finished_at: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: [{ leetcode_id: 'asc' }, { title: 'asc' }],
  });
  return problems.map((p) => {
    const attempts = p.quiz_approaches.flatMap((a) => a.attempts).sort((a, b) => +b.finished_at - +a.finished_at);
    const last = attempts[0];
    return {
      id: p.id,
      title: p.title,
      leetcodeId: p.leetcode_id,
      approachCount: p.quiz_approaches.length,
      questionCount: p.quiz_approaches.reduce((n, a) => n + a._count.questions, 0),
      lastAttempt: last ? { correct: last.correct_count, total: last.question_count, at: last.finished_at } : null,
    };
  });
}

export type QuizApproachCard = {
  id: string;
  name: string;
  isUserApproach: boolean;
  solutionLink: string | null;
  questionCount: number;
  lastAttempt: { correct: number; total: number; at: Date } | null;
};

export async function getQuizProblem(problemId: string) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      id: true,
      title: true,
      leetcode_id: true,
      neetcode_link: true,
      source_link: true,
      quiz_approaches: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          origin: true,
          solution_link: true,
          _count: { select: { questions: true } },
          attempts: { orderBy: { finished_at: 'desc' }, take: 1 },
        },
      },
    },
  });
  if (!problem) return null;
  const approaches: QuizApproachCard[] = problem.quiz_approaches.map((a) => {
    const last = a.attempts[0];
    return {
      id: a.id,
      name: a.name,
      isUserApproach: a.origin === 'User',
      solutionLink: a.solution_link,
      questionCount: a._count.questions,
      lastAttempt: last ? { correct: last.correct_count, total: last.question_count, at: last.finished_at } : null,
    };
  });
  return {
    id: problem.id,
    title: problem.title,
    leetcodeId: problem.leetcode_id,
    neetcodeLink: problem.neetcode_link,
    leetcodeLink: problem.source_link,
    approaches,
  };
}

// The cheap read behind the "Quiz this problem?" popup shown right after a tick: does this problem
// have a quiz at all, and what is it called.
export async function getQuizPrompt(problemId: string): Promise<{ title: string } | null> {
  const problem = await prisma.problem.findFirst({
    where: { id: problemId, quiz_approaches: { some: { questions: { some: {} } } } },
    select: { title: true },
  });
  return problem ? { title: problem.title } : null;
}

export type PlayQuestion = {
  id: string;
  category: QuizCategory;
  text: string;
  snippet: string | null;
  // Already shuffled. `index` is the option's position in the stored (canonical) order, which is
  // what a recorded answer refers to; the position in this array is only what is displayed.
  options: { index: number; text: string }[];
  correctIndex: number;
  explanation: string | null;
  // Matching-text specs for the lines of the approach's code this explanation is about; resolved
  // against the code in the browser when the code panel is open. Null = no highlight.
  highlight: HighlightSpec[] | null;
};

// A quiz run: all questions, or a random sample of `limit`, always shown easiest to hardest, with
// every question's options shuffled. Quizzes run on the server's random numbers per request.
export async function getQuizRun(approachId: string, limit: number | null) {
  const approach = await prisma.quizApproach.findUnique({
    where: { id: approachId },
    select: {
      id: true,
      name: true,
      origin: true,
      code: true,
      problem_id: true,
      problem: { select: { title: true } },
      questions: { orderBy: { position: 'asc' } },
    },
  });
  if (!approach) return null;
  let rows = approach.questions;
  const total = rows.length;
  if (limit !== null && limit < rows.length) {
    const picked = new Set(shuffle(rows).slice(0, limit).map((q) => q.id));
    rows = rows.filter((q) => picked.has(q.id));
  }
  const questions: PlayQuestion[] = rows.map((q) => ({
    id: q.id,
    category: q.category,
    text: q.text,
    snippet: q.snippet,
    options: shuffle(asOptions(q.options).map((text, index) => ({ index, text }))),
    correctIndex: q.correct_index,
    explanation: q.explanation,
    highlight: asHighlight(q.highlight),
  }));
  return {
    approachId: approach.id,
    approachName: approach.name,
    // Only the user's own code is shown beside the quiz; a standard approach's reference solution
    // is a link out (NeetCode), not something to display here.
    solutionCode: approach.origin === 'User' ? approach.code : null,
    problemId: approach.problem_id,
    problemTitle: approach.problem.title,
    totalQuestions: total,
    questions,
  };
}

export type ReviewQuestion = {
  id: string;
  category: QuizCategory;
  setLabel: string | null;
  text: string;
  snippet: string | null;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  // 1-based lines of the approach's code the explanation highlights, e.g. "12–14, 25"; null = none.
  highlightedLines: string | null;
  highlight: HighlightSpec[] | null;
  verified: boolean;
};

// Every stored question for an approach in the order a quiz would show them, optionally narrowed
// to one pattern. Powers the review page, where the user reads the questions and decides which
// patterns to keep.
export async function getApproachReview(approachId: string, category: QuizCategory | null) {
  const approach = await prisma.quizApproach.findUnique({
    where: { id: approachId },
    select: {
      id: true,
      name: true,
      code: true,
      problem_id: true,
      problem: { select: { title: true } },
      questions: { orderBy: { position: 'asc' } },
    },
  });
  if (!approach) return null;
  const all = approach.questions;
  const counts = new Map<QuizCategory, number>();
  for (const q of all) counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
  const shown = category ? all.filter((q) => q.category === category) : all;
  const questions: ReviewQuestion[] = shown.map((q) => ({
    id: q.id,
    category: q.category,
    setLabel: q.set_label,
    text: q.text,
    snippet: q.snippet,
    options: asOptions(q.options),
    correctIndex: q.correct_index,
    explanation: q.explanation,
    highlightedLines: approach.code ? describeLines(resolveHighlight(approach.code, asHighlight(q.highlight))) || null : null,
    highlight: asHighlight(q.highlight),
    verified: q.verified,
  }));
  return {
    approachId: approach.id,
    approachName: approach.name,
    code: approach.code,
    problemId: approach.problem_id,
    problemTitle: approach.problem.title,
    total: all.length,
    counts,
    questions,
  };
}

export type SubmittedAnswer = { questionId: string; chosenIndex: number };

// Scores a finished run on the server from the stored keys (the client's own idea of what was
// right is never trusted) and stores it. Quiz results are separate from Problem.confidence.
// Only questions that belong to this approach are counted; anything else in the payload is dropped.
export async function recordQuizAttempt(approachId: string, submitted: SubmittedAnswer[]) {
  const questions = await prisma.quizQuestion.findMany({
    where: { approach_id: approachId, id: { in: submitted.map((a) => a.questionId) } },
    select: { id: true, correct_index: true, options: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const seen = new Set<string>();
  const answers: { question_id: string; chosen_index: number; correct: boolean }[] = [];
  for (const a of submitted) {
    const q = byId.get(a.questionId);
    if (!q || seen.has(q.id)) continue;
    if (!Number.isInteger(a.chosenIndex) || a.chosenIndex < 0 || a.chosenIndex >= asOptions(q.options).length) continue;
    seen.add(q.id);
    answers.push({ question_id: q.id, chosen_index: a.chosenIndex, correct: a.chosenIndex === q.correct_index });
  }
  if (answers.length === 0) return null;
  const correct = answers.filter((a) => a.correct).length;
  return prisma.quizAttempt.create({
    data: { approach_id: approachId, question_count: answers.length, correct_count: correct, answers },
  });
}
