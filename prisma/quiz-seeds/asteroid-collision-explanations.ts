// Explanations for the seeded asteroid-collision questions, drafted by Claude from the user's code
// (see asteroid-collision.ts) for the user to review: they were not in the user's samples, and
// unlike the 16 answer keys they are not machine-checked. Keyed by the question's `key`; the seed
// script refuses to run if any question is missing one. Plain text on purpose (no markdown).
//
// The code every explanation refers to:
//   if ast > 0: push it
//   else: destroyed = false
//         while the stack is non-empty and its top is positive:
//             top bigger than |ast|  -> destroyed = true, break
//             top equal to |ast|     -> destroyed = true, pop, break
//             top smaller than |ast| -> pop (the top exploded), keep going
//         if not destroyed: push ast
//   finally pop everything into a vector and reverse it

export const EXPLANATIONS: Record<string, string> = {
  // ───────────── set 1 ─────────────
  's1-q01':
    'A collision only ever involves a negative asteroid and the positive ones before it, and the one it meets first is always the most recent survivor. A stack gives exactly that: the top is the newest survivor, and removing it exposes the next-newest.',
  's1-q02':
    'Asteroids only collide when a right-moving one (positive) is to the left of a left-moving one (negative). So -7 can only hit the top if there is a top and it is positive. A negative top moves left, away from -7, so they never meet, whatever their sizes.',
  's1-q03':
    '-5 reaches the top of the stack first, which is 3. Since 3 is smaller than 5, 3 is popped (destroyed) and -5 keeps going. Only after that does -5 meet 8, which is a separate, later step.',
  's1-q04':
    'One negative asteroid can destroy several positives in a row, for example -10 against [1, 2, 3]. After each pop a new positive may be exposed, so the check has to repeat until the negative asteroid dies or no positive is left on top. A single if would stop after one collision.',
  's1-q05':
    'Equal sizes destroy each other. The code handles this in the == branch: it pops the top and sets destroyed = true, so the negative asteroid is not pushed either. Nothing survives from the pair: [5, -5] gives [].',
  's1-q06':
    'That branch runs when the stack top is bigger than the incoming asteroid, so the incoming (negative) one is the asteroid that explodes. The top survives and is not popped. destroyed = true only records that ast must not be pushed after the loop.',
  's1-q07':
    'Both are negative, so both move left and never meet. The while condition (top is positive) is false each time, so no collision is checked and both are pushed: [-4, -2].',
  's1-q08':
    'If every positive asteroid on the stack was destroyed, the loop ends because the stack is empty. destroyed is still false, so the negative asteroid is pushed. It survived and now sits at the bottom of the stack.',
  's1-q09':
    'Only a positive top is moving right, toward the incoming negative asteroid. A negative top moves left, away from it, so a collision is impossible. Without this check the loop would make negative asteroids collide with each other.',
  's1-q10':
    'Popping the stack returns the newest survivor first, so result comes out in right-to-left order. Reversing it restores the original left-to-right order that the problem asks for.',
  's1-q11':
    'destroyed is true only if the current asteroid exploded inside the loop. If it survived every collision, or had nothing to collide with, it is pushed so that later asteroids can meet it and so it appears in the result.',
  's1-q12':
    '-5 meets 2 first: 2 is smaller, so 2 is popped. Then -5 meets 10: 10 is bigger, so -5 is destroyed and 10 stays. The stack ends as [10].',
  's1-q13':
    '10 is smaller than 15, so 10 is popped. The stack is now empty and destroyed is still false, so -15 is pushed. The stack becomes [-15].',
  's1-q14':
    'The loop condition is: stack not empty AND top is positive. The top is -5, which is not positive, so the condition is false and the loop body never runs. -10 is then pushed because destroyed is still false.',
  's1-q15':
    'The loop is a repeated duel: the incoming negative asteroid fights the nearest positive asteroid on the stack. It either wins (pops it and fights the next one) or dies (stops). It ends when the asteroid dies or has no positive asteroid left in front of it.',

  // ───────────── set 2 ─────────────
  's2-q01':
    'It records whether the current asteroid exploded during the while loop. After the loop, if(!destroyed) uses it to decide whether the asteroid should still be pushed.',
  's2-q03':
    'A positive asteroid heads right, away from everything already on the stack, so it cannot collide with any of it. It can only be hit later by a negative asteroid that arrives afterwards, and that is dealt with when that negative asteroid is processed.',
  's2-q04':
    'The condition is true when the stack has an asteroid and its top is positive. A positive top (moving right) sits to the left of the incoming negative asteroid (moving left), so they are heading toward each other and may collide. The body then compares their sizes.',
  's2-q05':
    'The top, 5, is bigger than 3, so the incoming -3 explodes. destroyed = true records that, and break leaves the loop. The top (5) stays on the stack.',
  's2-q06':
    'Once -3 is destroyed it no longer exists, so it cannot collide with anything else. Breaking stops the loop. Carrying on would compare a dead asteroid with the next one down, 10.',
  's2-q07':
    '-7 meets 5 first: 5 is smaller, so 5 is popped and -7 is still alive. It then faces 10, which is a separate, later comparison (10 is bigger, so -7 will end up destroyed). The step this question asks about is that 5 is popped and -7 continues.',
  's2-q08':
    'The popped asteroid exploded, so the new top is the next survivor behind it, which is the next asteroid the incoming one would hit. The loop uses it to decide whether another collision happens.',
  's2-q09':
    'The sign only says direction; the size is the absolute value. abs() lets the code compare 5 against -3 as 5 versus 3, without the minus sign changing the result. It does not change the stored values.',
  's2-q14':
    '-5 meets 10: 10 is bigger, so -5 is destroyed (destroyed = true) and is not pushed. 10 stays and 5 was never touched. Popping the stack gives [10, 5], and the reverse makes it [5, 10].',
  's2-q18':
    '8 is bigger than 3, so the first branch runs: destroyed = true and break. The incoming asteroid is the one destroyed, so destroyed is true.',
  's2-q19':
    '3 is smaller than 8, so 3 is popped and the loop continues. The stack is now empty, so the loop ends without ever setting destroyed. It is still false because -8 is alive.',
  's2-q20':
    'destroyed is false, so the if condition holds and -8 is pushed. -8 beat 3 and nothing was left to fight it, so it survives and must be on the stack to appear in the final result.',
  's2-q21':
    'Every asteroid is pushed at most once and popped at most once, so the total work across the whole run is proportional to n. The final copy and reverse are also linear. O(n).',
  's2-q22':
    'The inner while looks nested, but its iterations are not independent: each one pops an asteroid that was pushed earlier, and each asteroid is pushed at most once. So the total number of pops over the whole run is at most n. The cost is O(n) overall, not O(n^2).',
  's2-q24':
    'The stack can hold up to n asteroids and result can hold up to n as well. Both are O(n), and two O(n) structures together are still O(n), not O(1).',
  's2-q41':
    'Space grows with what is stored: the stack and result. Destroyed asteroids are popped, so the stack only keeps survivors. But in the worst case nothing collides (all positive, or all negative), so all n asteroids survive and both the stack and result hold n items. That is O(n). reverse() works in place and there is no recursion.',
  's2-q42':
    'Any correct solution has to look at every asteroid at least once, because skipping one could miss a collision, so n reads is a lower bound for time. This code reads each asteroid exactly once, so it is O(n) and cannot be asymptotically faster. No sorting is needed, abs() is constant time, and the while loop only runs for negative asteroids.',
  's2-q43':
    'reverse() makes one linear pass over result, which holds at most n survivors, so it costs O(n). The main loop is also O(n), and O(n) plus O(n) is still O(n): constants and lower-order terms of the same order do not change the complexity class. It is not constant time and not quadratic.',
  's2-q26':
    'All three are positive, so each is pushed immediately and the collision loop never runs. All survive: [2, 3, 4].',
  's2-q27':
    '-2 moves left, away from 3, which moves right and comes after it. They are heading apart, so there is no collision. -2 is pushed on the empty stack, then 3 is pushed: [-2, 3].',
  's2-q29':
    'The first -5 meets 10: 10 is bigger, so -5 is destroyed. The second -5 meets 10 again and is destroyed too. 10 survives both: [10].',
  's2-q30':
    'Calling top() on an empty stack is undefined behaviour in C++, so emptiness has to be checked first. In the real code the check is the first half of the while condition, and && short-circuits, so top() is never reached on an empty stack.',
  's2-q31':
    'Without destroyed, an asteroid that exploded (for example -3 against 8) would still be pushed after the loop, so a dead asteroid would show up in the answer. destroyed is what separates "survived" from "exploded".',
  's2-q32':
    'It copies the top asteroid into the result vector. It does not remove it from the stack; that is the pop on the next line.',
  's2-q33':
    'It removes the asteroid that was just copied. Without it the loop would copy the same top forever. Popping exposes the next one, until the stack is empty.',
  's2-q34':
    'The function must return a vector<int>, and a std::stack is not one and cannot be iterated directly. Emptying it from the top also gives the survivors right-to-left, which is why the result is reversed.',
  's2-q36':
    'Scan left to right and keep survivors on a stack. Only a negative asteroid triggers collisions, each time against the positive asteroids on top of the stack. There is no sorting and no comparing of every pair.',
  's2-q37':
    'A positive asteroid is pushed straight away and never reaches the loop. The loop sits in the else branch, which only runs for a negative asteroid (ast < 0), and even then it only iterates while the top is positive.',
  's2-q38':
    'destroyed is still false after the loop, so if(!destroyed) pushes it. It has to be on the stack so later asteroids can collide with it and so it appears in the result.',
  's2-q39':
    'Each destroyed positive asteroid is popped exactly once, in the else branch (a strictly smaller top). Three destroyed asteroids means three pops. For example, [1, 2, 3, -10] gives [-10] after exactly three pops.',
  's2-q40':
    'A negative asteroid fights the nearest positive asteroid on the stack, one at a time. It either wins and continues, or dies. It never interacts with asteroids to its right, or with ones already moving away from it.',
};
