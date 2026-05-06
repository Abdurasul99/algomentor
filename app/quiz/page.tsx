export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  ListChecks,
  Shuffle,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn, getDifficultyColor, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";

export default async function QuizCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; type?: string; difficulty?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const filterModule = sp.module ?? "";
  const filterType = sp.type ?? "";
  const filterDifficulty = sp.difficulty ?? "";

  // ── Fetch data ────────────────────────────────────────────────────────────
  const [modules, allAttempts] = await Promise.all([
    prisma.module.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        quizQuestions: {
          include: {
            attempts: {
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        question: {
          include: { module: { select: { name: true, slug: true } } },
        },
      },
    }),
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const allQuestions = modules.flatMap((m) => m.quizQuestions);
  const totalQuestions = allQuestions.length;
  const totalAttempts = allQuestions.reduce(
    (sum, q) => sum + q.attempts.length,
    0
  );
  const totalCorrect = allQuestions
    .flatMap((q) => q.attempts)
    .filter((a) => a.isCorrect).length;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const typeCounts: Record<string, number> = {};
  for (const q of allQuestions) {
    typeCounts[q.questionType] = (typeCounts[q.questionType] ?? 0) + 1;
  }

  // ── Filtered module cards ─────────────────────────────────────────────────
  const modulesWithQuestions = modules.filter(
    (m) => m.quizQuestions.length > 0
  );

  const filteredModules = modulesWithQuestions.filter((m) => {
    if (filterModule && m.slug !== filterModule) return false;
    if (filterType && !m.quizQuestions.some((q) => q.questionType === filterType))
      return false;
    if (
      filterDifficulty &&
      !m.quizQuestions.some((q) => q.difficultyLevel === filterDifficulty)
    )
      return false;
    return true;
  });

  const questionTypeLabel: Record<string, string> = {
    MultipleChoice: "Multiple Choice",
    FillInTheGap: "Fill in the Gap",
    TrueFalse: "True / False",
    ConceptCheck: "Concept Check",
  };

  const questionTypeVariant: Record<
    string,
    "default" | "info" | "purple" | "warning"
  > = {
    MultipleChoice: "default",
    FillInTheGap: "purple",
    TrueFalse: "info",
    ConceptCheck: "warning",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quiz Center</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Test your knowledge with concept checks, multiple choice, fill-in-the-gap, and true/false questions.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Questions"
          value={totalQuestions}
          icon={HelpCircle}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="Attempts Taken"
          value={totalAttempts}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Accuracy"
          value={`${overallAccuracy}%`}
          icon={Target}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Modules"
          value={modulesWithQuestions.length}
          icon={LayoutGrid}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── Question type breakdown ── */}
      {totalQuestions > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm"
            >
              <span className="font-semibold text-slate-900">{count}</span>
              {questionTypeLabel[type] ?? type}
            </span>
          ))}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <Card className="!py-4 !px-5">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          {/* Module filter */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Module
            </label>
            <select
              name="module"
              defaultValue={filterModule}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
            >
              <option value="">All Modules</option>
              {modulesWithQuestions.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question type filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Question Type
            </label>
            <select
              name="type"
              defaultValue={filterType}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
            >
              <option value="">All Types</option>
              {Object.entries(questionTypeLabel).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Difficulty
            </label>
            <select
              name="difficulty"
              defaultValue={filterDifficulty}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[130px]"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Filter
          </button>
          {(filterModule || filterType || filterDifficulty) && (
            <Link
              href="/quiz"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {/* ── Mixed Quiz Card ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          Quiz by Module
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mixed Quiz Card */}
          <Link
            href="/quiz/mixed"
            className="group bg-gradient-to-br from-indigo-600 to-indigo-500 border border-indigo-500 rounded-xl shadow-sm p-5 hover:shadow-md hover:from-indigo-700 hover:to-indigo-600 transition-all block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Mixed Quiz</span>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Random questions from all modules. Great for overall review and spaced repetition.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-100 group-hover:gap-2 transition-all">
              Start Mixed Quiz
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Per-module cards */}
          {filteredModules.map((m) => {
            const questions = m.quizQuestions;
            const attempts = questions.flatMap((q) => q.attempts);
            const correct = attempts.filter((a) => a.isCorrect).length;
            const accuracy =
              attempts.length > 0
                ? Math.round((correct / attempts.length) * 100)
                : null;

            const diffCounts: Record<string, number> = {};
            for (const q of questions) {
              diffCounts[q.difficultyLevel] =
                (diffCounts[q.difficultyLevel] ?? 0) + 1;
            }

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug flex-1">
                    {m.name}
                  </h3>
                  {accuracy !== null && (
                    <span
                      className={cn(
                        "text-xs font-semibold shrink-0",
                        accuracy >= 70
                          ? "text-green-700"
                          : accuracy >= 40
                          ? "text-yellow-700"
                          : "text-red-700"
                      )}
                    >
                      {accuracy}%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{questions.length}</span> questions
                  </span>
                  {attempts.length > 0 && (
                    <span className="text-xs text-slate-400">
                      · {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Difficulty mix */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(diffCounts).map(([diff, count]) => (
                    <span
                      key={diff}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        getDifficultyColor(diff)
                      )}
                    >
                      {count} {diff}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/quiz/${m.slug}`}
                    className="inline-flex items-center gap-1.5 w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    Take Quiz
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No modules match your filters.</p>
            <Link
              href="/quiz"
              className="mt-3 inline-flex text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear filters
            </Link>
          </div>
        )}
      </div>

      {/* ── Recent Quiz History ── */}
      {allAttempts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Recent Quiz History
          </h2>
          <Card padding="none">
            <div className="divide-y divide-slate-100">
              {allAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-start gap-3 px-5 py-3.5"
                >
                  <div className="mt-0.5 shrink-0">
                    {attempt.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 line-clamp-2 leading-snug">
                      {attempt.question.prompt}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {attempt.question.module.name}
                      </span>
                      <Badge
                        variant={
                          questionTypeVariant[attempt.question.questionType] ??
                          "default"
                        }
                        size="sm"
                      >
                        {questionTypeLabel[attempt.question.questionType] ??
                          attempt.question.questionType}
                      </Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        attempt.isCorrect ? "text-green-600" : "text-red-500"
                      )}
                    >
                      {attempt.isCorrect ? "Correct" : "Wrong"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(attempt.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
