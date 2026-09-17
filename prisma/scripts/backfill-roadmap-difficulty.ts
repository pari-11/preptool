import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

// Verified against leetcode.com (and corroborating sources) 2026-09-17 — these are the
// 20 roadmap-only problems flagged by import-roadmap.ts as having no companywise match yet.
const DIFFICULTIES: Record<number, Difficulty> = {
  271: 'Medium', // Encode and Decode Strings
  448: 'Easy', // Find All Numbers Disappeared in an Array
  442: 'Medium', // Find All Duplicates in an Array
  2461: 'Medium', // Maximum Sum of Distinct Subarrays With Length K
  226: 'Easy', // Invert Binary Tree
  572: 'Easy', // Subtree of Another Tree
  1448: 'Medium', // Count Good Nodes in Binary Tree
  235: 'Medium', // Lowest Common Ancestor of a BST
  105: 'Medium', // Construct Binary Tree from Preorder and Inorder Traversal
  973: 'Medium', // K Closest Points to Origin
  40: 'Medium', // Combination Sum II
  131: 'Medium', // Palindrome Partitioning
  323: 'Medium', // Number of Connected Components in an Undirected Graph
  684: 'Medium', // Redundant Connection
  1514: 'Medium', // Path with Maximum Probability
  778: 'Hard', // Swim in Rising Water
  846: 'Medium', // Hand of Straights
  1851: 'Hard', // Minimum Interval to Include Each Query
  2013: 'Medium', // Detect Squares
  338: 'Easy', // Counting Bits
};

async function main() {
  let updated = 0;
  let skippedAlreadySet = 0;
  let skippedNotFound = 0;

  for (const [idStr, difficulty] of Object.entries(DIFFICULTIES)) {
    const leetcodeId = parseInt(idStr, 10);
    const problem = await prisma.problem.findUnique({ where: { leetcode_id: leetcodeId } });

    if (!problem) {
      console.warn(`No Problem row for LC ${leetcodeId} — skipped.`);
      skippedNotFound++;
      continue;
    }
    if (problem.difficulty !== null) {
      console.warn(`LC ${leetcodeId} already has difficulty=${problem.difficulty} — leaving as-is.`);
      skippedAlreadySet++;
      continue;
    }

    await prisma.problem.update({ where: { id: problem.id }, data: { difficulty } });
    updated++;
  }

  console.log(`\nUpdated ${updated} problems, ${skippedAlreadySet} already set, ${skippedNotFound} not found.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
