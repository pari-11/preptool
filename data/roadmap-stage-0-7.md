# DSA Roadmap — Stage 0 through Stage 7 (Reference)

This is reference content the user provided to describe their existing roadmap structure — it is NOT already built/live anywhere. Transcribed directly from the user's screenshots as a reference for baseline import — no changes to groupings, ordering, or insight notes. Problems are identified by their actual LeetCode problem ID (not a sequential position number).

---

## Stage 0 — Direct Traversal / Running State
*Insight: track one running value while scanning once — no memory of history. The baseline before asking 'what if I need to remember more than one thing?'*
- LC 121 — Best Time to Buy and Sell Stock

## Stage 1 — Frequency / Memory → Hashing
*Insight: 'Have I seen this before?' needs a structure that remembers everything seen. O(1) memory → O(n) memory, traded for O(1) lookup.*
- LC 217 — Contains Duplicate
- LC 242 — Valid Anagram
- LC 1 — Two Sum
- LC 49 — Group Anagrams
- LC 271 — Encode and Decode Strings (premium)
- LC 347 — Top K Frequent Elements
- LC 36 — Valid Sudoku
- LC 128 — Longest Consecutive Sequence

## Stage 2 — Array-as-Hashmap
*Insight: what if the array itself can BE the hash map? Indices encode presence/value — O(1) space instead of O(n). The leap: index position carries information, not just cell value.*
- LC 268 — Missing Number *(also appears in Stage 22 via a bit-manipulation/XOR approach — see note at end of Stage 8+ file)*
- LC 448 — Find All Numbers Disappeared in an Array
- LC 442 — Find All Duplicates in an Array
- LC 41 — First Missing Positive

## Bridge B — Elimination / Cancellation
*Insight: sometimes you don't need memory — you need a rule for cancelling out candidates. Foreshadows the greedy-elimination leap.*
- LC 169 — Majority Element

## Stage 3 — Preprocessing Thinking
*Insight: compute something once, upfront, and reuse it per query. From storing raw seen-values to storing cumulative computed state.*
- LC 238 — Product of Array Except Self
- LC 189 — Rotate Array

## Stage 4A — Two Pointers — Opposite Direction
*Insight: two indices converging inward instead of nested loops. Pointer movement becomes a decision (move the shorter wall) — greedy elimination enters.*
- LC 125 — Valid Palindrome
- LC 977 — Squares of a Sorted Array
- LC 167 — Two Sum II — Input Array Is Sorted
- LC 11 — Container With Most Water
- LC 15 — 3Sum
- LC 16 — 3Sum Closest
- LC 42 — Trapping Rain Water

## Stage 4B — Two Pointers — Same Direction
*Insight: slow/fast: one pointer marks a write position while the other scans — in-place partitioning, matching, and merging.*
- LC 283 — Move Zeroes
- LC 26 — Remove Duplicates from Sorted Array
- LC 392 — Is Subsequence
- LC 88 — Merge Sorted Array
- LC 75 — Sort Colors

## Stage 5A — Sliding Window — Fixed Size
*Insight: a constant-size window slides; state updates incrementally, from a sum to a full frequency signature.*
- LC 643 — Maximum Average Subarray I
- LC 567 — Permutation in String
- LC 438 — Find All Anagrams in a String
- LC 2461 — Maximum Sum of Distinct Subarrays With Length K

## Stage 5B — Sliding Window — Variable Size
*Insight: a breathing interval governed by a validity rule: expand right, shrink left when the condition breaks.*
- LC 3 — Longest Substring Without Repeating Characters
- LC 209 — Minimum Size Subarray Sum
- LC 713 — Subarray Product Less Than K
- LC 904 — Fruit Into Baskets
- LC 424 — Longest Repeating Character Replacement
- LC 76 — Minimum Window Substring

## Stage 6 — Local vs Global Optimization
*Insight: extend what I've built, or abandon it and start fresh here? A decision on running-state sign — foreshadows DP.*
- LC 53 — Maximum Subarray (Kadane's)

## Stage 7 — Monotonic Structure Thinking
*Insight: sometimes you need an ordered mini-structure that maintains itself as the window moves. Bridge into monotonic stack/queue.*
- LC 239 — Sliding Window Maximum
