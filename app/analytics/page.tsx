export const dynamic = "force-dynamic";

import {
  BarChart2,
  Target,
  Brain,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BookOpen,
  HelpCircle,
  Award,
  Activity,
  Eye,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn, getMasteryLabel, getMasteryColor } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Card from "@/components/ui/Card";
import {
  ModuleBarChart,
  ActivityLineChart,
  AccuracyDonutChart,
  type ModuleBarChartData,
  type ActivityLineChartData,
  type AccuracyDonutChartData,
} from "@/components/analytics/Charts";

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getAnalyticsData(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [modules, problemAttempts, quizAttempts, dailyActivities] =
    await Promise.all([
      prisma.module.findMany({
        orderBy: { orderIndex: "asc" },
        include: {
          moduleProgress: {
            where: { userId },
          },
          quizQuestions: {
            include: {
              attempts: {
                where: { userId },
              },
            },
          },
        },
      }),
      prisma.problemAttempt.findMany({
        where: { userId },
        include: {
          problem: { include: { module: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          question: { include: { module: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dailyActivity.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
    ]);

  // ── Overview stats ───────────────────────────────────────────────────────────
  const totalAttempted = problemAttempts.length;
  const solvedAttempts = problemAttempts.filter(
    (a) => a.status === "Solved" || a.status === "Mastered"
  ).length;
  const solveRate =
    totalAttempted > 0 ? Math.round((solvedAttempts / totalAttempted) * 100) : 0;

  const totalQuizAttempts = quizAttempts.length;
  const correctQuiz = quizAttempts.filter((a) => a.isCorrect).length;
  const quizAccuracy =
    totalQuizAttempts > 0 ? Math.round((correctQuiz / totalQuizAttempts) * 100) : 0;

  const hintsUsed = problemAttempts.filter((a) => a.hintUsedLevel > 0).length;
  const avgHintDep =
    totalAttempted > 0 ? Math.round((hintsUsed / totalAttempted) * 100) : 0;

  // ── Module performance ───────────────────────────────────────────────────────
  const modulePerformance = modules.map((mod) => {
    const p = mod.moduleProgress[0] ?? null;
    const allQ = mod.quizQuestions.flatMap((q) => q.attempts);
    const qCorrect = allQ.filter((a) => a.isCorrect).length;
    const quizScore = allQ.length > 0 ? Math.round((qCorrect / allQ.length) * 100) : (p?.quizScore ?? 0);

    const modAttempts = problemAttempts.filter(
      (a) => a.problem.module.id === mod.id
    );
    const modSolved = modAttempts.filter(
      (a) => a.status === "Solved" || a.status === "Mastered"
    ).length;
    const practiceScore =
      modAttempts.length > 0
        ? Math.round((modSolved / modAttempts.length) * 100)
        : (p?.practiceScore ?? 0);

    const hintDep = p?.hintDependencyScore ?? 0;
    const hintLabel =
      hintDep > 60 ? "High" : hintDep > 30 ? "Med" : "Low";
    const hintVariant =
      hintDep > 60 ? "danger" : hintDep > 30 ? "warning" : "success";

    return {
      id: mod.id,
      name: mod.name,
      slug: mod.slug,
      status: p?.status ?? "NotStarted",
      quizScore: p ? Math.round(p.quizScore) : quizScore,
      practiceScore: p ? Math.round(p.practiceScore) : practiceScore,
      masteryScore: Math.round(p?.masteryScore ?? 0),
      hintDep,
      hintLabel,
      hintVariant: hintVariant as "danger" | "warning" | "success",
      confidence: Math.round(p?.confidenceAverage ?? 0),
      explanationScore: Math.round(p?.explanationScore ?? 0),
    };
  });

  // ── Chart data ───────────────────────────────────────────────────────────────
  const barChartData: ModuleBarChartData[] = modulePerformance
    .filter((m) => m.status !== "NotStarted")
    .map((m) => ({
      name: m.name.replace("and", "&").replace(/ /g, " ").split(" ").slice(0, 3).join(" "),
      quizScore: m.quizScore,
      practiceScore: m.practiceScore,
      masteryScore: m.masteryScore,
    }));

  const activityChartData: ActivityLineChartData[] = dailyActivities.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    minutesSpent: d.minutesSpent,
    problemsSolved: d.problemsSolved,
  }));

  // ── Question type breakdown ──────────────────────────────────────────────────
  const questionTypes = ["MultipleChoice", "TrueFalse", "FillInTheGap", "ConceptCheck"] as const;
  const qTypeBreakdown = questionTypes.map((type) => {
    const typeAttempts = quizAttempts.filter(
      (a) => a.question.questionType === type
    );
    const correct = typeAttempts.filter((a) => a.isCorrect).length;
    const accuracy =
      typeAttempts.length > 0 ? Math.round((correct / typeAttempts.length) * 100) : 0;
    return { type, total: typeAttempts.length, correct, accuracy };
  });

  const donutData: AccuracyDonutChartData[] = [
    { name: "Multiple Choice", value: qTypeBreakdown[0].total, color: "#6366f1" },
    { name: "True / False", value: qTypeBreakdown[1].total, color: "#22c55e" },
    { name: "Fill in Gap", value: qTypeBreakdown[2].total, color: "#f59e0b" },
    { name: "Concept Check", value: qTypeBreakdown[3].total, color: "#ec4899" },
  ].filter((d) => d.value > 0);

  // ── Mentor diagnosis ─────────────────────────────────────────────────────────
  const started = modulePerformance.filter((m) => m.status !== "NotStarted");

  const weakest3 = [...started]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);
  const strongest3 = [...started]
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 3);

  // Most common mistake type
  const mistakeCounts: Record<string, number> = {};
  for (const a of problemAttempts) {
    if (a.mistakeType && a.mistakeType !== "") {
      mistakeCounts[a.mistakeType] = (mistakeCounts[a.mistakeType] ?? 0) + 1;
    }
  }
  const topMistake =
    Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

  const highHintModules = started.filter((m) => m.hintDep > 60);
  const lowExplanationModules = started.filter((m) => m.explanationScore < 40);
  const interviewReadyModules = started.filter(
    (m) => m.masteryScore > 75 && m.hintDep < 30
  );
  const needsTheoryModules = started.filter((m) => m.quizScore < 50);

  return {
    totalAttempted,
    solveRate,
    quizAccuracy,
    avgHintDep,
    modulePerformance,
    barChartData,
    activityChartData,
    donutData,
    qTypeBreakdown,
    weakest3,
    strongest3,
    topMistake,
    highHintModules,
    lowExplanationModules,
    interviewReadyModules,
    needsTheoryModules,
  };
}

// ─── Status badge helper ───────────────────────────────────────────────────────
function statusBadgeVariant(
  status: string
): "success" | "warning" | "info" | "default" | "purple" {
  switch (status) {
    case "Mastered":
      return "success";
    case "Completed":
      return "info";
    case "InProgress":
      return "warning";
    default:
      return "default";
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalyticsData(user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-600" />
          Analytics
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Deep-dive into your learning patterns, strengths, and blind spots.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — Overview Stats
      ══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Problems Attempted"
          value={data.totalAttempted}
          icon={Target}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          subtitle="all time"
        />
        <StatCard
          label="Solve Rate"
          value={`${data.solveRate}%`}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle="solved or mastered"
        />
        <StatCard
          label="Quiz Accuracy"
          value={`${data.quizAccuracy}%`}
          icon={Brain}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="correct answers"
        />
        <StatCard
          label="Hint Dependency"
          value={`${data.avgHintDep}%`}
          icon={Lightbulb}
          iconColor={
            data.avgHintDep > 60
              ? "text-red-600"
              : data.avgHintDep > 30
              ? "text-amber-600"
              : "text-green-600"
          }
          iconBg={
            data.avgHintDep > 60
              ? "bg-red-50"
              : data.avgHintDep > 30
              ? "bg-amber-50"
              : "bg-green-50"
          }
          subtitle="problems needing hints"
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — Module Performance Table
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Module Performance
        </h2>
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Module
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Quiz %
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Practice %
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Mastery %
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Hint Dep.
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Confidence %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.modulePerformance.map((mod) => (
                  <tr
                    key={mod.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-800">{mod.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {getMasteryLabel(mod.masteryScore)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={statusBadgeVariant(mod.status)}>
                        {mod.status === "NotStarted" ? "Not Started" : mod.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScoreCell value={mod.quizScore} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScoreCell value={mod.practiceScore} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-md border",
                            getMasteryColor(mod.masteryScore)
                          )}
                        >
                          {mod.masteryScore}%
                        </span>
                        <ProgressBar
                          value={mod.masteryScore}
                          size="sm"
                          className="w-20"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={mod.hintVariant}>{mod.hintLabel}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScoreCell value={mod.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — Charts
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-600" />
          Performance Charts
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Module scores bar chart */}
          <Card>
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              Score Breakdown by Module
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Quiz, practice and mastery scores per module
            </p>
            {data.barChartData.length > 0 ? (
              <ModuleBarChart data={data.barChartData} />
            ) : (
              <EmptyChartState message="Start learning modules to see score data." />
            )}
          </Card>

          {/* Daily activity line chart */}
          <Card>
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              Daily Activity — Last 30 Days
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Minutes studied and problems solved per day
            </p>
            {data.activityChartData.length > 0 ? (
              <ActivityLineChart data={data.activityChartData} />
            ) : (
              <EmptyChartState message="No activity logged yet." />
            )}
          </Card>
        </div>

        {/* Donut chart */}
        {data.donutData.length > 0 && (
          <Card className="max-w-md">
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              Quiz Attempts by Question Type
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Distribution of question types you have attempted
            </p>
            <AccuracyDonutChart data={data.donutData} />
          </Card>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — Mentor Diagnosis
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" />
          Mentor Diagnosis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Weakest 3 */}
          {data.weakest3.length > 0 && (
            <DiagnosisCard
              title="Weakest Modules"
              color="red"
              icon={<TrendingDown className="w-4 h-4 text-red-600" />}
              insight="Focus here first — mastery is lagging."
            >
              <ul className="space-y-2 mt-2">
                {data.weakest3.map((m) => (
                  <ModuleScoreRow key={m.id} name={m.name} score={m.masteryScore} />
                ))}
              </ul>
            </DiagnosisCard>
          )}

          {/* Strongest 3 */}
          {data.strongest3.length > 0 && (
            <DiagnosisCard
              title="Strongest Modules"
              color="green"
              icon={<TrendingUp className="w-4 h-4 text-green-600" />}
              insight="Keep these warm with periodic review."
            >
              <ul className="space-y-2 mt-2">
                {data.strongest3.map((m) => (
                  <ModuleScoreRow key={m.id} name={m.name} score={m.masteryScore} />
                ))}
              </ul>
            </DiagnosisCard>
          )}

          {/* Top mistake */}
          {data.topMistake && (
            <DiagnosisCard
              title="Most Common Mistake"
              color="amber"
              icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
              insight="Knowing your pattern is the first step to fixing it."
            >
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {data.topMistake[0].replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Occurred {data.topMistake[1]} time
                {data.topMistake[1] !== 1 ? "s" : ""}
              </p>
            </DiagnosisCard>
          )}

          {/* High hint dependency */}
          {data.highHintModules.length > 0 && (
            <DiagnosisCard
              title="High Hint Dependency"
              color="orange"
              icon={<Lightbulb className="w-4 h-4 text-orange-600" />}
              insight="Revisit theory and concept checks before new problems."
            >
              <ul className="space-y-1 mt-2">
                {data.highHintModules.map((m) => (
                  <li key={m.id} className="text-xs text-slate-600 flex justify-between">
                    <span>{m.name}</span>
                    <span className="font-semibold text-orange-600">
                      {m.hintDep}%
                    </span>
                  </li>
                ))}
              </ul>
            </DiagnosisCard>
          )}

          {/* Low explanation score */}
          {data.lowExplanationModules.length > 0 && (
            <DiagnosisCard
              title="Needs Explanation Practice"
              color="purple"
              icon={<BookOpen className="w-4 h-4 text-purple-600" />}
              insight='Practice the "explain it back" technique on these modules.'
            >
              <ul className="space-y-1 mt-2">
                {data.lowExplanationModules.map((m) => (
                  <li key={m.id} className="text-xs text-slate-600 flex justify-between">
                    <span>{m.name}</span>
                    <span className="font-semibold text-purple-600">
                      {m.explanationScore}%
                    </span>
                  </li>
                ))}
              </ul>
            </DiagnosisCard>
          )}

          {/* Interview ready */}
          {data.interviewReadyModules.length > 0 && (
            <DiagnosisCard
              title="Interview-Style Practice Ready"
              color="green"
              icon={<Zap className="w-4 h-4 text-green-600" />}
              insight="These modules are strong enough for timed interview problems."
            >
              <ul className="space-y-1 mt-2">
                {data.interviewReadyModules.map((m) => (
                  <li key={m.id} className="text-xs text-slate-600 flex gap-2 items-center">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{m.name}</span>
                  </li>
                ))}
              </ul>
            </DiagnosisCard>
          )}

          {/* Needs theory review */}
          {data.needsTheoryModules.length > 0 && (
            <DiagnosisCard
              title="Needs Theory Review"
              color="blue"
              icon={<Eye className="w-4 h-4 text-blue-600" />}
              insight="Quiz score below 50% — re-read the theory before more practice."
            >
              <ul className="space-y-1 mt-2">
                {data.needsTheoryModules.map((m) => (
                  <li key={m.id} className="text-xs text-slate-600 flex justify-between">
                    <span>{m.name}</span>
                    <span className="font-semibold text-blue-600">
                      Quiz: {m.quizScore}%
                    </span>
                  </li>
                ))}
              </ul>
            </DiagnosisCard>
          )}
        </div>

        {data.weakest3.length === 0 &&
          data.highHintModules.length === 0 &&
          data.interviewReadyModules.length === 0 && (
            <Card className="text-center py-10">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Start learning modules to unlock mentor diagnosis.
              </p>
            </Card>
          )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — Question Type Breakdown
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          Question Type Breakdown
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.qTypeBreakdown.map((qt) => {
            const iconEl =
              qt.accuracy >= 70 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : qt.accuracy >= 40 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              );

            const label =
              qt.type === "MultipleChoice"
                ? "Multiple Choice"
                : qt.type === "TrueFalse"
                ? "True / False"
                : qt.type === "FillInTheGap"
                ? "Fill in the Gap"
                : "Concept Check";

            const bg =
              qt.accuracy >= 70
                ? "bg-green-50 border-green-200"
                : qt.accuracy >= 40
                ? "bg-amber-50 border-amber-200"
                : qt.total === 0
                ? "bg-slate-50 border-slate-200"
                : "bg-red-50 border-red-200";

            return (
              <div
                key={qt.type}
                className={cn(
                  "rounded-xl border p-4 shadow-sm",
                  bg
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {label}
                  </p>
                  {iconEl}
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {qt.total > 0 ? `${qt.accuracy}%` : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {qt.correct} / {qt.total} correct
                </p>
                {qt.total > 0 && (
                  <ProgressBar value={qt.accuracy} size="sm" className="mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Small helper components ───────────────────────────────────────────────────

function ScoreCell({ value }: { value: number }) {
  const color =
    value >= 70
      ? "text-green-700"
      : value >= 40
      ? "text-amber-700"
      : value > 0
      ? "text-red-600"
      : "text-slate-400";
  return (
    <span className={cn("text-sm font-bold", color)}>
      {value > 0 ? `${value}%` : "—"}
    </span>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
      {message}
    </div>
  );
}

function DiagnosisCard({
  title,
  color,
  icon,
  insight,
  children,
}: {
  title: string;
  color: "red" | "green" | "amber" | "orange" | "purple" | "blue";
  icon: React.ReactNode;
  insight: string;
  children: React.ReactNode;
}) {
  const bg = {
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
    amber: "bg-amber-50 border-amber-200",
    orange: "bg-orange-50 border-orange-200",
    purple: "bg-indigo-50 border-indigo-200",
    blue: "bg-blue-50 border-blue-200",
  }[color];

  const insightColor = {
    red: "text-red-600",
    green: "text-green-600",
    amber: "text-amber-600",
    orange: "text-orange-600",
    purple: "text-indigo-600",
    blue: "text-blue-600",
  }[color];

  return (
    <div className={cn("border rounded-xl p-4 shadow-sm", bg)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-sm font-bold text-slate-800">{title}</p>
      </div>
      <p className={cn("text-xs font-medium", insightColor)}>{insight}</p>
      {children}
    </div>
  );
}

function ModuleScoreRow({ name, score }: { name: string; score: number }) {
  return (
    <li className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-700 font-medium">{name}</span>
        <span className="font-bold text-slate-800">{score}%</span>
      </div>
      <ProgressBar value={score} size="sm" />
    </li>
  );
}
