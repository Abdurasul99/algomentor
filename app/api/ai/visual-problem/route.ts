import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { aiComplete, type ChatMessage } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { PatternVisualization } from "@/lib/visualizations";
import { repairJson } from "@/lib/jsonRepair";

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    leetcodeNumber?: number;
    lcNumber?: number;
    problemTitle: string;
    moduleSlug?: string;
  };

  const { problemTitle, moduleSlug } = body;
  // Support both field names for backwards compat
  const leetcodeNumber = body.leetcodeNumber ?? body.lcNumber ?? 0;

  if (!problemTitle) {
    return NextResponse.json({ error: "problemTitle is required" }, { status: 400 });
  }

  // ── 1. Check cache ───────────────────────────────────────────────────────────
  try {
    // For LC problems (number > 0): try by number first, fall back to title
    // For practice problems (number === 0): look up by title only
    let cached = null;

    if (leetcodeNumber > 0) {
      cached = await prisma.problemVisualCache.findFirst({
        where: { leetcodeNumber },
      });
    }

    if (!cached) {
      cached = await prisma.problemVisualCache.findUnique({
        where: { problemTitle },
      });
    }

    if (cached) {
      const visualization = JSON.parse(cached.visualJson) as PatternVisualization;
      return NextResponse.json({ visualization, cached: true });
    }
  } catch (err) {
    // Cache lookup failure — continue to generate
    console.error("Cache lookup error:", err);
  }

  // ── 2. Build the AI prompt ───────────────────────────────────────────────────
  const problemLine =
    leetcodeNumber > 0
      ? `${problemTitle} (LeetCode #${leetcodeNumber})`
      : problemTitle;

  const patternSlug = moduleSlug ?? "arrays-hashing";

  // Determine display type hint based on module
  const displayHint: Record<string, string> = {
    "arrays-hashing": "array + hashmap",
    "two-pointers": "array with left/right labels",
    "sliding-window": "array with window colors",
    "binary-search": "array with left/mid/right labels",
    "stack": "stack display",
    "linked-list": "linkedListNodes display",
    "trees": "array (level-order) + stack for call stack",
    "backtracking": "array for current state + stack for path",
    "heap-priority-queue": "array + stack (heap state)",
    "graphs": "grid display",
    "dynamic-programming": "dpTable display",
  };
  const displayType = displayHint[patternSlug] ?? "array";

  let prompt = `Generate a beginner-friendly step-by-step visual explanation for: ${problemLine}

Return compact JSON only (no markdown, no extra text outside the JSON).

Use this EXACT structure — output each step on one line to save space:

{"patternSlug":"${patternSlug}","title":"${problemTitle}","problemTitle":"${problemTitle}","problemInput":"YOUR_EXAMPLE_HERE","templateCode":["line1","line2","line3","line4","line5","line6","line7","line8"],"steps":[STEPS_HERE],"edgeCases":[{"title":"T","input":"I","explanation":"E","whatBreaks":"W","howToHandle":"H"},{"title":"T","input":"I","explanation":"E","whatBreaks":"W","howToHandle":"H"}],"keyInsights":["insight1","insight2","insight3","insight4"],"commonMistakes":["m1","m2","m3"]}

For STEPS_HERE, produce 8 to 10 steps. Each step shows the algorithm running on your example.
Use ${displayType} for the visual display.

Step format (only include fields you actually use, skip the rest):
{"stepNumber":N,"title":"Short title","description":"What happens — mention actual values like nums[2]=5","codeLineIndex":N,"array":{"values":[...],"colors":[...],"labels":[...]},"variables":[{"name":"x","value":0}],"result":null}

OR for hashmap steps add: "hashmap":[{"key":"k","value":0,"isNew":true}]
OR for stack steps add: "stack":{"items":[...],"lastAction":"push"}
OR for linkedList: "linkedListNodes":{"values":[...],"colors":[...],"labels":[...],"nullAtEnd":true}
OR for grid/graphs: "grid":{"cells":[["1","0"],["1","1"]],"colors":[["current","eliminated"],["window","found"]]}
OR for DP: "dpTable":{"headers":[0,1,2,3],"values":[0,1,2,3],"colors":["found","found","current","default"],"label":"dp"}

RULES (critical — must follow):
- Output ONLY the JSON object, nothing else
- NEVER write: Infinity, NaN, -inf, undefined, null for numeric values (use 0 instead)
- Colors allowed: "default" "current" "left" "right" "mid" "window" "found" "eliminated" "match" "duplicate"
- No trailing commas
- Last step: set "result" to a string like "Answer: 4"
- Pick an example with 4-6 elements (enough to show multiple iterations)
- Descriptions should explain WHY, not just what — help a beginner understand
- Each step must advance the algorithm (show meaningful progress)`;

  // ── 3. Call AI (with retry on JSON failure) ──────────────────────────────────
  let rawResponse = "";
  let visualization: PatternVisualization | null = null;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const messages: ChatMessage[] = [{ role: "user", content: prompt }];
      // 8192 = DeepSeek max output tokens — give full space for 8-10 step visualizations
      rawResponse = await aiComplete(messages, 8192);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "AI request failed";
      continue;
    }

    // ── 4. Parse + repair JSON ─────────────────────────────────────────────────
    try {
      const repaired = repairJson(rawResponse);
      visualization = JSON.parse(repaired) as PatternVisualization;
      break; // success
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Parse failed";
      console.error(`[visual-problem] attempt ${attempt + 1} parse error:`, lastError);
      console.error("Raw snippet:", rawResponse.slice(0, 300), "...", rawResponse.slice(-200));
      // On second attempt, ask for fewer steps to guarantee it fits
      if (attempt === 0) {
        prompt += "\n\nNOTE: Previous response had a JSON error. Produce exactly 6 steps this time with very short descriptions (under 40 chars each). Keep total JSON under 3000 characters. Output ONLY the JSON.";
      }
    }
  }

  if (!visualization) {
    return NextResponse.json(
      { error: `Failed to parse AI response as JSON: ${lastError}` },
      { status: 500 }
    );
  }

  // ── 5. Save to cache ─────────────────────────────────────────────────────────
  try {
    await prisma.problemVisualCache.upsert({
      where: { problemTitle },
      create: {
        leetcodeNumber,
        problemTitle,
        visualJson: JSON.stringify(visualization),
      },
      update: {
        leetcodeNumber,
        visualJson: JSON.stringify(visualization),
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    // Cache save failure is non-fatal — still return the visualization
    console.error("Cache save error:", err);
  }

  return NextResponse.json({ visualization, cached: false });
}
