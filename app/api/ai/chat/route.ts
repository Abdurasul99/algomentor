import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { aiStream, type ChatMessage } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";
import { getPersona } from "@/lib/personas";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json() as { message: string; personaId?: string };
    const { message, personaId = "alex" } = body;
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

    if (!user) return NextResponse.json({ error: "Session expired — please log out and log in again." }, { status: 404 });

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

    const persona = getPersona(personaId);
    const systemPrompt = persona.buildSystemPrompt({
      userName: user.name ?? "Student",
      experienceLevel: user.experienceLevel ?? "beginner",
      totalSolved: leetcode?.totalSolved ?? 0,
      easySolved: leetcode?.easySolved ?? 0,
      mediumSolved: leetcode?.mediumSolved ?? 0,
      hardSolved: leetcode?.hardSolved ?? 0,
      contestRating: Math.round(leetcode?.contestRating ?? 0),
      weakModules: weak.split(", ").filter(Boolean),
      strongModules: strong.split(", ").filter(Boolean),
      targetCompanies: companies,
      progressLines,
    });

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
