# DSA Roadmap — Draft Continuation (Stage 8 onward)

This continues the stage numbering from your existing roadmap, which now covers Stage 0 through Stage 7 (Direct Traversal, Frequency/Hashing, Array-as-Hashmap, Bridge B, Preprocessing, Two Pointers, Sliding Window, Local vs Global Optimization, Monotonic Structure Thinking). This is a **first draft** — review and reorder freely before it becomes baseline data. Problems are identified by their actual LeetCode problem ID (not a sequential position number).

Legend (matching your existing site): Core = NeetCode 150 · Supp = extra rep/high-frequency · Stretch = Hard, do later · ★ = highest priority.

---

## Stage 8A — Stack — Matching & Simulation
*Insight: valid pairing and "undo" operations — process one token at a time, use the stack as memory of the unmatched opens.*
- LC 20 — Valid Parentheses — Core ★
- LC 155 — Min Stack — Core
- LC 150 — Evaluate Reverse Polish Notation — Core
- LC 22 — Generate Parentheses — Core
- LC 735 — Asteroid Collision — Supp

## Stage 8B — Stack — Monotonic Stack
*Insight: keep the stack increasing/decreasing; pop when the incoming element breaks the order — answers "next greater/smaller" in O(n) instead of O(n²). Same monotonic-structure idea as your Stage 7, applied to a stack instead of a deque.*
- LC 739 — Daily Temperatures — Core ★
- LC 853 — Car Fleet — Core
- LC 84 — Largest Rectangle in Histogram — Stretch

## Stage 9A — Binary Search — Search Space is the Array
*Insight: when the array is sorted, halve the search space each time based on a comparison.*
- LC 704 — Binary Search — Core ★
- LC 74 — Search a 2D Matrix — Core
- LC 153 — Find Minimum in Rotated Sorted Array — Core
- LC 33 — Search in Rotated Sorted Array — Core ★

## Stage 9B — Binary Search — Search Space is a Range of Answers
*Insight: sometimes what you're binary-searching isn't the array itself, but the space of possible answers — binary search on "is this value feasible?"*
- LC 875 — Koko Eating Bananas — Core ★
- LC 981 — Time Based Key-Value Store — Core
- LC 4 — Median of Two Sorted Arrays — Stretch

## Stage 10A — Linked List — Traversal & Reversal
*Insight: no random access — pointer-chasing IS the algorithm; manipulate the pointers themselves.*
- LC 206 — Reverse Linked List — Core ★
- LC 21 — Merge Two Sorted Lists — Core
- LC 143 — Reorder List — Core
- LC 19 — Remove Nth Node From End of List — Core

## Stage 10B — Linked List — Fast & Slow Pointers
*Insight: two pointers at different speeds through a chain reveal cycles and midpoints — the same idea as your Stage 4B two-pointers, now on a structure with no index access.*
- LC 141 — Linked List Cycle — Core ★
- LC 287 — Find the Duplicate Number — Supp
- LC 138 — Copy List with Random Pointer — Core

## Stage 10C — Linked List — Merge & Design
*Insight: combining many sorted structures, or building a list-backed structure with extra bookkeeping.*
- LC 2 — Add Two Numbers — Core
- LC 146 — LRU Cache — Core ★
- LC 23 — Merge k Sorted Lists — Stretch *(bridges toward Heap — see Stage 13)*

## Stage 11A — Trees — DFS (Recursive Traversal)
*Insight: a tree is recursively "a node plus two smaller trees" — most tree problems are solved by trusting recursion on subtrees.*
- LC 226 — Invert Binary Tree — Core ★
- LC 104 — Maximum Depth of Binary Tree — Core
- LC 543 — Diameter of Binary Tree — Core
- LC 110 — Balanced Binary Tree — Core
- LC 100 — Same Tree — Core
- LC 572 — Subtree of Another Tree — Core

## Stage 11B — Trees — BFS (Level Order)
*Insight: when "level" or "shortest path in unweighted layers" matters, process the tree layer by layer with a queue instead of recursion.*
- LC 102 — Binary Tree Level Order Traversal — Core ★
- LC 199 — Binary Tree Right Side View — Core
- LC 1448 — Count Good Nodes in Binary Tree — Core

## Stage 11C — Trees — BST Properties
*Insight: a BST's sorted structure lets you prune half the tree at each step — binary search, but on a tree.*
- LC 98 — Validate Binary Search Tree — Core ★
- LC 230 — Kth Smallest Element in a BST — Core
- LC 235 — Lowest Common Ancestor of a BST — Core

## Stage 11D — Trees — Construction & Hard Traversal
*Insight: rebuilding a tree from traversal orders, or finding paths that don't pass through the root, needs care about what each traversal order actually encodes.*
- LC 105 — Construct Binary Tree from Preorder and Inorder Traversal — Core
- LC 124 — Binary Tree Maximum Path Sum — Stretch
- LC 297 — Serialize and Deserialize Binary Tree — Stretch

## Stage 12 — Tries
*Insight: when "does any word start with this prefix" matters, a trie shares common prefixes across words instead of storing each one separately.*
- LC 208 — Implement Trie (Prefix Tree) — Core ★
- LC 211 — Design Add and Search Words Data Structure — Core
- LC 212 — Word Search II — Stretch *(bridges to Backtracking — see Stage 14B)*

## Stage 13A — Heap / Priority Queue — Direct Usage
*Insight: when you repeatedly need "the current min/max" while the set changes, a heap keeps that answer in O(log n) instead of resorting each time.*
- LC 703 — Kth Largest Element in a Stream — Core
- LC 1046 — Last Stone Weight — Core
- LC 973 — K Closest Points to Origin — Core ★
- LC 215 — Kth Largest Element in an Array — Core
- LC 621 — Task Scheduler — Core

## Stage 13B — Heap — Two-Heap Design
*Insight: one max-heap for the lower half, one min-heap for the upper half — together they track a running median in O(log n) per insert.*
- LC 295 — Find Median from Data Stream — Stretch ★

## Stage 14A — Backtracking — Include/Exclude Decisions
*Insight: explore a decision tree — choose, recurse, un-choose — pruning branches that can't lead anywhere. Subsets/permutations problems are "decide yes or no for each element."*
- LC 78 — Subsets — Core ★
- LC 39 — Combination Sum — Core
- LC 46 — Permutations — Core
- LC 90 — Subsets II — Core
- LC 40 — Combination Sum II — Core

## Stage 14B — Backtracking — Constraint Satisfaction (Grid/Board)
*Insight: same choose-recurse-undo shape, but the "board" itself constrains which choices are legal at each step.*
- LC 79 — Word Search — Core ★
- LC 131 — Palindrome Partitioning — Core
- LC 51 — N-Queens — Stretch

## Stage 15A — Graphs — DFS/BFS Traversal
*Insight: a grid is just a graph with implicit edges — visit each cell/node once, spread outward.*
- LC 200 — Number of Islands — Core ★
- LC 695 — Max Area of Island — Supp
- LC 133 — Clone Graph — Core
- LC 417 — Pacific Atlantic Water Flow — Core
- LC 130 — Surrounded Regions — Core
- LC 994 — Rotting Oranges — Core
- LC 286 — Walls and Gates — Supp (premium)

## Stage 15B — Graphs — Topological Sort
*Insight: when edges represent "must happen before," ordering nodes so every edge points forward requires detecting and respecting dependencies (and catching cycles, which mean no valid order exists).*
- LC 207 — Course Schedule — Core ★
- LC 210 — Course Schedule II — Core
- LC 261 — Graph Valid Tree — Supp (premium)

## Stage 15C — Graphs — Union-Find (Disjoint Set)
*Insight: when the question is "are these two things eventually connected," union-find tracks connectivity without re-traversing the whole graph each time.*
- LC 323 — Number of Connected Components in an Undirected Graph — Core ★ (premium)
- LC 684 — Redundant Connection — Core

## Stage 16A — Advanced Graphs — Shortest Path (Weighted)
*Insight: plain BFS assumes every edge costs the same; weighted edges need priority-ordered exploration (Dijkstra) or repeated relaxation (Bellman-Ford). Bridges from Stage 13 (Heap) — Dijkstra is BFS with a priority queue instead of a plain queue.*
- LC 743 — Network Delay Time — Core ★
- LC 787 — Cheapest Flights Within K Stops — Core
- LC 1514 — Path with Maximum Probability — Supp

## Stage 16B — Advanced Graphs — Minimum Spanning Tree & Variants
*Insight: connecting all nodes for minimum total cost — greedily add the cheapest edge that doesn't create a cycle (or use a heap-driven expansion).*
- LC 1584 — Min Cost to Connect All Points — Core ★
- LC 778 — Swim in Rising Water — Stretch
- LC 332 — Reconstruct Itinerary — Stretch

## Stage 17A — 1-D Dynamic Programming — Linear Sequence DP
*Insight: when today's answer depends only on a few previous answers, cache/build them bottom-up instead of recomputing — the Fibonacci shape.*
- LC 70 — Climbing Stairs — Core ★
- LC 198 — House Robber — Core
- LC 213 — House Robber II — Core
- LC 91 — Decode Ways — Core

## Stage 17B — 1-D Dynamic Programming — Subsequence/Substring DP
*Insight: same bottom-up caching idea, but the state now depends on "which elements so far," not just "how many steps so far."*
- LC 300 — Longest Increasing Subsequence — Core ★
- LC 139 — Word Break — Core
- LC 322 — Coin Change — Core
- LC 152 — Maximum Product Subarray — Core
- LC 416 — Partition Equal Subset Sum — Core

## Stage 18 — 2-D Dynamic Programming
*Insight: when state depends on two changing quantities (two indices, or two strings), the cache becomes a grid instead of a line — bridges from Stage 17B, since Longest Common Subsequence sits right at that boundary.*
- LC 62 — Unique Paths — Core ★
- LC 1143 — Longest Common Subsequence — Core
- LC 5 — Longest Palindromic Substring — Core
- LC 647 — Palindromic Substrings — Core
- LC 72 — Edit Distance — Stretch

## Stage 19 — Greedy
*Insight: sometimes the locally-best choice at each step provably leads to the globally-best answer — no need to explore alternatives (backtracking) or remember all past states (DP). (Maximum Subarray, the classic greedy/DP-boundary example, is already covered in your Stage 6 — Local vs Global Optimization.)*
- LC 55 — Jump Game — Core ★
- LC 45 — Jump Game II — Core
- LC 134 — Gas Station — Core
- LC 846 — Hand of Straights — Supp
- LC 678 — Valid Parenthesis String — Stretch

## Stage 20 — Intervals
*Insight: sort by start (or end) time first — most interval problems become straightforward once the ordering is fixed.*
- LC 57 — Insert Interval — Core ★
- LC 56 — Merge Intervals — Core
- LC 435 — Non-overlapping Intervals — Core
- LC 252 — Meeting Rooms — Core (premium)
- LC 253 — Meeting Rooms II — Core (premium)
- LC 1851 — Minimum Interval to Include Each Query — Stretch

## Stage 21 — Math & Geometry
*Insight: a grab-bag of problems where the trick is a specific mathematical or geometric observation rather than a reusable general pattern.*
- LC 48 — Rotate Image — Core ★
- LC 54 — Spiral Matrix — Core
- LC 73 — Set Matrix Zeroes — Core
- LC 202 — Happy Number — Supp
- LC 66 — Plus One — Supp
- LC 50 — Pow(x, n) — Core
- LC 43 — Multiply Strings — Supp
- LC 2013 — Detect Squares — Supp

## Stage 22 — Bit Manipulation
*Insight: some problems collapse to simple operations once you think in binary rather than decimal.*
- LC 136 — Single Number — Core ★
- LC 191 — Number of 1 Bits — Core
- LC 338 — Counting Bits — Core
- LC 190 — Reverse Bits — Core
- LC 268 — Missing Number — Core *(intentionally also in Stage 2, via a different solving technique — array-index marking there, XOR here)*
- LC 371 — Sum of Two Integers — Core
- LC 7 — Reverse Integer — Supp

---

## Notes on choices made in this draft
- Some problems appear where you might place them differently (e.g. "Find the Duplicate Number" could sit with your Stage 2 array-as-hashmap logic instead of Stage 10B's fast/slow pointers — I placed it by the fast/slow-pointer *solution technique*, not the array data structure, to match your stated rule of "filed by the pattern that cracks it, not the data structure").
- Bridges beyond your original Bridge B: Stage 10C → Stage 13 (Merge k Sorted Lists needs a heap), Stage 12 → Stage 14B (Word Search II needs backtracking over the trie), and Stage 13 → Stage 16A (Dijkstra is BFS with a priority queue). Worth confirming these read as real conceptual leaps to you, the way your original Bridge B did.
- LeetCode #268 (Missing Number) intentionally appears twice — Stage 2 and Stage 22 — since it has two genuinely different solving techniques worth separate reps on.
- Difficulty tags (Core/Supp/Stretch) and ★ priority flags are my best guess by typical interview frequency — you'll know better than any generic source which ones deserve ★ for your own prep.
- A few problems are LeetCode Premium (marked above) — worth flagging since not everyone has premium access; your roadmap tool could note this per problem if relevant.
