import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { aiComplete, type ChatMessage } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pattern, difficulty, company } = await req.json() as {
    pattern: string;
    difficulty: string;
    company?: string;
  };

  if (!pattern || !difficulty) {
    return NextResponse.json({ error: "pattern and difficulty are required" }, { status: 400 });
  }

  const prompt = `Generate a FAANG-style coding interview problem for the pattern: ${pattern}. Difficulty: ${difficulty}.${company ? ` Similar to problems asked at ${company}.` : ""}

Return ONLY valid JSON with this exact structure (no markdown fences, no extra text):
{
  "title": "Problem title",
  "company": "Company that commonly asks this",
  "difficulty": "${difficulty}",
  "description": "Full problem description",
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "constraints": ["Constraint 1", "Constraint 2"],
  "hints": ["Gentle hint", "More specific hint", "Near-solution hint"],
  "approach": "Key insight and high-level approach",
  "timeComplexity": "O(...) with explanation",
  "spaceComplexity": "O(...) with explanation"
}`;

  try {
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const raw = await aiComplete(messages, 1200);
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
