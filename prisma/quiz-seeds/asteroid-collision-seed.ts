import type { QuizSeed } from './types';
import { APPROACH_NAME, LEETCODE_ID, QUESTIONS, USER_CODE } from './asteroid-collision';
import { EXPLANATIONS } from './asteroid-collision-explanations';
import { HIGHLIGHTS } from './asteroid-collision-highlights';

// LC 735 Asteroid Collision, assembled for prisma/scripts/seed-quiz.ts.
export const SEED: QuizSeed = {
  leetcodeId: LEETCODE_ID,
  approachName: APPROACH_NAME,
  functionName: 'asteroidCollision',
  code: USER_CODE,
  questions: QUESTIONS,
  explanations: EXPLANATIONS,
  highlights: HIGHLIGHTS,
};
