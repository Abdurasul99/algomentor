import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const { quizQuestionId, selectedAnswer, isCorrect, attemptMode } = body;

    if (!quizQuestionId || selectedAnswer === undefined || isCorrect === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: quizQuestionId, selectedAnswer, isCorrect" },
        { status: 400 }
      );
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizQuestionId,
        selectedAnswer: String(selectedAnswer),
        isCorrect: Boolean(isCorrect),
        attemptMode: attemptMode ?? "Practice",
      },
    });

    // Update ModuleProgress quizScore: avg accuracy of all attempts for this user + module
    const question = await prisma.quizQuestion.findUnique({
      where: { id: quizQuestionId },
      select: { moduleId: true },
    });

    if (question) {
      const moduleQuestions = await prisma.quizQuestion.findMany({
        where: { moduleId: question.moduleId },
        select: { id: true },
      });
      const qIds = moduleQuestions.map((q) => q.id);

      const moduleAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizQuestionId: { in: qIds },
        },
        select: { isCorrect: true },
      });

      const totalAttempts = moduleAttempts.length;
      const correctAttempts = moduleAttempts.filter((a) => a.isCorrect).length;
      const quizScore =
        totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId: question.moduleId } },
        create: {
          userId,
          moduleId: question.moduleId,
          quizScore,
          masteryScore: quizScore * 0.25,
        },
        update: {
          quizScore,
        },
      });
    }

    return NextResponse.json(attempt, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quiz/attempt]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
