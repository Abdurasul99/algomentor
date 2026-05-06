import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const modules = [
  {
    name: "Arrays and Hashing",
    slug: "arrays-hashing",
    description: "Master the foundation of all algorithm problems using arrays and hash maps.",
    overview: "Arrays and hash maps are the most fundamental data structures in coding interviews. Almost every algorithm problem touches arrays in some way. Hash maps give you O(1) lookup, which turns many O(n²) brute force solutions into O(n) optimized ones.",
    intuition: "Think of a hash map as a super-fast lookup table. Instead of scanning an array one by one to find something, you store it in a hash map and retrieve it instantly. This is the key insight that unlocks most 'two sum' style problems.",
    whenToUse: "Use arrays and hashing when: you need to count frequencies, check for duplicates, find pairs that sum to a target, group elements by a property, or need O(1) lookup instead of O(n) scan.",
    recognitionSignals: "Look for: 'find two numbers that sum to X', 'find duplicates', 'group anagrams', 'count frequencies', 'check if contains', any problem asking about pairs or matches.",
    commonMistakes: "1. Forgetting to handle duplicate keys in a map. 2. Using a list when a set would be faster. 3. Not considering the case where the complement equals the number itself (e.g., 4+4=8). 4. Modifying a collection while iterating over it.",
    difficultyLevel: "Beginner",
    orderIndex: 1,
    prerequisites: "[]",
  },
  {
    name: "Two Pointers",
    slug: "two-pointers",
    description: "Use two pointers moving toward each other or in the same direction to solve problems efficiently.",
    overview: "Two Pointers is a technique where you maintain two index variables that move through an array or string. This avoids nested loops and reduces time complexity from O(n²) to O(n) for many problems.",
    intuition: "Imagine two people walking toward each other on a sorted array. They can together check every pair in O(n) instead of O(n²). The key is knowing when to move each pointer — this is what the invariant tells you.",
    whenToUse: "Use Two Pointers when: working with sorted arrays, finding pairs that sum to a target, removing duplicates in-place, checking if a string is a palindrome, or merging two sorted arrays.",
    recognitionSignals: "Look for: sorted arrays, palindrome checks, remove duplicates in-place, container with most water, three sum, or any problem where you need to efficiently scan from both ends.",
    commonMistakes: "1. Forgetting to sort the array first when the pattern requires it. 2. Moving both pointers at the same time when only one should move. 3. Off-by-one errors on the boundary conditions. 4. Not handling the case where left == right.",
    difficultyLevel: "Beginner",
    orderIndex: 2,
    prerequisites: '["arrays-hashing"]',
  },
  {
    name: "Sliding Window",
    slug: "sliding-window",
    description: "Efficiently process subarrays or substrings using a window that slides over the data.",
    overview: "Sliding Window is a technique for processing contiguous subarrays or substrings. Instead of recalculating everything for each new window from scratch, you add new elements on one side and remove old elements on the other.",
    intuition: "Think of a train window. As the train moves, you see new scenery on the front and old scenery leaves from the back. You don't rebuild the entire view — you just update what changed. This is exactly what Sliding Window does with subarrays.",
    whenToUse: "Use Sliding Window when: you need the longest or shortest subarray/substring satisfying a condition, you need maximum/minimum sum of a subarray of size k, or any time the problem asks about contiguous elements.",
    recognitionSignals: "Look for: 'longest substring without repeating', 'maximum sum subarray of size k', 'minimum window substring', 'find all anagrams in string'. Keywords: subarray, substring, contiguous, window.",
    commonMistakes: "1. Not knowing when to shrink the window vs when to expand. 2. Forgetting to update the window state when shrinking. 3. Using fixed vs variable window when the problem needs the opposite. 4. Not handling the empty window edge case.",
    difficultyLevel: "Beginner",
    orderIndex: 3,
    prerequisites: '["arrays-hashing", "two-pointers"]',
  },
  {
    name: "Stack",
    slug: "stack",
    description: "Use the Last-In-First-Out (LIFO) structure to solve problems involving nested or sequential dependencies.",
    overview: "A stack is a LIFO data structure. The last element pushed is the first one popped. Stacks are perfect for tracking state that needs to be undone, matching brackets, evaluating expressions, and solving problems where you need to remember previous context.",
    intuition: "Think of a stack of plates. You can only add or remove from the top. This LIFO property is powerful when you need to remember 'what came before' — like matching opening brackets with closing ones, or tracking the previous element in a traversal.",
    whenToUse: "Use a Stack when: matching parentheses or brackets, evaluating expressions, implementing undo operations, finding next greater element, or any problem where you process things in reverse order.",
    recognitionSignals: "Look for: balanced parentheses, evaluate expressions, undo/redo, next greater element, daily temperatures, largest rectangle in histogram. Pattern: process and remember previous context.",
    commonMistakes: "1. Popping from an empty stack without checking. 2. Using a stack when a queue (FIFO) is needed. 3. Forgetting to clear the stack between test cases. 4. Not processing remaining elements after the main loop ends.",
    difficultyLevel: "Beginner",
    orderIndex: 4,
    prerequisites: '["arrays-hashing"]',
  },
  {
    name: "Binary Search",
    slug: "binary-search",
    description: "Efficiently search a sorted space by halving the search range with each step.",
    overview: "Binary Search eliminates half the search space with each comparison, reducing O(n) linear scans to O(log n). It is not just for searching in arrays — it applies to any monotonic (always increasing or decreasing) search space.",
    intuition: "If you know an array is sorted, you can check the middle element. If the target is smaller, throw away the right half. If larger, throw away the left half. Repeat until found. Each step cuts the problem in half.",
    whenToUse: "Use Binary Search when: the array or search space is sorted, you need to find a boundary (first true, last false), you are searching in a range of values (not just indices), or the problem says O(log n) is required.",
    recognitionSignals: "Look for: sorted array, 'find minimum/maximum', rotated sorted array, search for a condition boundary, 'minimum number of days to do X', any problem where brute force is O(n) and O(log n) is possible.",
    commonMistakes: "1. Incorrect mid calculation causing integer overflow (use left + (right-left)/2). 2. Off-by-one errors in while condition (< vs <=). 3. Not updating left or right correctly causing infinite loops. 4. Applying to unsorted data.",
    difficultyLevel: "Easy",
    orderIndex: 5,
    prerequisites: '["arrays-hashing"]',
  },
  {
    name: "Linked List",
    slug: "linked-list",
    description: "Navigate and manipulate node-based linear data structures using pointer techniques.",
    overview: "A linked list is a sequence of nodes where each node holds a value and a pointer to the next node. Unlike arrays, elements are not stored contiguously, so random access is O(n). But insertion and deletion are O(1) if you have a pointer to the position.",
    intuition: "Think of a chain. Each link only knows about the next link. To traverse, you follow links one by one. To insert, you reroute two pointers. The danger is losing your reference — always save pointers before overwriting them.",
    whenToUse: "Use Linked List techniques when: reversing a list, detecting a cycle (Floyd's algorithm), finding the middle, merging sorted lists, or when the problem explicitly uses a linked list data structure.",
    recognitionSignals: "Look for: reverse list, detect cycle, find middle, merge k sorted lists, remove nth node, copy list with random pointer. Fast and slow pointer pattern is very common.",
    commonMistakes: "1. Losing a node reference before saving it. 2. Not handling null pointer at the end. 3. Off-by-one in the number of steps. 4. Not considering the edge case of single-node or empty list.",
    difficultyLevel: "Easy",
    orderIndex: 6,
    prerequisites: '["arrays-hashing", "two-pointers"]',
  },
  {
    name: "Trees",
    slug: "trees",
    description: "Traverse and manipulate hierarchical tree structures using recursive and iterative techniques.",
    overview: "Trees are hierarchical data structures. Binary trees have at most two children per node. Most tree problems involve some form of traversal (DFS or BFS) and recursive thinking. The recursive structure of trees mirrors the recursive nature of many solutions.",
    intuition: "Think recursively. A tree is a node with a left subtree and a right subtree. Many tree problems break down to: what do I do at this node? What do I get back from left? What do I get back from right? Combine and return.",
    whenToUse: "Use tree techniques when: traversing hierarchical data, searching in BSTs, computing heights or depths, checking symmetry or validity, finding paths, or any problem with a tree structure.",
    recognitionSignals: "Look for: binary tree, BST, level order traversal, max depth, path sum, lowest common ancestor, serialize/deserialize. Key patterns: DFS (recursive), BFS (queue), and BST properties.",
    commonMistakes: "1. Not handling null nodes in recursive calls. 2. Confusing inorder/preorder/postorder. 3. Not using the BST property (left < root < right) when applicable. 4. Using DFS when BFS is needed (level-order problems).",
    difficultyLevel: "Easy",
    orderIndex: 7,
    prerequisites: '["arrays-hashing", "stack"]',
  },
  {
    name: "Backtracking",
    slug: "backtracking",
    description: "Explore all possible solutions by building candidates incrementally and abandoning invalid paths.",
    overview: "Backtracking is a systematic way to explore all possible solutions by building candidates step by step and abandoning (backtracking from) a path as soon as it is determined that the path cannot lead to a valid solution.",
    intuition: "Think of a maze. You try a path. If you hit a dead end, you backtrack to the last decision point and try a different direction. Backtracking does this programmatically — building partial solutions and undoing them when they fail.",
    whenToUse: "Use Backtracking when: generating all permutations or combinations, solving constraint satisfaction problems (Sudoku, N-Queens), finding all paths, or any problem asking for 'all possible' results.",
    recognitionSignals: "Look for: generate all subsets/permutations/combinations, solve Sudoku, N-Queens, word search in a grid, any problem where you need to explore all possibilities.",
    commonMistakes: "1. Not undoing state changes when backtracking. 2. Missing the base case that stops recursion. 3. Generating duplicates in combination problems (not skipping same-value siblings). 4. Incorrect pruning that eliminates valid solutions.",
    difficultyLevel: "Medium",
    orderIndex: 8,
    prerequisites: '["arrays-hashing", "trees"]',
  },
  {
    name: "Heap / Priority Queue",
    slug: "heap-priority-queue",
    description: "Efficiently maintain and extract minimum or maximum elements using a heap.",
    overview: "A heap (priority queue) is a tree-based data structure that always keeps the minimum (min-heap) or maximum (max-heap) element at the root. This gives O(log n) insertion and O(log n) extraction, much better than sorting for streaming problems.",
    intuition: "Think of a to-do list always sorted by priority. You always work on the highest priority item. When you add new items, they automatically get placed correctly. This is exactly how a heap works — it maintains order efficiently without full sorting.",
    whenToUse: "Use a Heap when: finding the k largest/smallest elements, median of a stream, scheduling problems, merge k sorted lists, or any problem where you repeatedly need the min/max from a changing collection.",
    recognitionSignals: "Look for: k largest, k smallest, median of stream, top k frequent, merge k lists, task scheduler. Keywords: 'k', 'top', 'minimum', 'maximum', 'priority'.",
    commonMistakes: "1. Using a max-heap when a min-heap is needed. 2. Not negating values when simulating a max-heap in Python (which only has min-heap). 3. Heap size management (keeping only k elements). 4. Forgetting that heap peek is O(1) but extraction is O(log n).",
    difficultyLevel: "Medium",
    orderIndex: 9,
    prerequisites: '["arrays-hashing", "trees"]',
  },
  {
    name: "Graphs",
    slug: "graphs",
    description: "Traverse and analyze graph structures using BFS, DFS, and specialized graph algorithms.",
    overview: "Graphs represent connections between entities. Unlike trees, graphs can have cycles and multiple paths between nodes. BFS explores level by level, DFS explores as far as possible first. Both have key applications in interview problems.",
    intuition: "Think of cities connected by roads. BFS finds the shortest path (fewest roads). DFS finds if a path exists or explores all paths. The visited set prevents revisiting — without it, you would loop forever in a cyclic graph.",
    whenToUse: "Use graph techniques when: finding shortest paths, detecting cycles, counting connected components, island problems (grid = graph), topological sorting, or any problem with connections/relationships between entities.",
    recognitionSignals: "Look for: number of islands, shortest path, connected components, course schedule (dependencies), clone graph, Pacific Atlantic water flow. Grid problems are often graph problems in disguise.",
    commonMistakes: "1. Forgetting the visited set and getting infinite loops. 2. Using BFS for depth-first problems or DFS for shortest-path problems. 3. Not handling disconnected graphs. 4. Off-by-one in grid boundary checks.",
    difficultyLevel: "Medium",
    orderIndex: 10,
    prerequisites: '["arrays-hashing", "trees", "stack"]',
  },
  {
    name: "Dynamic Programming",
    slug: "dynamic-programming",
    description: "Solve complex problems by breaking them into overlapping subproblems and storing results.",
    overview: "Dynamic Programming (DP) solves problems by breaking them into smaller overlapping subproblems and storing results to avoid recomputation. It applies when a problem has optimal substructure (optimal solution built from optimal subsolutions) and overlapping subproblems.",
    intuition: "Think of climbing stairs. To reach step 10, you came from step 9 or step 8. To reach step 9, you came from step 8 or 7, and so on. Instead of recomputing step 8's answer multiple times, store it once. This is memoization — the heart of DP.",
    whenToUse: "Use DP when: the problem asks for optimal value (min/max), counting ways to do something, and the naive recursive solution has overlapping subproblems. Classic signs: Fibonacci-like recursion, knapsack variants, string matching.",
    recognitionSignals: "Look for: minimum cost, maximum profit, number of ways, can you achieve X, longest common subsequence, coin change, edit distance, partition problems. If backtracking is too slow, DP might be the answer.",
    commonMistakes: "1. Not identifying the correct state definition. 2. Wrong recurrence relation. 3. Not initializing base cases correctly. 4. Confusing top-down (memoization) with bottom-up (tabulation). 5. Wrong iteration order in 2D DP.",
    difficultyLevel: "Hard",
    orderIndex: 11,
    prerequisites: '["arrays-hashing", "backtracking", "trees"]',
  },
];

const quizData: Record<string, Array<{
  questionType: string;
  prompt: string;
  explanation: string;
  difficultyLevel: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  fillGapAnswer?: string;
}>> = {
  "arrays-hashing": [
    {
      questionType: "MultipleChoice",
      prompt: "What is the time complexity of looking up a value in a hash map?",
      explanation: "Hash maps provide O(1) average-case lookup because the hash function maps keys directly to memory locations. In the worst case (many collisions), it can be O(n), but average case is O(1).",
      difficultyLevel: "Beginner",
      options: [
        { text: "O(1) average case", isCorrect: true },
        { text: "O(log n)", isCorrect: false },
        { text: "O(n)", isCorrect: false },
        { text: "O(n²)", isCorrect: false },
      ],
    },
    {
      questionType: "TrueFalse",
      prompt: "A hash set can store duplicate values.",
      explanation: "False. A hash set only stores unique values. If you try to add a duplicate, it will not be stored again. Use a list if you need duplicates.",
      difficultyLevel: "Beginner",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
    },
    {
      questionType: "MultipleChoice",
      prompt: "In the Two Sum problem, what data structure gives you the most efficient solution?",
      explanation: "A hash map lets you store each number and its index. For each number x, check if (target - x) already exists in the map. This gives O(n) time vs O(n²) for brute force.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Hash Map", isCorrect: true },
        { text: "Sorted Array", isCorrect: false },
        { text: "Stack", isCorrect: false },
        { text: "Queue", isCorrect: false },
      ],
    },
    {
      questionType: "FillInTheGap",
      prompt: "To find duplicates in an array in O(n) time, you should use a ___.",
      explanation: "A hash set lets you check membership in O(1). As you iterate, if the element is already in the set, it's a duplicate. Otherwise, add it to the set.",
      difficultyLevel: "Beginner",
      fillGapAnswer: "hash set",
    },
    {
      questionType: "ConceptCheck",
      prompt: "Why does using a hash map turn the Two Sum problem from O(n²) to O(n)?",
      explanation: "With brute force, you check every pair: two nested loops = O(n²). With a hash map, for each element you check once if its complement exists in the map (O(1) lookup). One pass through the array = O(n) total.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Because hash maps sort the array automatically", isCorrect: false },
        { text: "Because we replace the inner loop with an O(1) hash map lookup", isCorrect: true },
        { text: "Because hash maps use binary search internally", isCorrect: false },
        { text: "Because we skip duplicate elements", isCorrect: false },
      ],
    },
  ],
  "two-pointers": [
    {
      questionType: "MultipleChoice",
      prompt: "What is the FIRST thing you should usually do before applying the Two Pointers technique to find a pair with target sum?",
      explanation: "Two Pointers for pair sum requires the array to be sorted. When the sum is too small, move the left pointer right to increase it. When too large, move right pointer left to decrease it.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Sort the array", isCorrect: true },
        { text: "Create a hash map", isCorrect: false },
        { text: "Reverse the array", isCorrect: false },
        { text: "Find the median", isCorrect: false },
      ],
    },
    {
      questionType: "TrueFalse",
      prompt: "Two Pointers always requires both pointers to start at opposite ends of the array.",
      explanation: "False. Two Pointers has two main variants: (1) opposite ends — pointers start at left and right and move toward each other, and (2) same direction — both pointers start at the left and move right at different speeds (fast/slow pointers).",
      difficultyLevel: "Beginner",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
    },
    {
      questionType: "FillInTheGap",
      prompt: "In Two Pointers for palindrome check, if characters at left and right do not match, the string is NOT a ___.",
      explanation: "A palindrome reads the same forward and backward. We check pairs from outside in. If any pair doesn't match, it's not a palindrome.",
      difficultyLevel: "Beginner",
      fillGapAnswer: "palindrome",
    },
    {
      questionType: "MultipleChoice",
      prompt: "You have a sorted array [-2, 0, 1, 3] and target 1. What is the correct first move with left=0, right=3?",
      explanation: "left=0 (-2), right=3 (3). Sum = -2+3 = 1. That equals the target! We found our answer. If sum > target, we'd move right pointer left. If sum < target, we'd move left pointer right.",
      difficultyLevel: "Easy",
      options: [
        { text: "Sum = 1, pair found at [-2, 3]", isCorrect: true },
        { text: "Move left pointer right because sum is too small", isCorrect: false },
        { text: "Move right pointer left because sum is too large", isCorrect: false },
        { text: "Sort the array again", isCorrect: false },
      ],
    },
  ],
  "sliding-window": [
    {
      questionType: "MultipleChoice",
      prompt: "Which of these problems is BEST solved with a Sliding Window?",
      explanation: "Longest substring without repeating characters asks for a contiguous subarray/string with a property — this is the perfect use case for sliding window. The window expands when valid and shrinks when a duplicate is found.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Longest substring without repeating characters", isCorrect: true },
        { text: "Find if two numbers sum to target in unsorted array", isCorrect: false },
        { text: "Find the median of a sorted array", isCorrect: false },
        { text: "Count number of BST nodes", isCorrect: false },
      ],
    },
    {
      questionType: "TrueFalse",
      prompt: "In a fixed-size sliding window, the window always stays exactly k elements wide.",
      explanation: "True. In fixed-size sliding window, you slide a window of exactly k elements. You add the new right element and remove the leftmost element. Variable-size windows shrink or grow based on a condition.",
      difficultyLevel: "Beginner",
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ],
    },
    {
      questionType: "FillInTheGap",
      prompt: "In a sliding window with a hash map to track character counts, when a character count exceeds 1, you must ___ the window from the left.",
      explanation: "When a duplicate is found (count > 1), we shrink the window from the left by moving the left pointer right and decrementing the count for the removed character.",
      difficultyLevel: "Beginner",
      fillGapAnswer: "shrink",
    },
    {
      questionType: "MultipleChoice",
      prompt: "What is the time complexity of a well-implemented sliding window algorithm?",
      explanation: "Each element is added to and removed from the window at most once. This means the total operations are proportional to n (the array size), making it O(n).",
      difficultyLevel: "Beginner",
      options: [
        { text: "O(n)", isCorrect: true },
        { text: "O(n²)", isCorrect: false },
        { text: "O(n log n)", isCorrect: false },
        { text: "O(k) where k is window size", isCorrect: false },
      ],
    },
  ],
  "binary-search": [
    {
      questionType: "MultipleChoice",
      prompt: "What is the time complexity of Binary Search?",
      explanation: "Binary Search divides the search space in half with each step. Starting from n elements: n → n/2 → n/4 → ... → 1. This takes log₂(n) steps, so O(log n).",
      difficultyLevel: "Beginner",
      options: [
        { text: "O(log n)", isCorrect: true },
        { text: "O(n)", isCorrect: false },
        { text: "O(n log n)", isCorrect: false },
        { text: "O(1)", isCorrect: false },
      ],
    },
    {
      questionType: "FillInTheGap",
      prompt: "To avoid integer overflow in calculating mid, use: mid = left + ___ instead of (left + right) / 2.",
      explanation: "(left + right) can overflow if both are large integers. The safe formula is left + (right - left) / 2, which gives the same result without overflow.",
      difficultyLevel: "Easy",
      fillGapAnswer: "(right - left) / 2",
    },
    {
      questionType: "TrueFalse",
      prompt: "Binary Search can only be applied to arrays, not to ranges of values.",
      explanation: "False. Binary Search applies to any monotonic search space. For example, finding the minimum speed to ship packages in d days — you binary search on possible speeds (1 to max weight), not array indices.",
      difficultyLevel: "Easy",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
    },
    {
      questionType: "MultipleChoice",
      prompt: "In Binary Search, after comparing mid with target, if target > arr[mid], what do you do?",
      explanation: "If the target is greater than the mid element, the target must be in the right half. We set left = mid + 1 to eliminate the left half from consideration.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Set left = mid + 1", isCorrect: true },
        { text: "Set right = mid - 1", isCorrect: false },
        { text: "Set mid = (left + right) / 2 again", isCorrect: false },
        { text: "Return -1", isCorrect: false },
      ],
    },
  ],
  "stack": [
    {
      questionType: "MultipleChoice",
      prompt: "What does LIFO stand for and why does it matter for stacks?",
      explanation: "LIFO stands for Last-In-First-Out. The last element pushed onto the stack is the first one popped. This mirrors natural 'undo' behavior and bracket matching — the most recent open bracket must be closed first.",
      difficultyLevel: "Beginner",
      options: [
        { text: "Last-In-First-Out: last pushed is first popped", isCorrect: true },
        { text: "Last-In-First-Out: first pushed is first popped", isCorrect: false },
        { text: "Least-Important-First-Out: priority-based removal", isCorrect: false },
        { text: "Linear-Insert-First-Out: sequential insertion", isCorrect: false },
      ],
    },
    {
      questionType: "TrueFalse",
      prompt: "For the balanced parentheses problem, you push closing brackets onto the stack.",
      explanation: "False. You push opening brackets. When you see a closing bracket, you check if the top of the stack is the matching opening bracket. If it is, pop it. If not, the parentheses are unbalanced.",
      difficultyLevel: "Beginner",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
    },
    {
      questionType: "FillInTheGap",
      prompt: "Before popping from a stack, always check that the stack is not ___.",
      explanation: "Popping from an empty stack causes an error (stack underflow). Always check if the stack is empty before popping.",
      difficultyLevel: "Beginner",
      fillGapAnswer: "empty",
    },
  ],
};

const problemsData: Record<string, Array<{
  title: string;
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
}>> = {
  "arrays-hashing": [
    {
      title: "Two Sum",
      source: "LeetCode",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.",
      learningObjective: "Practice using a hash map to avoid the O(n²) brute force solution. Recognize the complement pattern.",
      hintLevelOne: "Think about what you need to find for each number. For a number x, you need to find (target - x) somewhere in the array.",
      hintLevelTwo: "As you iterate through the array, store each number in a hash map with its index. Before storing, check if the complement already exists.",
      hintLevelThree: "For each nums[i], calculate complement = target - nums[i]. Check if complement is in your hash map. If yes, return [map[complement], i]. If no, add nums[i] → i to the map.",
      hintLevelFour: "hashmap = {}\nfor i, num in enumerate(nums):\n    complement = target - num\n    if complement in hashmap:\n        return [hashmap[complement], i]\n    hashmap[num] = i",
      finalExplanation: "We use one hash map pass. For each element, we check if its complement (target - element) has been seen before. If yes, we found our pair. If no, we store the current element. Time: O(n), Space: O(n).",
      companies: '["Amazon","Google","Meta","Microsoft"]',
      orderIndex: 1,
    },
    {
      title: "Valid Anagram",
      source: "LeetCode",
      url: "https://leetcode.com/problems/valid-anagram/",
      difficulty: "Easy",
      description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word formed by rearranging the letters of another word, using all original letters exactly once.",
      learningObjective: "Practice character frequency counting using hash maps. Understand how frequency maps can compare strings.",
      hintLevelOne: "Two strings are anagrams if they have the same characters with the same frequencies. How can you count character frequencies?",
      hintLevelTwo: "Count how many times each character appears in both strings using two hash maps (or dictionaries). Then compare the two maps.",
      hintLevelThree: "Create a frequency map for s and a frequency map for t. Return True if both maps are equal. Or use a single map: increment for s, decrement for t, then check all values are 0.",
      hintLevelFour: "count = {}\nfor c in s: count[c] = count.get(c, 0) + 1\nfor c in t: count[c] = count.get(c, 0) - 1\nreturn all(v == 0 for v in count.values())",
      finalExplanation: "Count character frequencies in s (increment) and t (decrement) using one map. If all frequencies are 0, both strings have identical character counts. Time: O(n), Space: O(1) since only 26 lowercase letters.",
      companies: '["Amazon","Google"]',
      orderIndex: 2,
    },
    {
      title: "Contains Duplicate",
      source: "LeetCode",
      url: "https://leetcode.com/problems/contains-duplicate/",
      difficulty: "Easy",
      description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
      learningObjective: "Learn to use a hash set for O(n) duplicate detection instead of O(n²) nested loops.",
      hintLevelOne: "You need to check if any number appears more than once. What data structure lets you check membership in O(1)?",
      hintLevelTwo: "Use a hash set. As you iterate, check if the current number is already in the set before adding it.",
      hintLevelThree: "seen = set(). For each num in nums: if num in seen, return True. Else, add num to seen. Return False after the loop.",
      hintLevelFour: "seen = set()\nfor num in nums:\n    if num in seen:\n        return True\n    seen.add(num)\nreturn False",
      finalExplanation: "We use a set for O(1) lookups. For each element, if it's already in the set, we found a duplicate. Otherwise, add it. Time: O(n), Space: O(n). Note: sorting first (O(n log n)) would let you compare adjacent elements with O(1) space.",
      companies: '["Amazon","Apple","Netflix"]',
      orderIndex: 3,
    },
  ],
  "two-pointers": [
    {
      title: "Valid Palindrome",
      source: "LeetCode",
      url: "https://leetcode.com/problems/valid-palindrome/",
      difficulty: "Easy",
      description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
      learningObjective: "Apply the classic Two Pointers palindrome pattern. Practice pointer movement and character comparison.",
      hintLevelOne: "A palindrome reads the same forward and backward. Start with two pointers: one at the start, one at the end. Move them toward each other, skipping non-alphanumeric characters.",
      hintLevelTwo: "Use left = 0, right = len(s)-1. While left < right: skip non-alphanumeric chars. Compare s[left].lower() == s[right].lower(). If not equal, return False. Else, move both inward.",
      hintLevelThree: "while left < right:\n    while left < right and not s[left].isalnum(): left += 1\n    while left < right and not s[right].isalnum(): right -= 1\n    if s[left].lower() != s[right].lower(): return False\n    left += 1; right -= 1\nreturn True",
      hintLevelFour: "Key insight: handle the skip-non-alphanumeric with inner while loops. The outer while continues as long as pointers haven't crossed. Compare lowercase versions of valid characters.",
      finalExplanation: "Two pointers move inward from both ends. We skip non-alphanumeric characters with inner loops. We compare case-insensitively. If any pair doesn't match, it's not a palindrome. Time: O(n), Space: O(1).",
      companies: '["Meta","Microsoft","Apple"]',
      orderIndex: 1,
    },
    {
      title: "Two Sum II - Input Array Is Sorted",
      source: "LeetCode",
      url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      difficulty: "Easy",
      description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target. Return indices in 1-indexed format. Use only constant extra space.",
      learningObjective: "Apply Two Pointers to a sorted array. Understand when to move left vs right pointer based on the current sum.",
      hintLevelOne: "Since the array is sorted, use left pointer at start and right pointer at end. The current sum tells you which pointer to move.",
      hintLevelTwo: "If sum < target: we need a larger sum, so move left pointer right (to a larger number). If sum > target: move right pointer left (to a smaller number). If equal: return the indices.",
      hintLevelThree: "left, right = 0, len(numbers)-1\nwhile left < right:\n    s = numbers[left] + numbers[right]\n    if s == target: return [left+1, right+1]\n    elif s < target: left += 1\n    else: right -= 1",
      hintLevelFour: "The sorted property guarantees: moving left pointer right increases the sum, moving right pointer left decreases it. We always converge toward the target. No hash map needed — O(1) space.",
      finalExplanation: "Two Pointers on a sorted array. We binary-search-like narrow our range: sum too small → left++, sum too large → right--. Guaranteed to find the answer. Time: O(n), Space: O(1).",
      companies: '["Amazon"]',
      orderIndex: 2,
    },
  ],
  "sliding-window": [
    {
      title: "Best Time to Buy and Sell Stock",
      source: "LeetCode",
      url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      difficulty: "Easy",
      description: "You are given an array prices where prices[i] is the price of a stock on the ith day. You want to maximize your profit by choosing a single day to buy and sell on a future day. Return the maximum profit, or 0 if no profit is possible.",
      learningObjective: "Apply the sliding window / two-pointer variant to track minimum price seen so far and maximum profit.",
      hintLevelOne: "You need to find the pair (buy_day, sell_day) where buy_day < sell_day and prices[sell_day] - prices[buy_day] is maximum. What if you track the minimum price seen so far?",
      hintLevelTwo: "Use two variables: min_price (minimum seen so far) and max_profit. For each price: update min_price if current is lower, then compute profit = current_price - min_price and update max_profit.",
      hintLevelThree: "min_price = float('inf'), max_profit = 0\nfor price in prices:\n    min_price = min(min_price, price)\n    profit = price - min_price\n    max_profit = max(max_profit, profit)",
      hintLevelFour: "This is like a sliding window where left is the minimum-price day and right scans forward. When we find a price lower than our left, we 'slide' left forward to the new minimum.",
      finalExplanation: "Track minimum price seen so far. For each price, compute potential profit (price - min_price). Keep the maximum profit seen. The key insight: sell price must come AFTER buy price, so left pointer never goes backwards. Time: O(n), Space: O(1).",
      companies: '["Amazon","Bloomberg","Goldman Sachs"]',
      orderIndex: 1,
    },
    {
      title: "Longest Substring Without Repeating Characters",
      source: "LeetCode",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      difficulty: "Medium",
      description: "Given a string s, find the length of the longest substring without repeating characters.",
      learningObjective: "Master the variable-size sliding window with a hash set. Learn when to expand and when to shrink the window.",
      hintLevelOne: "You need the longest window where all characters are unique. Use two pointers for the window boundaries and a set to track current characters.",
      hintLevelTwo: "Expand right pointer one step at a time. If the new character is not in the set, add it and update max_length. If it IS in the set, shrink from the left by removing s[left] from the set and moving left forward — repeat until the duplicate is removed.",
      hintLevelThree: "left = 0, char_set = set(), max_len = 0\nfor right in range(len(s)):\n    while s[right] in char_set:\n        char_set.remove(s[left])\n        left += 1\n    char_set.add(s[right])\n    max_len = max(max_len, right - left + 1)",
      hintLevelFour: "The window [left, right] always contains unique characters. When right finds a duplicate, we shrink from left until the duplicate is gone. Window size = right - left + 1.",
      finalExplanation: "Variable-size sliding window. Expand right until duplicate found, then shrink left until no duplicate. Each character enters and leaves the window at most once. Time: O(n), Space: O(min(n, alphabet_size)).",
      companies: '["Amazon","Google","Meta","Bloomberg"]',
      orderIndex: 2,
    },
  ],
  "binary-search": [
    {
      title: "Binary Search",
      source: "LeetCode",
      url: "https://leetcode.com/problems/binary-search/",
      difficulty: "Easy",
      description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1. Must be O(log n).",
      learningObjective: "Implement the fundamental binary search template. Get comfortable with the left, right, mid pattern and the while loop condition.",
      hintLevelOne: "Set left = 0, right = len(nums) - 1. Calculate the middle index. If nums[mid] == target, return mid. If target is in the right half, move left. If in left half, move right.",
      hintLevelTwo: "Use while left <= right. Calculate mid = left + (right - left) // 2. If nums[mid] == target: return mid. If nums[mid] < target: left = mid + 1. Else: right = mid - 1.",
      hintLevelThree: "left, right = 0, len(nums) - 1\nwhile left <= right:\n    mid = left + (right - left) // 2\n    if nums[mid] == target: return mid\n    elif nums[mid] < target: left = mid + 1\n    else: right = mid - 1\nreturn -1",
      hintLevelFour: "Why left <= right? We need to check when left == right (one element left). Why mid = left + (right-left)//2? Prevents integer overflow. Why left = mid+1 (not mid)? To avoid infinite loops.",
      finalExplanation: "Classic binary search template. The key invariants: the target (if it exists) is always within [left, right]. We eliminate the half that can't contain the target. Time: O(log n), Space: O(1).",
      companies: '["Google","Meta","Amazon"]',
      orderIndex: 1,
    },
    {
      title: "Search a 2D Matrix",
      source: "LeetCode",
      url: "https://leetcode.com/problems/search-a-2d-matrix/",
      difficulty: "Medium",
      description: "You are given an m x n integer matrix where each row is sorted left to right and the first integer of each row is greater than the last integer of the previous row. Search for target in O(log(m*n)).",
      learningObjective: "Extend binary search to 2D by treating the matrix as a flattened sorted array. Practice index conversion.",
      hintLevelOne: "The matrix is essentially a sorted 1D array laid out in 2D. If you flatten it, you get a sorted array of m*n elements. Can you binary search on the indices 0 to m*n-1?",
      hintLevelTwo: "Use left = 0, right = m*n - 1. For mid index, convert to row = mid // n, col = mid % n. This gives you matrix[row][col] to compare with target.",
      hintLevelThree: "m, n = len(matrix), len(matrix[0])\nleft, right = 0, m*n - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    val = matrix[mid // n][mid % n]\n    if val == target: return True\n    elif val < target: left = mid + 1\n    else: right = mid - 1",
      hintLevelFour: "Key insight: the 2D → 1D index conversion. For a matrix with n columns: row = index // n, col = index % n. This treats the 2D matrix as a flat array for binary search purposes.",
      finalExplanation: "Treat the sorted matrix as a 1D array. Binary search on indices 0 to m*n-1. Convert mid → (row, col) using integer division and modulo. Time: O(log(m*n)), Space: O(1).",
      companies: '["Google","Microsoft"]',
      orderIndex: 2,
    },
  ],
  "stack": [
    {
      title: "Valid Parentheses",
      source: "LeetCode",
      url: "https://leetcode.com/problems/valid-parentheses/",
      difficulty: "Easy",
      description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Valid means open brackets must be closed by the same type of brackets in the correct order.",
      learningObjective: "Apply the classic stack matching pattern. Understand why LIFO is the right structure for bracket matching.",
      hintLevelOne: "When you see an opening bracket, you need to remember it. When you see a closing bracket, the most recent opening bracket must match it. What data structure gives you the most recent item?",
      hintLevelTwo: "Use a stack. Push opening brackets. When you see a closing bracket, check if the stack's top is the matching opening bracket. If not (or stack is empty), it's invalid.",
      hintLevelThree: "stack = []\npairs = {')': '(', ']': '[', '}': '{'}\nfor c in s:\n    if c in '([{': stack.append(c)\n    else:\n        if not stack or stack[-1] != pairs[c]: return False\n        stack.pop()\nreturn len(stack) == 0",
      hintLevelFour: "Don't forget to check len(stack) == 0 at the end! '((((' has all valid push operations but is invalid because the stack isn't empty — unclosed brackets remain.",
      finalExplanation: "Push opening brackets, match closing brackets against stack top. The stack LIFO property ensures most-recently-opened is checked first. Final stack must be empty (no unclosed brackets). Time: O(n), Space: O(n).",
      companies: '["Google","Meta","Amazon","Bloomberg"]',
      orderIndex: 1,
    },
  ],
};

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.reviewLog.deleteMany();
  await prisma.problemAttempt.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.fillGapAnswer.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.practiceProblem.deleteMany();
  await prisma.lessonContent.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.module.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.leetCodeProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Create demo user ────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.create({
    data: {
      email: "abdurasul@demo.com",
      name: "Abdurasul",
      password: hashedPassword,
      experienceLevel: "Intermediate",
      goal: "Get a job at a top tech company",
      targetCompanies: '["Google","Meta","Amazon"]',
      leetcodeUsername: "Mq5Vg47Ocy",
    },
  });
  console.log(`Created demo user: ${demoUser.email}`);

  // ── Create LeetCodeProfile ──────────────────────────────────────────────────
  await prisma.leetCodeProfile.create({
    data: {
      userId: demoUser.id,
      username: "Mq5Vg47Ocy",
      totalSolved: 93,
      easySolved: 31,
      mediumSolved: 51,
      hardSolved: 11,
      ranking: 715113,
      contestRating: 1412,
    },
  });
  console.log("Created LeetCodeProfile");

  // ── Seed modules ────────────────────────────────────────────────────────────
  // Module progress config for demo user
  const progressConfig: Record<string, {
    theoryCompleted: boolean;
    quizScore: number;
    practiceScore: number;
    masteryScore: number;
    confidenceAverage: number;
    hintDependencyScore: number;
    status: string;
  }> = {
    "arrays-hashing": {
      theoryCompleted: true,
      quizScore: 68,
      practiceScore: 60,
      masteryScore: 65,
      confidenceAverage: 62,
      hintDependencyScore: 40,
      status: "InProgress",
    },
    "two-pointers": {
      theoryCompleted: true,
      quizScore: 50,
      practiceScore: 45,
      masteryScore: 48,
      confidenceAverage: 45,
      hintDependencyScore: 65,
      status: "InProgress",
    },
    "sliding-window": {
      theoryCompleted: false,
      quizScore: 15,
      practiceScore: 10,
      masteryScore: 15,
      confidenceAverage: 20,
      hintDependencyScore: 80,
      status: "InProgress",
    },
  };

  let arraysHashingModuleId = "";

  for (const mod of modules) {
    const created = await prisma.module.create({ data: mod });
    console.log(`Created module: ${created.name}`);

    if (mod.slug === "arrays-hashing") {
      arraysHashingModuleId = created.id;
    }

    // Seed quiz questions for this module
    const questions = quizData[mod.slug];
    if (questions) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const createdQ = await prisma.quizQuestion.create({
          data: {
            moduleId: created.id,
            questionType: q.questionType,
            prompt: q.prompt,
            explanation: q.explanation,
            difficultyLevel: q.difficultyLevel,
            orderIndex: i,
          },
        });

        if (q.options) {
          for (const opt of q.options) {
            await prisma.quizOption.create({
              data: {
                quizQuestionId: createdQ.id,
                text: opt.text,
                isCorrect: opt.isCorrect,
              },
            });
          }
        }

        if (q.fillGapAnswer) {
          await prisma.fillGapAnswer.create({
            data: {
              quizQuestionId: createdQ.id,
              correctAnswer: q.fillGapAnswer,
            },
          });
        }
      }
    }

    // Seed practice problems for this module
    const problems = problemsData[mod.slug];
    let firstProblemId: string | null = null;
    if (problems) {
      for (const prob of problems) {
        const createdProb = await prisma.practiceProblem.create({
          data: { ...prob, moduleId: created.id },
        });
        if (prob.orderIndex === 1 && mod.slug === "arrays-hashing") {
          firstProblemId = createdProb.id;
        }
      }
    }

    // Seed ModuleProgress for demo user
    const progConf = progressConfig[mod.slug];
    if (progConf) {
      await prisma.moduleProgress.create({
        data: {
          userId: demoUser.id,
          moduleId: created.id,
          theoryCompleted: progConf.theoryCompleted,
          quizScore: progConf.quizScore,
          practiceScore: progConf.practiceScore,
          masteryScore: progConf.masteryScore,
          confidenceAverage: progConf.confidenceAverage,
          hintDependencyScore: progConf.hintDependencyScore,
          status: progConf.status,
          reviewDueDate: new Date(Date.now() + (mod.slug === "two-pointers" ? -1 : 5) * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await prisma.moduleProgress.create({
        data: {
          userId: demoUser.id,
          moduleId: created.id,
          status: "NotStarted",
        },
      });
    }

    // Seed ProblemAttempt for the first problem in arrays-hashing
    if (firstProblemId) {
      const attempt = await prisma.problemAttempt.create({
        data: {
          userId: demoUser.id,
          practiceProblemId: firstProblemId,
          status: "Solved",
          minutesSpent: 25,
          hintUsedLevel: 2,
          solvedIndependently: false,
          canExplainClearly: true,
          confidenceScore: 65,
          mistakeType: "PointerOrIndexIssue",
          keyInsight: "Use hash map for O(1) lookup",
          notes: "Needed hint 2 but understood after. Will review in 3 days.",
          revisitDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          lastReviewedAt: new Date(),
        },
      });

      await prisma.reviewLog.create({
        data: {
          problemAttemptId: attempt.id,
          previousConfidence: 30,
          newConfidence: 65,
          previousStatus: "InProgress",
          newStatus: "Solved",
          notes: "Made progress, needed hint 2. Understand pattern now.",
        },
      });
    }
  }

  // ── Seed QuizAttempts for demo user ─────────────────────────────────────────
  const allQuestions = await prisma.quizQuestion.findMany({ take: 10 });
  for (const q of allQuestions.slice(0, 6)) {
    await prisma.quizAttempt.create({
      data: {
        userId: demoUser.id,
        quizQuestionId: q.id,
        selectedAnswer: "some answer",
        isCorrect: Math.random() > 0.4,
        attemptMode: "Practice",
      },
    });
  }

  // ── Seed DailyActivity for last 7 days ──────────────────────────────────────
  for (let i = 6; i >= 0; i--) {
    await prisma.dailyActivity.create({
      data: {
        userId: demoUser.id,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        problemsSolved: i === 0 ? 2 : i % 2 === 0 ? 1 : 0,
        quizzesTaken: i % 3 === 0 ? 2 : 1,
        minutesSpent: 20 + (i % 3) * 10,
        modulesWorked: '["arrays-hashing"]',
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
