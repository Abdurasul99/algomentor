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

    const prompt = `You are an algorithm mentor. A student is studying this LeetCode problem:

TITLE: ${problemTitle}
DESCRIPTION: ${problemDescription}

Generate a JSON response with two parts:

1. Three understanding questions to check if they understand the problem:
   - question1: A multiple choice question about what the problem is asking
   - question2: A fill-in-the-gap question about the key algorithm approach
   - question3: A true/false question about an edge case

2. A solution explanation for when they need help

Return ONLY valid JSON:
{
  "questions": [
    {
      "type": "MultipleChoice",
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "Why this is correct..."
    },
    {
      "type": "FillInGap",
      "question": "Complete the key step: ...",
      "answer": "...",
      "explanation": "..."
    },
    {
      "type": "TrueFalse",
      "question": "True or False: ...",
      "answer": false,
      "explanation": "..."
    }
  ],
  "solution": {
    "approach": "Step-by-step approach in 4-5 clear bullet points as a single string",
    "keyInsight": "The one key insight that makes this problem easy",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."]
  }
}`;

    const raw = await aiComplete(
      [{ role: "user", content: prompt }],
      2000
    );

    const repaired = repairJson(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(repaired);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[ai/problem-help] error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
