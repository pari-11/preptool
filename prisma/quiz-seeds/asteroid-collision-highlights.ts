import type { HighlightSpec } from '../../lib/quizHighlight';

// Which lines of the user's code each explanation is about (see lib/quizHighlight.ts for the
// spec format; matching text, not line numbers). Drafted by Claude for the user to review. A
// question with no entry here has no highlight on purpose: its explanation is not about any
// particular lines (for example the "what is the time complexity" question, or the whole-
// algorithm one). The seed script fails if any spec matches nothing in USER_CODE, and prints the
// lines each one resolves to so a wrong match is visible.

const STACK: HighlightSpec = 'stack<int> st;';
const FOR: HighlightSpec = 'for(int ast : asteroids)';
const WHILE: HighlightSpec = 'while(!st.empty() && st.top() > 0)';
// `if(ast > 0)` through the push inside it
const POSITIVE_PUSH: HighlightSpec = { from: 'if(ast > 0)', to: 'st.push(ast);' };
const DESTROYED_DECL: HighlightSpec = 'bool destroyed = false;';
// the branch where the stack top is bigger: `if(...>...)` through its first break
const TOP_BIGGER: HighlightSpec = { from: 'if(abs(st.top()) > abs(ast))', to: 'break;' };
// the branch for equal sizes: `else if(...==...)` through its break
const EQUAL: HighlightSpec = { from: 'else if(abs(st.top()) == abs(ast))', to: 'break;' };
// the last branch (top is smaller): the second `else {` through the pop inside it
const TOP_SMALLER: HighlightSpec = { from: 'else {', nth: 2, to: 'st.pop();' };
// `if(!destroyed)` through the push inside it
const PUSH_IF_SURVIVED: HighlightSpec = { from: 'if(!destroyed)', to: 'st.push(ast);' };
const RESULT_DECL: HighlightSpec = 'vector<int> result;';
// the final loop that copies the stack into result
const COPY_LOOP: HighlightSpec = { from: 'while(!st.empty()) {', to: 'st.pop();' };
const REVERSE: HighlightSpec = 'reverse(result.begin(), result.end());';

export const HIGHLIGHTS: Record<string, HighlightSpec[]> = {
  // ───────────── set 1 ─────────────
  's1-q01': [STACK, WHILE], // why a stack: the top is the newest survivor
  's1-q02': [WHILE], // when can -7 collide: stack non-empty and top positive
  's1-q03': [TOP_SMALLER], // [8, 3] vs -5: 3 is popped
  's1-q04': [WHILE], // why a while, not an if
  's1-q05': [EQUAL], // equal sizes
  's1-q06': [TOP_BIGGER], // destroyed = true when the top is bigger
  's1-q07': [WHILE, PUSH_IF_SURVIVED], // [-4, -2]: loop never runs, both pushed
  's1-q08': [PUSH_IF_SURVIVED], // stack emptied, negative survives and is pushed
  's1-q09': [WHILE], // why top > 0
  's1-q10': [COPY_LOOP, REVERSE], // why reverse
  's1-q11': [PUSH_IF_SURVIVED],
  's1-q12': [TOP_SMALLER, TOP_BIGGER], // [10, 2] vs -5: pops 2, then 10 wins
  's1-q13': [TOP_SMALLER, PUSH_IF_SURVIVED], // [10] vs -15: pops 10, then -15 pushed
  's1-q14': [WHILE], // top is negative so the loop does not run
  's1-q15': [WHILE, TOP_BIGGER, EQUAL, TOP_SMALLER], // the mental model: the duel loop

  // ───────────── set 2 ─────────────
  's2-q01': [DESTROYED_DECL, PUSH_IF_SURVIVED],
  's2-q03': [POSITIVE_PUSH], // a positive asteroid is pushed straight away
  's2-q04': [WHILE],
  's2-q05': [TOP_BIGGER],
  's2-q06': [TOP_BIGGER], // why break
  's2-q07': [TOP_SMALLER], // [10, 5] vs -7: 5 is popped
  's2-q08': [TOP_SMALLER, WHILE], // after the pop, the loop re-checks the new top
  's2-q09': ['abs(st.top())'], // the two comparisons that use abs()
  's2-q14': [TOP_BIGGER], // [5, 10, -5]: 10 destroys -5
  's2-q18': [TOP_BIGGER], // destroyed is true
  's2-q19': [DESTROYED_DECL, TOP_SMALLER], // destroyed stays false after the pop
  's2-q20': [PUSH_IF_SURVIVED],
  's2-q22': [FOR, WHILE], // the nested loops
  's2-q24': [STACK, RESULT_DECL], // the two structures that use space
  's2-q26': [POSITIVE_PUSH], // all positive
  's2-q27': [WHILE, PUSH_IF_SURVIVED, POSITIVE_PUSH], // [-2, 3]
  's2-q29': [TOP_BIGGER], // [10, -5, -5]
  's2-q30': [WHILE], // the empty check is the first half of the condition
  's2-q31': ['destroyed = true;', PUSH_IF_SURVIVED], // what destroyed is for
  's2-q32': ['result.push_back(st.top());'],
  's2-q33': [{ from: 'result.push_back(st.top());', to: 'st.pop();' }], // the pop in the copy loop
  's2-q34': [COPY_LOOP, REVERSE], // why the stack is not returned directly
  's2-q37': [{ from: 'else {', to: 'while(!st.empty() && st.top() > 0)' }], // only a negative reaches the loop
  's2-q38': [PUSH_IF_SURVIVED],
  's2-q39': [TOP_SMALLER], // each destroyed positive is one pop
  's2-q40': [WHILE, TOP_BIGGER, EQUAL, TOP_SMALLER], // the mental model: the duel loop
  's2-q41': [STACK, RESULT_DECL], // why space is O(n)
  's2-q42': [FOR], // every asteroid is read once
  's2-q43': [REVERSE],
};
