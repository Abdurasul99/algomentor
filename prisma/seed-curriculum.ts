import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Week definitions ──────────────────────────────────────────────────────────

const weeks = [
  { weekNumber: 1, title: "Onboarding + Arrays", totalPoints: 14.5 },
  { weekNumber: 2, title: "Stacks & Queues", totalPoints: 14.5 },
  { weekNumber: 3, title: "Linked Lists", totalPoints: 14.5 },
  { weekNumber: 4, title: "Heaps + Maps", totalPoints: 14.5 },
  { weekNumber: 5, title: "Sorting", totalPoints: 15 },
  { weekNumber: 6, title: "Searching + QuickSelect + Binary Search", totalPoints: 14.5 },
  { weekNumber: 7, title: "Two Pointers + Sliding Window", totalPoints: 14 },
  { weekNumber: 8, title: "Two Heaps + Fast/Slow Pointers + Bit Manipulation", totalPoints: 14.5 },
  { weekNumber: 9, title: "Bit Manipulation + Graphs/Trees intro", totalPoints: 13.5 },
  { weekNumber: 10, title: "Graphs DFS + BFS + Weighted", totalPoints: 14.5 },
  { weekNumber: 11, title: "Graphs + Strings", totalPoints: 14.5 },
  { weekNumber: 12, title: "Tries + Strings", totalPoints: 13 },
  { weekNumber: 13, title: "Backtracking + Greedy (Bonus DP)", totalPoints: 14 },
  { weekNumber: 14, title: "DP Standard", totalPoints: 15 },
  { weekNumber: 15, title: "Advanced DP", totalPoints: 9 },
];

// ─── Task definitions per week ─────────────────────────────────────────────────

type TaskDef = {
  title: string;
  category: string;
  points: number;
  leetcodeNumber?: number;
  leetcodeUrl?: string;
  moduleSlug?: string;
  orderIndex: number;
};

const tasksByWeek: Record<number, TaskDef[]> = {
  1: [
    { title: "Read and follow steps of the Guide - Onboarding", category: "Onboarding", points: 0.5, orderIndex: 1 },
    { title: "Submit your #introyourself on Slack", category: "Onboarding", points: 0.5, orderIndex: 2 },
    { title: "Participate in a kick-off meeting with your batch manager", category: "Onboarding", points: 0.5, orderIndex: 3 },
    { title: "Watch Ana's video: 2023 Seminar: Kick-off", category: "Onboarding", points: 1.5, orderIndex: 4 },
    { title: "Read the Guide - Outtalent-Style Coding Interviews", category: "Algorithms - core program", points: 2, orderIndex: 5 },
    { title: "Read the Guide - What to Do During a Coding Interview", category: "Algorithms - core program", points: 2, orderIndex: 6 },
    { title: "Read & follow steps of the Guide - Mock Interviews at Outtalent", category: "Algorithms - core program", points: 2, orderIndex: 7 },
    { title: "Read: Algorithms - Track Intro (before the Demo Mock)", category: "Algorithms - core program", points: 0.5, orderIndex: 8 },
    { title: "Watch: Algorithms - Demo Mock", category: "Algorithms - core program", points: 1, orderIndex: 9 },
    { title: "Read: Data Structures - Time Complexity and Big O Notation", category: "Algorithms - core program", points: 1, orderIndex: 10 },
    { title: "Read: Data Structures - Space Complexity", category: "Algorithms - core program", points: 1, orderIndex: 11 },
    { title: "Read: Data Structures - Arrays", category: "Algorithms - core program", points: 1, orderIndex: 12 },
    { title: "Solve: 26. Remove Duplicates from Sorted Array", category: "Algorithms - core program", points: 1, leetcodeNumber: 26, leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", moduleSlug: "arrays-hashing", orderIndex: 13 },
  ],
  2: [
    { title: "Participate in LeetCode biweekly or weekly contest #1", category: "Algorithms - core program", points: 1.5, orderIndex: 1 },
    { title: "Participate in Pair programming session with a fellow #1", category: "Algorithms - core program", points: 1.5, orderIndex: 2 },
    { title: "[Group event] Review LeetCode biweekly or weekly contest #1 solutions", category: "Algorithms - core program", points: 1, orderIndex: 3 },
    { title: "Prepare 1-2 coding problem to interview other fellows #1", category: "Algorithms - core program", points: 1.5, orderIndex: 4 },
    { title: "Read: Data Structures - Stacks and Queues", category: "Algorithms - core program", points: 1, orderIndex: 5 },
    { title: "Solve: 155. Min Stack", category: "Algorithms - core program", points: 1, leetcodeNumber: 155, leetcodeUrl: "https://leetcode.com/problems/min-stack/", moduleSlug: "stack", orderIndex: 6 },
    { title: "Solve: 1381. Design a Stack With Increment Operation", category: "Algorithms - core program", points: 1, leetcodeNumber: 1381, leetcodeUrl: "https://leetcode.com/problems/design-a-stack-with-increment-operation/", moduleSlug: "stack", orderIndex: 7 },
    { title: "Solve: 641. Design Circular Deque", category: "Algorithms - core program", points: 1, leetcodeNumber: 641, leetcodeUrl: "https://leetcode.com/problems/design-circular-deque/", moduleSlug: "stack", orderIndex: 8 },
    { title: "Solve: 232. Implement Queue using Stacks", category: "Algorithms - core program", points: 1, leetcodeNumber: 232, leetcodeUrl: "https://leetcode.com/problems/implement-queue-using-stacks/", moduleSlug: "stack", orderIndex: 9 },
    { title: "Solve: Nearest Smaller Element", category: "Algorithms - core program", points: 1, moduleSlug: "stack", orderIndex: 10 },
    { title: "Solve: 20. Valid Parentheses", category: "Algorithms - core program", points: 1, leetcodeNumber: 20, leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/", moduleSlug: "stack", orderIndex: 11 },
    { title: "Solve: 84. Largest Rectangle in Histogram", category: "Algorithms - core program", points: 1, leetcodeNumber: 84, leetcodeUrl: "https://leetcode.com/problems/largest-rectangle-in-histogram/", moduleSlug: "stack", orderIndex: 12 },
    { title: "Read: Data Structures - Lists", category: "Algorithms - core program", points: 1, orderIndex: 13 },
  ],
  3: [
    { title: "Read: Algorithms - Linked Lists", category: "Algorithms - core program", points: 1, orderIndex: 1 },
    { title: "Solve: 83. Remove Duplicates from Sorted List", category: "Algorithms - core program", points: 1, leetcodeNumber: 83, leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-list/", moduleSlug: "linked-list", orderIndex: 2 },
    { title: "Solve: 82. Remove Duplicates from Sorted List II", category: "Algorithms - core program", points: 1, leetcodeNumber: 82, leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/", moduleSlug: "linked-list", orderIndex: 3 },
    { title: "Solve: 160. Intersection of Two Linked Lists", category: "Algorithms - core program", points: 1, leetcodeNumber: 160, leetcodeUrl: "https://leetcode.com/problems/intersection-of-two-linked-lists/", moduleSlug: "linked-list", orderIndex: 4 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #1", category: "Algorithms - core program", points: 2, orderIndex: 5 },
    { title: "Participate in Pair programming session with a fellow #2", category: "Algorithms - core program", points: 1.5, orderIndex: 6 },
    { title: "Prepare 1 coding problem to interview other fellows #2", category: "Algorithms - core program", points: 1, orderIndex: 7 },
    { title: "Read: Data Structures - Heaps", category: "Algorithms - core program", points: 1, orderIndex: 8 },
    { title: "Solve: Daily LeetCode challenge (7 days) #2", category: "Algorithms - core program", points: 5, orderIndex: 9 },
  ],
  4: [
    { title: "Solve: 23. Merge k Sorted Lists", category: "Algorithms - core program", points: 1, leetcodeNumber: 23, leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists/", moduleSlug: "heap-priority-queue", orderIndex: 1 },
    { title: "Solve: Magician and Chocolates", category: "Algorithms - core program", points: 1, moduleSlug: "heap-priority-queue", orderIndex: 2 },
    { title: "Solve: 373. Find K Pairs with Smallest Sums", category: "Algorithms - core program", points: 1, leetcodeNumber: 373, leetcodeUrl: "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/", moduleSlug: "heap-priority-queue", orderIndex: 3 },
    { title: "Solve: 264. Ugly Number II", category: "Algorithms - core program", points: 1, leetcodeNumber: 264, leetcodeUrl: "https://leetcode.com/problems/ugly-number-ii/", moduleSlug: "heap-priority-queue", orderIndex: 4 },
    { title: "Read: Data Structures - Maps", category: "Algorithms - core program", points: 1, orderIndex: 5 },
    { title: "Read: Data Structures - Caches", category: "Algorithms - core program", points: 1, orderIndex: 6 },
    { title: "Solve: 146. LRU Cache", category: "Algorithms - core program", points: 1, leetcodeNumber: 146, leetcodeUrl: "https://leetcode.com/problems/lru-cache/", moduleSlug: "arrays-hashing", orderIndex: 7 },
    { title: "Solve: 460. LFU Cache", category: "Algorithms - core program", points: 1, leetcodeNumber: 460, leetcodeUrl: "https://leetcode.com/problems/lfu-cache/", moduleSlug: "arrays-hashing", orderIndex: 8 },
    { title: "Solve: 380. Insert Delete GetRandom O(1)", category: "Algorithms - core program", points: 1, leetcodeNumber: 380, leetcodeUrl: "https://leetcode.com/problems/insert-delete-getrandom-o1/", moduleSlug: "arrays-hashing", orderIndex: 9 },
    { title: "Prepare 1 coding problem to interview other fellows #3", category: "Algorithms - core program", points: 1, orderIndex: 10 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #2", category: "Algorithms - core program", points: 2, orderIndex: 11 },
    { title: "Participate in Pair programming session with a fellow #3", category: "Algorithms - core program", points: 1.5, orderIndex: 12 },
    { title: "Read: Algorithms - Sorting", category: "Algorithms - core program", points: 1, orderIndex: 13 },
  ],
  5: [
    { title: "Solve: Daily LeetCode challenge (7 days) #3", category: "Algorithms - core program", points: 5, orderIndex: 1 },
    { title: "Read: Algorithms - Searching", category: "Algorithms - core program", points: 1, orderIndex: 2 },
    { title: "Solve: 912. Sort an Array - Bubble sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "arrays-hashing", orderIndex: 3 },
    { title: "Solve: 912. Sort an Array - Insertion sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "arrays-hashing", orderIndex: 4 },
    { title: "Solve: 912. Sort an Array - Heap sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "heap-priority-queue", orderIndex: 5 },
    { title: "Solve: 912. Sort an Array - Quick sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "arrays-hashing", orderIndex: 6 },
    { title: "Solve: 912. Sort an Array - Merge sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "arrays-hashing", orderIndex: 7 },
    { title: "Solve: 912. Sort an Array - Count sort", category: "Algorithms - core program", points: 1, leetcodeNumber: 912, leetcodeUrl: "https://leetcode.com/problems/sort-an-array/", moduleSlug: "arrays-hashing", orderIndex: 8 },
    { title: "Solve: 147. Insertion Sort List", category: "Algorithms - core program", points: 1, leetcodeNumber: 147, leetcodeUrl: "https://leetcode.com/problems/insertion-sort-list/", moduleSlug: "linked-list", orderIndex: 9 },
    { title: "Solve: 1122. Relative Sort Array", category: "Algorithms - core program", points: 1, leetcodeNumber: 1122, leetcodeUrl: "https://leetcode.com/problems/relative-sort-array/", moduleSlug: "arrays-hashing", orderIndex: 10 },
  ],
  6: [
    { title: "Solve: 215. Kth Largest Element in an Array (QuickSelect)", category: "Algorithms - core program", points: 1, leetcodeNumber: 215, leetcodeUrl: "https://leetcode.com/problems/kth-largest-element-in-an-array/", moduleSlug: "heap-priority-queue", orderIndex: 1 },
    { title: "Solve: 973. K Closest Points to Origin", category: "Algorithms - core program", points: 1, leetcodeNumber: 973, leetcodeUrl: "https://leetcode.com/problems/k-closest-points-to-origin/", moduleSlug: "heap-priority-queue", orderIndex: 2 },
    { title: "Solve: 347. Top K Frequent Elements", category: "Algorithms - core program", points: 1, leetcodeNumber: 347, leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/", moduleSlug: "heap-priority-queue", orderIndex: 3 },
    { title: "Participate in Pair programming session with a fellow #4", category: "Algorithms - core program", points: 1.5, orderIndex: 4 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #3", category: "Algorithms - core program", points: 2, orderIndex: 5 },
    { title: "Prepare 1 coding problem to interview other fellows #4", category: "Algorithms - core program", points: 1, orderIndex: 6 },
    { title: "Solve: 53. Maximum Subarray (Partial Sum)", category: "Algorithms - core program", points: 1, leetcodeNumber: 53, leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/", moduleSlug: "sliding-window", orderIndex: 7 },
    { title: "Solve: daily LeetCode problem #4", category: "Algorithms - core program", points: 1, orderIndex: 8 },
    { title: "Solve: 303. Range Sum Query - Immutable", category: "Algorithms - core program", points: 1, leetcodeNumber: 303, leetcodeUrl: "https://leetcode.com/problems/range-sum-query-immutable/", moduleSlug: "arrays-hashing", orderIndex: 9 },
    { title: "Solve: 304. Range Sum Query 2D - Immutable", category: "Algorithms - core program", points: 1, leetcodeNumber: 304, leetcodeUrl: "https://leetcode.com/problems/range-sum-query-2d-immutable/", moduleSlug: "arrays-hashing", orderIndex: 10 },
    { title: "Solve: 35. Search Insert Position (Binary Search)", category: "Algorithms - core program", points: 1, leetcodeNumber: 35, leetcodeUrl: "https://leetcode.com/problems/search-insert-position/", moduleSlug: "binary-search", orderIndex: 11 },
    { title: "Solve: 153. Find Minimum in Rotated Sorted Array", category: "Algorithms - core program", points: 1, leetcodeNumber: 153, leetcodeUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", moduleSlug: "binary-search", orderIndex: 12 },
    { title: "Solve: 162. Find Peak Element", category: "Algorithms - core program", points: 1, leetcodeNumber: 162, leetcodeUrl: "https://leetcode.com/problems/find-peak-element/", moduleSlug: "binary-search", orderIndex: 13 },
  ],
  7: [
    { title: "Solve: 441. Arranging Coins (Binary Search)", category: "Algorithms - core program", points: 1, leetcodeNumber: 441, leetcodeUrl: "https://leetcode.com/problems/arranging-coins/", moduleSlug: "binary-search", orderIndex: 1 },
    { title: "Read: Algorithms - Two Pointers and Sliding Window", category: "Algorithms - core program", points: 1, orderIndex: 2 },
    { title: "Solve: 1. Two Sum (Two Pointers)", category: "Algorithms - core program", points: 1, leetcodeNumber: 1, leetcodeUrl: "https://leetcode.com/problems/two-sum/", moduleSlug: "two-pointers", orderIndex: 3 },
    { title: "Solve: 3. Longest Substring Without Repeating Characters", category: "Algorithms - core program", points: 1, leetcodeNumber: 3, leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", moduleSlug: "sliding-window", orderIndex: 4 },
    { title: "Solve: 76. Minimum Window Substring", category: "Algorithms - core program", points: 1, leetcodeNumber: 76, leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/", moduleSlug: "sliding-window", orderIndex: 5 },
    { title: "Solve: 209. Minimum Size Subarray Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 209, leetcodeUrl: "https://leetcode.com/problems/minimum-size-subarray-sum/", moduleSlug: "sliding-window", orderIndex: 6 },
    { title: "Solve: 219. Contains Duplicate II", category: "Algorithms - core program", points: 1, leetcodeNumber: 219, leetcodeUrl: "https://leetcode.com/problems/contains-duplicate-ii/", moduleSlug: "sliding-window", orderIndex: 7 },
    { title: "Solve: 239. Sliding Window Maximum", category: "Algorithms - core program", points: 1, leetcodeNumber: 239, leetcodeUrl: "https://leetcode.com/problems/sliding-window-maximum/", moduleSlug: "sliding-window", orderIndex: 8 },
    { title: "Solve: 56. Merge Intervals (Sweep Line)", category: "Algorithms - core program", points: 1, leetcodeNumber: 56, leetcodeUrl: "https://leetcode.com/problems/merge-intervals/", moduleSlug: "arrays-hashing", orderIndex: 9 },
    { title: "Solve: 57. Insert Interval", category: "Algorithms - core program", points: 1, leetcodeNumber: 57, leetcodeUrl: "https://leetcode.com/problems/insert-interval/", moduleSlug: "arrays-hashing", orderIndex: 10 },
    { title: "Solve: 435. Non-overlapping Intervals", category: "Algorithms - core program", points: 1, leetcodeNumber: 435, leetcodeUrl: "https://leetcode.com/problems/non-overlapping-intervals/", moduleSlug: "arrays-hashing", orderIndex: 11 },
    { title: "Solve: 220. Contains Duplicate III", category: "Algorithms - core program", points: 1, leetcodeNumber: 220, leetcodeUrl: "https://leetcode.com/problems/contains-duplicate-iii/", moduleSlug: "sliding-window", orderIndex: 12 },
    { title: "Solve: 424. Longest Repeating Character Replacement", category: "Algorithms - core program", points: 1, leetcodeNumber: 424, leetcodeUrl: "https://leetcode.com/problems/longest-repeating-character-replacement/", moduleSlug: "sliding-window", orderIndex: 13 },
    { title: "Solve: 218. The Skyline Problem", category: "Algorithms - core program", points: 1, leetcodeNumber: 218, leetcodeUrl: "https://leetcode.com/problems/the-skyline-problem/", moduleSlug: "heap-priority-queue", orderIndex: 14 },
  ],
  8: [
    { title: "Participate in Pair programming session with a fellow #5", category: "Algorithms - core program", points: 1.5, orderIndex: 1 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #4", category: "Algorithms - core program", points: 2, orderIndex: 2 },
    { title: "Prepare 1 coding problem to interview other fellows #5", category: "Algorithms - core program", points: 1, orderIndex: 3 },
    { title: "Solve: 295. Find Median from Data Stream", category: "Algorithms - core program", points: 1, leetcodeNumber: 295, leetcodeUrl: "https://leetcode.com/problems/find-median-from-data-stream/", moduleSlug: "heap-priority-queue", orderIndex: 4 },
    { title: "Solve: 480. Sliding Window Median", category: "Algorithms - core program", points: 1, leetcodeNumber: 480, leetcodeUrl: "https://leetcode.com/problems/sliding-window-median/", moduleSlug: "heap-priority-queue", orderIndex: 5 },
    { title: "Solve: 142. Linked List Cycle II", category: "Algorithms - core program", points: 1, leetcodeNumber: 142, leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle-ii/", moduleSlug: "linked-list", orderIndex: 6 },
    { title: "Solve: 876. Middle of the Linked List", category: "Algorithms - core program", points: 1, leetcodeNumber: 876, leetcodeUrl: "https://leetcode.com/problems/middle-of-the-linked-list/", moduleSlug: "linked-list", orderIndex: 7 },
    { title: "Solve: 457. Circular Array Loop", category: "Algorithms - core program", points: 1, leetcodeNumber: 457, leetcodeUrl: "https://leetcode.com/problems/circular-array-loop/", moduleSlug: "linked-list", orderIndex: 8 },
    { title: "Read: Bit Manipulation", category: "Algorithms - core program", points: 1, orderIndex: 9 },
    { title: "Solve: 136. Single Number", category: "Algorithms - core program", points: 1, leetcodeNumber: 136, leetcodeUrl: "https://leetcode.com/problems/single-number/", moduleSlug: "arrays-hashing", orderIndex: 10 },
    { title: "Solve: 137. Single Number II", category: "Algorithms - core program", points: 1, leetcodeNumber: 137, leetcodeUrl: "https://leetcode.com/problems/single-number-ii/", moduleSlug: "arrays-hashing", orderIndex: 11 },
    { title: "Solve: 260. Single Number III", category: "Algorithms - core program", points: 1, leetcodeNumber: 260, leetcodeUrl: "https://leetcode.com/problems/single-number-iii/", moduleSlug: "arrays-hashing", orderIndex: 12 },
    { title: "Solve: 201. Bitwise AND of Numbers Range", category: "Algorithms - core program", points: 1, leetcodeNumber: 201, leetcodeUrl: "https://leetcode.com/problems/bitwise-and-of-numbers-range/", moduleSlug: "arrays-hashing", orderIndex: 13 },
  ],
  9: [
    { title: "Solve: 477. Total Hamming Distance", category: "Algorithms - core program", points: 1, leetcodeNumber: 477, leetcodeUrl: "https://leetcode.com/problems/total-hamming-distance/", moduleSlug: "arrays-hashing", orderIndex: 1 },
    { title: "Review educational tasks on Bitwise operations on LeetCode premium", category: "Algorithms - core program", points: 1, orderIndex: 2 },
    { title: "Participate in Pair programming session with a fellow #6", category: "Algorithms - core program", points: 1.5, orderIndex: 3 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #5", category: "Algorithms - core program", points: 2, orderIndex: 4 },
    { title: "Prepare 1 coding problem to interview other fellows #6", category: "Algorithms - core program", points: 1, orderIndex: 5 },
    { title: "Read: Algorithms - Graphs", category: "Algorithms - core program", points: 1, orderIndex: 6 },
    { title: "Read: Data Structures - Graphs", category: "Algorithms - core program", points: 1, orderIndex: 7 },
    { title: "Read: Data Structures - Trees", category: "Algorithms - core program", points: 1, orderIndex: 8 },
    { title: "Read: Algorithms - Recursion", category: "Algorithms - core program", points: 1, orderIndex: 9 },
    { title: "Solve: 101. Symmetric Tree", category: "Algorithms - core program", points: 1, leetcodeNumber: 101, leetcodeUrl: "https://leetcode.com/problems/symmetric-tree/", moduleSlug: "trees", orderIndex: 10 },
    { title: "Solve: 98. Validate Binary Search Tree", category: "Algorithms - core program", points: 1, leetcodeNumber: 98, leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree/", moduleSlug: "trees", orderIndex: 11 },
    { title: "Solve: 236. Lowest Common Ancestor of a Binary Tree", category: "Algorithms - core program", points: 1, leetcodeNumber: 236, leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", moduleSlug: "trees", orderIndex: 12 },
    { title: "Solve: 94. Binary Tree Inorder Traversal", category: "Algorithms - core program", points: 1, leetcodeNumber: 94, leetcodeUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/", moduleSlug: "trees", orderIndex: 13 },
  ],
  10: [
    { title: "Solve: 113. Path Sum II", category: "Algorithms - core program", points: 1, leetcodeNumber: 113, leetcodeUrl: "https://leetcode.com/problems/path-sum-ii/", moduleSlug: "trees", orderIndex: 1 },
    { title: "Solve: 200. Number of Islands", category: "Algorithms - core program", points: 1, leetcodeNumber: 200, leetcodeUrl: "https://leetcode.com/problems/number-of-islands/", moduleSlug: "graphs", orderIndex: 2 },
    { title: "Solve: 332. Reconstruct Itinerary", category: "Algorithms - core program", points: 1, leetcodeNumber: 332, leetcodeUrl: "https://leetcode.com/problems/reconstruct-itinerary/", moduleSlug: "graphs", orderIndex: 3 },
    { title: "Solve: 210. Course Schedule II", category: "Algorithms - core program", points: 1, leetcodeNumber: 210, leetcodeUrl: "https://leetcode.com/problems/course-schedule-ii/", moduleSlug: "graphs", orderIndex: 4 },
    { title: "Participate in Pair programming session with a fellow #7", category: "Algorithms - core program", points: 1.5, orderIndex: 5 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #6", category: "Algorithms - core program", points: 2, orderIndex: 6 },
    { title: "Prepare 1 coding problem to interview other fellows #7", category: "Algorithms - core program", points: 1, orderIndex: 7 },
    { title: "Solve: 102. Binary Tree Level Order Traversal", category: "Algorithms - core program", points: 1, leetcodeNumber: 102, leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/", moduleSlug: "trees", orderIndex: 8 },
    { title: "Solve: 45. Jump Game II", category: "Algorithms - core program", points: 1, leetcodeNumber: 45, leetcodeUrl: "https://leetcode.com/problems/jump-game-ii/", moduleSlug: "graphs", orderIndex: 9 },
    { title: "Solve: 127. Word Ladder", category: "Algorithms - core program", points: 1, leetcodeNumber: 127, leetcodeUrl: "https://leetcode.com/problems/word-ladder/", moduleSlug: "graphs", orderIndex: 10 },
    { title: "Solve: 743. Network Delay Time", category: "Algorithms - core program", points: 1, leetcodeNumber: 743, leetcodeUrl: "https://leetcode.com/problems/network-delay-time/", moduleSlug: "graphs", orderIndex: 11 },
    { title: "Solve: 787. Cheapest Flights Within K Stops", category: "Algorithms - core program", points: 1, leetcodeNumber: 787, leetcodeUrl: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", moduleSlug: "graphs", orderIndex: 12 },
    { title: "Solve: 1334. Find the City With the Smallest Number of Neighbors", category: "Algorithms - core program", points: 1, leetcodeNumber: 1334, leetcodeUrl: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/", moduleSlug: "graphs", orderIndex: 13 },
  ],
  11: [
    { title: "Solve: 1462. Course Schedule IV", category: "Algorithms - core program", points: 1, leetcodeNumber: 1462, leetcodeUrl: "https://leetcode.com/problems/course-schedule-iv/", moduleSlug: "graphs", orderIndex: 1 },
    { title: "Solve: 1489. Find Critical and Pseudo-Critical Edges in MST", category: "Algorithms - core program", points: 1, leetcodeNumber: 1489, leetcodeUrl: "https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/", moduleSlug: "graphs", orderIndex: 2 },
    { title: "Solve: 1192. Critical Connections in a Network", category: "Algorithms - core program", points: 1, leetcodeNumber: 1192, leetcodeUrl: "https://leetcode.com/problems/critical-connections-in-a-network/", moduleSlug: "graphs", orderIndex: 3 },
    { title: "Participate in Pair programming session with a fellow #8", category: "Algorithms - core program", points: 1.5, orderIndex: 4 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #7", category: "Algorithms - core program", points: 2, orderIndex: 5 },
    { title: "Participate in LeetCode biweekly or weekly contest #2", category: "Algorithms - core program", points: 1.5, orderIndex: 6 },
    { title: "[Group event] Review LeetCode biweekly or weekly contest #2 solutions", category: "Algorithms - core program", points: 1, orderIndex: 7 },
    { title: "Read: Data Structures - Strings", category: "Algorithms - core program", points: 1, orderIndex: 8 },
    { title: "Read: Algorithms - Strings", category: "Algorithms - core program", points: 1, orderIndex: 9 },
    { title: "Solve: 5. Longest Palindromic Substring", category: "Algorithms - core program", points: 1, leetcodeNumber: 5, leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring/", moduleSlug: "sliding-window", orderIndex: 10 },
    { title: "Solve: 28. Find the Index of the First Occurrence in a String", category: "Algorithms - core program", points: 1, leetcodeNumber: 28, leetcodeUrl: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/", moduleSlug: "two-pointers", orderIndex: 11 },
    { title: "Solve: 214. Shortest Palindrome", category: "Algorithms - core program", points: 1, leetcodeNumber: 214, leetcodeUrl: "https://leetcode.com/problems/shortest-palindrome/", moduleSlug: "two-pointers", orderIndex: 12 },
    { title: "Read: Data Structures - Tries (Prefix Trees)", category: "Algorithms - core program", points: 1, orderIndex: 13 },
  ],
  12: [
    { title: "Solve: 208. Implement Trie (Prefix Tree)", category: "Algorithms - core program", points: 1, leetcodeNumber: 208, leetcodeUrl: "https://leetcode.com/problems/implement-trie-prefix-tree/", moduleSlug: "trees", orderIndex: 1 },
    { title: "Solve: 211. Design Add and Search Words Data Structure", category: "Algorithms - core program", points: 1, leetcodeNumber: 211, leetcodeUrl: "https://leetcode.com/problems/design-add-and-search-words-data-structure/", moduleSlug: "trees", orderIndex: 2 },
    { title: "Solve: 677. Map Sum Pairs", category: "Algorithms - core program", points: 1, leetcodeNumber: 677, leetcodeUrl: "https://leetcode.com/problems/map-sum-pairs/", moduleSlug: "trees", orderIndex: 3 },
    { title: "Solve: 745. Prefix and Suffix Search", category: "Algorithms - core program", points: 1, leetcodeNumber: 745, leetcodeUrl: "https://leetcode.com/problems/prefix-and-suffix-search/", moduleSlug: "trees", orderIndex: 4 },
    { title: "Solve: 132. Palindrome Partitioning II", category: "Algorithms - core program", points: 1, leetcodeNumber: 132, leetcodeUrl: "https://leetcode.com/problems/palindrome-partitioning-ii/", moduleSlug: "dynamic-programming", orderIndex: 5 },
    { title: "Solve: 421. Maximum XOR of Two Numbers in an Array", category: "Algorithms - core program", points: 1, leetcodeNumber: 421, leetcodeUrl: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", moduleSlug: "trees", orderIndex: 6 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #8", category: "Algorithms - core program", points: 2, orderIndex: 7 },
    { title: "Prepare 1 coding problem to interview other fellows #8", category: "Algorithms - core program", points: 1, orderIndex: 8 },
    { title: "Solve: daily LeetCode problem (x4)", category: "Algorithms - core program", points: 2, orderIndex: 9 },
    { title: "Read: Algorithms - Backtracking", category: "Algorithms - core program", points: 1, orderIndex: 10 },
  ],
  13: [
    { title: "Solve: Daily LeetCode challenge (7 days) #1", category: "Algorithms - core program", points: 5, orderIndex: 1 },
    { title: "Solve: 79. Word Search", category: "Algorithms - core program", points: 1, leetcodeNumber: 79, leetcodeUrl: "https://leetcode.com/problems/word-search/", moduleSlug: "backtracking", orderIndex: 2 },
    { title: "Read: Algorithms - Greedy", category: "Algorithms - core program", points: 1, orderIndex: 3 },
    { title: "Participate in Two-way coding mock with an Outtalent fellow #9", category: "Algorithms - core program", points: 2, orderIndex: 4 },
    { title: "Solve: 402. Remove K Digits (Greedy)", category: "Algorithms - core program", points: 1, leetcodeNumber: 402, leetcodeUrl: "https://leetcode.com/problems/remove-k-digits/", moduleSlug: "backtracking", orderIndex: 5 },
    { title: "Solve: 343. Integer Break", category: "Algorithms - core program", points: 1, leetcodeNumber: 343, leetcodeUrl: "https://leetcode.com/problems/integer-break/", moduleSlug: "dynamic-programming", orderIndex: 6 },
    { title: "Solve: 392. Is Subsequence", category: "Algorithms - core program", points: 1, leetcodeNumber: 392, leetcodeUrl: "https://leetcode.com/problems/is-subsequence/", moduleSlug: "two-pointers", orderIndex: 7 },
    { title: "Solve: 123. Best Time to Buy and Sell Stock III", category: "Algorithms - core program", points: 1, leetcodeNumber: 123, leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/", moduleSlug: "dynamic-programming", orderIndex: 8 },
    { title: "Solve: 698. Partition to K Equal Sum Subsets (DP Masks)", category: "Algorithms - core program", points: 1, leetcodeNumber: 698, leetcodeUrl: "https://leetcode.com/problems/partition-to-k-equal-sum-subsets/", moduleSlug: "backtracking", orderIndex: 9 },
  ],
  14: [
    { title: "Solve: 473. Matchsticks to Square", category: "Algorithms - core program", points: 1, leetcodeNumber: 473, leetcodeUrl: "https://leetcode.com/problems/matchsticks-to-square/", moduleSlug: "backtracking", orderIndex: 1 },
    { title: "Solve: 63. Unique Paths II", category: "Algorithms - core program", points: 1, leetcodeNumber: 63, leetcodeUrl: "https://leetcode.com/problems/unique-paths-ii/", moduleSlug: "dynamic-programming", orderIndex: 2 },
    { title: "Solve: 64. Minimum Path Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 64, leetcodeUrl: "https://leetcode.com/problems/minimum-path-sum/", moduleSlug: "dynamic-programming", orderIndex: 3 },
    { title: "Solve: 91. Decode Ways", category: "Algorithms - core program", points: 1, leetcodeNumber: 91, leetcodeUrl: "https://leetcode.com/problems/decode-ways/", moduleSlug: "dynamic-programming", orderIndex: 4 },
    { title: "Solve: 152. Maximum Product Subarray", category: "Algorithms - core program", points: 1, leetcodeNumber: 152, leetcodeUrl: "https://leetcode.com/problems/maximum-product-subarray/", moduleSlug: "dynamic-programming", orderIndex: 5 },
    { title: "Solve: 213. House Robber II", category: "Algorithms - core program", points: 1, leetcodeNumber: 213, leetcodeUrl: "https://leetcode.com/problems/house-robber-ii/", moduleSlug: "dynamic-programming", orderIndex: 6 },
    { title: "Solve: 300. Longest Increasing Subsequence", category: "Algorithms - core program", points: 1, leetcodeNumber: 300, leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence/", moduleSlug: "dynamic-programming", orderIndex: 7 },
    { title: "Solve: 322. Coin Change", category: "Algorithms - core program", points: 1, leetcodeNumber: 322, leetcodeUrl: "https://leetcode.com/problems/coin-change/", moduleSlug: "dynamic-programming", orderIndex: 8 },
    { title: "Solve: 416. Partition Equal Subset Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 416, leetcodeUrl: "https://leetcode.com/problems/partition-equal-subset-sum/", moduleSlug: "dynamic-programming", orderIndex: 9 },
    { title: "Solve: 494. Target Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 494, leetcodeUrl: "https://leetcode.com/problems/target-sum/", moduleSlug: "dynamic-programming", orderIndex: 10 },
    { title: "Solve: 354. Russian Doll Envelopes", category: "Algorithms - core program", points: 1, leetcodeNumber: 354, leetcodeUrl: "https://leetcode.com/problems/russian-doll-envelopes/", moduleSlug: "dynamic-programming", orderIndex: 11 },
    { title: "Solve: 403. Frog Jump", category: "Algorithms - core program", points: 1, leetcodeNumber: 403, leetcodeUrl: "https://leetcode.com/problems/frog-jump/", moduleSlug: "dynamic-programming", orderIndex: 12 },
    { title: "Solve: 1434. Number of Ways to Wear Different Hats", category: "Algorithms - core program", points: 1, leetcodeNumber: 1434, leetcodeUrl: "https://leetcode.com/problems/number-of-ways-to-wear-different-hats-to-each-other/", moduleSlug: "dynamic-programming", orderIndex: 13 },
    { title: "Solve: 1349. Maximum Students Taking Exam", category: "Algorithms - core program", points: 1, leetcodeNumber: 1349, leetcodeUrl: "https://leetcode.com/problems/maximum-students-taking-exam/", moduleSlug: "dynamic-programming", orderIndex: 14 },
  ],
  15: [
    { title: "Solve: 410. Split Array Largest Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 410, leetcodeUrl: "https://leetcode.com/problems/split-array-largest-sum/", moduleSlug: "dynamic-programming", orderIndex: 1 },
    { title: "Solve: 124. Binary Tree Maximum Path Sum", category: "Algorithms - core program", points: 1, leetcodeNumber: 124, leetcodeUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", moduleSlug: "trees", orderIndex: 2 },
    { title: "Solve: 10. Regular Expression Matching", category: "Algorithms - core program", points: 1, leetcodeNumber: 10, leetcodeUrl: "https://leetcode.com/problems/regular-expression-matching/", moduleSlug: "dynamic-programming", orderIndex: 3 },
    { title: "Solve: 72. Edit Distance", category: "Algorithms - core program", points: 1, leetcodeNumber: 72, leetcodeUrl: "https://leetcode.com/problems/edit-distance/", moduleSlug: "dynamic-programming", orderIndex: 4 },
    { title: "Solve: 115. Distinct Subsequences", category: "Algorithms - core program", points: 1, leetcodeNumber: 115, leetcodeUrl: "https://leetcode.com/problems/distinct-subsequences/", moduleSlug: "dynamic-programming", orderIndex: 5 },
    { title: "Solve: 486. Predict the Winner", category: "Algorithms - core program", points: 1, leetcodeNumber: 486, leetcodeUrl: "https://leetcode.com/problems/predict-the-winner/", moduleSlug: "dynamic-programming", orderIndex: 6 },
    { title: "Solve: 312. Burst Balloons", category: "Algorithms - core program", points: 1, leetcodeNumber: 312, leetcodeUrl: "https://leetcode.com/problems/burst-balloons/", moduleSlug: "dynamic-programming", orderIndex: 7 },
    { title: "Solve: 1130. Minimum Cost Tree From Leaf Values", category: "Algorithms - core program", points: 1, leetcodeNumber: 1130, leetcodeUrl: "https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/", moduleSlug: "dynamic-programming", orderIndex: 8 },
    { title: "Solve: 337. House Robber III", category: "Algorithms - core program", points: 1, leetcodeNumber: 337, leetcodeUrl: "https://leetcode.com/problems/house-robber-iii/", moduleSlug: "trees", orderIndex: 9 },
  ],
};

// ─── Practice Problems ─────────────────────────────────────────────────────────

type ProblemData = {
  title: string;
  moduleSlug: string;
  source: string;
  url: string;
  difficulty: string;
  description: string;
  learningObjective: string;
  hintLevelOne: string;
  hintLevelTwo: string;
  hintLevelThree: string;
  hintLevelFour: string;
  finalExplanation: string;
  companies: string;
  orderIndex: number;
};

const curriculumProblems: ProblemData[] = [
  {
    title: "26. Remove Duplicates from Sorted Array",
    moduleSlug: "arrays-hashing",
    source: "LeetCode",
    url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    difficulty: "Easy",
    description: "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Return k, the number of unique elements.",
    learningObjective: "Two-pointer in-place technique: slow write pointer advances only on unique values.",
    hintLevelOne: "Since the array is sorted, duplicates are always adjacent. You need an in-place approach with no extra space.",
    hintLevelTwo: "Use a slow pointer that only advances when you find a new unique value. This 'write pointer' marks where the next unique element should go.",
    hintLevelThree: "Keep k=0 as the write pointer. For each element, if it's different from nums[k-1], write it at nums[k] and increment k.",
    hintLevelFour: "k = 1\nfor i in range(1, len(nums)):\n    if nums[i] != nums[k-1]:\n        nums[k] = nums[i]\n        k += 1\nreturn k",
    finalExplanation: "Two-pointer technique. The write pointer only advances when a new value is found. Since sorted, comparison with previous write position is sufficient. Time: O(n), Space: O(1).",
    companies: '["Amazon","Microsoft","Apple"]',
    orderIndex: 100,
  },
  {
    title: "155. Min Stack",
    moduleSlug: "stack",
    source: "LeetCode",
    url: "https://leetcode.com/problems/min-stack/",
    difficulty: "Medium",
    description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    learningObjective: "Parallel min-stack pattern: maintain a synchronized auxiliary stack tracking running minimum.",
    hintLevelOne: "You need O(1) getMin(). A single stack can't do this — think about what extra info to track at each level.",
    hintLevelTwo: "Use a second stack that tracks the minimum at each level. Push to min_stack only when new element <= current minimum.",
    hintLevelThree: "Each push to main stack also updates min_stack: push min(val, min_stack top). Each pop from main also pops from min_stack.",
    hintLevelFour: "self.stack = []; self.min_stack = []\n# push:\nself.stack.append(val)\nself.min_stack.append(min(val, self.min_stack[-1] if self.min_stack else val))\n# getMin:\nreturn self.min_stack[-1]",
    finalExplanation: "Parallel min-stack always has current minimum on top. Both stacks stay synchronized — push together, pop together. Time: O(1) all ops, Space: O(n).",
    companies: '["Amazon","Google","Bloomberg","Microsoft"]',
    orderIndex: 101,
  },
  {
    title: "232. Implement Queue using Stacks",
    moduleSlug: "stack",
    source: "LeetCode",
    url: "https://leetcode.com/problems/implement-queue-using-stacks/",
    difficulty: "Easy",
    description: "Implement a first-in, first-out (FIFO) queue using only two stacks. Support push, pop, peek, and empty operations.",
    learningObjective: "Lazy transfer pattern: two stacks reverse order; transfer only when the output stack is empty.",
    hintLevelOne: "A queue is FIFO, a stack is LIFO. You need two stacks to reverse the order. One for input, one for output.",
    hintLevelTwo: "Use an input stack and output stack. Push always goes to input. Pop transfers all from input to output (if output empty), then pops from output.",
    hintLevelThree: "This is the lazy transfer technique. Only move elements when output is empty and a pop is needed. Amortized O(1).",
    hintLevelFour: "# push:\nself.in_stack.append(x)\n# pop:\nif not self.out_stack:\n    while self.in_stack:\n        self.out_stack.append(self.in_stack.pop())\nreturn self.out_stack.pop()",
    finalExplanation: "Amortized O(1) for both operations. Each element crosses from in_stack to out_stack exactly once. The lazy transfer avoids unnecessary work.",
    companies: '["Amazon","Microsoft"]',
    orderIndex: 102,
  },
  {
    title: "84. Largest Rectangle in Histogram",
    moduleSlug: "stack",
    source: "LeetCode",
    url: "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    difficulty: "Hard",
    description: "Given an array of integers heights representing the histogram's bar heights, return the area of the largest rectangle in the histogram.",
    learningObjective: "Monotonic increasing stack pattern: find left/right boundaries for each bar in O(n).",
    hintLevelOne: "For each bar, what is the largest rectangle it can be part of? It extends left and right as far as bars of equal or greater height.",
    hintLevelTwo: "Use a monotonic increasing stack. When you find a shorter bar, pop taller bars and calculate the rectangle they could form.",
    hintLevelThree: "For each popped bar, width = current_index - stack_top_index - 1. Area = height * width. Track the max area seen.",
    hintLevelFour: "stack = []; max_area = 0\nfor i, h in enumerate(heights + [0]):\n    while stack and heights[stack[-1]] > h:\n        height = heights[stack.pop()]\n        width = i if not stack else i - stack[-1] - 1\n        max_area = max(max_area, height * width)\n    stack.append(i)",
    finalExplanation: "Monotonic stack processes each bar exactly once. Appending sentinel 0 at end flushes remaining bars. Time: O(n), Space: O(n).",
    companies: '["Amazon","Google","Meta","Microsoft"]',
    orderIndex: 103,
  },
  {
    title: "83. Remove Duplicates from Sorted List",
    moduleSlug: "linked-list",
    source: "LeetCode",
    url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list/",
    difficulty: "Easy",
    description: "Given the head of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.",
    learningObjective: "Single pointer traversal: rewire next pointer to skip duplicate nodes in-place.",
    hintLevelOne: "The list is sorted, so duplicates are adjacent. Traverse and skip duplicate nodes by rewiring the next pointer.",
    hintLevelTwo: "Use a single pointer curr. If curr.val == curr.next.val, skip curr.next. Otherwise advance curr.",
    hintLevelThree: "curr = head\nwhile curr and curr.next:\n    if curr.val == curr.next.val:\n        curr.next = curr.next.next\n    else:\n        curr = curr.next\nreturn head",
    hintLevelFour: "Key insight: don't advance curr when you delete — the new curr.next might also be a duplicate! Only move forward when values differ.",
    finalExplanation: "O(n) time, O(1) space. We never need a previous pointer — just rewire the next pointer on the current node. The sorted property ensures all dupes are contiguous.",
    companies: '["Amazon","Microsoft"]',
    orderIndex: 104,
  },
  {
    title: "160. Intersection of Two Linked Lists",
    moduleSlug: "linked-list",
    source: "LeetCode",
    url: "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    difficulty: "Easy",
    description: "Given the heads of two singly linked lists, return the node where the two lists intersect. If no intersection, return null.",
    learningObjective: "Two-pointer path equalization: both pointers travel equal total distance and converge at intersection.",
    hintLevelOne: "If two lists intersect, they share a common tail. After the intersection point, every node is the same.",
    hintLevelTwo: "Classic trick: traverse both simultaneously. When one reaches the end, redirect to the other list's head. They will meet at the intersection.",
    hintLevelThree: "a, b = headA, headB\nwhile a != b:\n    a = a.next if a else headB\n    b = b.next if b else headA\nreturn a",
    hintLevelFour: "Why this works: pointer A travels len(A) + len(B) nodes, pointer B travels len(B) + len(A). They cover the same total distance and meet at the intersection (or both reach null if no intersection).",
    finalExplanation: "O(n+m) time, O(1) space. The two-pointer approach equalizes path lengths without modifying the lists. Elegant and interview-favorite.",
    companies: '["Amazon","Meta","Microsoft","Bloomberg"]',
    orderIndex: 105,
  },
  {
    title: "23. Merge k Sorted Lists",
    moduleSlug: "heap-priority-queue",
    source: "LeetCode",
    url: "https://leetcode.com/problems/merge-k-sorted-lists/",
    difficulty: "Hard",
    description: "You are given an array of k linked lists, each sorted in ascending order. Merge all the linked lists into one sorted linked list and return it.",
    learningObjective: "Min-heap merge: always extract the global minimum across k sorted lists in O(log k) per step.",
    hintLevelOne: "Brute force: collect all values, sort, build list. O(N log N). Can you do better using the fact that lists are already sorted?",
    hintLevelTwo: "Use a min-heap. Start by pushing the head of each list. Pop the minimum, add to result, then push that node's next.",
    hintLevelThree: "heap = [(node.val, i, node) for i, node in enumerate(lists) if node]; heapify(heap). Pop smallest, link to result, push its next into heap.",
    hintLevelFour: "import heapq\nheap = []\nfor i, node in enumerate(lists):\n    if node: heapq.heappush(heap, (node.val, i, node))\ndummy = ListNode(0); curr = dummy\nwhile heap:\n    val, i, node = heapq.heappop(heap)\n    curr.next = node; curr = curr.next\n    if node.next: heapq.heappush(heap, (node.next.val, i, node.next))\nreturn dummy.next",
    finalExplanation: "O(N log k) where N is total nodes, k is number of lists. The heap always has at most k elements. Dummy head simplifies edge cases.",
    companies: '["Amazon","Google","Meta","Microsoft","LinkedIn"]',
    orderIndex: 106,
  },
  {
    title: "146. LRU Cache",
    moduleSlug: "arrays-hashing",
    source: "LeetCode",
    url: "https://leetcode.com/problems/lru-cache/",
    difficulty: "Medium",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get and put in O(1) time complexity.",
    learningObjective: "HashMap + Doubly Linked List combination for O(1) lookup with O(1) insertion order management.",
    hintLevelOne: "LRU = Least Recently Used. You need O(1) get and O(1) put. What structures give O(1) lookup AND maintain insertion order?",
    hintLevelTwo: "Combine a HashMap (for O(1) key lookup) with a Doubly Linked List (to track usage order). Most recently used at head, LRU at tail.",
    hintLevelThree: "On get: move the node to head. On put: add to head. If over capacity: remove tail node AND remove from hashmap.",
    hintLevelFour: "# Python shortcut using OrderedDict:\nfrom collections import OrderedDict\nself.cache = OrderedDict()\n# get: self.cache.move_to_end(key)\n# put: self.cache[key] = value; self.cache.move_to_end(key)\n# if len > capacity: self.cache.popitem(last=False)",
    finalExplanation: "The classic LRU implementation. HashMap gives O(1) key access. Doubly linked list gives O(1) move-to-front and evict-tail. Python's OrderedDict handles both cleanly.",
    companies: '["Amazon","Google","Meta","Microsoft","Apple"]',
    orderIndex: 107,
  },
  {
    title: "215. Kth Largest Element in an Array",
    moduleSlug: "heap-priority-queue",
    source: "LeetCode",
    url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    difficulty: "Medium",
    description: "Given an integer array nums and an integer k, return the kth largest element in the array.",
    learningObjective: "Min-heap of size k maintains the k largest elements; QuickSelect gives average O(n).",
    hintLevelOne: "Simplest: sort and return nums[-k]. O(n log n). Can you do O(n log k) using the fact you only care about k elements?",
    hintLevelTwo: "Use a min-heap of size k. Maintain it as you scan. The minimum of this heap IS the kth largest element.",
    hintLevelThree: "heap = []\nfor num in nums:\n    heappush(heap, num)\n    if len(heap) > k:\n        heappop(heap)\nreturn heap[0]",
    hintLevelFour: "Alternative: QuickSelect. Partition array like quicksort, but only recurse into one side. Average O(n). In Python: import heapq; return heapq.nlargest(k, nums)[-1]",
    finalExplanation: "Min-heap approach: O(n log k). QuickSelect: average O(n), worst O(n²). Min-heap is safer to implement correctly in interviews.",
    companies: '["Amazon","Google","Meta","Facebook","LinkedIn"]',
    orderIndex: 108,
  },
  {
    title: "347. Top K Frequent Elements",
    moduleSlug: "heap-priority-queue",
    source: "LeetCode",
    url: "https://leetcode.com/problems/top-k-frequent-elements/",
    difficulty: "Medium",
    description: "Given an integer array nums and an integer k, return the k most frequent elements.",
    learningObjective: "Bucket sort by frequency achieves O(n); min-heap approach is O(n log k).",
    hintLevelOne: "Count frequencies first (Counter). Then find the k most frequent. Multiple approaches possible — think about the fastest.",
    hintLevelTwo: "Option 1: sort by frequency O(n log n). Option 2: min-heap of size k O(n log k). Option 3: Bucket sort O(n).",
    hintLevelThree: "Bucket sort: create buckets[0..n] where bucket[freq] = list of numbers with that frequency. Scan from high to low frequency.",
    hintLevelFour: "from collections import Counter\ncount = Counter(nums)\nfreq = [[] for _ in range(len(nums)+1)]\nfor num, cnt in count.items():\n    freq[cnt].append(num)\nres = []\nfor i in range(len(freq)-1, -1, -1):\n    res.extend(freq[i])\n    if len(res) >= k: return res[:k]",
    finalExplanation: "Bucket sort O(n): frequency can't exceed n, so buckets are bounded. Scan from highest frequency bucket. Most elegant O(n) solution.",
    companies: '["Amazon","Google","Meta","Microsoft"]',
    orderIndex: 109,
  },
  {
    title: "53. Maximum Subarray",
    moduleSlug: "sliding-window",
    source: "LeetCode",
    url: "https://leetcode.com/problems/maximum-subarray/",
    difficulty: "Medium",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    learningObjective: "Kadane's algorithm: greedy decision at each element whether to extend or restart the current subarray.",
    hintLevelOne: "Brute force O(n²). Think: can we decide at each position whether to extend the current subarray or start fresh?",
    hintLevelTwo: "Kadane's Algorithm. Keep a running sum. If running sum becomes negative, restart from current element. Track maximum seen.",
    hintLevelThree: "curr_sum = nums[0]; max_sum = nums[0]\nfor num in nums[1:]:\n    curr_sum = max(num, curr_sum + num)\n    max_sum = max(max_sum, curr_sum)",
    hintLevelFour: "The key decision at each element: is it better to include this in the current subarray, or start a new one? curr_sum + num vs num → equivalent to: if curr_sum < 0, restart.",
    finalExplanation: "Kadane's algorithm O(n). A subarray with negative prefix sum only hurts future sums, so we discard it. Single pass, two variables.",
    companies: '["Amazon","Google","Meta","Microsoft","Apple"]',
    orderIndex: 110,
  },
  {
    title: "153. Find Minimum in Rotated Sorted Array",
    moduleSlug: "binary-search",
    source: "LeetCode",
    url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    difficulty: "Medium",
    description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Find the minimum element in O(log n).",
    learningObjective: "Binary search on rotated array: compare mid with right to determine which half contains the minimum.",
    hintLevelOne: "The array is sorted but rotated. Binary search must work in O(log n). What property tells you which half contains the minimum?",
    hintLevelTwo: "If nums[mid] > nums[right]: the minimum is in the right half. Else: the minimum is in the left half (including mid).",
    hintLevelThree: "left, right = 0, len(nums)-1\nwhile left < right:\n    mid = (left+right)//2\n    if nums[mid] > nums[right]:\n        left = mid+1\n    else:\n        right = mid\nreturn nums[left]",
    hintLevelFour: "Key insight: compare mid with right (not left!). If nums[mid] > nums[right], there is a rotation in the right half. Otherwise, the minimum is at mid or in the left.",
    finalExplanation: "O(log n). Compare mid to right to determine which side has the minimum. Loop converges when left == right, which is the minimum position.",
    companies: '["Amazon","Google","Microsoft","Apple"]',
    orderIndex: 111,
  },
  {
    title: "76. Minimum Window Substring",
    moduleSlug: "sliding-window",
    source: "LeetCode",
    url: "https://leetcode.com/problems/minimum-window-substring/",
    difficulty: "Hard",
    description: "Given two strings s and t, return the minimum window substring of s such that every character in t is included in the window. Return empty string if no valid window exists.",
    learningObjective: "Variable sliding window with character frequency tracking: expand to satisfy condition, shrink to minimize.",
    hintLevelOne: "Sliding window. Expand right to include all required chars, then shrink left while still valid, tracking the minimum window.",
    hintLevelTwo: "Use two frequency maps: need (target freqs) and window (current freqs). Track 'have' count — chars satisfying their needed frequency.",
    hintLevelThree: "When have == len(need): valid window found. Record if smaller than current min. Move left pointer to shrink.",
    hintLevelFour: "from collections import Counter\nneed = Counter(t); window = {}; have, required = 0, len(need); l = 0; res = ''\nfor r, c in enumerate(s):\n    window[c] = window.get(c,0)+1\n    if c in need and window[c] == need[c]: have += 1\n    while have == required:\n        if not res or r-l+1 < len(res): res = s[l:r+1]\n        if window[s[l]] == need.get(s[l],0): have -= 1\n        window[s[l]] -= 1; l += 1",
    finalExplanation: "O(n). The 'have' counter tracks when a char's window count meets (not exceeds) its needed count. Shrinking from left is valid while have equals required.",
    companies: '["Amazon","Google","Meta","Microsoft","Bloomberg"]',
    orderIndex: 112,
  },
  {
    title: "295. Find Median from Data Stream",
    moduleSlug: "heap-priority-queue",
    source: "LeetCode",
    url: "https://leetcode.com/problems/find-median-from-data-stream/",
    difficulty: "Hard",
    description: "Design a data structure that supports adding integers and finding the median. Implement MedianFinder with addNum and findMedian.",
    learningObjective: "Two heaps partition: max-heap for lower half, min-heap for upper half, maintain balance for O(1) median.",
    hintLevelOne: "Brute force: keep sorted array, median is middle element. O(n log n) insert. Can you do O(log n) insert with O(1) median?",
    hintLevelTwo: "Use two heaps! A max-heap for the lower half, min-heap for the upper half. Median is the tops of these heaps.",
    hintLevelThree: "Always maintain: max-heap size == min-heap size OR max-heap size == min-heap size + 1. Median is max-heap top (or average of both tops).",
    hintLevelFour: "# addNum:\nheapq.heappush(self.lo, -num)  # max-heap (negate)\nheapq.heappush(self.hi, -heapq.heappop(self.lo))  # balance\nif len(self.lo) < len(self.hi):\n    heapq.heappush(self.lo, -heapq.heappop(self.hi))\n# findMedian:\nif len(self.lo) > len(self.hi): return -self.lo[0]\nreturn (-self.lo[0] + self.hi[0]) / 2",
    finalExplanation: "O(log n) add, O(1) median. Two heaps maintain a balanced partition of all numbers. Lower half max = upper half min neighbor = median region.",
    companies: '["Amazon","Google","Meta","Microsoft"]',
    orderIndex: 113,
  },
  {
    title: "200. Number of Islands",
    moduleSlug: "graphs",
    source: "LeetCode",
    url: "https://leetcode.com/problems/number-of-islands/",
    difficulty: "Medium",
    description: "Given a 2D binary grid of '1's (land) and '0's (water), return the number of islands.",
    learningObjective: "DFS/BFS flood fill on a grid: count connected components by marking visited cells.",
    hintLevelOne: "Each '1' can be part of an island. When you find one, how do you mark the whole island so you don't count it again?",
    hintLevelTwo: "DFS/BFS flood fill. When you find '1', increment counter, then recursively mark all connected '1's as visited (change to '0').",
    hintLevelThree: "Change visited '1' to '0' (or use visited set). For each cell, if it is '1', run DFS and increment islands count.",
    hintLevelFour: "def dfs(r,c):\n    if r<0 or r>=rows or c<0 or c>=cols or grid[r][c]!='1': return\n    grid[r][c]='0'\n    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)\ncount = 0\nfor r in range(rows):\n    for c in range(cols):\n        if grid[r][c]=='1':\n            dfs(r,c); count+=1",
    finalExplanation: "O(m*n). Modify grid in-place to mark visited. Each island is fully flooded in one DFS call. BFS (queue) is alternative for very deep grids.",
    companies: '["Amazon","Google","Meta","Microsoft","Bloomberg"]',
    orderIndex: 114,
  },
  {
    title: "210. Course Schedule II",
    moduleSlug: "graphs",
    source: "LeetCode",
    url: "https://leetcode.com/problems/course-schedule-ii/",
    difficulty: "Medium",
    description: "There are numCourses courses. Return the ordering of courses to finish all, or empty array if impossible.",
    learningObjective: "Topological sort via DFS with 3-state coloring: detect cycles while building post-order sequence.",
    hintLevelOne: "This is a topological sort problem. If there is a cycle (circular dependency), return an empty array.",
    hintLevelTwo: "Build adjacency list. Use DFS with 3 states: unvisited(0), visiting(1), visited(2). If you reach a 'visiting' node, there is a cycle.",
    hintLevelThree: "Post-order DFS: add a course to result AFTER all its dependencies are added. Reverse the result at the end.",
    hintLevelFour: "state = [0]*n; result = []\ndef dfs(node):\n    if state[node]==1: return False  # cycle\n    if state[node]==2: return True   # already done\n    state[node]=1\n    for nei in adj[node]:\n        if not dfs(nei): return False\n    state[node]=2\n    result.append(node)\n    return True",
    finalExplanation: "O(V+E). Topological ordering via DFS post-order + reverse. 3-state coloring cleanly detects back edges (cycles). Classic interview problem.",
    companies: '["Amazon","Google","Meta","Microsoft","Apple"]',
    orderIndex: 115,
  },
  {
    title: "322. Coin Change",
    moduleSlug: "dynamic-programming",
    source: "LeetCode",
    url: "https://leetcode.com/problems/coin-change/",
    difficulty: "Medium",
    description: "Given coins of different denominations and an amount, compute the fewest number of coins needed to make up the amount. Return -1 if not possible.",
    learningObjective: "Bottom-up DP on amount range: dp[i] = min coins for amount i, built from smaller subproblems.",
    hintLevelOne: "Classic DP. For each amount 0 to target, what is the minimum number of coins?",
    hintLevelTwo: "dp[i] = minimum coins to make amount i. Base case: dp[0] = 0. For each coin c: dp[i] = min(dp[i], dp[i-c] + 1).",
    hintLevelThree: "dp = [float('inf')] * (amount+1)\ndp[0] = 0\nfor a in range(1, amount+1):\n    for coin in coins:\n        if a >= coin:\n            dp[a] = min(dp[a], dp[a-coin]+1)",
    hintLevelFour: "Why bottom-up? dp[i] depends on dp[i-coin] which is always smaller → already computed. Return dp[amount] if not inf else -1.",
    finalExplanation: "O(amount × num_coins). Bottom-up DP. Think of it as BFS from 0 to target where each edge is a coin denomination.",
    companies: '["Amazon","Google","Meta","Microsoft","Apple"]',
    orderIndex: 116,
  },
  {
    title: "72. Edit Distance",
    moduleSlug: "dynamic-programming",
    source: "LeetCode",
    url: "https://leetcode.com/problems/edit-distance/",
    difficulty: "Hard",
    description: "Given two strings word1 and word2, return the minimum number of operations (insert, delete, replace) required to convert word1 to word2.",
    learningObjective: "2D DP string matching: dp[i][j] = min operations to convert word1[:i] to word2[:j].",
    hintLevelOne: "dp[i][j] = min edits to convert word1[:i] to word2[:j]. Think about the base cases and the recurrence.",
    hintLevelTwo: "Base cases: dp[i][0] = i (delete all), dp[0][j] = j (insert all). If chars match: dp[i][j] = dp[i-1][j-1]. Else: min of three operations + 1.",
    hintLevelThree: "dp[i][j] = dp[i-1][j-1] if word1[i-1]==word2[j-1] else 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])",
    hintLevelFour: "The three options when chars don't match:\ndp[i-1][j]+1 = delete from word1\ndp[i][j-1]+1 = insert into word1\ndp[i-1][j-1]+1 = replace in word1",
    finalExplanation: "O(m×n) time and space. Classic 2D DP. Space can be optimized to O(min(m,n)) using two rows. One of the most important DP problems.",
    companies: '["Amazon","Google","Microsoft","Meta"]',
    orderIndex: 117,
  },
  {
    title: "300. Longest Increasing Subsequence",
    moduleSlug: "dynamic-programming",
    source: "LeetCode",
    url: "https://leetcode.com/problems/longest-increasing-subsequence/",
    difficulty: "Medium",
    description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    learningObjective: "Patience sorting with binary search achieves O(n log n) LIS via tails array maintenance.",
    hintLevelOne: "dp[i] = length of LIS ending at index i. For each i, check all j < i where nums[j] < nums[i]. Can you do better than O(n²)?",
    hintLevelTwo: "O(n log n): Maintain a tails array where tails[i] is the smallest tail element of all LIS of length i+1. Use binary search.",
    hintLevelThree: "tails = []\nfor num in nums:\n    pos = bisect_left(tails, num)\n    if pos == len(tails): tails.append(num)\n    else: tails[pos] = num\nreturn len(tails)",
    hintLevelFour: "The patience sorting insight: tails[i] is always the optimal (smallest) tail for an LIS of length i+1. Replacing with binary search maintains this invariant.",
    finalExplanation: "O(n log n). The tails array does not store the actual LIS, but its length is correct. bisect_left finds where to place or replace each element.",
    companies: '["Amazon","Google","Microsoft","Meta"]',
    orderIndex: 118,
  },
  {
    title: "98. Validate Binary Search Tree",
    moduleSlug: "trees",
    source: "LeetCode",
    url: "https://leetcode.com/problems/validate-binary-search-tree/",
    difficulty: "Medium",
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    learningObjective: "Range-based BST validation: pass valid (min, max) bounds through recursion, not just parent comparison.",
    hintLevelOne: "A BST requires every node in the left subtree to be LESS than the root, and every node in the right subtree to be GREATER. Not just immediate children!",
    hintLevelTwo: "Pass valid range [min_val, max_val] through recursion. Root has range (-inf, +inf). Left child: (-inf, parent.val). Right child: (parent.val, +inf).",
    hintLevelThree: "def validate(node, lo, hi):\n    if not node: return True\n    if not lo < node.val < hi: return False\n    return validate(node.left, lo, node.val) and validate(node.right, node.val, hi)",
    hintLevelFour: "Common mistake: only checking immediate parent-child relationship. A right subtree's left child must still be > root — the bounds enforce this globally.",
    finalExplanation: "O(n). Pass bounds through every recursive call. The bounds tighten as you go deeper. This catches all invalid nodes regardless of tree shape.",
    companies: '["Amazon","Google","Microsoft","Meta","Bloomberg"]',
    orderIndex: 119,
  },
  {
    title: "236. Lowest Common Ancestor of a Binary Tree",
    moduleSlug: "trees",
    source: "LeetCode",
    url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    difficulty: "Medium",
    description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q.",
    learningObjective: "Post-order DFS: if p and q are found in different subtrees, current node is the LCA.",
    hintLevelOne: "The LCA is the deepest node that has both p and q as descendants (a node is a descendant of itself).",
    hintLevelTwo: "Recursive approach: if current node is p or q, return it. If p and q are in different subtrees, current node is the LCA.",
    hintLevelThree: "def lca(node, p, q):\n    if not node or node==p or node==q: return node\n    left = lca(node.left, p, q)\n    right = lca(node.right, p, q)\n    if left and right: return node\n    return left or right",
    hintLevelFour: "If both subtrees return non-null, current node is the LCA. If only one returns non-null, that subtree contains both p and q — propagate that result upward.",
    finalExplanation: "O(n) single-pass DFS. If p is in one subtree and q in the other, we have found the LCA. Otherwise the answer is deeper in one subtree.",
    companies: '["Amazon","Google","Meta","Microsoft","Bloomberg"]',
    orderIndex: 120,
  },
];

// ─── Main seed function ────────────────────────────────────────────────────────

export async function seedCurriculum(userId: string) {
  console.log("Seeding curriculum weeks and tasks...");

  // Delete old curriculum data
  await prisma.curriculumTask.deleteMany({ where: { userId } });
  await prisma.curriculumWeek.deleteMany();

  // Create weeks
  const weekMap: Record<number, string> = {};
  for (const week of weeks) {
    const created = await prisma.curriculumWeek.create({ data: week });
    weekMap[week.weekNumber] = created.id;
    console.log(`  Created week ${week.weekNumber}: ${week.title}`);
  }

  // Simulate progress for weeks 1–6 (completed), week 7 (partial), weeks 8+ (not started)
  const completedWeeks = new Set([1, 2, 3, 4, 5, 6]);
  const partialWeek = 7;
  const partialCompletedTasks = new Set([1, 2, 3, 4, 5, 6, 7]); // first 7 tasks of week 7

  // Create tasks for each week
  for (const [weekNumStr, tasks] of Object.entries(tasksByWeek)) {
    const weekNum = parseInt(weekNumStr);
    const weekId = weekMap[weekNum];
    if (!weekId) continue;

    for (const task of tasks) {
      let isCompleted = false;
      let completedAt: Date | null = null;

      if (completedWeeks.has(weekNum)) {
        isCompleted = true;
        // Spread completion dates across the past weeks
        const daysAgo = (7 - weekNum) * 7 + task.orderIndex;
        completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      } else if (weekNum === partialWeek && partialCompletedTasks.has(task.orderIndex)) {
        isCompleted = true;
        completedAt = new Date(Date.now() - task.orderIndex * 24 * 60 * 60 * 1000);
      }

      await prisma.curriculumTask.create({
        data: {
          weekId,
          userId,
          title: task.title,
          category: task.category,
          points: task.points,
          isCompleted,
          completedAt,
          leetcodeNumber: task.leetcodeNumber ?? null,
          leetcodeUrl: task.leetcodeUrl ?? null,
          moduleSlug: task.moduleSlug ?? null,
          orderIndex: task.orderIndex,
        },
      });
    }
    console.log(`  Created ${tasks.length} tasks for week ${weekNum}`);
  }

  // Seed curriculum-specific practice problems
  console.log("Seeding curriculum practice problems...");

  // Look up module IDs
  const modules = await prisma.module.findMany({ select: { id: true, slug: true } });
  const moduleBySlug = Object.fromEntries(modules.map((m) => [m.slug, m.id]));

  for (const prob of curriculumProblems) {
    const moduleId = moduleBySlug[prob.moduleSlug];
    if (!moduleId) {
      console.warn(`  Skipping ${prob.title}: module ${prob.moduleSlug} not found`);
      continue;
    }

    // Check if already exists (by title + moduleId)
    const existing = await prisma.practiceProblem.findFirst({
      where: { title: prob.title, moduleId },
    });
    if (existing) {
      console.log(`  Skipping (already exists): ${prob.title}`);
      continue;
    }

    await prisma.practiceProblem.create({
      data: {
        moduleId,
        title: prob.title,
        source: prob.source,
        url: prob.url,
        difficulty: prob.difficulty,
        description: prob.description,
        learningObjective: prob.learningObjective,
        hintLevelOne: prob.hintLevelOne,
        hintLevelTwo: prob.hintLevelTwo,
        hintLevelThree: prob.hintLevelThree,
        hintLevelFour: prob.hintLevelFour,
        finalExplanation: prob.finalExplanation,
        companies: prob.companies,
        orderIndex: prob.orderIndex,
      },
    });
    console.log(`  Created practice problem: ${prob.title}`);
  }

  console.log("Curriculum seeding complete!");
}
