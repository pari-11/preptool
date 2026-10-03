// Spec 011: the quiz for LC 739 (Daily Temperatures), written by Claude (standing in for the
// question generator that will run later) against the user's OWN solution below. That solution is
// NeetCode's approach 2, "Stack" (a monotonic stack, one pass), in its index-only form: it stores
// the day, not a {temperature, day} pair, and reads the temperature from the array.
//
// Written to the user's curation rules (docs/quiz-question-patterns.md): no trivially easy
// recall, no "what is on the next line" questions, no near-duplicates, tracing kept lean, each edge
// case covered once, complexity as "what is it" plus "why" pairs, and the "count the operations"
// kind kept. 31 questions: Intuition 3, Code reading 8, Tracing 3, Edge cases 6, Complexity 6,
// Counterfactual 2, Final understanding 3.
//
// `options` are in the order written; `correct` indexes into them; the quiz shuffles the display
// order every time. `check` runs the user's REAL C++ (see types.ts); a question has one only where
// the function's output logically fixes the key, so the rest stay verified = false.

import type { SeedQuestion } from './types';

export const APPROACH_NAME = 'Monotonic stack (your solution)';
export const LEETCODE_ID = 739;

export const USER_CODE = `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> result(n,0);
        stack<int> st;

        for(int i=0; i<n; i++) {
            while(!st.empty() && temperatures[st.top()] < temperatures[i]) {
                int diff = i - st.top();
                result[st.top()] = diff;
                st.pop();
            }

            st.push(i);
        }
        return result;
    }
};
`;

const SET = 'curated';

export const QUESTIONS: SeedQuestion[] = [
  // ───────────── Intuition ─────────────
  {
    key: 'dt-q01',
    set: SET,
    category: 'Intuition',
    text: 'Why is a stack a good fit for finding the next warmer day?',
    options: [
      'Days still waiting for a warmer day sit on the stack, and a new day can only answer the ones at the top, so we stop at the first one it cannot beat.',
      'Days are always answered in the order they arrived, oldest first.',
      'A stack keeps the temperatures sorted as they are pushed.',
      'A stack lets us jump straight to the next warmer day in O(1).',
    ],
    correct: 0,
  },
  {
    key: 'dt-q02',
    set: SET,
    category: 'Intuition',
    text: 'What does the stack hold at any moment?',
    options: [
      'The indices of days that have not yet found a warmer day.',
      'The temperatures seen so far, in sorted order.',
      'The indices of days that already found their warmer day.',
      'The answers computed so far.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q03',
    set: SET,
    category: 'Intuition',
    text: 'Read the stack from bottom to top. How do the temperatures at those days behave?',
    options: [
      'They never increase: each day on the stack is at least as warm as the day above it.',
      'They strictly increase.',
      'They are in no particular order.',
      'They alternate between rising and falling.',
    ],
    correct: 0,
  },

  // ───────────── Code reading ─────────────
  {
    key: 'dt-q04',
    set: SET,
    category: 'CodeReading',
    text: 'Why is result created with n zeros?',
    snippet: 'vector<int> result(n,0);',
    options: [
      'A day that never finds a warmer day is never written to, so it has to start at 0, which is exactly its answer.',
      'result must be filled before the stack can be created.',
      'Zero marks the days that have already been popped from the stack.',
      'result[i] can only be assigned if the vector was first filled with zeros.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q05',
    set: SET,
    category: 'CodeReading',
    text: 'Why does the stack store indices rather than temperatures?',
    snippet: 'st.push(i);',
    options: [
      'An index gives both the day (to write result[day] and to compute i - day) and the temperature (temperatures[day]); a temperature alone gives neither.',
      'Indices take up less memory than temperatures.',
      'A stack<int> cannot hold temperatures above 100.',
      'temperatures[st.top()] only works if the stack is sorted by index.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q06',
    set: SET,
    category: 'CodeReading',
    text: 'What does it mean when this condition is true?',
    snippet: 'while(!st.empty() && temperatures[st.top()] < temperatures[i])',
    options: [
      'Today is strictly warmer than the day on top of the stack, so that waiting day has just found its answer.',
      'The stack is sorted and can be returned.',
      'Today is the warmest day so far.',
      'The day on top of the stack is the last day in the array.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q07',
    set: SET,
    category: 'CodeReading',
    text: 'Why < and not <= in this comparison?',
    snippet: 'temperatures[st.top()] < temperatures[i]',
    options: [
      'The answer is the next strictly warmer day, so an equal temperature must not answer a waiting day.',
      '<= would make the loop run forever.',
      '< is faster than <=.',
      'Equal temperatures cannot appear in the input.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q08',
    set: SET,
    category: 'CodeReading',
    text: 'What does diff hold?',
    snippet: 'int diff = i - st.top();',
    options: [
      'The number of days between the waiting day and today: how long that day waited for a warmer one.',
      'The temperature difference between the two days.',
      'The number of days still on the stack.',
      'The index of the next warmer day.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q09',
    set: SET,
    category: 'CodeReading',
    text: 'Why is this a while loop and not an if?',
    snippet: 'while(!st.empty() && temperatures[st.top()] < temperatures[i])',
    options: [
      'One warm day can be the answer for several waiting days at once, so we keep popping until the top is no longer colder.',
      'Every day must be compared with every earlier day.',
      'A while loop is required whenever a stack is used.',
      'result has to be filled from right to left.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q10',
    set: SET,
    category: 'CodeReading',
    text: 'Why is st.push(i) after the while loop and not before it?',
    snippet: 'st.push(i);',
    options: [
      'Today must first answer the colder days waiting on the stack. Pushed first, today would sit on top, be compared with itself, and block the days underneath.',
      'Pushing first would overflow the stack.',
      'The stack has to be empty before any push.',
      'It makes no difference; the order is only style.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q11',
    set: SET,
    category: 'CodeReading',
    text: 'Why does the first of these two lines have to come before the second?',
    snippet: 'result[st.top()] = diff;\nst.pop();',
    options: [
      'After the pop, st.top() is a different day (the next one down), so the answer would be written to the wrong day.',
      'pop() returns the value that has to be written into result.',
      'Popping first would make the stack empty.',
      'The order does not matter because both lines use the same index.',
    ],
    correct: 0,
  },

  // ───────────── Tracing ─────────────
  {
    key: 'dt-q12',
    set: SET,
    category: 'Tracing',
    text: 'What is the result for [73, 74, 75, 71, 69, 72, 76, 73]?',
    options: [
      '[1, 1, 4, 2, 1, 1, 0, 0]',
      '[1, 1, 5, 2, 1, 1, 0, 0]',
      '[1, 1, 4, 2, 1, 1, 1, 0]',
      '[1, 1, 4, 3, 2, 1, 0, 0]',
    ],
    correct: 0,
    check: { input: [73, 74, 75, 71, 69, 72, 76, 73], expect: [1, 1, 4, 2, 1, 1, 0, 0] },
  },
  {
    key: 'dt-q13',
    set: SET,
    category: 'Tracing',
    text: 'In [73, 74, 75, 71, 69, 72, 76, 73], which days are on the stack (bottom to top) after the first four days (73, 74, 75, 71) have been processed?',
    options: ['Days [2, 3]', 'Days [0, 1, 2, 3]', 'Day [3]', 'Day [2]'],
    correct: 0,
    // A day is popped exactly when it gets a nonzero answer, so the days still on the stack are the
    // zeros of the result for that prefix: [1, 1, 0, 0] leaves days 2 and 3.
    check: { input: [73, 74, 75, 71], expect: [1, 1, 0, 0] },
  },
  {
    key: 'dt-q14',
    set: SET,
    category: 'Tracing',
    text: 'For [1, 2, 3, 4, 5], how many times does st.pop() run in total?',
    options: ['4', '5', '0', '10'],
    correct: 0,
    // Every popped day gets a nonzero answer and every other day keeps 0, so [1, 1, 1, 1, 0]
    // means exactly four pops.
    check: { input: [1, 2, 3, 4, 5], expect: [1, 1, 1, 1, 0] },
  },

  // ───────────── Edge cases ─────────────
  {
    key: 'dt-q15',
    set: SET,
    category: 'EdgeCase',
    text: 'What is the result for a single day, [5]?',
    options: ['[0]', '[1]', '[5]', '[]'],
    correct: 0,
    check: { input: [5], expect: [0] },
  },
  {
    key: 'dt-q16',
    set: SET,
    category: 'EdgeCase',
    text: 'What is the result when every day is colder than the one before, [50, 40, 30]?',
    options: ['[0, 0, 0]', '[1, 1, 0]', '[1, 1, 1]', '[2, 1, 0]'],
    correct: 0,
    check: { input: [50, 40, 30], expect: [0, 0, 0] },
  },
  {
    key: 'dt-q17',
    set: SET,
    category: 'EdgeCase',
    text: 'What is the result when every day has the same temperature, [30, 30, 30]?',
    options: ['[0, 0, 0]', '[1, 1, 0]', '[2, 1, 0]', '[1, 1, 1]'],
    correct: 0,
    check: { input: [30, 30, 30], expect: [0, 0, 0] },
  },
  {
    key: 'dt-q18',
    set: SET,
    category: 'EdgeCase',
    text: 'What is the result for [30, 30, 31]?',
    options: ['[2, 1, 0]', '[1, 1, 0]', '[0, 0, 0]', '[1, 2, 0]'],
    correct: 0,
    check: { input: [30, 30, 31], expect: [2, 1, 0] },
  },
  {
    key: 'dt-q19',
    set: SET,
    category: 'EdgeCase',
    text: 'What is the result for [60, 50, 40, 30, 70]?',
    options: ['[4, 3, 2, 1, 0]', '[1, 1, 1, 1, 0]', '[4, 4, 4, 4, 0]', '[0, 0, 0, 0, 0]'],
    correct: 0,
    check: { input: [60, 50, 40, 30, 70], expect: [4, 3, 2, 1, 0] },
  },
  {
    key: 'dt-q20',
    set: SET,
    category: 'EdgeCase',
    text: 'Whatever the input, what is the answer for the last day, and why?',
    options: [
      'Always 0: no day comes after it, so it is pushed and never popped.',
      'Always 1.',
      "It depends on the previous day's temperature.",
      'Always the length of the array.',
    ],
    correct: 0,
  },

  // ───────────── Complexity ─────────────
  {
    key: 'dt-q21',
    set: SET,
    category: 'Complexity',
    text: 'What is the time complexity of this approach?',
    options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(1)'],
    correct: 0,
  },
  {
    key: 'dt-q22',
    set: SET,
    category: 'Complexity',
    text: "\"There is a while loop inside a for loop, so shouldn't it be O(n²)?\" Which explanation is correct?",
    options: [
      'Each day is pushed once and popped at most once, so the total number of pops over the whole run is at most n.',
      'The while loop runs exactly once per day.',
      'The stack makes nested loops take constant time.',
      'while loops do not count towards time complexity.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q23',
    set: SET,
    category: 'Complexity',
    text: 'What is the space complexity of this solution, counting both the stack and result?',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
    correct: 0,
  },
  {
    key: 'dt-q24',
    set: SET,
    category: 'Complexity',
    text: 'Why is the space complexity O(n)?',
    options: [
      'result always has n entries, and for days that never get warmer nothing is popped, so all n days can be on the stack too.',
      'The input array is copied before the loop.',
      'diff allocates new memory on every iteration.',
      'The stack stores every temperature twice.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q25',
    set: SET,
    category: 'Complexity',
    text: "Why can't this approach beat O(n) time, even in the best case?",
    options: [
      "Every day's temperature has to be read at least once, because skipping one could change an answer.",
      'The days must be sorted first.',
      'Filling result with zeros costs O(n²).',
      'The while loop runs n times for every day.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q26',
    set: SET,
    category: 'Complexity',
    text: 'When does the stack hold all n days at the same time?',
    options: [
      'When no day is ever strictly warmer than the day before it (for example, colder every day): nothing is popped.',
      'When every day is warmer than the one before it.',
      'When the first day is the coldest.',
      'Only when n is 1.',
    ],
    correct: 0,
  },

  // ───────────── Counterfactual ─────────────
  {
    key: 'dt-q27',
    set: SET,
    category: 'Counterfactual',
    text: 'What would go wrong if the condition used <= instead of <?',
    snippet: 'temperatures[st.top()] < temperatures[i]',
    options: [
      'Equal temperatures would answer each other, so [30, 30, 30] would give [1, 1, 0] instead of [0, 0, 0].',
      'The loop would never end.',
      'The stack would be empty at the end.',
      'Nothing: the result is the same for every input.',
    ],
    correct: 0,
    // Checked by running the changed code: with <= the three equal days give [1, 1, 0].
    check: {
      input: [30, 30, 30],
      expect: [1, 1, 0],
      variant: { replace: 'temperatures[st.top()] < temperatures[i]', with: 'temperatures[st.top()] <= temperatures[i]' },
    },
  },
  {
    key: 'dt-q28',
    set: SET,
    category: 'Counterfactual',
    text: 'What would go wrong if the stack stored only temperatures instead of indices?',
    options: [
      'The comparison would still work, but the day number would be lost, so we could not write result[day] or compute how many days passed.',
      'The comparison would no longer work.',
      'The stack would hold the wrong number of elements.',
      'Nothing would change: the day can be recovered from the temperature.',
    ],
    correct: 0,
  },

  // ───────────── Final understanding ─────────────
  {
    key: 'dt-q29',
    set: SET,
    category: 'FinalUnderstanding',
    text: 'Which statement best describes the algorithm?',
    options: [
      'Scan once, left to right. Keep the days still waiting for a warmer day on a stack. Each new day answers every colder day waiting on top, then waits itself.',
      'For each day, scan forward until a warmer day is found.',
      'Scan from right to left and reuse earlier answers to jump ahead.',
      'Sort the days by temperature and match each day to the next one in the sorted order.',
    ],
    correct: 0,
  },
  {
    key: 'dt-q30',
    set: SET,
    category: 'FinalUnderstanding',
    text: 'Which is the best mental model for this solution?',
    options: [
      '"Every day waits on the stack until a warmer day arrives; that day answers every colder day waiting on top of it, then joins the wait itself."',
      '"Every day looks ahead until it finds a warmer day."',
      '"The stack always holds the warmest days in sorted order."',
      '"Every day compares itself only with the day before it."',
    ],
    correct: 0,
  },
  {
    key: 'dt-q31',
    set: SET,
    category: 'FinalUnderstanding',
    text: "When is a day's answer decided?",
    options: [
      'At the moment a warmer day arrives and pops it; days that are never popped keep 0.',
      'When the day is pushed onto the stack.',
      'At the end, when the stack is emptied into result.',
      'At the start, when result is created.',
    ],
    correct: 0,
  },
];
