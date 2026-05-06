import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface ModuleImport {
  slug: string;
  status: string;
  quizScore: number;
  practiceScore: number;
  confidenceAverage: number;
  theoryCompleted: boolean;
  problemsSolved: number;
}

function computeMastery(data: ModuleImport): number {
  if (data.status === "NotStarted") return 0;
  return Math.round(
    data.quizScore        * 0.25 +
    data.practiceScore    * 0.30 +
    data.confidenceAverage * 0.20 +
    (data.theoryCompleted ? 15 : 0) +
    Math.min(data.problemsSolved * 2, 10)
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { modules } = await req.json() as { modules: ModuleImport[] };
  if (!Array.isArray(modules)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const dbModules = await prisma.module.findMany({ select: { id: true, slug: true } });
  const slugToId = Object.fromEntries(dbModules.map((m) => [m.slug, m.id]));

  for (const mod of modules) {
    const moduleId = slugToId[mod.slug];
    if (!moduleId) continue;

    const masteryScore = computeMastery(mod);
    const explanationScore = mod.status === "Mastered" ? 75 : mod.status === "Completed" ? 55 : mod.status === "InProgress" ? 30 : 0;
    const hintDependencyScore = mod.status === "Mastered" ? 20 : mod.status === "Completed" ? 40 : mod.status === "InProgress" ? 60 : 0;

    const reviewDueDate = mod.status !== "NotStarted"
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : null;

    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        status: mod.status,
        theoryCompleted: mod.theoryCompleted,
        quizScore: mod.quizScore,
        practiceScore: mod.practiceScore,
        confidenceAverage: mod.confidenceAverage,
        masteryScore,
        explanationScore,
        hintDependencyScore,
        reviewDueDate,
      },
      update: {
        status: mod.status,
        theoryCompleted: mod.theoryCompleted,
        quizScore: mod.quizScore,
        practiceScore: mod.practiceScore,
        confidenceAverage: mod.confidenceAverage,
        masteryScore,
        explanationScore,
        hintDependencyScore,
        reviewDueDate,
      },
    });
  }

  return NextResponse.json({ success: true, updated: modules.length });
}
