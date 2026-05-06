import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { aiStream, type ChatMessage } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const { message } = await req.json() as { message: string };
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Load context in parallel
    const [user, leetcode, progress, history] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.leetCodeProfile.findUnique({ where: { userId } }).catch(() => null),
      prisma.moduleProgress.findMany({
        where: { userId },
        include: { module: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.aIChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: 12,
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let companies = "top tech companies";
    try {
      const p = JSON.parse(user.targetCompanies || "[]") as string[];
      if (p.length) companies = p.join(", ");
    } catch { /* keep default */ }

    const progressLines = progress
      .filter((p) => p.status !== "NotStarted")
      .map((p) => `  • ${p.module.name}: ${p.status}, Mastery ${Math.round(p.masteryScore)}%, Quiz ${Math.round(p.quizScore)}%`)
      .join("\n") || "  • No modules started yet";

    const weak = progress.filter((p) => p.masteryScore < 50 && p.status !== "NotStarted").map((p) => p.module.name).join(", ") || "none yet";
    const strong = progress.filter((p) => p.masteryScore > 70).map((p) => p.module.name).join(", ") || "none yet";

    const systemPrompt = `You are an expert algorithm and data structures mentor for ${user.name}. Help them get a job at ${companies}.

STUDENT DATA:
• Experience: ${user.experienceLevel}
• LeetCode: ${leetcode?.totalSolved ?? 0} solved (${leetcode?.easySolved ?? 0}E / ${leetcode?.mediumSolved ?? 0}M / ${leetcode?.hardSolved ?? 0}H), contest rating: ${leetcode?.contestRating ?? "N/A"}

MODULE PROGRESS:
${progressLines}
Weak areas: ${weak}
Strong areas: ${strong}

YOUR RULES:
1. Always reference their specific data — never be generic
2. For problems, use real FAANG interview style with examples and constraints
3. For concepts, start with a simple analogy, then go deeper
4. Use Socratic method — guide with questions, don't just give answers
5. Format all code in triple backticks with language label
6. Be encouraging but brutally honest about gaps
7. Responses should be focused and actionable, not long and fluffy`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ];

    return aiStream(messages, 1500, async (fullText) => {
      await prisma.aIChatMessage.createMany({
        data: [
          { userId, role: "user", content: message },
          { userId, role: "assistant", content: fullText },
        ],
      });
    });
  } catch (err) {
    console.error("[/api/ai/chat]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
