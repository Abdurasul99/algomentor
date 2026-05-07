import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { aiComplete } from "@/lib/ai";
import { repairJson } from "@/lib/jsonRepair";

export const runtime = "nodejs";
export const maxDuration = 90;

function buildPrompt(problemTitle: string, problemDescription: string, short = false): string {
  // Truncate very long descriptions to prevent token overflow
  const maxDescLen = short ? 800 : 1500;
  const desc = problemDescription.length > maxDescLen
    ? problemDescription.slice(0, maxDescLen) + "\n[...truncated]"
    : problemDescription;

  const stepsCount = short ? 3 : 4;

  return `You are an algorithm mentor. Analyze this LeetCode problem and return ONLY valid JSON:

TITLE: ${problemTitle}
DESCRIPTION: ${desc}

Return this exact JSON structure (no markdown, no extra text, strict JSON):
{
  "questions": [
    {"type":"MultipleChoice","question":"What does this problem ask us to do?","options":["A. option1","B. option2","C. option3","D. option4"],"correctIndex":0,"explanation":"Brief explanation"},
    {"type":"FillInGap","question":"Complete: The key insight is to use ___ to achieve O(log n)","answer":"binary search","explanation":"Brief explanation"},
    {"type":"TrueFalse","question":"True or False: [edge case statement]","answer":true,"explanation":"Brief explanation"}
  ],
  "solution":{"keyInsight":"One sentence key insight","steps":["Step 1","Step 2","Step 3"],"timeComplexity":"O(n)","spaceComplexity":"O(1)"},
  "bigO":{"time":"O(n)","timeWhy":"brief reason","space":"O(1)","spaceWhy":"brief reason","optimizeNote":"brief note"},
  "bestApproach":{"name":"Approach Name","pattern":"Pattern","why":"brief why","whenToUse":"brief when"},
  "optimalSolution":{"language":"Python","code":"def solution():\\n    pass","lines":["line explanation 1","line explanation 2"]},
  "alternativeApproach":{"applicable":true,"name":"Alternative Name","description":"brief desc","timeComplexity":"O(n)","spaceComplexity":"O(n)","whenBetter":"brief","tradeoff":"brief"},
  "ru":{"questions":[{"question":"Рус вопрос 1","options":["А. вариант1","Б. вариант2","В. вариант3","Г. вариант4"],"explanation":"Рус объяснение"},{"question":"Рус вопрос 2","answer":"рус ответ","explanation":"Рус объяснение"},{"question":"Верно или Неверно: рус утверждение","explanation":"Рус объяснение"}],"solution":{"keyInsight":"Рус инсайт","steps":["Шаг 1","Шаг 2","Шаг 3"]},"bigO":{"timeWhy":"рус причина","spaceWhy":"рус причина","optimizeNote":"рус заметка"},"bestApproach":{"name":"Рус название","why":"рус почему","whenToUse":"рус когда"},"optimalSolution":{"lines":["рус объяснение 1","рус объяснение 2"]},"alternativeApproach":{"description":"рус описание","whenBetter":"рус когда лучше","tradeoff":"рус компромисс"}}
}

CRITICAL: Output ONLY the JSON. No markdown. No extra text. Keep ALL string values SHORT (under 120 chars each). Valid JSON only.`;
}

async function tryParse(raw: string): Promise<unknown | null> {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(repairJson(raw));
    } catch {
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { problemTitle?: string; problemDescription?: string };
    const { problemTitle = "", problemDescription = "" } = body;

    if (!problemTitle.trim() || !problemDescription.trim()) {
      return NextResponse.json({ error: "problemTitle and problemDescription are required" }, { status: 400 });
    }

    // Attempt 1: full prompt
    let raw = "";
    try {
      raw = await aiComplete([{ role: "user", content: buildPrompt(problemTitle, problemDescription) }], 4000);
    } catch (e) {
      console.error("[problem-help] AI call 1 failed:", e);
    }

    let parsed = await tryParse(raw);

    // Attempt 2: shorter prompt if first failed
    if (!parsed || !(parsed as Record<string, unknown>).questions) {
      console.warn("[problem-help] attempt 1 failed, retrying with shorter prompt");
      try {
        raw = await aiComplete([{ role: "user", content: buildPrompt(problemTitle, problemDescription, true) }], 3000);
        parsed = await tryParse(raw);
      } catch (e) {
        console.error("[problem-help] AI call 2 failed:", e);
      }
    }

    if (!parsed || !(parsed as Record<string, unknown>).questions) {
      console.error("[problem-help] Both attempts failed. Raw snippet:", raw?.slice(0, 300));
      return NextResponse.json({ error: "AI could not generate questions for this problem. Please try again." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[ai/problem-help] unhandled error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
