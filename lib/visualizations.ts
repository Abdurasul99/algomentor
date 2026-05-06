// ─── Types ────────────────────────────────────────────────────────────────────

export type CellColor =
  | "default"    // gray - untouched
  | "left"       // blue - left pointer
  | "right"      // orange - right pointer
  | "mid"        // purple - mid pointer
  | "window"     // green - inside window
  | "found"      // emerald - answer found
  | "eliminated" // slate/dim - eliminated from search
  | "current"    // yellow - currently processing
  | "duplicate"  // red - duplicate/conflict
  | "match";     // teal - matched pair

export interface ArrayState {
  values: (string | number)[];
  colors: CellColor[];
  labels?: string[];
}

export interface HashmapEntry {
  key: string;
  value: string | number;
  isNew?: boolean;
  isLookup?: boolean;
}

export interface StackState {
  items: (string | number)[];
  lastAction?: "push" | "pop";
}

export interface VisualStep {
  stepNumber: number;
  title: string;
  description: string;
  codeLineIndex: number;
  array?: ArrayState;
  hashmap?: HashmapEntry[];
  stack?: StackState;
  variables?: { name: string; value: string | number }[];
  result?: string;
  isEdgeCase?: boolean;
  edgeCaseNote?: string;
  linkedListNodes?: {
    values: (string | number)[];
    colors: CellColor[];
    labels?: string[];
    nullAtEnd?: boolean;
  };
  grid?: {
    cells: (string | number)[][];
    colors: CellColor[][];
  };
  dpTable?: {
    headers: (string | number)[];
    values: (string | number)[];
    colors: CellColor[];
    label?: string;
  };
}

export interface PatternVisualization {
  patternSlug: string;
  title: string;
  problemTitle: string;
  problemInput: string;
  templateCode: string[];
  steps: VisualStep[];
  edgeCases: {
    title: string;
    input: string;
    explanation: string;
    whatBreaks: string;
    howToHandle: string;
  }[];
  keyInsights: string[];
  commonMistakes: string[];
}

// ─── Pattern 1: Two Pointers ─────────────────────────────────────────────────

const twoPointers: PatternVisualization = {
  patternSlug: "two-pointers",
  title: "Two Pointers",
  problemTitle: "Valid Palindrome",
  problemInput: 's = "racecar"',
  templateCode: [
    "def isPalindrome(s):",
    "    left, right = 0, len(s) - 1",
    "    while left < right:",
    "        if s[left] != s[right]:",
    "            return False",
    "        left += 1",
    "        right -= 1",
    "    return True",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize pointers",
      description:
        'Set left = 0 pointing at the first character \'r\', and right = 6 pointing at the last character \'r\'. The two-pointer technique places one pointer at each end and moves them inward, comparing as we go.',
      codeLineIndex: 1,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["left", "default", "default", "default", "default", "default", "right"],
        labels: ["L", "", "", "", "", "", "R"],
      },
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 6 },
      ],
    },
    {
      stepNumber: 1,
      title: "Compare s[0] and s[6]",
      description:
        "s[left] = 'r' and s[right] = 'r'. They match! A palindrome requires all symmetric pairs to be equal. Since this pair matches, we can safely advance both pointers inward.",
      codeLineIndex: 3,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["match", "default", "default", "default", "default", "default", "match"],
        labels: ["L", "", "", "", "", "", "R"],
      },
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 6 },
        { name: "s[left]", value: "'r'" },
        { name: "s[right]", value: "'r'" },
      ],
    },
    {
      stepNumber: 2,
      title: "Advance pointers inward",
      description:
        "left += 1 → left = 1. right -= 1 → right = 5. Both pointers move toward the center. We repeat the loop since left (1) < right (5) is still true.",
      codeLineIndex: 5,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["eliminated", "left", "default", "default", "default", "right", "eliminated"],
        labels: ["", "L", "", "", "", "R", ""],
      },
      variables: [
        { name: "left", value: 1 },
        { name: "right", value: 5 },
      ],
    },
    {
      stepNumber: 3,
      title: "Compare s[1] and s[5]",
      description:
        "s[left] = 'a' and s[right] = 'a'. Another match! The second characters from each end are equal. Advance both pointers again.",
      codeLineIndex: 3,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["eliminated", "match", "default", "default", "default", "match", "eliminated"],
        labels: ["", "L", "", "", "", "R", ""],
      },
      variables: [
        { name: "left", value: 1 },
        { name: "right", value: 5 },
        { name: "s[left]", value: "'a'" },
        { name: "s[right]", value: "'a'" },
      ],
    },
    {
      stepNumber: 4,
      title: "Advance to positions 2 and 4",
      description:
        "left = 2, right = 4. Still left < right, so the while loop continues. We now compare the third character from each end.",
      codeLineIndex: 5,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["eliminated", "eliminated", "left", "default", "right", "eliminated", "eliminated"],
        labels: ["", "", "L", "", "R", "", ""],
      },
      variables: [
        { name: "left", value: 2 },
        { name: "right", value: 4 },
      ],
    },
    {
      stepNumber: 5,
      title: "Compare s[2] and s[4]",
      description:
        "s[left] = 'c' and s[right] = 'c'. Match again! All three outer pairs have matched. Advance both pointers one more time.",
      codeLineIndex: 3,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["eliminated", "eliminated", "match", "default", "match", "eliminated", "eliminated"],
        labels: ["", "", "L", "", "R", "", ""],
      },
      variables: [
        { name: "left", value: 2 },
        { name: "right", value: 4 },
        { name: "s[left]", value: "'c'" },
        { name: "s[right]", value: "'c'" },
      ],
    },
    {
      stepNumber: 6,
      title: "Pointers meet at center",
      description:
        "left = 3, right = 3. Now left >= right (3 >= 3), so the while loop condition `left < right` is FALSE. We exit the loop. The center character 'e' is the pivot and doesn't need a pair in an odd-length palindrome.",
      codeLineIndex: 2,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["eliminated", "eliminated", "eliminated", "current", "eliminated", "eliminated", "eliminated"],
        labels: ["", "", "", "L=R", "", "", ""],
      },
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 3 },
        { name: "left < right", value: "false" },
      ],
    },
    {
      stepNumber: 7,
      title: "Return True — it IS a palindrome",
      description:
        'All symmetric pairs matched and the loop completed without returning False. We reach `return True`. The string "racecar" reads the same forwards and backwards.',
      codeLineIndex: 7,
      array: {
        values: ["r", "a", "c", "e", "c", "a", "r"],
        colors: ["found", "found", "found", "found", "found", "found", "found"],
        labels: ["", "", "", "", "", "", ""],
      },
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 3 },
      ],
      result: 'Answer: True — "racecar" is a palindrome',
    },
    {
      stepNumber: 8,
      title: "Edge case: mismatch detected early",
      description:
        'For s = "ab": left=0 points at \'a\', right=1 points at \'b\'. s[0] != s[1], so we immediately return False. No need to check further — one mismatch proves it is NOT a palindrome.',
      codeLineIndex: 4,
      array: {
        values: ["a", "b"],
        colors: ["duplicate", "duplicate"],
        labels: ["L", "R"],
      },
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 1 },
        { name: "s[left]", value: "'a'" },
        { name: "s[right]", value: "'b'" },
      ],
      isEdgeCase: true,
      edgeCaseNote:
        'Input "ab": s[0]=\'a\' ≠ s[1]=\'b\' → return False immediately. One mismatch is enough.',
      result: 'Answer: False — "ab" is NOT a palindrome',
    },
  ],
  edgeCases: [
    {
      title: "Empty string",
      input: 's = ""',
      explanation: "An empty string has no characters to mismatch.",
      whatBreaks: "left=0, right=-1, so left < right is immediately false.",
      howToHandle: "The while loop never runs and we return True — correct by definition.",
    },
    {
      title: "Single character",
      input: 's = "a"',
      explanation: "A single character trivially reads the same forwards and backwards.",
      whatBreaks: "left=0, right=0, so left < right is false from the start.",
      howToHandle: "Return True immediately — the loop never executes.",
    },
    {
      title: "Non-alphanumeric characters",
      input: 's = "A man, a plan, a canal: Panama"',
      explanation: "Spaces, commas, and colons should be ignored for the palindrome check.",
      whatBreaks: "Naive comparison fails: ',' != 'a' even though the phrase is a palindrome.",
      howToHandle: "Pre-filter: s = s.lower(); s = ''.join(c for c in s if c.isalnum()). Then run two-pointer check.",
    },
    {
      title: "Case sensitivity",
      input: 's = "Aba"',
      explanation: "Uppercase 'A' and lowercase 'a' are the same letter but different ASCII codes.",
      whatBreaks: "Direct comparison 'A' != 'a' returns False even though it should be a palindrome.",
      howToHandle: "Normalize case first: s = s.lower() before comparing, or compare s[left].lower() == s[right].lower().",
    },
  ],
  keyInsights: [
    "Two pointers work best on sorted arrays or strings — they exploit the structure to skip unnecessary comparisons.",
    "This achieves O(n) time vs O(n²) brute force — the pointers never backtrack, each element is visited at most once.",
    "left and right always converge toward the center — the loop runs at most n/2 iterations.",
    "Early exit is key: return False the moment any mismatch is found — no need to check the rest.",
    "The pattern generalizes: use two pointers whenever you compare or combine elements from opposite ends of a sequence.",
  ],
  commonMistakes: [
    "Using `left <= right` instead of `left < right` — causes comparing an element with itself at the center, which always matches so it is not incorrect but is redundant.",
    "Forgetting to skip non-alphanumeric characters when the problem says 'consider only alphanumeric characters'.",
    "Not lowercasing both characters before comparing when the problem is case-insensitive.",
    "Advancing only one pointer after a match — both pointers must move inward each step.",
  ],
};

// ─── Pattern 2: Sliding Window ───────────────────────────────────────────────

const slidingWindow: PatternVisualization = {
  patternSlug: "sliding-window",
  title: "Sliding Window",
  problemTitle: "Longest Substring Without Repeating Characters",
  problemInput: 's = "abcabcbb"',
  templateCode: [
    "def lengthOfLongestSubstring(s):",
    "    char_index = {}",
    "    left = 0",
    "    max_len = 0",
    "    for right in range(len(s)):",
    "        if s[right] in char_index:",
    "            left = max(left, char_index[s[right]] + 1)",
    "        char_index[s[right]] = right",
    "        max_len = max(max_len, right - left + 1)",
    "    return max_len",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize variables",
      description:
        "Set up: char_index = {} (empty hashmap to track last-seen positions), left = 0 (left boundary of the window), max_len = 0. The right pointer will scan from left to right via the for loop.",
      codeLineIndex: 1,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["default", "default", "default", "default", "default", "default", "default", "default"],
        labels: ["0", "1", "2", "3", "4", "5", "6", "7"],
      },
      hashmap: [],
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: "-" },
        { name: "max_len", value: 0 },
      ],
    },
    {
      stepNumber: 1,
      title: "right=0, process 'a'",
      description:
        "'a' is NOT in char_index (empty). No shrinking needed. Add char_index['a'] = 0. Window is now [a] from index 0 to 0, size = 1. Update max_len = max(0, 0-0+1) = 1.",
      codeLineIndex: 7,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["window", "default", "default", "default", "default", "default", "default", "default"],
        labels: ["L/R", "", "", "", "", "", "", ""],
      },
      hashmap: [{ key: "a", value: 0, isNew: true }],
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 0 },
        { name: "max_len", value: 1 },
      ],
    },
    {
      stepNumber: 2,
      title: "right=1, process 'b'",
      description:
        "'b' is NOT in char_index. Expand window. Add char_index['b'] = 1. Window is [a, b] from index 0 to 1, size = 2. Update max_len = max(1, 1-0+1) = 2.",
      codeLineIndex: 7,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["window", "window", "default", "default", "default", "default", "default", "default"],
        labels: ["L", "R", "", "", "", "", "", ""],
      },
      hashmap: [
        { key: "a", value: 0 },
        { key: "b", value: 1, isNew: true },
      ],
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 1 },
        { name: "max_len", value: 2 },
      ],
    },
    {
      stepNumber: 3,
      title: "right=2, process 'c'",
      description:
        "'c' is NOT in char_index. Expand window. Add char_index['c'] = 2. Window is [a, b, c] from index 0 to 2, size = 3. max_len = max(2, 2-0+1) = 3.",
      codeLineIndex: 7,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["window", "window", "window", "default", "default", "default", "default", "default"],
        labels: ["L", "", "R", "", "", "", "", ""],
      },
      hashmap: [
        { key: "a", value: 0 },
        { key: "b", value: 1 },
        { key: "c", value: 2, isNew: true },
      ],
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 2 },
        { name: "max_len", value: 3 },
      ],
    },
    {
      stepNumber: 4,
      title: "right=3, duplicate 'a' found!",
      description:
        "'a' IS in char_index at index 0. The window [a,b,c,a] would have a duplicate. Shrink: left = max(0, 0+1) = 1. Update char_index['a'] = 3. Window is now [b,c,a] (indices 1–3), size = 3. max_len stays 3.",
      codeLineIndex: 6,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["eliminated", "window", "window", "window", "default", "default", "default", "default"],
        labels: ["", "L", "", "R", "", "", "", ""],
      },
      hashmap: [
        { key: "a", value: 3, isNew: true },
        { key: "b", value: 1 },
        { key: "c", value: 2 },
      ],
      variables: [
        { name: "left", value: 1 },
        { name: "right", value: 3 },
        { name: "max_len", value: 3 },
        { name: "duplicate", value: "'a' at 0" },
      ],
    },
    {
      stepNumber: 5,
      title: "right=4, duplicate 'b' found!",
      description:
        "'b' IS in char_index at index 1. Shrink: left = max(1, 1+1) = 2. Update char_index['b'] = 4. Window is [c,a,b] (indices 2–4), size = 3. max_len stays 3.",
      codeLineIndex: 6,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["eliminated", "eliminated", "window", "window", "window", "default", "default", "default"],
        labels: ["", "", "L", "", "R", "", "", ""],
      },
      hashmap: [
        { key: "a", value: 3 },
        { key: "b", value: 4, isNew: true },
        { key: "c", value: 2 },
      ],
      variables: [
        { name: "left", value: 2 },
        { name: "right", value: 4 },
        { name: "max_len", value: 3 },
        { name: "duplicate", value: "'b' at 1" },
      ],
    },
    {
      stepNumber: 6,
      title: "right=5, duplicate 'c' found!",
      description:
        "'c' IS in char_index at index 2. Shrink: left = max(2, 2+1) = 3. Update char_index['c'] = 5. Window is [a,b,c] (indices 3–5), size = 3. max_len stays 3.",
      codeLineIndex: 6,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["eliminated", "eliminated", "eliminated", "window", "window", "window", "default", "default"],
        labels: ["", "", "", "L", "", "R", "", ""],
      },
      hashmap: [
        { key: "a", value: 3 },
        { key: "b", value: 4 },
        { key: "c", value: 5, isNew: true },
      ],
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 5 },
        { name: "max_len", value: 3 },
        { name: "duplicate", value: "'c' at 2" },
      ],
    },
    {
      stepNumber: 7,
      title: "right=6, duplicate 'b' again",
      description:
        "'b' IS in char_index at index 4. Shrink: left = max(3, 4+1) = 5. Update char_index['b'] = 6. Window is [c,b] (indices 5–6), size = 2. max_len stays 3.",
      codeLineIndex: 6,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["eliminated", "eliminated", "eliminated", "eliminated", "eliminated", "window", "window", "default"],
        labels: ["", "", "", "", "", "L", "R", ""],
      },
      hashmap: [
        { key: "a", value: 3 },
        { key: "b", value: 6, isNew: true },
        { key: "c", value: 5 },
      ],
      variables: [
        { name: "left", value: 5 },
        { name: "right", value: 6 },
        { name: "max_len", value: 3 },
        { name: "duplicate", value: "'b' at 4" },
      ],
    },
    {
      stepNumber: 8,
      title: "right=7, duplicate 'b' again",
      description:
        "'b' IS in char_index at index 6. Shrink: left = max(5, 6+1) = 7. Update char_index['b'] = 7. Window is [b] (index 7 only), size = 1. max_len stays 3. Loop ends.",
      codeLineIndex: 6,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["eliminated", "eliminated", "eliminated", "eliminated", "eliminated", "eliminated", "eliminated", "window"],
        labels: ["", "", "", "", "", "", "", "L/R"],
      },
      hashmap: [
        { key: "a", value: 3 },
        { key: "b", value: 7, isNew: true },
        { key: "c", value: 5 },
      ],
      variables: [
        { name: "left", value: 7 },
        { name: "right", value: 7 },
        { name: "max_len", value: 3 },
      ],
    },
    {
      stepNumber: 9,
      title: "Return max_len = 3",
      description:
        'The for loop has processed all characters. The maximum window size seen was 3 (e.g., "abc"). Return max_len = 3.',
      codeLineIndex: 9,
      array: {
        values: ["a", "b", "c", "a", "b", "c", "b", "b"],
        colors: ["found", "found", "found", "default", "default", "default", "default", "default"],
        labels: ["", "", "", "", "", "", "", ""],
      },
      hashmap: [
        { key: "a", value: 3 },
        { key: "b", value: 7 },
        { key: "c", value: 5 },
      ],
      variables: [
        { name: "left", value: 7 },
        { name: "right", value: 7 },
        { name: "max_len", value: 3 },
      ],
      result: "Answer: 3 — longest substring without repeating chars is 'abc'",
    },
  ],
  edgeCases: [
    {
      title: "All unique characters",
      input: 's = "abcdef"',
      explanation: "Window never shrinks — it just grows from left=0 to right=5.",
      whatBreaks: "Nothing breaks, but you must ensure max_len is updated at every step.",
      howToHandle: "Algorithm handles this naturally — no duplicates are ever found, window grows to full string length.",
    },
    {
      title: "All same characters",
      input: 's = "bbbbbb"',
      explanation: "Every new character is a duplicate. Window is always size 1.",
      whatBreaks: "left jumps to right at each step. max_len = 1 throughout.",
      howToHandle: "left = max(left, char_index[s[right]] + 1) correctly jumps left past the old occurrence. Answer is 1.",
    },
    {
      title: "Empty string",
      input: 's = ""',
      explanation: "No characters to process.",
      whatBreaks: "The for loop never executes.",
      howToHandle: "max_len stays 0 and is returned correctly.",
    },
    {
      title: "Single character",
      input: 's = "z"',
      explanation: "Only one character, trivially no repeats.",
      whatBreaks: "Nothing — max_len is set to 1 after one iteration.",
      howToHandle: "Works correctly. Answer is 1.",
    },
  ],
  keyInsights: [
    "The window always contains unique characters — shrink it the moment a duplicate enters from the right.",
    "Use a hashmap to store the LAST SEEN index of each character, enabling O(1) jump of the left pointer.",
    "left = max(left, char_index[s[right]] + 1) prevents left from moving backward — crucial for correctness.",
    "O(n) time: each character is added and removed from the window at most once total.",
    "The window size at any point is right - left + 1; track the maximum of this value.",
  ],
  commonMistakes: [
    "Forgetting `max(left, ...)` — without it, left can move backward past already-processed characters, creating invalid windows.",
    "Using char_count > 1 with a frequency map (valid but O(n) per step); the index-map approach is faster.",
    "Off-by-one: window size is right - left + 1, not right - left.",
    "Not updating char_index even when duplicate found — you must always store the latest index.",
  ],
};

// ─── Pattern 3: Binary Search ────────────────────────────────────────────────

const binarySearch: PatternVisualization = {
  patternSlug: "binary-search",
  title: "Binary Search",
  problemTitle: "Binary Search",
  problemInput: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
  templateCode: [
    "def search(nums, target):",
    "    left, right = 0, len(nums) - 1",
    "    while left <= right:",
    "        mid = left + (right - left) // 2",
    "        if nums[mid] == target:",
    "            return mid",
    "        elif nums[mid] < target:",
    "            left = mid + 1",
    "        else:",
    "            right = mid - 1",
    "    return -1",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize search boundaries",
      description:
        "Set left = 0 (start of array) and right = 5 (last index). Binary search works by repeatedly halving the search space. The array must be sorted — here [-1, 0, 3, 5, 9, 12] is sorted ascending. We are searching for target = 9.",
      codeLineIndex: 1,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["left", "default", "default", "default", "default", "right"],
        labels: ["L", "", "", "", "", "R"],
      },
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 5 },
        { name: "target", value: 9 },
      ],
    },
    {
      stepNumber: 1,
      title: "Calculate first midpoint",
      description:
        "mid = left + (right - left) // 2 = 0 + (5-0)//2 = 2. We use this formula instead of (left+right)//2 to prevent integer overflow. nums[2] = 3. Compare with target 9.",
      codeLineIndex: 3,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["left", "default", "mid", "default", "default", "right"],
        labels: ["L", "", "mid", "", "", "R"],
      },
      variables: [
        { name: "left", value: 0 },
        { name: "right", value: 5 },
        { name: "mid", value: 2 },
        { name: "nums[mid]", value: 3 },
        { name: "target", value: 9 },
      ],
    },
    {
      stepNumber: 2,
      title: "nums[mid]=3 < target=9, search right half",
      description:
        "nums[2] = 3 < target = 9. Target must be in the RIGHT half (indices 3–5). Set left = mid + 1 = 3. The left half (indices 0–2) is eliminated — those values are all ≤ 3 < 9.",
      codeLineIndex: 7,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["eliminated", "eliminated", "eliminated", "left", "default", "right"],
        labels: ["", "", "", "L", "", "R"],
      },
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 5 },
        { name: "mid", value: 2 },
        { name: "nums[mid]", value: 3 },
        { name: "target", value: 9 },
      ],
    },
    {
      stepNumber: 3,
      title: "Calculate second midpoint",
      description:
        "mid = 3 + (5-3)//2 = 3 + 1 = 4. nums[4] = 9. Compare with target 9. Now checking the middle of the remaining search space [5, 9, 12].",
      codeLineIndex: 3,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["eliminated", "eliminated", "eliminated", "left", "mid", "right"],
        labels: ["", "", "", "L", "mid", "R"],
      },
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 5 },
        { name: "mid", value: 4 },
        { name: "nums[mid]", value: 9 },
        { name: "target", value: 9 },
      ],
    },
    {
      stepNumber: 4,
      title: "nums[mid]=9 == target=9, FOUND!",
      description:
        "nums[4] = 9 exactly equals target = 9. We found it! Return mid = 4. Total comparisons: only 2! Linear search would have needed 5 comparisons to reach index 4.",
      codeLineIndex: 5,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["eliminated", "eliminated", "eliminated", "eliminated", "found", "eliminated"],
        labels: ["", "", "", "", "FOUND", ""],
      },
      variables: [
        { name: "left", value: 3 },
        { name: "right", value: 5 },
        { name: "mid", value: 4 },
        { name: "nums[mid]", value: 9 },
        { name: "target", value: 9 },
      ],
      result: "Answer: index 4 — found target 9 at nums[4]",
    },
    {
      stepNumber: 5,
      title: "Edge case: target not found",
      description:
        "Searching for target = 2 in [-1, 0, 3, 5, 9, 12]. After checking mid=2 (value 3 > 2, set right=1), then mid=0 (value -1 < 2, set left=1), then mid=1 (value 0 < 2, set left=2). Now left=2 > right=1 — loop exits. Return -1.",
      codeLineIndex: 10,
      array: {
        values: [-1, 0, 3, 5, 9, 12],
        colors: ["eliminated", "eliminated", "eliminated", "eliminated", "eliminated", "eliminated"],
        labels: ["", "", "", "", "", ""],
      },
      variables: [
        { name: "left", value: 2 },
        { name: "right", value: 1 },
        { name: "target", value: 2 },
        { name: "left <= right", value: "false" },
      ],
      isEdgeCase: true,
      edgeCaseNote:
        "When left > right, search space is exhausted — target is not in the array. Return -1.",
      result: "Answer: -1 — target 2 not found in array",
    },
  ],
  edgeCases: [
    {
      title: "Target not in array",
      input: "nums = [1, 3, 5, 7], target = 4",
      explanation: "4 would sit between 3 and 5 but is absent.",
      whatBreaks: "left > right eventually — the search space collapses without finding target.",
      howToHandle: "Return -1 when the while loop exits without returning mid.",
    },
    {
      title: "Single element array",
      input: "nums = [5], target = 5",
      explanation: "Only one element to check.",
      whatBreaks: "left = right = mid = 0. One comparison finds it immediately.",
      howToHandle: "Works correctly — one iteration of the while loop.",
    },
    {
      title: "Target at boundaries",
      input: "nums = [1, 2, 3, 4, 5], target = 1 or target = 5",
      explanation: "Target is the first or last element.",
      whatBreaks: "Multiple halvings needed to reach the extreme ends.",
      howToHandle: "Algorithm handles correctly via standard left/right updates.",
    },
    {
      title: "Integer overflow prevention",
      input: "Very large left and right values",
      explanation: "(left + right) can overflow 32-bit integers in languages like Java/C++.",
      whatBreaks: "mid = (left + right) // 2 overflows to a negative number.",
      howToHandle: "Use mid = left + (right - left) // 2 — this is mathematically equivalent but safe.",
    },
  ],
  keyInsights: [
    "Binary search requires a SORTED array — without this, the elimination step is invalid.",
    "Each iteration eliminates half the search space, giving O(log n) time complexity — 1 billion elements needs only ~30 comparisons.",
    "Use `left + (right - left) // 2` not `(left + right) // 2` to prevent integer overflow.",
    "Loop condition is `left <= right` (inclusive) — this ensures single-element subarrays are checked.",
    "When searching for insertion point or in rotated arrays, the template changes — recognize which variant the problem needs.",
  ],
  commonMistakes: [
    "Using `left < right` instead of `left <= right` — misses checking when left == right (single element range).",
    "Setting left = mid or right = mid instead of mid+1/mid-1 — causes infinite loop when left == right.",
    "Applying binary search to an unsorted array — produces wrong results without error.",
    "Off-by-one in mid calculation — especially easy to get wrong with `//` vs `/` in Python.",
  ],
};

// ─── Pattern 4: Arrays & Hashing ─────────────────────────────────────────────

const arraysHashing: PatternVisualization = {
  patternSlug: "arrays-hashing",
  title: "Arrays & Hashing",
  problemTitle: "Two Sum",
  problemInput: "nums = [2, 7, 11, 15], target = 9",
  templateCode: [
    "def twoSum(nums, target):",
    "    seen = {}",
    "    for i, num in enumerate(nums):",
    "        complement = target - num",
    "        if complement in seen:",
    "            return [seen[complement], i]",
    "        seen[num] = i",
    "    return []",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize empty hashmap",
      description:
        "Create seen = {}, an empty dictionary that will map each value we've visited to its index. We use a hashmap because lookup is O(1) — this is the key insight that turns an O(n²) brute force into O(n).",
      codeLineIndex: 1,
      array: {
        values: [2, 7, 11, 15],
        colors: ["default", "default", "default", "default"],
        labels: ["0", "1", "2", "3"],
      },
      hashmap: [],
      variables: [
        { name: "target", value: 9 },
        { name: "i", value: "-" },
      ],
    },
    {
      stepNumber: 1,
      title: "i=0, num=2, complement=7",
      description:
        "i=0, num=2. Calculate complement = target - num = 9 - 2 = 7. Ask: 'Is 7 already in seen?' Check hashmap — it's empty, so NO. Store seen[2] = 0 (value 2 was seen at index 0). Move to next element.",
      codeLineIndex: 3,
      array: {
        values: [2, 7, 11, 15],
        colors: ["current", "default", "default", "default"],
        labels: ["i=0", "", "", ""],
      },
      hashmap: [{ key: "2", value: 0, isNew: true }],
      variables: [
        { name: "i", value: 0 },
        { name: "num", value: 2 },
        { name: "complement", value: 7 },
        { name: "7 in seen?", value: "NO" },
      ],
    },
    {
      stepNumber: 2,
      title: "i=1, num=7, complement=2 — FOUND!",
      description:
        "i=1, num=7. Calculate complement = target - num = 9 - 7 = 2. Ask: 'Is 2 already in seen?' Check hashmap — YES! seen[2] = 0. We found a pair! nums[0]=2 and nums[1]=7 sum to 9. Return [seen[2], 1] = [0, 1].",
      codeLineIndex: 4,
      array: {
        values: [2, 7, 11, 15],
        colors: ["current", "current", "default", "default"],
        labels: ["i=0", "i=1", "", ""],
      },
      hashmap: [{ key: "2", value: 0, isLookup: true }],
      variables: [
        { name: "i", value: 1 },
        { name: "num", value: 7 },
        { name: "complement", value: 2 },
        { name: "2 in seen?", value: "YES at index 0" },
      ],
    },
    {
      stepNumber: 3,
      title: "Return the answer indices",
      description:
        "complement (2) IS in seen at index 0. Return [seen[complement], i] = [seen[2], 1] = [0, 1]. We found the answer after examining only 2 elements! The hashmap lookup was O(1).",
      codeLineIndex: 5,
      array: {
        values: [2, 7, 11, 15],
        colors: ["found", "found", "default", "default"],
        labels: ["ans[0]", "ans[1]", "", ""],
      },
      hashmap: [{ key: "2", value: 0, isLookup: true }],
      variables: [
        { name: "i", value: 1 },
        { name: "num", value: 7 },
        { name: "complement", value: 2 },
        { name: "result", value: "[0, 1]" },
      ],
      result: "Answer: [0, 1] — nums[0] + nums[1] = 2 + 7 = 9 ✓",
    },
    {
      stepNumber: 4,
      title: "Why this works: the complement trick",
      description:
        "For any pair (a, b) with a + b = target, when we encounter b, its complement a = target - b must have been seen earlier. By storing {value: index} as we scan left-to-right, we guarantee we catch the pair the first time b appears. This is why we never need to revisit earlier elements.",
      codeLineIndex: 5,
      array: {
        values: [2, 7, 11, 15],
        colors: ["found", "found", "eliminated", "eliminated"],
        labels: ["2", "7", "", ""],
      },
      hashmap: [
        { key: "2", value: 0, isLookup: true },
        { key: "7", value: 1 },
      ],
      variables: [
        { name: "nums[0] + nums[1]", value: "2 + 7 = 9" },
        { name: "equals target", value: "9 == 9 ✓" },
      ],
      result: "Answer: [0, 1] — nums[0] + nums[1] = 2 + 7 = 9 ✓",
    },
  ],
  edgeCases: [
    {
      title: "Same element used twice",
      input: "nums = [3, 3], target = 6",
      explanation: "The two 3s are at different indices — using each once is valid.",
      whatBreaks: "If we store seen[3] = 0 first, then at i=1 we find complement=3 in seen at index 0. This is correct — indices 0 and 1 are different.",
      howToHandle: "The current algorithm handles this correctly — we check BEFORE storing, ensuring i=0's value is in seen when i=1 checks for it.",
    },
    {
      title: "Negative numbers",
      input: "nums = [-1, -2, -3, -4, -5], target = -8",
      explanation: "complement = -8 - (-3) = -5. Negative numbers work the same way.",
      whatBreaks: "Nothing — Python dicts handle negative keys perfectly.",
      howToHandle: "Algorithm works unchanged for negative numbers.",
    },
    {
      title: "No solution exists",
      input: "nums = [1, 2, 3, 4], target = 100",
      explanation: "No pair sums to 100.",
      whatBreaks: "The for loop completes without ever finding complement in seen.",
      howToHandle: "Return [] after the loop — the problem guarantees exactly one solution exists, but guard with empty return just in case.",
    },
    {
      title: "Large arrays",
      input: "nums = [10^4 random numbers], target = X",
      explanation: "Brute force O(n²) would be ~10^8 operations — too slow.",
      whatBreaks: "O(n²) nested loop solution times out on LeetCode.",
      howToHandle: "Our O(n) hashmap solution handles 10^4 elements in microseconds.",
    },
  ],
  keyInsights: [
    "The hashmap stores VALUE → INDEX, enabling O(1) complement lookup instead of O(n) linear scan.",
    "We check for complement BEFORE storing the current element — this prevents using the same index twice.",
    "Total time: O(n). Space: O(n) for the hashmap. Classic space-time tradeoff.",
    "The pattern: 'store what you've seen, check if what you need is already there' — applies to many problems.",
    "This reduces two nested loops (O(n²)) to one single pass (O(n)) — a 100x speedup for n=10,000.",
  ],
  commonMistakes: [
    "Checking `seen[complement]` before adding — must handle key-not-found safely with `complement in seen`.",
    "Storing seen[num] = i BEFORE checking — could allow using the same element twice if num == complement.",
    "Returning indices in wrong order: always return [seen[complement], i] not [i, seen[complement]] (earlier index first).",
    "Using sorted array + two pointers instead — valid but gives indices of sorted array, not original indices.",
  ],
};

// ─── Pattern 5: Stack ─────────────────────────────────────────────────────────

const stack: PatternVisualization = {
  patternSlug: "stack",
  title: "Stack",
  problemTitle: "Valid Parentheses",
  problemInput: 's = "({[]})"',
  templateCode: [
    "def isValid(s):",
    "    stack = []",
    "    pairs = {')': '(', ']': '[', '}': '{'}",
    "    for char in s:",
    "        if char in '([{':",
    "            stack.append(char)",
    "        else:",
    "            if not stack or stack[-1] != pairs[char]:",
    "                return False",
    "            stack.pop()",
    "    return len(stack) == 0",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize stack and pairs map",
      description:
        "Create empty stack = [] and pairs mapping closing-to-opening brackets: {')':'(', ']':'[', '}':'{'}. The stack will hold unmatched opening brackets. When we see a closing bracket, its matching opener should be on top of the stack.",
      codeLineIndex: 1,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["default", "default", "default", "default", "default", "default"],
        labels: ["0", "1", "2", "3", "4", "5"],
      },
      stack: { items: [] },
      variables: [
        { name: "i", value: 0 },
        { name: "char", value: "-" },
        { name: "stack", value: "[]" },
      ],
    },
    {
      stepNumber: 1,
      title: "char='(', push opening bracket",
      description:
        "'(' is an opening bracket (in '([{'). Push it onto the stack. Stack = ['(']. We must wait to see if a matching ')' comes later.",
      codeLineIndex: 5,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["current", "default", "default", "default", "default", "default"],
        labels: ["→", "", "", "", "", ""],
      },
      stack: { items: ["("], lastAction: "push" },
      variables: [
        { name: "i", value: 0 },
        { name: "char", value: "'('" },
        { name: "action", value: "PUSH '('" },
      ],
    },
    {
      stepNumber: 2,
      title: "char='{', push opening bracket",
      description:
        "'{' is an opening bracket. Push onto stack. Stack = ['(', '{']. The stack grows as we encounter nested opening brackets.",
      codeLineIndex: 5,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["window", "current", "default", "default", "default", "default"],
        labels: ["", "→", "", "", "", ""],
      },
      stack: { items: ["(", "{"], lastAction: "push" },
      variables: [
        { name: "i", value: 1 },
        { name: "char", value: "'{'" },
        { name: "action", value: "PUSH '{'" },
      ],
    },
    {
      stepNumber: 3,
      title: "char='[', push opening bracket",
      description:
        "'[' is an opening bracket. Push onto stack. Stack = ['(', '{', '[']. We now have three nested opening brackets waiting to be matched.",
      codeLineIndex: 5,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["window", "window", "current", "default", "default", "default"],
        labels: ["", "", "→", "", "", ""],
      },
      stack: { items: ["(", "{", "["], lastAction: "push" },
      variables: [
        { name: "i", value: 2 },
        { name: "char", value: "'['" },
        { name: "action", value: "PUSH '['" },
      ],
    },
    {
      stepNumber: 4,
      title: "char=']', check top of stack",
      description:
        "']' is a closing bracket. Look up pairs[']'] = '['. Check: is stack non-empty AND stack[-1] == '['? Stack = ['(', '{', '['] — top is '['. YES, it matches! Pop '[' from stack. Stack = ['(', '{'].",
      codeLineIndex: 9,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["window", "window", "match", "match", "default", "default"],
        labels: ["", "", "←", "→", "", ""],
      },
      stack: { items: ["(", "{"], lastAction: "pop" },
      variables: [
        { name: "i", value: 3 },
        { name: "char", value: "']'" },
        { name: "pairs[']']", value: "'['" },
        { name: "stack[-1]", value: "'['" },
        { name: "match?", value: "YES → POP" },
      ],
    },
    {
      stepNumber: 5,
      title: "char='}', check top of stack",
      description:
        "'}' is a closing bracket. pairs['}'] = '{'. Stack top is '{'. Match! Pop '{' from stack. Stack = ['(']. The innermost brackets always close first — this is the LIFO (Last In, First Out) property of stacks.",
      codeLineIndex: 9,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["window", "match", "eliminated", "eliminated", "match", "default"],
        labels: ["", "←", "", "", "→", ""],
      },
      stack: { items: ["("], lastAction: "pop" },
      variables: [
        { name: "i", value: 4 },
        { name: "char", value: "'}'" },
        { name: "pairs['}']", value: "'{'" },
        { name: "stack[-1]", value: "'{'" },
        { name: "match?", value: "YES → POP" },
      ],
    },
    {
      stepNumber: 6,
      title: "char=')', check top of stack",
      description:
        "')' is a closing bracket. pairs[')'] = '('. Stack top is '('. Match! Pop '(' from stack. Stack = []. All brackets have been properly matched and closed.",
      codeLineIndex: 9,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["match", "eliminated", "eliminated", "eliminated", "eliminated", "match"],
        labels: ["←", "", "", "", "", "→"],
      },
      stack: { items: [], lastAction: "pop" },
      variables: [
        { name: "i", value: 5 },
        { name: "char", value: "')'" },
        { name: "pairs[')']", value: "'('" },
        { name: "stack[-1]", value: "'('" },
        { name: "match?", value: "YES → POP" },
      ],
    },
    {
      stepNumber: 7,
      title: "End of string — stack is empty!",
      description:
        "Loop finished. len(stack) == 0 is TRUE. Every opening bracket was matched by a corresponding closing bracket in the correct order. Return True.",
      codeLineIndex: 10,
      array: {
        values: ["(", "{", "[", "]", "}", ")"],
        colors: ["found", "found", "found", "found", "found", "found"],
        labels: ["", "", "", "", "", ""],
      },
      stack: { items: [] },
      variables: [
        { name: "stack", value: "[]" },
        { name: "len(stack)==0", value: "true" },
      ],
      result: 'Answer: True — "({[]})" has valid parentheses',
    },
    {
      stepNumber: 8,
      title: "Edge case: wrong nesting order",
      description:
        'For s = "([)]": After pushing \'(\' and \'[\', we see \')\'. pairs[\')\'] = \'(\', but stack[-1] = \'[\'. MISMATCH! Return False. Even though counts are equal (2 open, 2 close), the nesting order is wrong — \')\' closes \'(\' before \'[\' is closed.',
      codeLineIndex: 8,
      array: {
        values: ["(", "[", ")", "]"],
        colors: ["duplicate", "duplicate", "duplicate", "duplicate"],
        labels: ["", "", "FAIL", ""],
      },
      stack: { items: ["(", "["] },
      variables: [
        { name: "char", value: "')'" },
        { name: "pairs[')']", value: "'('" },
        { name: "stack[-1]", value: "'['" },
        { name: "match?", value: "NO → return False" },
      ],
      isEdgeCase: true,
      edgeCaseNote:
        'Input "([)]": stack=["(","["], but \')\' needs \'(\' on top. stack top is \'[\' — WRONG ORDER. Invalid.',
      result: 'Answer: False — "([)]" has invalid nesting',
    },
  ],
  edgeCases: [
    {
      title: "Wrong nesting order",
      input: 's = "([)]"',
      explanation: "Opening and closing counts match but nesting is crossed.",
      whatBreaks: "stack[-1] != pairs[char] even though overall counts are balanced.",
      howToHandle: "The stack naturally catches this — the top must always be the matching opener.",
    },
    {
      title: "Unmatched opening bracket",
      input: 's = "((("',
      explanation: "Three opening brackets with no closing brackets.",
      whatBreaks: "Loop ends, but stack = ['(', '(', '('] is not empty.",
      howToHandle: "Check len(stack) == 0 at the end — returns False because stack is non-empty.",
    },
    {
      title: "Closing bracket with empty stack",
      input: 's = ")("',
      explanation: "Closing bracket appears before any opening bracket.",
      whatBreaks: "`not stack` is True when ']' or ')' or '}' is encountered first.",
      howToHandle: "The `if not stack or ...` guard handles this — returns False immediately.",
    },
    {
      title: "Mismatched bracket types",
      input: 's = "(]"',
      explanation: "Opening '(' paired with closing ']'.",
      whatBreaks: "pairs[']'] = '[', but stack[-1] = '(' — type mismatch.",
      howToHandle: "The stack[-1] != pairs[char] check catches the type mismatch and returns False.",
    },
  ],
  keyInsights: [
    "Stacks are perfect for matching problems because they preserve LIFO order — innermost brackets close first.",
    "Map closing-to-opening brackets: {')':'(', ']':'[', '}':'{'} for O(1) lookup of expected opener.",
    "Always check: (1) stack is non-empty before accessing stack[-1], (2) top matches the expected opener.",
    "Valid result requires: every closer had a matching opener AND no unmatched openers remain (stack empty at end).",
    "This pattern extends to: matching HTML tags, undo/redo operations, expression evaluation, depth-first traversal.",
  ],
  commonMistakes: [
    "Checking `stack[-1]` before verifying `stack` is non-empty — causes IndexError on empty stack.",
    "Forgetting to check `len(stack) == 0` at the end — '[(' has balanced positions but unmatched openers.",
    "Using a counter instead of a stack — counts can't detect wrong ordering like '([)]'.",
    "Mapping opening-to-closing instead of closing-to-opening — requires looking up the wrong direction.",
  ],
};

// ─── Pattern 6: Linked List ──────────────────────────────────────────────────

const linkedList: PatternVisualization = {
  patternSlug: "linked-list",
  title: "Linked List",
  problemTitle: "Reverse Linked List",
  problemInput: "head = [1, 2, 3, 4, 5]",
  templateCode: [
    "def reverseList(head):",
    "    prev = None",
    "    curr = head",
    "    while curr:",
    "        next_node = curr.next",
    "        curr.next = prev",
    "        prev = curr",
    "        curr = next_node",
    "    return prev",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize pointers",
      description:
        "Set prev = None and curr = head (node 1). prev will trail behind curr, collecting the reversed chain. curr walks forward through the original list. The loop runs while curr is not None.",
      codeLineIndex: 1,
      linkedListNodes: {
        values: [1, 2, 3, 4, 5],
        colors: ["current", "default", "default", "default", "default"],
        labels: ["curr", "", "", "", ""],
        nullAtEnd: true,
      },
      stack: { items: ["prev = None"] },
      variables: [
        { name: "prev", value: "None" },
        { name: "curr", value: "node(1)" },
      ],
    },
    {
      stepNumber: 1,
      title: "Save next_node = curr.next",
      description:
        "CRITICAL: Save next_node = curr.next = node(2) BEFORE we overwrite curr.next. If we forget this, we lose access to the rest of the list permanently. This is the most common mistake in linked list reversal.",
      codeLineIndex: 4,
      linkedListNodes: {
        values: [1, 2, 3, 4, 5],
        colors: ["current", "right", "default", "default", "default"],
        labels: ["curr", "next", "", "", ""],
        nullAtEnd: true,
      },
      stack: { items: ["prev = None"] },
      variables: [
        { name: "prev", value: "None" },
        { name: "curr", value: "node(1)" },
        { name: "next_node", value: "node(2)" },
      ],
    },
    {
      stepNumber: 2,
      title: "Reverse the pointer: curr.next = prev",
      description:
        "Set curr.next = prev (None). Node 1 now points backward to None — it becomes the new tail of the reversed list. The original forward link to node 2 was already saved in next_node.",
      codeLineIndex: 5,
      linkedListNodes: {
        values: [1, 2, 3, 4, 5],
        colors: ["found", "default", "default", "default", "default"],
        labels: ["curr→None", "", "", "", ""],
        nullAtEnd: false,
      },
      stack: { items: ["prev = None", "curr(1)→None"] },
      variables: [
        { name: "prev", value: "None" },
        { name: "curr", value: "node(1)" },
        { name: "next_node", value: "node(2)" },
        { name: "curr.next", value: "None (reversed)" },
      ],
    },
    {
      stepNumber: 3,
      title: "Advance: prev = curr, curr = next_node",
      description:
        "Move prev forward to node(1) and curr forward to node(2) (our saved next_node). Both pointers advance by one. prev now holds the growing reversed list, curr is the next node to process.",
      codeLineIndex: 6,
      linkedListNodes: {
        values: [1, 2, 3, 4, 5],
        colors: ["found", "current", "default", "default", "default"],
        labels: ["prev", "curr", "", "", ""],
        nullAtEnd: true,
      },
      stack: { items: ["prev = node(1)"] },
      variables: [
        { name: "prev", value: "node(1)" },
        { name: "curr", value: "node(2)" },
      ],
    },
    {
      stepNumber: 4,
      title: "Reverse node(2): next=node(3), point back to node(1)",
      description:
        "Save next_node = node(3). Then curr.next = prev = node(1). Node 2 now points to node 1. The reversed chain so far: 2→1→None. Advance prev to node(2), curr to node(3).",
      codeLineIndex: 4,
      linkedListNodes: {
        values: [2, 1, 3, 4, 5],
        colors: ["found", "found", "current", "default", "default"],
        labels: ["prev", "", "curr", "", ""],
        nullAtEnd: true,
      },
      stack: { items: ["prev = node(2)", "2→1→None built"] },
      variables: [
        { name: "prev", value: "node(2)" },
        { name: "curr", value: "node(3)" },
        { name: "chain so far", value: "2→1→None" },
      ],
    },
    {
      stepNumber: 5,
      title: "Continue: reverse node(3), node(4)",
      description:
        "Same three-step pattern for nodes 3 and 4. Each time: save next, point back, advance. After processing node(4), the chain reads 4→3→2→1→None. curr is now node(5).",
      codeLineIndex: 4,
      linkedListNodes: {
        values: [4, 3, 2, 1, 5],
        colors: ["found", "found", "found", "found", "current"],
        labels: ["prev", "", "", "", "curr"],
        nullAtEnd: true,
      },
      stack: { items: ["prev = node(4)", "4→3→2→1→None built"] },
      variables: [
        { name: "prev", value: "node(4)" },
        { name: "curr", value: "node(5)" },
        { name: "chain so far", value: "4→3→2→1→None" },
      ],
    },
    {
      stepNumber: 6,
      title: "Reverse final node(5)",
      description:
        "Save next_node = None (node 5 was the last node). Set curr.next = prev = node(4). Node 5 now points to node 4. Advance prev to node(5), curr to None. The full reversed chain: 5→4→3→2→1→None.",
      codeLineIndex: 5,
      linkedListNodes: {
        values: [5, 4, 3, 2, 1],
        colors: ["found", "found", "found", "found", "found"],
        labels: ["prev", "", "", "", ""],
        nullAtEnd: true,
      },
      stack: { items: ["prev = node(5)", "5→4→3→2→1→None complete"] },
      variables: [
        { name: "prev", value: "node(5)" },
        { name: "curr", value: "None" },
      ],
    },
    {
      stepNumber: 7,
      title: "Return prev — the new head",
      description:
        "curr is now None, so the while loop exits. Return prev = node(5), which is the new head of the fully reversed list. O(n) time, O(1) space — only three pointer variables used.",
      codeLineIndex: 8,
      linkedListNodes: {
        values: [5, 4, 3, 2, 1],
        colors: ["found", "found", "found", "found", "found"],
        labels: ["head", "", "", "", "tail"],
        nullAtEnd: true,
      },
      stack: { items: ["return prev = node(5)"] },
      variables: [
        { name: "prev (new head)", value: "node(5)" },
        { name: "curr", value: "None" },
      ],
      result: "Reversed: 5→4→3→2→1→None",
    },
  ],
  edgeCases: [
    {
      title: "Empty list",
      input: "head = None",
      explanation: "No nodes to reverse.",
      whatBreaks: "curr starts as None, so the while loop never runs.",
      howToHandle: "Return prev = None immediately. Correct — an empty list reversed is still empty.",
    },
    {
      title: "Single node",
      input: "head = [1]",
      explanation: "Only one node, already trivially reversed.",
      whatBreaks: "One iteration: next_node = None, curr.next = None (unchanged), prev = node(1), curr = None. Loop exits.",
      howToHandle: "Return prev = node(1). Correct — single node reversed is itself.",
    },
    {
      title: "Two nodes",
      input: "head = [1, 2]",
      explanation: "Simplest non-trivial reversal.",
      whatBreaks: "Easy to forget next_node and lose node(2) before flipping node(1)'s pointer.",
      howToHandle: "Always save next_node first: next_node=node(2), then curr.next=None, prev=node(1), curr=node(2).",
    },
    {
      title: "Forgetting to copy next",
      input: "head = [1, 2, 3, ...]",
      explanation: "If you set curr.next = prev BEFORE saving next_node, you permanently lose access to the rest of the list.",
      whatBreaks: "The rest of the list is unreachable — you can only reverse the first node.",
      howToHandle: "ALWAYS: (1) save next_node, (2) flip pointer, (3) advance. Order is critical.",
    },
  ],
  keyInsights: [
    "Always save next_node BEFORE changing curr.next or you lose the rest of the list.",
    "prev starts as None — the original head becomes the new tail, pointing to null.",
    "Three pointers: prev, curr, next_node — all must be tracked simultaneously.",
    "O(n) time, O(1) space — no extra data structure needed, just pointer manipulation.",
    "The loop ends when curr becomes None, meaning we've processed every node.",
  ],
  commonMistakes: [
    "Overwriting curr.next before saving next_node — destroys the rest of the list.",
    "Returning curr instead of prev — curr is None when loop exits, prev is the new head.",
    "Not initializing prev = None — the new tail must point to null.",
    "Forgetting to advance curr after reversing — causes infinite loop on the same node.",
  ],
};

// ─── Pattern 7: Trees ────────────────────────────────────────────────────────

const trees: PatternVisualization = {
  patternSlug: "trees",
  title: "Trees",
  problemTitle: "Maximum Depth of Binary Tree",
  problemInput: "tree = [3, 9, 20, null, null, 15, 7]",
  templateCode: [
    "def maxDepth(root):",
    "    if not root:",
    "        return 0",
    "    left = maxDepth(root.left)",
    "    right = maxDepth(root.right)",
    "    return 1 + max(left, right)",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Start at root = 3",
      description:
        "Begin DFS at the root node (value 3). The recursive call maxDepth(3) is placed on the call stack. We will explore left subtree first, then right.",
      codeLineIndex: 0,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["current", "default", "default", "eliminated", "eliminated", "default", "default"],
        labels: ["root", "L", "R", "", "", "RL", "RR"],
      },
      stack: { items: ["maxDepth(3)"] },
      variables: [
        { name: "current_node", value: 3 },
        { name: "depth", value: "?" },
      ],
    },
    {
      stepNumber: 1,
      title: "Recurse left: maxDepth(9)",
      description:
        "Root is not null, so we recurse on root.left = node(9). A new call frame maxDepth(9) is pushed onto the call stack. Node 9 has no children (both null).",
      codeLineIndex: 3,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "current", "default", "eliminated", "eliminated", "default", "default"],
        labels: ["", "curr", "", "", "", "", ""],
      },
      stack: { items: ["maxDepth(3)", "maxDepth(9)"] },
      variables: [
        { name: "current_node", value: 9 },
        { name: "left_depth", value: "?" },
        { name: "right_depth", value: "?" },
      ],
    },
    {
      stepNumber: 2,
      title: "Node 9: both children null → return 1",
      description:
        "Node 9 has no children. maxDepth(null) returns 0 for both left and right. So maxDepth(9) = 1 + max(0, 0) = 1. Pop maxDepth(9) from call stack, return 1 to maxDepth(3).",
      codeLineIndex: 5,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "default", "eliminated", "eliminated", "default", "default"],
        labels: ["", "depth=1", "", "", "", "", ""],
      },
      stack: { items: ["maxDepth(3)"] },
      variables: [
        { name: "node", value: 9 },
        { name: "left_depth", value: 0 },
        { name: "right_depth", value: 0 },
        { name: "return", value: "1 + max(0,0) = 1" },
      ],
    },
    {
      stepNumber: 3,
      title: "Back at node 3: recurse right to maxDepth(20)",
      description:
        "left = 1 is stored. Now recurse on root.right = node(20). Push maxDepth(20) onto call stack. Node 20 has two children: 15 (left) and 7 (right).",
      codeLineIndex: 4,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "current", "eliminated", "eliminated", "default", "default"],
        labels: ["", "done", "curr", "", "", "", ""],
      },
      stack: { items: ["maxDepth(3)", "maxDepth(20)"] },
      variables: [
        { name: "current_node", value: 20 },
        { name: "left_depth (from 9)", value: 1 },
      ],
    },
    {
      stepNumber: 4,
      title: "Recurse left from 20 to maxDepth(15)",
      description:
        "Node 20 recurses left to node(15). Push maxDepth(15). Node 15 has no children.",
      codeLineIndex: 3,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "window", "eliminated", "eliminated", "current", "default"],
        labels: ["", "", "", "", "", "curr", ""],
      },
      stack: { items: ["maxDepth(3)", "maxDepth(20)", "maxDepth(15)"] },
      variables: [
        { name: "current_node", value: 15 },
      ],
    },
    {
      stepNumber: 5,
      title: "Node 15: return 1",
      description:
        "Node 15 has no children. Returns 1 + max(0,0) = 1. Pop maxDepth(15), return 1 to maxDepth(20).",
      codeLineIndex: 5,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "window", "eliminated", "eliminated", "found", "default"],
        labels: ["", "", "", "", "", "depth=1", ""],
      },
      stack: { items: ["maxDepth(3)", "maxDepth(20)"] },
      variables: [
        { name: "node", value: 15 },
        { name: "return", value: 1 },
      ],
    },
    {
      stepNumber: 6,
      title: "Recurse right from 20 to maxDepth(7)",
      description:
        "Node 20's left = 1. Now recurse right to node(7). Push maxDepth(7). Node 7 has no children.",
      codeLineIndex: 4,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "window", "eliminated", "eliminated", "found", "current"],
        labels: ["", "", "", "", "", "", "curr"],
      },
      stack: { items: ["maxDepth(3)", "maxDepth(20)", "maxDepth(7)"] },
      variables: [
        { name: "current_node", value: 7 },
      ],
    },
    {
      stepNumber: 7,
      title: "Node 7 returns 1 → maxDepth(20) = 2",
      description:
        "Node 7 returns 1. Back in maxDepth(20): left=1, right=1. maxDepth(20) = 1 + max(1,1) = 2. Pop maxDepth(20), return 2 to maxDepth(3).",
      codeLineIndex: 5,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["window", "found", "found", "eliminated", "eliminated", "found", "found"],
        labels: ["", "", "depth=2", "", "", "", ""],
      },
      stack: { items: ["maxDepth(3)"] },
      variables: [
        { name: "node", value: 20 },
        { name: "left_depth", value: 1 },
        { name: "right_depth", value: 1 },
        { name: "return", value: "1 + max(1,1) = 2" },
      ],
    },
    {
      stepNumber: 8,
      title: "maxDepth(3) = 1 + max(1, 2) = 3",
      description:
        "Back at root. left_depth = 1 (from node 9), right_depth = 2 (from node 20). maxDepth(3) = 1 + max(1, 2) = 3. The tree has maximum depth 3.",
      codeLineIndex: 5,
      array: {
        values: [3, 9, 20, "null", "null", 15, 7],
        colors: ["found", "found", "found", "eliminated", "eliminated", "found", "found"],
        labels: ["depth=3", "", "", "", "", "", ""],
      },
      stack: { items: [] },
      variables: [
        { name: "root", value: 3 },
        { name: "left_depth", value: 1 },
        { name: "right_depth", value: 2 },
        { name: "return", value: "1 + max(1,2) = 3" },
      ],
      result: "Maximum depth = 3",
    },
  ],
  edgeCases: [
    {
      title: "Empty tree",
      input: "root = None",
      explanation: "No nodes exist.",
      whatBreaks: "Accessing root.left or root.right on null would crash.",
      howToHandle: "Base case: if not root: return 0. Handles null immediately.",
    },
    {
      title: "Single node",
      input: "root = [1]",
      explanation: "Only the root, depth is 1.",
      whatBreaks: "Both children are null, recursion returns 0 for both sides.",
      howToHandle: "1 + max(0, 0) = 1. Correct.",
    },
    {
      title: "Skewed tree (all left children)",
      input: "root = [1, 2, null, 3, null, ...]",
      explanation: "Degenerates into a linked list. Depth = n.",
      whatBreaks: "O(n) recursive call stack depth — risk of stack overflow for very large n.",
      howToHandle: "Use iterative BFS/DFS with an explicit stack to avoid call stack limits.",
    },
    {
      title: "Balanced vs unbalanced",
      input: "Any tree shape",
      explanation: "Same algorithm regardless of shape — recursion handles it naturally.",
      whatBreaks: "Nothing — the algorithm is shape-agnostic.",
      howToHandle: "The recurrence always picks the deeper subtree via max(left, right).",
    },
  ],
  keyInsights: [
    "Tree problems = solve for one node, trust recursion for the subtrees.",
    "Base case: null node returns 0 — this is what terminates the recursion.",
    "Every node contributes exactly +1 to the depth of its subtree.",
    "DFS naturally explores depth-first, perfect for depth-related problems.",
    "Return values propagate bottom-up through the call stack — leaves return first.",
  ],
  commonMistakes: [
    "Forgetting the base case `if not root: return 0` — causes AttributeError on null.left.",
    "Returning max(left, right) instead of 1 + max(left, right) — forgets to count the current node.",
    "Using BFS (level-order) when DFS is simpler — both work but DFS code is shorter for depth.",
    "Not handling the case where one child is null and the other is not — max handles this correctly.",
  ],
};

// ─── Pattern 8: Backtracking ─────────────────────────────────────────────────

const backtracking: PatternVisualization = {
  patternSlug: "backtracking",
  title: "Backtracking",
  problemTitle: "Subsets",
  problemInput: "nums = [1, 2, 3]",
  templateCode: [
    "def subsets(nums):",
    "    result = []",
    "    def backtrack(start, current):",
    "        result.append(current[:])",
    "        for i in range(start, len(nums)):",
    "            current.append(nums[i])",
    "            backtrack(i + 1, current)",
    "            current.pop()",
    "    backtrack(0, [])",
    "    return result",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Start: current=[], add [] to result",
      description:
        "Call backtrack(0, []). First action: append a COPY of current (empty list) to result. result = [[]]. Then enter the for loop starting at index 0.",
      codeLineIndex: 3,
      array: {
        values: ["[ ]"],
        colors: ["found"],
        labels: ["current"],
      },
      stack: { items: ["result: [[]]"] },
      variables: [
        { name: "start", value: 0 },
        { name: "current", value: "[]" },
      ],
    },
    {
      stepNumber: 1,
      title: "Try nums[0]=1 → current=[1], add [1]",
      description:
        "Append nums[0]=1 to current → current=[1]. Recurse: backtrack(1, [1]). Immediately append copy → result=[[], [1]].",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["current", "default", "default"],
        labels: ["i=0", "", ""],
      },
      stack: { items: ["result: [[], [1]]", "backtrack(1,[1])"] },
      variables: [
        { name: "start", value: 1 },
        { name: "current", value: "[1]" },
        { name: "depth", value: 1 },
      ],
    },
    {
      stepNumber: 2,
      title: "Try nums[1]=2 → current=[1,2], add [1,2]",
      description:
        "Inside backtrack(1,[1]): append nums[1]=2 → current=[1,2]. Recurse backtrack(2,[1,2]). Append copy → result=[[], [1], [1,2]].",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["found", "current", "default"],
        labels: ["", "i=1", ""],
      },
      stack: { items: ["result: [[], [1], [1,2]]", "backtrack(2,[1,2])"] },
      variables: [
        { name: "start", value: 2 },
        { name: "current", value: "[1,2]" },
      ],
    },
    {
      stepNumber: 3,
      title: "Try nums[2]=3 → current=[1,2,3], add [1,2,3]",
      description:
        "Inside backtrack(2,[1,2]): append nums[2]=3 → current=[1,2,3]. Recurse backtrack(3,[1,2,3]). Append copy → result includes [1,2,3]. for loop in backtrack(3) has no iterations (start=3 = len).",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["found", "found", "current"],
        labels: ["", "", "i=2"],
      },
      stack: { items: ["result: [..., [1,2,3]]", "backtrack(3,[1,2,3])"] },
      variables: [
        { name: "start", value: 3 },
        { name: "current", value: "[1,2,3]" },
      ],
    },
    {
      stepNumber: 4,
      title: "BACKTRACK: pop 3 → current=[1,2]",
      description:
        "backtrack(3) returns. current.pop() removes 3 → current=[1,2]. The for loop in backtrack(2) has no more iterations (only i=2 was in range(2,3)). Return to backtrack(1).",
      codeLineIndex: 7,
      array: {
        values: [1, 2, 3],
        colors: ["found", "found", "eliminated"],
        labels: ["", "", "popped"],
      },
      stack: { items: ["result: 4 subsets so far", "backtrack(1,[1])"] },
      variables: [
        { name: "action", value: "pop() → [1,2]→[1]" },
        { name: "current", value: "[1]" },
      ],
    },
    {
      stepNumber: 5,
      title: "Try nums[2]=3 → [1,3], add [1,3]. Then BACKTRACK",
      description:
        "Back in backtrack(1,[1]): next i=2. Append nums[2]=3 → current=[1,3]. Recurse → add [1,3] to result. Then pop 3 and pop 1 — fully backtrack to current=[].",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["found", "eliminated", "current"],
        labels: ["", "", "i=2"],
      },
      stack: { items: ["result: [..., [1,3]]", "backtrack(0,[])"] },
      variables: [
        { name: "current", value: "[1,3] → pop → [1] → pop → []" },
      ],
    },
    {
      stepNumber: 6,
      title: "Try nums[1]=2 → current=[2], add [2]",
      description:
        "Back in backtrack(0,[]): i=1 (we already did i=0). Append nums[1]=2 → current=[2]. Recurse → add [2]. Then explore [2,3] and add [2,3].",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["eliminated", "current", "default"],
        labels: ["done", "i=1", ""],
      },
      stack: { items: ["result: [..., [2], [2,3]]", "backtrack(2,[2])"] },
      variables: [
        { name: "start", value: 1 },
        { name: "current", value: "[2]" },
      ],
    },
    {
      stepNumber: 7,
      title: "Try nums[2]=3 → current=[3], add [3]",
      description:
        "After backtracking from [2,3]: back at backtrack(0,[]). i=2. Append nums[2]=3 → current=[3]. Recurse → add [3]. No further elements. All 2^3 = 8 subsets found!",
      codeLineIndex: 5,
      array: {
        values: [1, 2, 3],
        colors: ["eliminated", "eliminated", "current"],
        labels: ["done", "done", "i=2"],
      },
      stack: { items: ["result: 7 subsets...", "backtrack(3,[3])"] },
      variables: [
        { name: "current", value: "[3]" },
        { name: "start", value: 2 },
      ],
    },
    {
      stepNumber: 8,
      title: "All backtracking complete",
      description:
        "Pop 3 from current → current=[]. The outer for loop in backtrack(0,[]) is done (i went 0,1,2). All 8 subsets have been collected.",
      codeLineIndex: 7,
      array: {
        values: [1, 2, 3],
        colors: ["found", "found", "found"],
        labels: ["done", "done", "done"],
      },
      stack: { items: ["[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]"] },
      variables: [
        { name: "result size", value: "2^3 = 8 subsets" },
      ],
      result: "Result: [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]",
    },
    {
      stepNumber: 9,
      title: "Why current[:] is essential",
      description:
        "If you write result.append(current) instead of result.append(current[:]), you store a reference to the same list object. Every later pop/append will retroactively change all stored subsets — they all end up empty. Always copy!",
      codeLineIndex: 3,
      array: {
        values: ["current[:]", "current"],
        colors: ["found", "duplicate"],
        labels: ["CORRECT", "WRONG"],
      },
      stack: { items: ["current[:] = snapshot copy", "current = same reference!"] },
      variables: [
        { name: "current[:]", value: "creates new list" },
        { name: "current", value: "same object — DANGER" },
      ],
      isEdgeCase: true,
      edgeCaseNote: "result.append(current) stores a reference. After pop(), all entries in result reflect the mutation. Always use current[:] to snapshot.",
    },
  ],
  edgeCases: [
    {
      title: "Empty input array",
      input: "nums = []",
      explanation: "No elements to include or exclude.",
      whatBreaks: "backtrack(0,[]) immediately appends [] and the for loop has no iterations.",
      howToHandle: "Returns [[]] — the single subset of an empty set is the empty subset.",
    },
    {
      title: "Duplicates in input",
      input: "nums = [1, 2, 2]",
      explanation: "Without handling, [1,2] appears twice (once using each '2').",
      whatBreaks: "Result has duplicate subsets.",
      howToHandle: "Sort nums first, then skip if i > start and nums[i] == nums[i-1] inside the loop.",
    },
    {
      title: "Power set size",
      input: "nums with n=20",
      explanation: "2^20 = ~1 million subsets. 2^30 = ~1 billion — exponential explosion.",
      whatBreaks: "Time and memory blow up for large n.",
      howToHandle: "Backtracking is inherently O(n * 2^n). Only feasible for small n (typically n ≤ 20).",
    },
    {
      title: "Forgetting current[:]",
      input: "result.append(current) instead of current[:]",
      explanation: "Appends a reference to the mutable list, not a snapshot.",
      whatBreaks: "All result entries reflect the final (empty) state of current.",
      howToHandle: "Always use current[:] or list(current) to create an independent copy.",
    },
  ],
  keyInsights: [
    "Backtracking = try an option, recurse, then undo (pop) to try the next option.",
    "ALWAYS undo (pop) after the recursive call returns — this restores state for the next branch.",
    "current[:] creates a COPY of the list — appending current directly stores a reference that changes.",
    "The start index prevents revisiting earlier elements, avoiding duplicate subsets.",
    "Time complexity is O(n * 2^n) — 2^n subsets, each requiring O(n) to copy.",
  ],
  commonMistakes: [
    "Appending current without [:] — all stored subsets end up pointing to the same (final empty) list.",
    "Forgetting to pop after recursion — current grows indefinitely, subsets are wrong.",
    "Starting for loop at 0 each time instead of start — generates duplicate subsets.",
    "Not understanding that the append happens BEFORE the loop, capturing the current subset at each call.",
  ],
};

// ─── Pattern 9: Heap / Priority Queue ────────────────────────────────────────

const heapPriorityQueue: PatternVisualization = {
  patternSlug: "heap-priority-queue",
  title: "Heap / Priority Queue",
  problemTitle: "Kth Largest Element in an Array",
  problemInput: "nums = [3, 2, 1, 5, 6, 4], k = 3",
  templateCode: [
    "import heapq",
    "def findKthLargest(nums, k):",
    "    heap = []",
    "    for num in nums:",
    "        heapq.heappush(heap, num)",
    "        if len(heap) > k:",
    "            heapq.heappop(heap)",
    "    return heap[0]",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize: heap=[], k=3",
      description:
        "We maintain a min-heap of size at most k. The key insight: if we keep only the k largest elements seen so far, the smallest of them (the heap root) IS the kth largest. Start with an empty heap.",
      codeLineIndex: 2,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["default", "default", "default", "default", "default", "default"],
        labels: ["0", "1", "2", "3", "4", "5"],
      },
      stack: { items: ["heap: []"] },
      variables: [
        { name: "k", value: 3 },
        { name: "heap_size", value: 0 },
      ],
    },
    {
      stepNumber: 1,
      title: "Push 3 → heap=[3], size=1 ≤ k",
      description:
        "Push nums[0]=3 onto the min-heap. heap=[3]. Size is 1, which is ≤ k=3. No pop needed. The heap root is 3.",
      codeLineIndex: 4,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["current", "default", "default", "default", "default", "default"],
        labels: ["→push", "", "", "", "", ""],
      },
      stack: { items: ["heap: [3]", "size=1 ≤ k, keep"] },
      variables: [
        { name: "num", value: 3 },
        { name: "heap_size", value: 1 },
        { name: "heap[0] (min)", value: 3 },
      ],
    },
    {
      stepNumber: 2,
      title: "Push 2 → heap=[2,3], size=2 ≤ k",
      description:
        "Push nums[1]=2. Min-heap property: smallest is at root. heap=[2,3]. Size 2 ≤ k=3. No pop. Both elements fit within our k-largest window.",
      codeLineIndex: 4,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["window", "current", "default", "default", "default", "default"],
        labels: ["", "→push", "", "", "", ""],
      },
      stack: { items: ["heap: [2, 3]", "size=2 ≤ k, keep"] },
      variables: [
        { name: "num", value: 2 },
        { name: "heap_size", value: 2 },
        { name: "heap[0] (min)", value: 2 },
      ],
    },
    {
      stepNumber: 3,
      title: "Push 1 → heap=[1,2,3], size=3 = k",
      description:
        "Push nums[2]=1. heap=[1,2,3]. Size 3 = k. At capacity — no pop yet. The heap root is 1 (the minimum of the 3 largest seen so far, which happens to include all 3 numbers).",
      codeLineIndex: 4,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["window", "window", "current", "default", "default", "default"],
        labels: ["", "", "→push", "", "", ""],
      },
      stack: { items: ["heap: [1, 2, 3]", "size=3 = k, at capacity"] },
      variables: [
        { name: "num", value: 1 },
        { name: "heap_size", value: 3 },
        { name: "heap[0] (kth largest?)", value: 1 },
      ],
    },
    {
      stepNumber: 4,
      title: "Push 5 → size=4 > k → pop min(1). heap=[2,3,5]",
      description:
        "Push nums[3]=5. heap=[1,2,3,5]. Size 4 > k=3. Pop the minimum (1) — it's too small to be in the top 3. heap=[2,3,5]. Now heap[0]=2 is the 3rd largest seen so far.",
      codeLineIndex: 5,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["window", "window", "eliminated", "current", "default", "default"],
        labels: ["", "", "popped", "→push", "", ""],
      },
      stack: { items: ["heap: [2, 3, 5]", "popped 1 (too small)", "size=3 ≤ k now"] },
      variables: [
        { name: "num", value: 5 },
        { name: "popped", value: 1 },
        { name: "heap_size", value: 3 },
        { name: "heap[0] (3rd largest)", value: 2 },
      ],
    },
    {
      stepNumber: 5,
      title: "Push 6 → pop min(2). heap=[3,5,6]",
      description:
        "Push nums[4]=6. Size becomes 4 > k. Pop minimum (2). heap=[3,5,6]. Now we have the 3 largest elements seen: 3, 5, 6. heap[0]=3 is the 3rd largest.",
      codeLineIndex: 5,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["window", "eliminated", "eliminated", "window", "current", "default"],
        labels: ["", "popped", "", "", "→push", ""],
      },
      stack: { items: ["heap: [3, 5, 6]", "popped 2", "3rd largest so far = 3"] },
      variables: [
        { name: "num", value: 6 },
        { name: "popped", value: 2 },
        { name: "heap[0] (3rd largest)", value: 3 },
      ],
    },
    {
      stepNumber: 6,
      title: "Push 4 → pop min(3). heap=[4,5,6]",
      description:
        "Push nums[5]=4. Size 4 > k. Pop minimum (3). heap=[4,5,6]. The 3 largest of all 6 elements are now 4, 5, 6. heap[0]=4 is the 3rd largest overall.",
      codeLineIndex: 5,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["eliminated", "eliminated", "eliminated", "window", "window", "current"],
        labels: ["popped", "", "", "", "", "→push"],
      },
      stack: { items: ["heap: [4, 5, 6]", "popped 3", "3rd largest = 4"] },
      variables: [
        { name: "num", value: 4 },
        { name: "popped", value: 3 },
        { name: "heap[0] (3rd largest)", value: 4 },
      ],
    },
    {
      stepNumber: 7,
      title: "Return heap[0] = 4 — the 3rd largest",
      description:
        "Loop complete. The heap contains the k=3 largest elements: [4, 5, 6]. The root heap[0]=4 is the SMALLEST of these k largest values — that is exactly the kth largest element. Return 4.",
      codeLineIndex: 7,
      array: {
        values: [3, 2, 1, 5, 6, 4],
        colors: ["eliminated", "eliminated", "eliminated", "found", "found", "found"],
        labels: ["", "", "", "3rd", "1st", "2nd"],
      },
      stack: { items: ["heap: [4, 5, 6]", "heap[0] = 4 = answer"] },
      variables: [
        { name: "k", value: 3 },
        { name: "heap[0]", value: 4 },
        { name: "top-3", value: "4, 5, 6" },
      ],
      result: "3rd largest = 4",
    },
  ],
  edgeCases: [
    {
      title: "k = 1 (find maximum)",
      input: "nums = [3,1,4,1,5,9], k = 1",
      explanation: "Heap of size 1 keeps only the current maximum.",
      whatBreaks: "Nothing — algorithm works, always popping the smaller element until only the max remains.",
      howToHandle: "heap[0] after processing is the maximum. Equivalent to max(nums) but with O(n log 1) = O(n).",
    },
    {
      title: "k = n (find minimum)",
      input: "nums = [3,1,4], k = 3",
      explanation: "Heap never exceeds size k=n, so no pops occur.",
      whatBreaks: "The heap root is the minimum of all elements.",
      howToHandle: "heap[0] is the minimum. Correct — kth largest when k=n is the smallest element.",
    },
    {
      title: "Duplicate elements",
      input: "nums = [3,3,3,3,3], k = 2",
      explanation: "All elements are the same.",
      whatBreaks: "Nothing — heapq handles duplicates correctly.",
      howToHandle: "heap ends as [3,3], heap[0]=3. Correct.",
    },
    {
      title: "heapq is min-heap only",
      input: "Need kth smallest instead",
      explanation: "Python heapq only provides min-heap. For max-heap, negate values.",
      whatBreaks: "heapq.heappush(heap, -num) and negate on return to get a max-heap.",
      howToHandle: "For kth smallest: use heapq directly. For kth largest: either negate or use this min-heap-of-size-k approach.",
    },
  ],
  keyInsights: [
    "A min-heap of size k keeps exactly the k largest elements seen — the root is the kth largest.",
    "When heap size exceeds k, pop the minimum — it's too small to be in the top k.",
    "O(n log k) time: n pushes and pops each costing O(log k) — better than O(n log n) sort when k << n.",
    "Python heapq is always a min-heap. Negate values to simulate max-heap behavior.",
    "Heap invariant: parent ≤ children (for min-heap) ensures O(log n) push and pop.",
  ],
  commonMistakes: [
    "Using a max-heap of size n and popping k times — O(n + k log n), works but wasteful.",
    "Forgetting to check len(heap) > k before popping — index errors on empty heap.",
    "Returning heap[-1] (max of heap) instead of heap[0] (min, which is the kth largest).",
    "Using sorted(nums)[-k] — correct but O(n log n), misses the O(n log k) heap optimization.",
  ],
};

// ─── Pattern 10: Graphs ──────────────────────────────────────────────────────

const graphs: PatternVisualization = {
  patternSlug: "graphs",
  title: "Graphs",
  problemTitle: "Number of Islands",
  problemInput: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]',
  templateCode: [
    "def numIslands(grid):",
    "    if not grid: return 0",
    "    islands = 0",
    "    def dfs(r, c):",
    "        if r<0 or r>=len(grid): return",
    "        if c<0 or c>=len(grid[0]): return",
    "        if grid[r][c] != '1': return",
    "        grid[r][c] = '0'",
    "        dfs(r+1,c); dfs(r-1,c)",
    "        dfs(r,c+1); dfs(r,c-1)",
    "    for r in range(len(grid)):",
    "        for c in range(len(grid[0])):",
    "            if grid[r][c] == '1':",
    "                islands += 1; dfs(r, c)",
    "    return islands",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Start scanning: islands=0",
      description:
        "Initialize islands=0. We scan every cell row by row. When we find an unvisited '1', we count a new island and DFS to mark all connected land cells.",
      codeLineIndex: 2,
      grid: {
        cells: [["1","1","0"],["1","0","0"],["0","0","1"]],
        colors: [
          ["default","default","eliminated"],
          ["default","eliminated","eliminated"],
          ["eliminated","eliminated","default"],
        ],
      },
      variables: [
        { name: "islands", value: 0 },
        { name: "scanning", value: "(0,0)" },
      ],
    },
    {
      stepNumber: 1,
      title: "(0,0)='1' → islands=1, start DFS",
      description:
        "Cell (0,0) is '1'. Increment islands to 1. Call dfs(0,0): mark (0,0) as visited by changing it to '0'. Then recursively visit all 4 neighbors.",
      codeLineIndex: 13,
      grid: {
        cells: [["0","1","0"],["1","0","0"],["0","0","1"]],
        colors: [
          ["current","default","eliminated"],
          ["default","eliminated","eliminated"],
          ["eliminated","eliminated","default"],
        ],
      },
      variables: [
        { name: "islands", value: 1 },
        { name: "dfs at", value: "(0,0)" },
        { name: "marking", value: "(0,0) → '0'" },
      ],
    },
    {
      stepNumber: 2,
      title: "DFS visits (0,1)='1', marks visited",
      description:
        "From (0,0), DFS checks right neighbor (0,1)='1'. Mark it '0' (visited). Continue DFS from (0,1): check its neighbors.",
      codeLineIndex: 7,
      grid: {
        cells: [["0","0","0"],["1","0","0"],["0","0","1"]],
        colors: [
          ["found","current","eliminated"],
          ["default","eliminated","eliminated"],
          ["eliminated","eliminated","default"],
        ],
      },
      variables: [
        { name: "islands", value: 1 },
        { name: "dfs at", value: "(0,1)" },
        { name: "marking", value: "(0,1) → '0'" },
      ],
    },
    {
      stepNumber: 3,
      title: "DFS visits (1,0)='1', marks visited",
      description:
        "From (0,0)'s down neighbor: (1,0)='1'. Mark it '0'. (0,1)'s other neighbors: (0,2)='0' skip, (1,1)='0' skip. (1,0)'s neighbors: (2,0)='0', (1,1)='0', (0,0)='0' — all skip.",
      codeLineIndex: 7,
      grid: {
        cells: [["0","0","0"],["0","0","0"],["0","0","1"]],
        colors: [
          ["found","found","eliminated"],
          ["current","eliminated","eliminated"],
          ["eliminated","eliminated","default"],
        ],
      },
      variables: [
        { name: "islands", value: 1 },
        { name: "dfs at", value: "(1,0)" },
        { name: "marking", value: "(1,0) → '0'" },
      ],
    },
    {
      stepNumber: 4,
      title: "Island 1 complete — DFS returns",
      description:
        "All cells connected to (0,0) have been visited and marked. DFS unwinds. The first island (cells (0,0), (0,1), (1,0)) is fully explored.",
      codeLineIndex: 10,
      grid: {
        cells: [["0","0","0"],["0","0","0"],["0","0","1"]],
        colors: [
          ["found","found","eliminated"],
          ["found","eliminated","eliminated"],
          ["eliminated","eliminated","default"],
        ],
      },
      variables: [
        { name: "islands", value: 1 },
        { name: "island 1", value: "(0,0),(0,1),(1,0) done" },
      ],
    },
    {
      stepNumber: 5,
      title: "Continue scanning: all '0' until (2,2)",
      description:
        "Scanner continues: (0,2)='0', (1,0)='0'(visited), (1,1)='0', (1,2)='0', (2,0)='0', (2,1)='0' — all skip. Finally reach (2,2)='1'.",
      codeLineIndex: 12,
      grid: {
        cells: [["0","0","0"],["0","0","0"],["0","0","1"]],
        colors: [
          ["found","found","eliminated"],
          ["found","eliminated","eliminated"],
          ["eliminated","eliminated","current"],
        ],
      },
      variables: [
        { name: "islands", value: 1 },
        { name: "scanning", value: "(2,2)" },
        { name: "found '1'?", value: "YES at (2,2)" },
      ],
    },
    {
      stepNumber: 6,
      title: "(2,2)='1' → islands=2, DFS marks it",
      description:
        "Cell (2,2) is '1'. Increment islands to 2. Call dfs(2,2): mark as '0'. All 4 neighbors are out-of-bounds or '0'. DFS returns immediately.",
      codeLineIndex: 13,
      grid: {
        cells: [["0","0","0"],["0","0","0"],["0","0","0"]],
        colors: [
          ["found","found","eliminated"],
          ["found","eliminated","eliminated"],
          ["eliminated","eliminated","found"],
        ],
      },
      variables: [
        { name: "islands", value: 2 },
        { name: "dfs at", value: "(2,2)" },
        { name: "island 2", value: "just (2,2)" },
      ],
    },
    {
      stepNumber: 7,
      title: "Scan complete — return islands=2",
      description:
        "All cells processed. Found 2 islands. DFS 'sank' each island by marking connected '1' cells as '0', preventing double-counting. Time O(m*n), Space O(m*n) for recursion stack.",
      codeLineIndex: 14,
      grid: {
        cells: [["0","0","0"],["0","0","0"],["0","0","0"]],
        colors: [
          ["found","found","eliminated"],
          ["found","eliminated","eliminated"],
          ["eliminated","eliminated","found"],
        ],
      },
      variables: [
        { name: "islands", value: 2 },
        { name: "cells scanned", value: "all 9" },
      ],
      result: "Number of islands = 2",
    },
  ],
  edgeCases: [
    {
      title: "Empty grid",
      input: "grid = []",
      explanation: "No cells to process.",
      whatBreaks: "Iterating on empty grid would immediately return.",
      howToHandle: "Guard: if not grid: return 0.",
    },
    {
      title: "All water",
      input: 'grid = [["0","0"],["0","0"]]',
      explanation: "No land cells — no islands.",
      whatBreaks: "The inner if never triggers.",
      howToHandle: "islands stays 0, returned correctly.",
    },
    {
      title: "All land",
      input: 'grid = [["1","1"],["1","1"]]',
      explanation: "All cells are connected land — one giant island.",
      whatBreaks: "DFS from (0,0) visits all cells, marking them all '0'. Counter increments once.",
      howToHandle: "Returns 1. Correct.",
    },
    {
      title: "Diagonal cells NOT connected",
      input: '[["1","0"],["0","1"]]',
      explanation: "Diagonally adjacent cells are not connected in 4-directional DFS.",
      whatBreaks: "Naive 8-directional DFS would connect diagonals and return 1 instead of 2.",
      howToHandle: "Only call dfs(r+1,c), dfs(r-1,c), dfs(r,c+1), dfs(r,c-1) — 4 directions only.",
    },
  ],
  keyInsights: [
    "Grid problems are graph problems — each cell is a node, edges connect adjacent cells.",
    "DFS 'sinks' each island by changing '1'→'0', preventing revisiting and infinite loops.",
    "Without marking visited, the DFS would ping-pong between neighbors infinitely.",
    "Only 4-directional connectivity (up/down/left/right), NOT diagonal.",
    "Time O(m*n), Space O(m*n) for the recursion stack in the worst case.",
  ],
  commonMistakes: [
    "Forgetting to mark the cell visited (grid[r][c]='0') before recursing — causes infinite DFS loops.",
    "Using 8-directional DFS — diagonals should not connect islands per the problem definition.",
    "Not checking bounds (r<0 etc.) before accessing grid[r][c] — causes IndexError.",
    "Using a visited set instead of mutating the grid — both work but mutation is simpler here.",
  ],
};

// ─── Pattern 11: Dynamic Programming ─────────────────────────────────────────

const dynamicProgramming: PatternVisualization = {
  patternSlug: "dynamic-programming",
  title: "Dynamic Programming",
  problemTitle: "Climbing Stairs",
  problemInput: "n = 6",
  templateCode: [
    "def climbStairs(n):",
    "    if n <= 2: return n",
    "    dp = [0] * (n + 1)",
    "    dp[1] = 1",
    "    dp[2] = 2",
    "    for i in range(3, n + 1):",
    "        dp[i] = dp[i-1] + dp[i-2]",
    "    return dp[n]",
  ],
  steps: [
    {
      stepNumber: 0,
      title: "Initialize dp array: all zeros",
      description:
        "n=6. Allocate dp = [0, 0, 0, 0, 0, 0, 0] (indices 0–6). dp[i] will store the number of distinct ways to climb to step i. We fill it bottom-up from small i to large i.",
      codeLineIndex: 2,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 0, 0, 0, 0, 0, 0],
        colors: ["eliminated", "default", "default", "default", "default", "default", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "n", value: 6 },
        { name: "dp", value: "[0,0,0,0,0,0,0]" },
      ],
    },
    {
      stepNumber: 1,
      title: "Base case: dp[1] = 1",
      description:
        "dp[1] = 1. There is exactly 1 way to reach step 1: take a single 1-step from the ground. This is our first base case.",
      codeLineIndex: 3,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 0, 0, 0, 0, 0],
        colors: ["eliminated", "found", "default", "default", "default", "default", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "dp[1]", value: 1 },
        { name: "meaning", value: "1 way: {1}" },
      ],
    },
    {
      stepNumber: 2,
      title: "Base case: dp[2] = 2",
      description:
        "dp[2] = 2. Two ways to reach step 2: (1+1) or (2). This is our second base case — can't use the recurrence yet because it would need dp[0] and dp[1], and dp[0] is unused.",
      codeLineIndex: 4,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 0, 0, 0, 0],
        colors: ["eliminated", "found", "found", "default", "default", "default", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "dp[2]", value: 2 },
        { name: "meaning", value: "2 ways: {1+1}, {2}" },
      ],
    },
    {
      stepNumber: 3,
      title: "i=3: dp[3] = dp[2] + dp[1] = 2+1 = 3",
      description:
        "To reach step 3, you either came from step 2 (dp[2]=2 ways) or step 1 (dp[1]=1 way). Total: 3 ways. Recurrence: dp[i] = dp[i-1] + dp[i-2].",
      codeLineIndex: 6,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 3, 0, 0, 0],
        colors: ["eliminated", "current", "current", "found", "default", "default", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "i", value: 3 },
        { name: "dp[i-1]", value: 2 },
        { name: "dp[i-2]", value: 1 },
        { name: "dp[3]", value: 3 },
      ],
    },
    {
      stepNumber: 4,
      title: "i=4: dp[4] = dp[3] + dp[2] = 3+2 = 5",
      description:
        "To reach step 4: from step 3 (3 ways) or from step 2 (2 ways). dp[4] = 5. Notice: these are Fibonacci numbers! dp[n] = Fib(n+1).",
      codeLineIndex: 6,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 3, 5, 0, 0],
        colors: ["eliminated", "found", "current", "current", "found", "default", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "i", value: 4 },
        { name: "dp[i-1]", value: 3 },
        { name: "dp[i-2]", value: 2 },
        { name: "dp[4]", value: 5 },
      ],
    },
    {
      stepNumber: 5,
      title: "i=5: dp[5] = dp[4] + dp[3] = 5+3 = 8",
      description:
        "dp[5] = dp[4] + dp[3] = 5 + 3 = 8. The Fibonacci pattern continues: 1, 2, 3, 5, 8, 13...",
      codeLineIndex: 6,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 3, 5, 8, 0],
        colors: ["eliminated", "found", "found", "current", "current", "found", "default"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "i", value: 5 },
        { name: "dp[i-1]", value: 5 },
        { name: "dp[i-2]", value: 3 },
        { name: "dp[5]", value: 8 },
      ],
    },
    {
      stepNumber: 6,
      title: "i=6: dp[6] = dp[5] + dp[4] = 8+5 = 13",
      description:
        "dp[6] = dp[5] + dp[4] = 8 + 5 = 13. All 7 cells are now filled. dp[6] is our answer.",
      codeLineIndex: 6,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 3, 5, 8, 13],
        colors: ["eliminated", "found", "found", "found", "current", "current", "found"],
        label: "dp[ ] — ways to reach each step",
      },
      variables: [
        { name: "i", value: 6 },
        { name: "dp[i-1]", value: 8 },
        { name: "dp[i-2]", value: 5 },
        { name: "dp[6]", value: 13 },
      ],
    },
    {
      stepNumber: 7,
      title: "Return dp[6] = 13",
      description:
        "Return dp[n] = dp[6] = 13. There are 13 distinct ways to climb 6 stairs taking 1 or 2 steps at a time. Space optimization: since we only ever use the last 2 values, we can reduce to O(1) space using two variables instead of the full array.",
      codeLineIndex: 7,
      dpTable: {
        headers: [0, 1, 2, 3, 4, 5, 6],
        values: [0, 1, 2, 3, 5, 8, 13],
        colors: ["eliminated", "found", "found", "found", "found", "found", "found"],
        label: "dp[ ] — final answer at dp[6]",
      },
      variables: [
        { name: "dp[6]", value: 13 },
        { name: "sequence", value: "1,2,3,5,8,13 = Fibonacci!" },
      ],
      result: "13 ways to climb 6 stairs",
    },
  ],
  edgeCases: [
    {
      title: "n=1",
      input: "n = 1",
      explanation: "Only one step: one 1-step.",
      whatBreaks: "The for loop range(3, 2) is empty, but the base case handles it.",
      howToHandle: "if n <= 2: return n → returns 1. Correct.",
    },
    {
      title: "n=2",
      input: "n = 2",
      explanation: "Two ways: {1,1} or {2}.",
      whatBreaks: "Needs base case before the loop starts.",
      howToHandle: "if n <= 2: return n → returns 2. Correct.",
    },
    {
      title: "This IS the Fibonacci sequence",
      input: "dp[n] for n=1,2,3,...",
      explanation: "dp values: 1, 2, 3, 5, 8, 13, 21... These are Fibonacci(n+1).",
      whatBreaks: "Nothing — this is a mathematical identity, not an edge case.",
      howToHandle: "Can compute directly: return fibonacci(n+1). But DP is cleaner to understand.",
    },
    {
      title: "Space optimization to O(1)",
      input: "Any n",
      explanation: "dp[i] only depends on dp[i-1] and dp[i-2]. Store just two variables.",
      whatBreaks: "Nothing breaks — just an optimization.",
      howToHandle: "prev2=1, prev1=2; then loop: curr=prev1+prev2; prev2=prev1; prev1=curr. Return prev1.",
    },
  ],
  keyInsights: [
    "DP = avoid recomputing by storing results — each subproblem solved once, stored, reused.",
    "Recurrence: dp[i] = dp[i-1] + dp[i-2] (reach step i from one step below or two steps below).",
    "This is literally the Fibonacci sequence — a classic DP pattern.",
    "Bottom-up (tabulation): fill from small to large. Top-down: memoized recursion. Both are valid.",
    "Space optimization: since only last 2 values needed, O(n) array reduces to O(1) two variables.",
  ],
  commonMistakes: [
    "Missing base cases for n=1 and n=2 — the recurrence requires two previous values to exist.",
    "dp array of size n instead of n+1 — off-by-one causes index out-of-bounds.",
    "Confusing top-down (memoization) vs bottom-up (tabulation) — both solve DP, different code style.",
    "Not recognizing the Fibonacci pattern — missing opportunities to connect this to related problems.",
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const visualizations: Record<string, PatternVisualization> = {
  "arrays-hashing": arraysHashing,
  "two-pointers": twoPointers,
  "sliding-window": slidingWindow,
  "stack": stack,
  "binary-search": binarySearch,
  "linked-list": linkedList,
  "trees": trees,
  "backtracking": backtracking,
  "heap-priority-queue": heapPriorityQueue,
  "graphs": graphs,
  "dynamic-programming": dynamicProgramming,
};
