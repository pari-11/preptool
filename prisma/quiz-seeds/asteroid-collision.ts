// Spec 011, first slice (D12/D13/D14/D15): the user's own hand-written quiz for LC 735 (Asteroid
// Collision), written against THEIR stack solution below, not NeetCode's article approach.
// Two sets: set-1 is the first 15 questions, set-2 the next 40; overlaps are kept on purpose
// (the user reviews and prunes). Questions that were phrased relative to another one ("in the
// situation from Q5", "why does this execute in Q19") are restated so they stand alone.
//
// `options` are in the user's order; `correct` indexes into them. The quiz shuffles the display
// order every time, so the stored order never shows. In the samples the key was usually A but not
// always (set-1 Q14 is B), so every key was derived by tracing the code, not assumed.
//
// `check`, when present, is run against the user's REAL C++ (g++) by the seed script: the final
// vector the code returns for `input` must equal `expect`. It is only given where that outcome
// logically fixes the key (a final result, a stack after n elements, a pop count). Questions about
// an intermediate step or a variable's value (`destroyed`) cannot be observed from the output, and
// conceptual ones cannot be machine-checked at all: those stay verified = false (spec 011 D2).

export type SeedCategory =
  | 'Intuition'
  | 'CodeReading'
  | 'Tracing'
  | 'EdgeCase'
  | 'Complexity'
  | 'Counterfactual'
  | 'FinalUnderstanding';

export type SeedQuestion = {
  key: string;
  // 'added' = drafted with Claude at the user's request after the two hand-written sets
  set: 'set-1' | 'set-2' | 'added';
  category: SeedCategory;
  text: string;
  snippet?: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  check?: { input: number[]; expect: number[] };
};

export const APPROACH_NAME = 'Stack (your solution)';
export const LEETCODE_ID = 735;

export const USER_CODE = `class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        stack<int> st;
        for(int ast : asteroids) {
            if(ast > 0) {
                st.push(ast);
            }
            else {
                bool destroyed = false;
                while(!st.empty() && st.top() > 0) {
                    if(abs(st.top()) > abs(ast)) {
                        destroyed = true; //ast exploded
                        break;
                    }
                    else if(abs(st.top()) == abs(ast)) {
                        destroyed = true; //ast exploded
                        st.pop(); //top of stack also exploded
                        break;
                    }
                    else {
                        st.pop();
                    }
                }
                if(!destroyed) { //ast survived all collisions and wasn't destroyed
                    st.push(ast);
                }
            }
        }

        vector<int> result;

        while(!st.empty()) {
            result.push_back(st.top());
            st.pop();
        }

        reverse(result.begin(), result.end()); //stack to vector results in opp order

        return result;
    }
};
`;

const FINAL_LOOP = `while(!st.empty()) {
    result.push_back(st.top());
    st.pop();
}

reverse(result.begin(), result.end());`;

export const QUESTIONS: SeedQuestion[] = [
  // ───────────────────────────── set 1 (15) ─────────────────────────────
  {
    key: 's1-q01',
    set: 'set-1',
    category: 'Intuition',
    text: 'Why is a stack suitable for this problem?',
    options: [
      'The newest relevant asteroid is the first one that may collide with a new negative asteroid.',
      'Asteroids always collide in the exact order they entered the input.',
      'A stack automatically compares asteroid sizes.',
      'Negative asteroids can only collide with the first asteroid in the input.',
    ],
    correct: 0,
  },
  {
    key: 's1-q02',
    set: 'set-1',
    category: 'CodeReading',
    text: 'For a current asteroid ast = -7, when can it actually collide with the stack top?',
    options: [
      'The stack is non-empty and its top is positive.',
      'The stack is non-empty and its top is negative.',
      'The stack top is smaller than 7.',
      'The stack contains at least two asteroids.',
    ],
    correct: 0,
  },
  {
    key: 's1-q03',
    set: 'set-1',
    category: 'Tracing',
    text: 'Suppose the stack is [8, 3] (3 on top) and the current asteroid is -5. What happens first?',
    options: [
      '3 is destroyed and -5 continues.',
      '8 is destroyed immediately.',
      '-5 is destroyed.',
      '3 and -5 both survive.',
    ],
    correct: 0,
  },
  {
    key: 's1-q04',
    set: 'set-1',
    category: 'CodeReading',
    text: 'Why do we need a while loop instead of checking only one collision?',
    options: [
      'A negative asteroid may destroy one positive asteroid and then collide with another.',
      'Every asteroid must be compared with every other asteroid.',
      'Negative asteroids move faster than positive asteroids.',
      'The while loop converts the stack into a vector.',
    ],
    correct: 0,
  },
  {
    key: 's1-q05',
    set: 'set-1',
    category: 'EdgeCase',
    text: 'Stack top is +5, current asteroid is -5. What happens?',
    options: ['Both are destroyed.', '+5 survives.', '-5 survives.', 'They are both pushed into the stack.'],
    correct: 0,
    check: { input: [5, -5], expect: [] },
  },
  {
    key: 's1-q06',
    set: 'set-1',
    category: 'CodeReading',
    text: 'In this condition, what does destroyed = true; mean?',
    snippet: 'if(abs(st.top()) > abs(ast))',
    options: [
      'The current asteroid has been destroyed.',
      'The stack-top asteroid has been destroyed.',
      'Both asteroids have been destroyed.',
      'The current asteroid destroyed every asteroid in the stack.',
    ],
    correct: 0,
  },
  {
    key: 's1-q07',
    set: 'set-1',
    category: 'EdgeCase',
    text: 'What is the final result for [-4, -2]?',
    options: ['[-4, -2]', '[-2]', '[-4]', '[]'],
    correct: 0,
    check: { input: [-4, -2], expect: [-4, -2] },
  },
  {
    key: 's1-q08',
    set: 'set-1',
    category: 'EdgeCase',
    text: 'Suppose a negative asteroid destroys all positive asteroids in front of it, and the stack becomes empty. What happens to the negative asteroid?',
    options: ['It gets pushed into the stack.', 'It gets destroyed automatically.', 'The entire process restarts.', 'It is ignored.'],
    correct: 0,
    check: { input: [3, -8], expect: [-8] },
  },
  {
    key: 's1-q09',
    set: 'set-1',
    category: 'CodeReading',
    text: 'Why do we need this condition inside the collision loop?',
    snippet: 'st.top() > 0',
    options: [
      'Only a positive asteroid on the left can collide with a negative current asteroid.',
      'Negative asteroids are never allowed in the stack.',
      'Positive asteroids are always larger than negative asteroids.',
      'The stack can only store positive values.',
    ],
    correct: 0,
  },
  {
    key: 's1-q10',
    set: 'set-1',
    category: 'CodeReading',
    text: 'At the end we do the following. Why do we reverse result?',
    snippet: FINAL_LOOP,
    options: [
      'Popping the stack gives the surviving asteroids in reverse of their required order.',
      'We need to sort the asteroids by size.',
      'Negative asteroids must come before positive asteroids.',
      'Reversing removes destroyed asteroids.',
    ],
    correct: 0,
  },
  {
    key: 's1-q11',
    set: 'set-1',
    category: 'CodeReading',
    text: 'What does this mean?',
    snippet: 'if(!destroyed) {\n    st.push(ast);\n}',
    options: [
      'Push the current asteroid if it survived all possible collisions.',
      'Push the current asteroid only if it is positive.',
      'Push the current asteroid if the stack is empty, regardless of whether it was destroyed.',
      'Push the current asteroid after every collision.',
    ],
    correct: 0,
  },
  {
    key: 's1-q12',
    set: 'set-1',
    category: 'Tracing',
    text: 'Suppose stack = [10, 2] (2 on top) and ast = -5. What will the stack eventually become?',
    options: ['[10]', '[2]', '[-5]', '[10, 2, -5]'],
    correct: 0,
    check: { input: [10, 2, -5], expect: [10] },
  },
  {
    key: 's1-q13',
    set: 'set-1',
    category: 'Tracing',
    text: 'Suppose stack = [10] and ast = -15. What happens?',
    options: [
      '10 is popped, then -15 is pushed.',
      '-15 is destroyed.',
      'Both are destroyed.',
      'Nothing happens because -15 is negative.',
    ],
    correct: 0,
    check: { input: [10, -15], expect: [-15] },
  },
  {
    key: 's1-q14',
    set: 'set-1',
    category: 'Tracing',
    text: 'Suppose stack = [-5] and ast = -10. Will the while loop execute?',
    options: [
      'Yes, because both asteroids are negative.',
      'No, because st.top() > 0 is false.',
      'Yes, because abs(-5) < abs(-10).',
      'No, because negative asteroids cannot be stored.',
    ],
    correct: 1, // the only set-1 question whose key is not the first option
  },
  {
    key: 's1-q15',
    set: 'set-1',
    category: 'FinalUnderstanding',
    text: 'The most important mental model for the while loop is:',
    options: [
      '"Keep comparing the current negative asteroid with the nearest positive asteroid until the current asteroid dies or has no possible collision left."',
      '"Compare every asteroid with every other asteroid."',
      '"Keep popping until the stack is completely empty."',
      '"Only compare the current asteroid with the largest asteroid."',
    ],
    correct: 0,
  },

  // ───────────────────────────── set 2 (40) ─────────────────────────────
  // Code reading
  {
    key: 's2-q01',
    set: 'set-2',
    category: 'CodeReading',
    text: 'What is the purpose of this variable?',
    snippet: 'bool destroyed = false;',
    options: [
      'Tracks whether the current asteroid has been destroyed',
      'Tracks whether the stack has been destroyed',
      'Tracks whether all asteroids have collided',
      'Tracks whether the current asteroid is positive',
    ],
    correct: 0,
  },
  {
    key: 's2-q03',
    set: 'set-2',
    category: 'Intuition',
    text: "Why doesn't a positive asteroid need the collision while loop immediately?",
    options: [
      'A positive asteroid moves right, so it cannot collide with asteroids already processed that are behind it',
      'Positive asteroids never collide with anything',
      'Positive asteroids are always larger',
      'The stack only accepts positive asteroids',
    ],
    correct: 0,
  },
  {
    key: 's2-q04',
    set: 'set-2',
    category: 'CodeReading',
    text: 'What happens when this condition is true?',
    snippet: 'while(!st.empty() && st.top() > 0)',
    options: [
      'The current negative asteroid may collide with the positive asteroid at the top of the stack',
      'The current asteroid is automatically destroyed',
      'The stack is cleared',
      'The current asteroid is pushed immediately',
    ],
    correct: 0,
  },
  {
    key: 's2-q05',
    set: 'set-2',
    category: 'CodeReading',
    text: 'Suppose st = [10, 5] and ast = -3. What happens after this condition is found to be true?',
    snippet: 'if(abs(st.top()) > abs(ast))',
    options: [
      'destroyed = true and the loop breaks',
      'st.pop() and the loop continues',
      'Both asteroids are destroyed',
      'ast is pushed',
    ],
    correct: 0,
  },
  {
    key: 's2-q06',
    set: 'set-2',
    category: 'CodeReading',
    text: 'Suppose st = [10, 5] and ast = -3, and abs(st.top()) > abs(ast) is true. Why do we break?',
    options: [
      'Because the current asteroid has been destroyed and cannot collide with anything else',
      'Because the stack is empty',
      'Because the current asteroid destroyed the stack top',
      'Because negative asteroids cannot enter the stack',
    ],
    correct: 0,
  },
  {
    key: 's2-q07',
    set: 'set-2',
    category: 'Tracing',
    text: 'Suppose st = [10, 5] (5 on top) and ast = -7. What happens?',
    options: [
      '5 is popped, then -7 continues toward 10',
      '-7 is immediately destroyed',
      '10 is popped',
      '5 and -7 both survive',
    ],
    correct: 0,
  },
  {
    key: 's2-q08',
    set: 'set-2',
    category: 'CodeReading',
    text: 'After this line inside the collision loop, what does the new stack top represent?',
    snippet: 'st.pop();',
    options: [
      'The next surviving asteroid behind the one that just exploded',
      'The current negative asteroid',
      'The largest asteroid in the stack',
      'The first asteroid in the input',
    ],
    correct: 0,
  },
  {
    key: 's2-q09',
    set: 'set-2',
    category: 'CodeReading',
    text: 'Why is abs() used here?',
    snippet: 'abs(st.top()) > abs(ast)',
    options: [
      'To compare asteroid sizes without their directions affecting the comparison',
      'To convert every asteroid into a positive asteroid permanently',
      'To determine the direction of an asteroid',
      'To remove negative asteroids from the stack',
    ],
    correct: 0,
  },

  // Code tracing
  {
    key: 's2-q14',
    set: 'set-2',
    category: 'Tracing',
    text: 'After processing [5, 10, -5], what is the final result?',
    options: ['[5, 10]', '[5, -5]', '[10, -5]', '[5]'],
    correct: 0,
    check: { input: [5, 10, -5], expect: [5, 10] },
  },

  // destroyed variable
  {
    key: 's2-q18',
    set: 'set-2',
    category: 'Tracing',
    text: 'Suppose st = [8] and ast = -3. After the collision, what is destroyed?',
    options: ['true', 'false', 'It becomes 8', 'It becomes -3'],
    correct: 0,
  },
  {
    key: 's2-q19',
    set: 'set-2',
    category: 'Tracing',
    text: 'Suppose st = [3] and ast = -8. After 3 is popped, what is destroyed?',
    options: ['false', 'true', 'It depends on the stack size', 'It becomes 8'],
    correct: 0,
  },
  {
    key: 's2-q20',
    set: 'set-2',
    category: 'CodeReading',
    text: 'Suppose st = [3] and ast = -8, so 3 is popped and the stack is empty. Why does this execute?',
    snippet: 'if(!destroyed) {\n    st.push(ast);\n}',
    options: [
      '-8 survived the collision, so it needs to be added to the stack',
      '-8 was destroyed',
      'The stack is always supposed to contain the current asteroid',
      'Every negative asteroid must be pushed',
    ],
    correct: 0,
  },

  // Complexity
  {
    key: 's2-q21',
    set: 'set-2',
    category: 'Complexity',
    text: 'What is the time complexity of this approach?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correct: 0,
  },
  {
    key: 's2-q22',
    set: 'set-2',
    category: 'Complexity',
    text: '"But there\'s a while loop inside a for loop, so shouldn\'t it be O(n²)?" Which explanation is correct?',
    options: [
      'Each asteroid can be pushed once and popped at most once, so the total number of stack operations is linear',
      'The while loop always runs exactly once',
      'The stack automatically makes nested loops constant time',
      "while loops don't contribute to time complexity",
    ],
    correct: 0,
  },
  {
    key: 's2-q24',
    set: 'set-2',
    category: 'Complexity',
    text: 'What is the overall auxiliary space complexity of the solution? Consider both stack<int> st; and vector<int> result;',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
    correct: 0,
  },
  {
    key: 's2-q41',
    set: 'added',
    category: 'Complexity',
    text: 'Why is the space complexity O(n)?',
    options: [
      'In the worst case nothing is destroyed (for example all positive, or all negative), so all n asteroids stay on the stack and are then copied into result.',
      'The stack always holds every asteroid, even destroyed ones.',
      'reverse() allocates a second array of size n.',
      'The while loop recurses n levels deep.',
    ],
    correct: 0,
  },
  {
    key: 's2-q42',
    set: 'added',
    category: 'Complexity',
    text: "Why can't this approach beat O(n) time, even in the best case?",
    options: [
      'Every asteroid has to be read at least once to decide whether it collides.',
      'The asteroids must be sorted before any collision can be checked.',
      'abs() takes linear time on every call.',
      'The while loop runs once for every asteroid, positive or negative.',
    ],
    correct: 0,
  },
  {
    key: 's2-q43',
    set: 'added',
    category: 'Complexity',
    text: 'Why does the final reverse() not change the overall time complexity?',
    snippet: 'reverse(result.begin(), result.end());',
    options: [
      'It is a single linear pass over at most n survivors, so O(n) plus O(n) is still O(n).',
      'reverse() runs in constant time on a vector.',
      'reverse() only reverses the stack, not result.',
      'It is O(n^2), but the main loop dominates it.',
    ],
    correct: 0,
  },

  // Edge cases
  {
    key: 's2-q26',
    set: 'set-2',
    category: 'EdgeCase',
    text: 'What happens with [2, 3, 4]?',
    options: ['All three survive', 'Only 4 survives', 'Only 2 survives', 'All three collide'],
    correct: 0,
    check: { input: [2, 3, 4], expect: [2, 3, 4] },
  },
  {
    key: 's2-q27',
    set: 'set-2',
    category: 'EdgeCase',
    text: 'What happens with [-2, 3]?',
    options: ['Both survive', '-2 collides with 3', '3 is destroyed', '-2 is destroyed'],
    correct: 0,
    check: { input: [-2, 3], expect: [-2, 3] },
  },
  {
    key: 's2-q29',
    set: 'set-2',
    category: 'EdgeCase',
    text: 'What happens with [10, -5, -5]?',
    options: ['[10]', '[10, -5]', '[-5]', '[]'],
    correct: 0,
    check: { input: [10, -5, -5], expect: [10] },
  },

  // Implementation understanding
  {
    key: 's2-q30',
    set: 'set-2',
    category: 'CodeReading',
    text: 'Why do we have this check?',
    snippet: 'if(!st.empty())',
    options: [
      'Because calling st.top() on an empty stack is invalid',
      'Because empty stacks cannot store negative values',
      'Because only positive asteroids can be checked',
      'Because pop() automatically empties the stack',
    ],
    correct: 0,
  },
  {
    key: 's2-q31',
    set: 'set-2',
    category: 'Counterfactual',
    text: 'What would happen if we removed destroyed and simply wrote the following after the while loop?',
    snippet: 'st.push(ast);',
    options: [
      'A negative asteroid that was already destroyed could incorrectly be pushed into the stack',
      'The algorithm would become faster',
      'Positive asteroids would stop working',
      'Nothing would change',
    ],
    correct: 0,
  },
  {
    key: 's2-q32',
    set: 'set-2',
    category: 'CodeReading',
    text: 'What does this line accomplish?',
    snippet: 'result.push_back(st.top());',
    options: [
      'Copies the current top asteroid into the result vector',
      'Removes the top asteroid from the stack',
      'Removes the asteroid from the input',
      'Sorts the result',
    ],
    correct: 0,
  },
  {
    key: 's2-q33',
    set: 'set-2',
    category: 'CodeReading',
    text: 'What does this line accomplish inside the final result-building loop?',
    snippet: 'st.pop();',
    options: [
      'Removes the asteroid that was just copied into result',
      'Destroys the asteroid in the original input',
      'Removes the smallest asteroid',
      'Reverses the stack',
    ],
    correct: 0,
  },
  {
    key: 's2-q34',
    set: 'set-2',
    category: 'CodeReading',
    text: "Why can't we simply return the stack?",
    options: [
      "stack doesn't provide the required vector result, and its access order is reversed",
      'Stacks cannot contain negative numbers',
      'The stack is always empty at the end',
      'C++ cannot return a stack',
    ],
    correct: 0,
  },

  // Final understanding
  {
    key: 's2-q36',
    set: 'set-2',
    category: 'FinalUnderstanding',
    text: 'Which statement best describes the entire algorithm?',
    options: [
      'Process asteroids from left to right; store survivors in a stack, and resolve collisions whenever a negative asteroid meets positive asteroids on the stack.',
      'Sort all asteroids and then simulate collisions.',
      'Compare every pair of asteroids and remove the smaller one.',
      'Keep only the largest asteroid from every group.',
    ],
    correct: 0,
  },
  {
    key: 's2-q37',
    set: 'set-2',
    category: 'FinalUnderstanding',
    text: 'What is the only situation in which the current asteroid can enter the collision while loop?',
    options: ['ast < 0', 'ast > 0', 'ast == 0', 'The stack contains exactly one element'],
    correct: 0,
  },
  {
    key: 's2-q38',
    set: 'set-2',
    category: 'FinalUnderstanding',
    text: 'A negative asteroid has survived every collision it encountered. What should happen?',
    options: ['It gets pushed into the stack', 'It gets discarded', 'It gets converted to positive', 'The stack gets cleared'],
    correct: 0,
  },
  {
    key: 's2-q39',
    set: 'set-2',
    category: 'Tracing',
    text: 'A negative asteroid destroys three positive asteroids. How many times can st.pop() execute because of those collisions?',
    options: ['Three times', 'Once', 'Four times', 'Zero times'],
    correct: 0,
    // [1, 2, 3, -10]: three pushes, then -10 is pushed too, so the result [-10] means exactly 3 pops.
    check: { input: [1, 2, 3, -10], expect: [-10] },
  },
  {
    key: 's2-q40',
    set: 'set-2',
    category: 'FinalUnderstanding',
    text: 'Which statement is the BEST mental model for this solution?',
    options: [
      '"A negative asteroid keeps fighting the nearest positive asteroid until either it dies or there is nobody left to fight."',
      '"Every asteroid fights the largest asteroid."',
      '"The stack contains only positive asteroids."',
      '"Every negative asteroid destroys everything before it."',
    ],
    correct: 0,
  },
];
