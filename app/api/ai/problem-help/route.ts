import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { aiComplete } from "@/lib/ai";
import { repairJson } from "@/lib/jsonRepair";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      problemTitle?: string;
      problemDescription?: string;
    };

    const { problemTitle, problemDescription } = body;

    if (!problemTitle?.trim() || !problemDescription?.trim()) {
      return NextResponse.json(
        { error: "problemTitle and problemDescription are required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert algorithm mentor. A student is studying this LeetCode problem:

TITLE: ${problemTitle}
DESCRIPTION: ${problemDescription}

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:

{
  "questions": [
    {
      "type": "MultipleChoice",
      "question": "Question about what the problem is asking",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "Why A is correct and others are wrong"
    },
    {
      "type": "FillInGap",
      "question": "Complete the key step: [sentence with ___ for the missing word]",
      "answer": "the missing word or short phrase",
      "explanation": "Why this word completes the step correctly"
    },
    {
      "type": "TrueFalse",
      "question": "True or False: [statement about an edge case]",
      "answer": true,
      "explanation": "Why this is true/false"
    }
  ],
  "solution": {
    "keyInsight": "The single most important insight — one sentence that unlocks the problem",
    "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)"
  },
  "bigO": {
    "time": "O(n)",
    "timeWhy": "We iterate through all n intervals exactly once",
    "space": "O(n)",
    "spaceWhy": "Result array can hold at most n intervals",
    "canOptimize": false,
    "optimizeNote": "Already optimal — linear scan is the best possible for this problem"
  },
  "bestApproach": {
    "name": "Linear Scan / Greedy",
    "pattern": "Interval Merging",
    "why": "Since intervals are sorted, we can make greedy decisions: skip intervals before newInterval, merge overlapping ones, then append the rest",
    "whenToUse": "Use this pattern when intervals are sorted and you need to insert/merge"
  },
  "optimalSolution": {
    "language": "Python",
    "code": "def insert(self, intervals, newInterval):\n    result = []\n    i = 0\n    n = len(intervals)\n    # Add all intervals that end before newInterval starts\n    while i < n and intervals[i][1] < newInterval[0]:\n        result.append(intervals[i])\n        i += 1\n    # Merge all overlapping intervals\n    while i < n and intervals[i][0] <= newInterval[1]:\n        newInterval[0] = min(newInterval[0], intervals[i][0])\n        newInterval[1] = max(newInterval[1], intervals[i][1])\n        i += 1\n    result.append(newInterval)\n    # Add remaining intervals\n    while i < n:\n        result.append(intervals[i])\n        i += 1\n    return result",
    "lines": [
      "result = [] — output list",
      "First while: skip intervals ending before newInterval starts (no overlap)",
      "Second while: merge overlapping intervals by expanding newInterval boundaries",
      "result.append(newInterval) — add merged interval",
      "Third while: append all remaining intervals unchanged"
    ]
  },
  "alternativeApproach": {
    "applicable": true,
    "name": "Binary Search + Merge",
    "description": "Use binary search to find insertion position, then merge overlapping neighbors",
    "timeComplexity": "O(n) worst case due to shifting, O(log n) for the search only",
    "spaceComplexity": "O(n)",
    "whenBetter": "Better when the array is very large and the new interval rarely overlaps — saves time on the search",
    "code": "import bisect\ndef insert_bs(intervals, newInterval):\n    start = bisect.bisect_left([x[0] for x in intervals], newInterval[0])\n    # then merge from start-1 outward",
    "tradeoff": "More complex to implement correctly. Linear scan is usually preferred in interviews"
  }
}

Rules: valid JSON only, no trailing commas, actual code in optimalSolution.code using \\n for newlines.`;

    const raw = await aiComplete([{ role: "user", content: prompt }], 3000);

    const repaired = repairJson(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(repaired);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[ai/problem-help] error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
