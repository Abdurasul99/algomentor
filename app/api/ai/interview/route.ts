import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { aiStream, type ChatMessage } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { type, message, sessionId } = await req.json() as {
    type: "start" | "answer";
    message?: string;
    sessionId?: string;
  };

  const [user, leetcode] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.leetCodeProfile.findUnique({ where: { userId } }).catch(() => null),
  ]);

  let company = "Google";
  try {
    const p = JSON.parse(user?.targetCompanies ?? "[]") as string[];
    if (p.length) company = p[0];
  } catch { /* keep default */ }

  const level = user?.experienceLevel ?? "Intermediate";
  const solved = leetcode?.totalSolved ?? 0;

  const interviewerSystem = `You are a senior software engineer at ${company} conducting a real technical interview.
The candidate (${user?.name ?? "candidate"}) is ${level}-level, has solved ${solved} LeetCode problems.

As interviewer:
• Present one focused coding problem appropriate for their level
• Be professional, direct, and encouraging
• Do NOT give away the solution — guide with Socratic hints
• Probe for time/space complexity, edge cases, optimizations
• Respond conversationally, like a real interview`;

  if (type === "start") {
    const messages: ChatMessage[] = [
      { role: "system", content: interviewerSystem },
      {
        role: "user",
        content: `Start a ${level}-level coding interview for ${company}. Present one algorithmic problem. After stating the problem and examples, end with "Take your time — what are your initial thoughts?"`,
      },
    ];

    return aiStream(messages, 1000, async (text) => {
      await prisma.aIChatMessage.create({
        data: { userId, role: "assistant", content: text, context: sessionId ?? "interview" },
      });
    });
  }

  if (type === "answer" && message) {
    const prev = sessionId
      ? await prisma.aIChatMessage.findMany({
          where: { userId, context: sessionId },
          orderBy: { createdAt: "asc" },
          take: 20,
        })
      : [];

    const messages: ChatMessage[] = [
      { role: "system", content: interviewerSystem },
      ...prev.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ];

    return aiStream(messages, 1000, async (text) => {
      await prisma.aIChatMessage.createMany({
        data: [
          { userId, role: "user", content: message, context: sessionId ?? "interview" },
          { userId, role: "assistant", content: text, context: sessionId ?? "interview" },
        ],
      });
    });
  }

  return NextResponse.json({ error: "type must be 'start' or 'answer'" }, { status: 400 });
}
