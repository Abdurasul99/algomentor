export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Lightbulb,
  ListChecks,
  Search,
  Shield,
  Shuffle,
  Star,
  Target,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Code2,
  Pencil,
  CalendarClock,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  cn,
  formatDate,
  daysUntil,
  getStatusColor,
  getDifficultyColor,
  getMasteryLabel,
  getMasteryColor,
  getConfidenceColor,
} from "@/lib/utils";
import { getModuleReadiness } from "@/lib/mentor";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function getModule(slug: string, userId: string) {
  return prisma.module.findUnique({
    where: { slug },
    include: {
      moduleProgress: {
        where: { userId },
      },
      practiceProblems: {
        orderBy: { orderIndex: "asc" },
        include: {
          attempts: {
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
      quizQuestions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: true,
          fillGapAnswers: true,
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function HintDependencyLabel({ score }: { score: number }) {
  if (score <= 30) {
    return (
      <span className="text-green-700 font-semibold">
        Low ({Math.round(score)}%)
      </span>
    );
  }
  if (score <= 60) {
    return (
      <span className="text-yellow-700 font-semibold">
        Medium ({Math.round(score)}%)
      </span>
    );
  }
  return (
    <span className="text-red-700 font-semibold">
      High ({Math.round(score)}%)
    </span>
  );
}

function ReadinessBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const map: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border",
        map[color] ?? map.gray
      )}
    >
      {label}
    </span>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  content,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
}: {
  icon: React.ElementType;
  title: string;
  content: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const module = await getModule(slug, user.id);

  if (!module) notFound();

  const progress = module.moduleProgress[0] ?? null;
  const status = progress?.status ?? "NotStarted";
  const mastery = progress?.masteryScore ?? 0;
  const isNotStarted = status === "NotStarted";

  const readiness = progress
    ? getModuleReadiness({
        quizScore: progress.quizScore,
        practiceScore: progress.practiceScore,
        confidenceAverage: progress.confidenceAverage,
        explanationScore: progress.explanationScore,
        hintDependencyScore: progress.hintDependencyScore,
        masteryScore: progress.masteryScore,
      })
    : null;

  const reviewDue = progress?.reviewDueDate ?? null;
  const reviewDays = daysUntil(reviewDue);
  const isReviewDue = reviewDays !== null && reviewDays <= 0 && !isNotStarted;

  const previewQuestions = module.quizQuestions.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-500 px-6 py-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant={
                module.difficultyLevel === "Hard"
                  ? "danger"
                  : module.difficultyLevel === "Medium"
                  ? "warning"
                  : module.difficultyLevel === "Easy"
                  ? "info"
                  : "default"
              }
              size="sm"
            >
              {module.difficultyLevel}
            </Badge>
            <Badge className={cn(getStatusColor(status), "border")} size="sm">
              {status}
            </Badge>
            {readiness && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border",
                  readiness.color === "green"
                    ? "bg-green-50 text-green-700 border-green-300"
                    : readiness.color === "yellow"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                    : readiness.color === "blue"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {readiness.label}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{module.name}</h1>
          <p className="text-indigo-200 text-sm mt-1 leading-relaxed">
            {module.description}
          </p>
        </div>

        {/* Progress strip */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Mastery
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                getMasteryColor(mastery)
                  .split(" ")
                  .find((c) => c.startsWith("text-"))
              )}
            >
              {getMasteryLabel(mastery)} · {Math.round(mastery)}%
            </span>
          </div>
          <ProgressBar value={mastery} size="md" />

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {progress && (
              <>
                <span className="text-xs text-slate-500">
                  Quiz:{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.round(progress.quizScore)}%
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  Practice:{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.round(progress.practiceScore)}%
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  Confidence:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      getConfidenceColor(progress.confidenceAverage)
                    )}
                  >
                    {Math.round(progress.confidenceAverage)}%
                  </span>
                </span>
              </>
            )}
            {reviewDue && (
              <span className="text-xs text-slate-500">
                Review:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    isReviewDue ? "text-red-600" : "text-slate-700"
                  )}
                >
                  {isReviewDue
                    ? "Overdue"
                    : reviewDays === 0
                    ? "Today"
                    : `${reviewDays}d`}
                </span>
              </span>
            )}

            {/* Action buttons */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <Link
                href={`/modules/${module.slug}/visual`}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Visual Explanation
              </Link>
              <Link
                href={`/quiz?module=${module.slug}`}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {isNotStarted ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    Start Module
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    Continue
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION A: OVERVIEW ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Overview & Theory
        </h2>

        {isNotStarted && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900 text-sm">
                Ready to start {module.name}?
              </h3>
              <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
                This module covers {module.description.toLowerCase()} Read
                the overview below, then work through concept checks and
                practice problems at your own pace.
              </p>
              <Link
                href={`/quiz?module=${module.slug}`}
                className="inline-flex items-center gap-1.5 mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Start Learning
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard
            icon={Eye}
            title="Overview"
            content={module.overview}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <SectionCard
            icon={Brain}
            title="Intuition"
            content={module.intuition}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
          <SectionCard
            icon={Lightbulb}
            title="When to Use"
            content={module.whenToUse}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <SectionCard
            icon={Search}
            title="Recognition Signals"
            content={module.recognitionSignals}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </div>

        <SectionCard
          icon={AlertTriangle}
          title="Common Mistakes"
          content={module.commonMistakes}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </section>

      {/* ── SECTION B: CONCEPT CHECKS ── */}
      {previewQuestions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Concept Checks
            </h2>
            <Link
              href={`/quiz?module=${module.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Take Full Quiz
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {previewQuestions.map((q, idx) => {
              const latestAttempt = q.attempts[0] ?? null;
              const attemptedCorrectly =
                latestAttempt?.isCorrect === true;

              return (
                <Card key={q.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium">
                        Q{idx + 1}
                      </span>
                      <Badge
                        variant={
                          q.questionType === "FillInTheGap"
                            ? "purple"
                            : q.questionType === "TrueFalse"
                            ? "info"
                            : "default"
                        }
                        size="sm"
                      >
                        {q.questionType === "FillInTheGap"
                          ? "Fill in the Gap"
                          : q.questionType === "TrueFalse"
                          ? "True / False"
                          : q.questionType === "MultipleChoice"
                          ? "Multiple Choice"
                          : q.questionType}
                      </Badge>
                      <Badge
                        variant={
                          q.difficultyLevel === "Hard"
                            ? "danger"
                            : q.difficultyLevel === "Medium"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {q.difficultyLevel}
                      </Badge>
                      {latestAttempt && (
                        <Badge
                          variant={
                            attemptedCorrectly ? "success" : "danger"
                          }
                          size="sm"
                        >
                          {attemptedCorrectly ? "Correct" : "Incorrect"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {q.questionType === "FillInTheGap"
                      ? q.prompt.replace(/__+/g, "___")
                      : q.prompt}
                  </p>

                  {/* Options preview (no answers revealed) */}
                  {(q.questionType === "MultipleChoice" ||
                    q.questionType === "TrueFalse") &&
                    q.options.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
                          >
                            <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            {opt.text}
                          </div>
                        ))}
                      </div>
                    )}

                  {q.questionType === "FillInTheGap" && (
                    <div className="pl-1">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-2">
                        <Pencil className="w-3 h-3" />
                        Type your answer in the quiz
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {module.quizQuestions.length > 5 && (
            <p className="text-xs text-slate-400 text-center">
              Showing 5 of {module.quizQuestions.length} questions.{" "}
              <Link
                href={`/quiz?module=${module.slug}`}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Take the full quiz
              </Link>{" "}
              to see all.
            </p>
          )}
        </section>
      )}

      {/* ── SECTION C: PRACTICE PROBLEMS ── */}
      {module.practiceProblems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              Practice Problems
            </h2>
            <span className="text-xs text-slate-500">
              {module.practiceProblems.length} problem
              {module.practiceProblems.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {module.practiceProblems.map((problem) => {
              const latestAttempt = problem.attempts[0] ?? null;
              const attemptStatus =
                latestAttempt?.status ?? "NotStarted";
              const confidenceScore =
                latestAttempt?.confidenceScore ?? 0;
              const hintUsed = latestAttempt?.hintUsedLevel ?? 0;

              return (
                <Link
                  key={problem.id}
                  href={`/practice/${problem.id}`}
                  className="block group bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge
                          variant={
                            problem.difficulty === "Hard"
                              ? "danger"
                              : problem.difficulty === "Medium"
                              ? "warning"
                              : problem.difficulty === "Easy"
                              ? "info"
                              : "default"
                          }
                          size="sm"
                        >
                          {problem.difficulty}
                        </Badge>
                        <Badge
                          className={getStatusColor(attemptStatus)}
                          size="sm"
                        >
                          {attemptStatus}
                        </Badge>
                        {latestAttempt && (
                          <Badge
                            variant={
                              confidenceScore >= 70
                                ? "success"
                                : confidenceScore >= 40
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                          >
                            {confidenceScore}% conf.
                          </Badge>
                        )}
                        {hintUsed > 0 && (
                          <Badge variant="default" size="sm">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Hint {hintUsed}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {problem.learningObjective}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {problem.source && (
                        <span className="text-xs text-slate-400 hidden sm:block">
                          {problem.source}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SECTION D: MASTERY TRACKER ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Mastery Tracker
        </h2>

        <Card>
          {/* Overall mastery */}
          <div className="text-center pb-5 border-b border-slate-100 mb-5">
            <div className="text-4xl font-bold text-slate-900">
              {Math.round(mastery)}
              <span className="text-xl text-slate-400">%</span>
            </div>
            <div className="mt-1">
              {readiness ? (
                <ReadinessBadge
                  label={readiness.label}
                  color={readiness.color}
                />
              ) : (
                <span className="text-sm text-slate-400">
                  Not started yet
                </span>
              )}
            </div>
            <div className="mt-3 max-w-xs mx-auto">
              <ProgressBar value={mastery} size="lg" />
            </div>
          </div>

          {progress ? (
            <div className="space-y-4">
              {/* Score bars */}
              {[
                {
                  label: "Theory Completed",
                  value: progress.theoryCompleted ? 100 : 0,
                  icon: BookOpen,
                  suffix: progress.theoryCompleted ? "Yes" : "No",
                },
                {
                  label: "Concept Score",
                  value: progress.conceptScore,
                  icon: Brain,
                },
                {
                  label: "Quiz Score",
                  value: progress.quizScore,
                  icon: ListChecks,
                },
                {
                  label: "Practice Score",
                  value: progress.practiceScore,
                  icon: Code2,
                },
                {
                  label: "Explanation Score",
                  value: progress.explanationScore,
                  icon: Shield,
                },
              ].map(({ label, value, icon: Icon, suffix }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {suffix ?? `${Math.round(value)}%`}
                    </span>
                  </div>
                  <ProgressBar value={value} size="sm" />
                </div>
              ))}

              {/* Hint dependency */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      Hint Dependency
                    </span>
                  </div>
                  <HintDependencyLabel
                    score={progress.hintDependencyScore}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Lower is better — aim for under 30% for interview
                  readiness.
                </p>
              </div>

              {/* Review date */}
              {reviewDue && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      Next Review
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isReviewDue ? "text-red-600" : "text-slate-700"
                    )}
                  >
                    {isReviewDue
                      ? "Overdue — review now"
                      : reviewDays === 0
                      ? "Today"
                      : `${formatDate(reviewDue)} (in ${reviewDays}d)`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Start the module to begin tracking your mastery.
              </p>
              <Link
                href={`/quiz?module=${module.slug}`}
                className="inline-flex items-center gap-1.5 mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Start Now
              </Link>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
