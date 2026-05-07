import { NextRequest, NextResponse } from "next/server";
import { aiComplete } from "@/lib/ai";
import { repairJson } from "@/lib/jsonRepair";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      code: string;
      language: string;
      problemTitle: string;
      problemDescription: string;
    };

    const { code, language, problemTitle, problemDescription } = body;
    if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const truncatedDesc = problemDescription.slice(0, 800);

    const prompt = `You are a code evaluator. Analyze this ${language} solution for the LeetCode problem.

PROBLEM: ${problemTitle}
DESCRIPTION: ${truncatedDesc}

USER CODE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Evaluate the solution and return ONLY valid JSON (no markdown, no extra text):
{
  "status": "passed" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | "compilation_error",
  "passed": true | false,
  "testResults": [
    {"input": "...", "expected": "...", "actual": "...", "passed": true},
    {"input": "...", "expected": "...", "actual": "...", "passed": true},
    {"input": "edge case", "expected": "...", "actual": "...", "passed": false}
  ],
  "error": null | {"message": "error description", "line": 3, "type": "TypeError"},
  "timeComplexity": "O(n log n)",
  "spaceComplexity": "O(1)",
  "feedback": "Brief feedback: what is correct, what could be improved",
  "hint": "If wrong: one specific hint to fix the issue (not the full solution)"
}

Rules:
- Generate 3 test cases: 2 normal + 1 edge case
- If code has syntax error: status="compilation_error", passed=false, fill error field
- If logic is wrong: status="wrong_answer", passed=false, show what the code would actually output
- If correct: status="passed", passed=true
- Keep all strings short (under 100 chars)
- Valid JSON only`;

    const raw = await aiComplete([{ role: "user", content: prompt }], 1500);

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      try { parsed = JSON.parse(repairJson(raw)); } catch {
        return NextResponse.json({ error: "Could not evaluate code" }, { status: 500 });
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[run-code]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
