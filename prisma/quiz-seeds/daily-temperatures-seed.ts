import type { QuizSeed } from './types';
import { APPROACH_NAME, LEETCODE_ID, QUESTIONS, USER_CODE } from './daily-temperatures';
import { EXPLANATIONS } from './daily-temperatures-explanations';
import { HIGHLIGHTS } from './daily-temperatures-highlights';

// LC 739 Daily Temperatures, assembled for prisma/scripts/seed-quiz.ts.
export const SEED: QuizSeed = {
  leetcodeId: LEETCODE_ID,
  approachName: APPROACH_NAME,
  functionName: 'dailyTemperatures',
  code: USER_CODE,
  questions: QUESTIONS,
  explanations: EXPLANATIONS,
  highlights: HIGHLIGHTS,
};
