export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PracticeWorkspace from "@/components/practice/PracticeWorkspace";
import VisualGeneratorClient from "@/components/visual/VisualGeneratorClient";
import { Eye } from "lucide-react";
import type { PatternVisualization } from "@/lib/visualizations";

async function getData(id: string, userId: string) {
  const problem = await prisma.practiceProblem.findUnique({
    where: { id },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      attempts: {
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  return problem;
}

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const problem = await getData(id, user.id);

  if (!problem) notFound();

  const existingAttempt = problem.attempts[0] ?? null;

  // ── Check visual cache for this practice problem ──────────────────────────
  const cachedVisual = await prisma.problemVisualCache.findUnique({
    where: { problemTitle: problem.title },
  });

  let initialVisualization: PatternVisualization | undefined;
  if (cachedVisual) {
    try {
      initialVisualization = JSON.parse(cachedVisual.visualJson) as PatternVisualization;
    } catch {
      // Corrupt cache entry — will regenerate
    }
  }

  return (
    <div>
      <PracticeWorkspace
        problem={{
          id: problem.id,
          title: problem.title,
          source: problem.source,
          url: problem.url,
          difficulty: problem.difficulty,
          description: problem.description,
          learningObjective: problem.learningObjective,
          hintLevelOne: problem.hintLevelOne,
          hintLevelTwo: problem.hintLevelTwo,
          hintLevelThree: problem.hintLevelThree,
          hintLevelFour: problem.hintLevelFour,
          finalExplanation: problem.finalExplanation,
          module: problem.module,
        }}
        existingAttempt={
          existingAttempt
            ? {
                id: existingAttempt.id,
                status: existingAttempt.status,
                minutesSpent: existingAttempt.minutesSpent,
                hintUsedLevel: existingAttempt.hintUsedLevel,
                solvedIndependently: existingAttempt.solvedIndependently,
                canExplainClearly: existingAttempt.canExplainClearly,
                confidenceScore: existingAttempt.confidenceScore,
                mistakeType: existingAttempt.mistakeType,
                keyInsight: existingAttempt.keyInsight,
                notes: existingAttempt.notes,
                updatedAt: existingAttempt.updatedAt.toISOString(),
              }
            : null
        }
      />

      {/* ── Visual Step-by-Step Explanation ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100 bg-purple-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              Visual Step-by-Step Explanation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 ml-9">
              AI-generated interactive walkthrough of this algorithm
            </p>
          </div>
          <VisualGeneratorClient
            lcNumber={0}
            problemTitle={problem.title}
            moduleSlug={problem.module.slug}
            initialVisualization={initialVisualization}
          />
        </div>
      </div>
    </div>
  );
}
