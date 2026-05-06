import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReviewSchedule } from "@/lib/mentor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const {
      practiceProblemId,
      status,
      minutesSpent,
      hintUsedLevel,
      solvedIndependently,
      canExplainClearly,
      confidenceScore,
      mistakeType,
      keyInsight,
      notes,
    } = body;

    if (!practiceProblemId) {
      return NextResponse.json(
        { error: "Missing required field: practiceProblemId" },
        { status: 400 }
      );
    }

    // Compute revisit date based on confidence + whether solved
    const wasCorrect =
      status === "Solved" || status === "Mastered" || solvedIndependently;
    const revisitDate = getReviewSchedule(confidenceScore ?? 0, wasCorrect);

    // Upsert: update existing attempt for this user+problem if one exists, else create
    const existing = await prisma.problemAttempt.findFirst({
      where: { userId, practiceProblemId },
      orderBy: { createdAt: "asc" },
    });

    let attempt;
    if (existing) {
      attempt = await prisma.problemAttempt.update({
        where: { id: existing.id },
        data: {
          status: status ?? "NotStarted",
          minutesSpent: minutesSpent ?? 0,
          hintUsedLevel: hintUsedLevel ?? 0,
          solvedIndependently: solvedIndependently ?? false,
          canExplainClearly: canExplainClearly ?? false,
          confidenceScore: confidenceScore ?? 0,
          mistakeType: mistakeType ?? "",
          keyInsight: keyInsight ?? "",
          notes: notes ?? "",
          revisitDate,
          lastReviewedAt: new Date(),
        },
      });
    } else {
      attempt = await prisma.problemAttempt.create({
        data: {
          userId,
          practiceProblemId,
          status: status ?? "NotStarted",
          minutesSpent: minutesSpent ?? 0,
          hintUsedLevel: hintUsedLevel ?? 0,
          solvedIndependently: solvedIndependently ?? false,
          canExplainClearly: canExplainClearly ?? false,
          confidenceScore: confidenceScore ?? 0,
          mistakeType: mistakeType ?? "",
          keyInsight: keyInsight ?? "",
          notes: notes ?? "",
          revisitDate,
          lastReviewedAt: new Date(),
        },
      });
    }

    // ── Recompute ModuleProgress ────────────────────────────────────────────

    // Get the problem's moduleId
    const problem = await prisma.practiceProblem.findUnique({
      where: { id: practiceProblemId },
      select: { moduleId: true },
    });

    if (problem) {
      const { moduleId } = problem;

      // All problems in this module + their latest attempts for this user
      const moduleProblems = await prisma.practiceProblem.findMany({
        where: { moduleId },
        include: {
          attempts: {
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });

      const allAttempts = moduleProblems
        .map((p) => p.attempts[0])
        .filter(Boolean) as NonNullable<(typeof moduleProblems)[0]["attempts"][0]>[];

      // practiceScore: avg confidence of solved/mastered problems (0-100 scale)
      const solvedAttempts = allAttempts.filter(
        (a) => a.status === "Solved" || a.status === "Mastered"
      );
      const practiceScore =
        solvedAttempts.length > 0
          ? solvedAttempts.reduce((sum, a) => sum + a.confidenceScore, 0) /
            solvedAttempts.length
          : 0;

      // hintDependencyScore: avg hint level as % of max (4)
      const hintDependencyScore =
        allAttempts.length > 0
          ? (allAttempts.reduce((sum, a) => sum + a.hintUsedLevel, 0) /
              allAttempts.length /
              4) *
            100
          : 0;

      // confidenceAverage: avg confidence of all attempted problems
      const confidenceAverage =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.confidenceScore, 0) /
            allAttempts.length
          : 0;

      // explanationScore: % of attempts where canExplainClearly is true
      const explanationScore =
        allAttempts.length > 0
          ? (allAttempts.filter((a) => a.canExplainClearly).length /
              allAttempts.length) *
            100
          : 0;

      // Get existing progress to preserve quizScore for this user
      const existingProgress = await prisma.moduleProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId } },
        select: { quizScore: true },
      });
      const quizScore = existingProgress?.quizScore ?? 0;

      // Compute mastery score
      const hintScore = Math.max(0, 100 - hintDependencyScore);
      const masteryScore =
        quizScore * 0.25 +
        practiceScore * 0.3 +
        confidenceAverage * 0.2 +
        explanationScore * 0.15 +
        hintScore * 0.1;

      // Determine module status
      let moduleStatus = "NotStarted";
      if (allAttempts.length > 0) {
        if (masteryScore >= 80) moduleStatus = "Mastered";
        else if (masteryScore >= 50) moduleStatus = "Completed";
        else moduleStatus = "InProgress";
      }

      // Compute reviewDueDate based on average confidence
      const reviewDueDate = getReviewSchedule(confidenceAverage, masteryScore >= 60);

      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        create: {
          userId,
          moduleId,
          practiceScore,
          hintDependencyScore,
          confidenceAverage,
          explanationScore,
          masteryScore,
          status: moduleStatus,
          reviewDueDate,
        },
        update: {
          practiceScore,
          hintDependencyScore,
          confidenceAverage,
          explanationScore,
          masteryScore,
          status: moduleStatus,
          reviewDueDate,
        },
      });
    }

    return NextResponse.json(attempt, { status: 200 });
  } catch (err) {
    console.error("[POST /api/practice/attempt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
