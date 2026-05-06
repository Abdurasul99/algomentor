export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import QuizEngine from "@/components/quiz/QuizEngine";

async function getData(slug: string, userId: string) {
  if (slug === "mixed") {
    // Mixed mode: grab questions from all modules
    const questions = await prisma.quizQuestion.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        options: true,
        fillGapAnswers: true,
        attempts: {
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        module: { select: { name: true, slug: true } },
      },
    });
    return { moduleName: "Mixed Quiz", moduleSlug: "mixed", questions };
  }

  const module = await prisma.module.findUnique({
    where: { slug },
    include: {
      quizQuestions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: true,
          fillGapAnswers: true,
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          module: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!module) return null;

  return {
    moduleName: module.name,
    moduleSlug: module.slug,
    questions: module.quizQuestions,
  };
}

export default async function QuizModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const user = await requireUser();
  const { moduleSlug } = await params;
  const data = await getData(moduleSlug, user.id);

  if (!data) notFound();

  if (data.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 text-sm">
          No quiz questions available for this module yet.
        </p>
      </div>
    );
  }

  return (
    <QuizEngine
      questions={data.questions}
      moduleSlug={data.moduleSlug}
      moduleName={data.moduleName}
    />
  );
}
