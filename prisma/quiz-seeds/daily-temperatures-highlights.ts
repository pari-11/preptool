import type { HighlightSpec } from '../../lib/quizHighlight';

// Which lines of the user's code each explanation is about (matching text, not line numbers; see
// lib/quizHighlight.ts). Drafted by Claude for the user to review. A question with no entry has no
// highlight on purpose: its explanation is not about particular lines (for example the plain
// "what is the time complexity" question, or the whole-algorithm one). The seed script fails if a
// spec matches nothing in the code and prints the lines each one resolves to.

const STACK: HighlightSpec = 'stack<int> st;';
const RESULT_DECL: HighlightSpec = 'vector<int> result(n,0);';
const FOR: HighlightSpec = 'for(int i=0; i<n; i++)';
const WHILE: HighlightSpec = 'while(!st.empty() && temperatures[st.top()] < temperatures[i])';
const COMPARE: HighlightSpec = 'temperatures[st.top()] < temperatures[i]';
const DIFF: HighlightSpec = 'int diff = i - st.top();';
const WRITE: HighlightSpec = 'result[st.top()] = diff;';
const POP: HighlightSpec = 'st.pop();';
const PUSH: HighlightSpec = 'st.push(i);';
// the body of the while loop: diff, the write and the pop
const LOOP_BODY: HighlightSpec = { from: 'int diff = i - st.top();', to: 'st.pop();' };

export const HIGHLIGHTS: Record<string, HighlightSpec[]> = {
  // Intuition
  'dt-q01': [STACK, WHILE], // why a stack
  'dt-q02': [STACK, PUSH, POP], // what it holds: days still waiting
  'dt-q03': [WHILE, PUSH], // non-increasing: pop colder days, then push today

  // Code reading
  'dt-q04': [RESULT_DECL],
  'dt-q05': [PUSH, 'temperatures[st.top()]', DIFF], // an index gives the day and the temperature
  'dt-q06': [WHILE],
  'dt-q07': [COMPARE], // strictly warmer
  'dt-q08': [DIFF],
  'dt-q09': [WHILE], // why a loop
  'dt-q10': [PUSH, WHILE], // push after the loop
  'dt-q11': [{ from: 'result[st.top()] = diff;', to: 'st.pop();' }], // write before pop

  // Tracing
  'dt-q12': [DIFF, WRITE],
  'dt-q13': [LOOP_BODY, PUSH], // which days are left on the stack
  'dt-q14': [POP], // counting pops

  // Edge cases
  'dt-q15': [RESULT_DECL, PUSH], // a single day is pushed and never popped
  'dt-q16': [WHILE, PUSH], // colder every day: nothing popped
  'dt-q17': [COMPARE], // equal is not warmer
  'dt-q18': [LOOP_BODY], // 31 pops both 30s
  'dt-q19': [WHILE], // one warm day pops all four
  'dt-q20': [PUSH, RESULT_DECL], // the last day is never popped

  // Complexity (the plain "what is the time / space complexity" ones have no highlight)
  'dt-q22': [FOR, WHILE], // the nested loops
  'dt-q23': [STACK, RESULT_DECL],
  'dt-q24': [STACK, RESULT_DECL],
  'dt-q25': [FOR], // every day is read once
  'dt-q26': [PUSH, WHILE], // nothing popped, so everything stays

  // Counterfactual
  'dt-q27': [COMPARE],
  'dt-q28': [PUSH, DIFF, WRITE],

  // Final understanding (the whole-algorithm question has no highlight)
  'dt-q30': [WHILE],
  'dt-q31': [WRITE],
};
