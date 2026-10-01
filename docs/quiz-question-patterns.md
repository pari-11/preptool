# Quiz question patterns

Reference for spec 011 (quiz mode). It records the *kinds* of questions the user wants, taken from their hand-written samples for LeetCode 735 (Asteroid Collision, stack solution): about 55 questions across two sets. It describes patterns, not a fixed question list. Questions for any other problem should follow the same shapes.

## Format

- 4-option multiple choice, exactly one correct. Wrong options are plausible misconceptions; a few are deliberately absurd.
- Questions quote the actual code line or condition from the reference solution and use concrete values.
- Grouped under themed headings, ordered basic to hard.
- In every sample the correct option was A. The app must shuffle option order.
- Some sample options carry a `**` prefix (Q13, Q18, Q19, Q29, Q39 of the second set). Meaning unconfirmed; assumed to mark options the user rewrote.

## Patterns

### 1. Intuition and design choice
- Why is data structure X suitable (what property of the problem it exploits)?
- Which element does a new item interact with first (newest / nearest relevant)?
- Why does a given case need no special handling (e.g. a positive asteroid never needs the collision loop)?
- Which statement best describes the whole algorithm?
- Which statement is the best mental model? (Closes every quiz.)

### 2. Code reading (a quoted line or block)
- What is the purpose of this variable or flag?
- What does this line accomplish (`push_back`, `pop`, `reverse`)?
- What happens immediately after this line (control flow)?
- What does it mean when this condition is true? What does it guard (`st.top() > 0`, the empty check)?
- What does a flag assignment mean in this specific branch (`destroyed = true`)?
- Why is this function or operator used (`abs()`)?
- What determines a property (direction is the sign)?
- Why a `break`? Why a `while` and not a single `if`?
- Why does this block execute in this scenario (`if(!destroyed)` push)?
- What does the structure's top represent after a pop (the invariant)?
- What is the only situation in which control enters this loop or branch?
- What should happen after a given outcome (the element survived every collision)?
- Why does the output need a final transformation (`reverse`), and why not return the stack directly?

### 3. Code tracing on concrete state
- Given this state and input, what happens first?
- What is the state after processing the first k elements?
- Which element is met first?
- What happens to a specific element? What happens next after it is removed?
- What is the final result for a full input?
- What is the value of a flag at this point, in several scenarios (including an "it depends" distractor)?
- Will the loop run at all for this state?
- Counting operations: how many times can `pop()` run when N elements are destroyed?

### 4. Complexity
- Time complexity of the approach.
- Space complexity of one structure.
- Overall auxiliary space, counting every structure (stack and result).
- The misconception question: "a `while` inside a `for`, so shouldn't it be O(n^2)?" (amortised: each element is pushed and popped at most once).

### 5. Edge cases (short concrete inputs)
- All same direction (all negative, all positive).
- Already in a collision-free order.
- Mixed order with no collision possible.
- Equal magnitudes.
- Repeated values.
- Empty-stack consequences.

### 6. Implementation counterfactuals
- What breaks if this variable or check is removed?
- Why is this guard needed (invalid call on an empty structure)?
- Why does the result need this conversion step?

### 7. Final "do you actually understand it" block
- Whole-algorithm description, loop-entry condition, action after surviving, operation counting, best mental model.

## Difficulty ordering

Intuition and single-line code reading first, then tracing and edge cases, then complexity and counterfactuals, then the final understanding block.
