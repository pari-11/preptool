// Explanations for the Daily Temperatures quiz, drafted by Claude from the user's code (see
// daily-temperatures.ts) for the user to review. Unlike the answer keys that were run against the
// real C++, these are not machine-checked. Keyed by the question's `key`; the seed script refuses
// to run if any question is missing one. Plain text on purpose (no markdown).
//
// The code every explanation refers to:
//   result = n zeros; stack of day indices
//   for each day i:
//       while stack is non-empty and temperatures[top] < temperatures[i]:
//           result[top] = i - top;  pop
//       push i
//   return result

export const EXPLANATIONS: Record<string, string> = {
  // ───────────── Intuition ─────────────
  'dt-q01':
    'Every day that has not found a warmer day yet is waiting on the stack, newest on top. A new warmer day answers the newest waiting days first, and as soon as the top day is not colder, the days below it are not colder either, so nothing further down can be answered. That is exactly how a stack works: look at the top, pop while it applies, stop at the first day that does not.',
  'dt-q02':
    'A day is pushed as soon as it has been processed, because it has not found a warmer day yet, and it is popped the moment a warmer day arrives and answers it. So the stack is exactly the set of days still waiting. Days still on it when the loop ends are the ones whose answer stays 0.',
  'dt-q03':
    'A day is only popped when the new day is strictly warmer. So whatever is left on top after the while loop is at least as warm as today, and today is pushed above it. Equal temperatures stay on the stack, which is why the order is non-increasing rather than strictly decreasing.',

  // ───────────── Code reading ─────────────
  'dt-q04':
    'The answer for a day with no warmer day ahead is 0, and such a day is never popped, so the loop never writes to it. Starting everything at 0 covers those days without any extra code. It also gives result its size n, so result[i] can be assigned directly.',
  'dt-q05':
    'From an index you can recover the temperature with temperatures[idx], and the index itself is what you need to write result[idx] and to count days with i - idx. Storing only the temperature would keep the comparison but lose which day it was.',
  'dt-q06':
    'The top of the stack is the newest day still waiting. If its temperature is strictly lower than today\'s, today is its next warmer day, so the body runs to record the wait and remove it. If the stack is empty, no day is waiting and nothing is compared.',
  'dt-q07':
    'The problem asks for the next day that is warmer, which means strictly higher. If an equal day were allowed to pop, a day would be answered by a day that is not warmer. For [30, 30, 31] the first 30 should wait 2 days for the 31, not 1 day for the second 30.',
  'dt-q08':
    'Both st.top() and i are day numbers, so i - st.top() is how many days passed. That count is exactly what the problem wants for the waiting day. The temperature difference does not matter here, and the day of the warmer temperature is i itself, not i - st.top().',
  'dt-q09':
    'After popping one day, the next day on the stack may also be colder than today. For example, a 70 arriving after 60, 50 and 40 answers all three. A single if would answer only the top one and leave the others waiting.',
  'dt-q10':
    'If today were pushed first, the top of the stack would be today itself. Comparing today with itself is never strictly smaller, so the loop would stop at once and no waiting day would ever be answered.',
  'dt-q11':
    'st.top() always means the day currently on top. Once st.pop() runs, that day is gone and st.top() is the day below it (or the stack is empty). Writing afterwards would put the answer on the wrong day, or read an empty stack. The write has to use the top before it is removed.',

  // ───────────── Tracing ─────────────
  'dt-q12':
    '73 waits 1 day for the 74. 74 waits 1 day for the 75. 75 waits until the 76 on day 6, which is 4 days. 71 waits 2 days for the 72. 69 waits 1 day for the 72. 72 waits 1 day for the 76. The 76 and the final 73 never get a warmer day, so both are 0.',
  'dt-q13':
    'Day 0 (73) is popped by the 74 on day 1, and day 1 (74) is popped by the 75 on day 2, so those two are gone. Day 2 (75) is still waiting. Day 3 (71) is colder than 75, so nothing is popped and it is pushed on top: the stack is [2, 3].',
  'dt-q14':
    'Each new day is warmer than the day just before it, so it pops exactly one day: days 1, 2, 3 and 4 each pop one, giving 4 pops. The last day (5) stays on the stack, so the result is [1, 1, 1, 1, 0]. Pops can never exceed the number of pushes, because each day is popped at most once.',

  // ───────────── Edge cases ─────────────
  'dt-q15':
    'There is no later day, so the day is pushed and never popped, and its answer stays at the starting 0. The result still has one element because it was created with n zeros.',
  'dt-q16':
    'Every day is colder than the one before it, so no day is ever strictly warmer than the day on top of the stack. Nothing is popped and nothing is written, so every day keeps 0: [0, 0, 0].',
  'dt-q17':
    'Equal is not warmer. The comparison is strictly less than, so no day pops another, and all three stay on the stack with 0 as their answer.',
  'dt-q18':
    'The two 30s do not answer each other, so both are waiting when the 31 arrives on day 2. The 31 is warmer than both: it pops day 1 (1 day) and then day 0 (2 days). The result is [2, 1, 0].',
  'dt-q19':
    'The first four days are each colder than the one before, so all four wait on the stack. The 70 on day 4 is warmer than all of them, so a single while loop pops all four: days 3, 2, 1 and 0 wait 1, 2, 3 and 4 days.',
  'dt-q20':
    'A day is answered only when a later, warmer day arrives, and nothing arrives after the last day. It is pushed at the end of its iteration and the loop then finishes, so it is never popped and keeps its 0.',

  // ───────────── Complexity ─────────────
  'dt-q21':
    'Each day is pushed once and popped at most once, so the total work over the whole run is proportional to n. The loop over days does a constant amount of work per day plus the pops, and the pops total at most n.',
  'dt-q22':
    'The inner while looks nested, but its iterations are not independent: each one pops a day that was pushed earlier, and each day is pushed exactly once. So the total number of pops over the whole run is at most n. The cost is O(n) overall, not O(n^2).',
  'dt-q23':
    'result always holds n values, and in the worst case the stack holds up to n days. Two structures of size up to n are still O(n).',
  'dt-q24':
    'Both structures grow with n. result is created with n entries, and when no day ever gets warmer than the one before, nothing is popped, so the stack ends up with all n days as well. There is no copy of the input, and diff is a single integer reused each time.',
  'dt-q25':
    'Any correct solution has to look at every day at least once, because skipping one could change an answer, so n reads is a lower bound for time. This code reads each day exactly once, so it is O(n) and cannot be asymptotically faster. No sorting is needed, and zero-filling is O(n).',
  'dt-q26':
    'A day is removed only by a strictly warmer later day. If temperatures never rise from one day to the next, nothing is ever popped, so all n days are on the stack at the end. Colder-every-day and all-equal inputs both do this. If every day is warmer than the one before, the stack holds just one day at a time.',

  // ───────────── Counterfactual ─────────────
  'dt-q27':
    'With <=, an equal day counts as warmer. For [30, 30, 30], day 1 pops day 0 and day 2 pops day 1, so the answers become [1, 1, 0]. The correct answer is [0, 0, 0], because an equal temperature is not warmer. The loop still ends, since every pop shrinks the stack.',
  'dt-q28':
    'Comparing temperatures only needs the temperature, but the answer needs the day: result[day] needs the position, and the wait is a difference of days. Two days can also have the same temperature, so the temperature cannot tell you which day it was.',

  // ───────────── Final understanding ─────────────
  'dt-q29':
    'This code is a single left-to-right pass with a stack of waiting days. The second option describes the brute-force approach (O(n^2)), and the third describes the right-to-left dynamic-programming approach. Sorting plays no part.',
  'dt-q30':
    'Each day joins the stack and waits. When a warmer day arrives it settles every colder waiting day on top of the stack, in one go, and then joins the wait itself. Nobody looks ahead; the future day does the work when it arrives.',
  'dt-q31':
    'The answer is written at exactly one moment: when a warmer day arrives and pops the waiting day, with the wait being i - day. A day that is never popped is never written to, so it keeps the 0 it started with.',
};
