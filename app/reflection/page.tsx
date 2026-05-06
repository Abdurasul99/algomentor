export const dynamic = "force-dynamic";

import {
  Calendar,
  Clock,
  CheckCircle2,
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Sparkles,
  BookOpen,
  BarChart2,
  Target,
  ArrowRight,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getReflectionData(userId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    dailyActivities,
    problemAttempts,
    quizAttempts,
    reviewLogs,
    lastWeekAttempts,
  ] = await Promise.all([
    prisma.dailyActivity.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.problemAttempt.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      include: {
        problem: { include: { module: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      include: {
        question: { include: { module: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reviewLog.findMany({
      where: { reviewedAt: { gte: sevenDaysAgo } },
      include: {
        attempt: {
          include: {
            problem: { include: { module: true } },
          },
        },
      },
      orderBy: { reviewedAt: "desc" },
    }),
    // Previous week confidence for comparison
    prisma.problemAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      select: { confidenceScore: true },
    }),
  ]);

  // ── Weekly summary computation ───────────────────────────────────────────────
  const daysStudied = dailyActivities.filter(
    (d) => d.minutesSpent > 0 || d.problemsSolved > 0 || d.quizzesTaken > 0
  ).length;

  const totalMinutes = dailyActivities.reduce(
    (s, d) => s + d.minutesSpent,
    0
  );

  const problemsAttempted = problemAttempts.length;
  const problemsSolved = problemAttempts.filter(
    (a) => a.status === "Solved" || a.status === "Mastered"
  ).length;

  const quizzesTaken = quizAttempts.length;
  const quizzesCorrect = quizAttempts.filter((a) => a.isCorrect).length;
  const quizAccuracy =
    quizzesTaken > 0 ? Math.round((quizzesCorrect / quizzesTaken) * 100) : 0;

  // Modules touched this week
  const modulesWorkedIds = new Set<string>();
  for (const a of problemAttempts) modulesWorkedIds.add(a.problem.module.id);
  for (const a of quizAttempts) modulesWorkedIds.add(a.question.module.id);

  const modulesTouchedNames = [...modulesWorkedIds].map((id) => {
    const source =
      problemAttempts.find((a) => a.problem.module.id === id)?.problem.module ??
      quizAttempts.find((a) => a.question.module.id === id)?.question.module;
    return source
      ? { id, name: source.name, slug: source.slug }
      : { id, name: "Unknown", slug: "" };
  });

  // Hints used ratio
  const hintsUsed = problemAttempts.filter((a) => a.hintUsedLevel > 0).length;
  const hintRatio =
    problemsAttempted > 0
      ? Math.round((hintsUsed / problemsAttempted) * 100)
      : 0;

  // Confidence comparison
  const thisWeekConf = problemAttempts
    .filter((a) => a.confidenceScore > 0)
    .map((a) => a.confidenceScore);
  const lastWeekConf = lastWeekAttempts
    .filter((a) => a.confidenceScore > 0)
    .map((a) => a.confidenceScore);

  const avgThisWeek =
    thisWeekConf.length > 0
      ? Math.round(thisWeekConf.reduce((a, b) => a + b, 0) / thisWeekConf.length)
      : null;
  const avgLastWeek =
    lastWeekConf.length > 0
      ? Math.round(lastWeekConf.reduce((a, b) => a + b, 0) / lastWeekConf.length)
      : null;
  const confidenceDelta =
    avgThisWeek !== null && avgLastWeek !== null
      ? avgThisWeek - avgLastWeek
      : null;

  // Correct quiz answers this week
  const correctAnswers = quizAttempts
    .filter((a) => a.isCorrect)
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      prompt: a.question.prompt.slice(0, 80) + (a.question.prompt.length > 80 ? "…" : ""),
      moduleName: a.question.module.name,
      moduleSlug: a.question.module.slug,
    }));

  // Mistake breakdown
  const mistakeCounts: Record<string, { count: number; problems: string[] }> = {};
  for (const a of problemAttempts) {
    if (a.mistakeType && a.mistakeType !== "") {
      if (!mistakeCounts[a.mistakeType]) {
        mistakeCounts[a.mistakeType] = { count: 0, problems: [] };
      }
      mistakeCounts[a.mistakeType].count++;
      if (mistakeCounts[a.mistakeType].problems.length < 3) {
        mistakeCounts[a.mistakeType].problems.push(a.problem.title);
      }
    }
  }
  const mistakeBreakdown = Object.entries(mistakeCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, data]) => ({ type, ...data }));

  // Confidence trend list (last 10 attempts)
  const confidenceTrend = problemAttempts
    .filter((a) => a.confidenceScore > 0)
    .slice(0, 10)
    .map((a, i, arr) => {
      const prev = arr[i + 1]?.confidenceScore ?? null;
      const improved = prev !== null ? a.confidenceScore > prev : null;
      return {
        id: a.id,
        problem: a.problem.title,
        module: a.problem.module.name,
        confidence: a.confidenceScore,
        improved,
        date: new Date(a.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    });

  // Per-module progress this week
  const moduleWeekData = modulesTouchedNames.map((mod) => {
    const modProblems = problemAttempts.filter(
      (a) => a.problem.module.id === mod.id
    );
    const modSolved = modProblems.filter(
      (a) => a.status === "Solved" || a.status === "Mastered"
    ).length;
    const modQuizzes = quizAttempts.filter(
      (a) => a.question.module.id === mod.id
    );
    const modQuizCorrect = modQuizzes.filter((a) => a.isCorrect).length;

    return {
      ...mod,
      problemsAttempted: modProblems.length,
      problemsSolved: modSolved,
      quizzesTaken: modQuizzes.length,
      quizAccuracy:
        modQuizzes.length > 0
          ? Math.round((modQuizCorrect / modQuizzes.length) * 100)
          : null,
    };
  });

  // Hint trend: if last 3 attempts all needed hints → worsening
  const lastFive = problemAttempts.slice(0, 5);
  const recentHintPct =
    lastFive.length > 0
      ? Math.round(
          (lastFive.filter((a) => a.hintUsedLevel > 0).length / lastFive.length) * 100
        )
      : 0;

  // ── Next week focus ──────────────────────────────────────────────────────────
  const nextWeekFocus = buildNextWeekFocus({
    hintRatio,
    quizAccuracy,
    mistakeBreakdown,
    modulesTouchedNames,
    problemsAttempted,
    confidenceDelta,
  });

  // ── Mentor weekly summary ────────────────────────────────────────────────────
  const mentorWeeklySummary = buildMentorWeeklySummary({
    daysStudied,
    totalMinutes,
    problemsAttempted,
    problemsSolved,
    quizzesTaken,
    quizAccuracy,
    modulesTouchedNames,
    hintsUsed,
    hintRatio,
    mistakeBreakdown,
    avgThisWeek,
    confidenceDelta,
  });

  return {
    daysStudied,
    totalMinutes,
    problemsAttempted,
    problemsSolved,
    quizzesTaken,
    quizAccuracy,
    modulesTouchedNames: moduleWeekData,
    hintsUsed,
    hintRatio,
    recentHintPct,
    avgThisWeek,
    avgLastWeek,
    confidenceDelta,
    correctAnswers,
    mistakeBreakdown,
    confidenceTrend,
    nextWeekFocus,
    mentorWeeklySummary,
    reviewsDone: reviewLogs.length,
  };
}

// ─── Helper generators ─────────────────────────────────────────────────────────

function buildNextWeekFocus({
  hintRatio,
  quizAccuracy,
  mistakeBreakdown,
  modulesTouchedNames,
  problemsAttempted,
  confidenceDelta,
}: {
  hintRatio: number;
  quizAccuracy: number;
  mistakeBreakdown: { type: string; count: number }[];
  modulesTouchedNames: { name: string }[];
  problemsAttempted: number;
  confidenceDelta: number | null;
}): string[] {
  const focus: string[] = [];

  if (hintRatio > 50) {
    focus.push(
      "Reduce hint dependency — try solving problems for 15 minutes before looking at hints."
    );
  }

  if (quizAccuracy < 60 && quizAccuracy > 0) {
    focus.push(
      `Improve quiz accuracy (currently ${quizAccuracy}%) — re-read theory for any module below 60%.`
    );
  } else if (quizAccuracy === 0) {
    focus.push("Take at least one quiz per module you study this week.");
  }

  if (mistakeBreakdown.length > 0) {
    const topMistake = mistakeBreakdown[0].type
      .replace(/([A-Z])/g, " $1")
      .trim();
    focus.push(
      `Work on "${topMistake}" — this was your most common mistake this week. Study the related concept check.`
    );
  }

  if (problemsAttempted < 3) {
    focus.push(
      "Aim for at least 3 practice problems this week to build muscle memory."
    );
  }

  if (confidenceDelta !== null && confidenceDelta < 0) {
    focus.push(
      "Confidence dipped this week — prioritize simpler problems first to rebuild momentum."
    );
  }

  if (modulesTouchedNames.length === 0) {
    focus.push("Pick a module and spend at least 20 minutes studying it.");
  }

  return focus.slice(0, 3);
}

function buildMentorWeeklySummary({
  daysStudied,
  totalMinutes,
  problemsAttempted,
  problemsSolved,
  quizzesTaken,
  quizAccuracy,
  modulesTouchedNames,
  hintsUsed,
  hintRatio,
  mistakeBreakdown,
  avgThisWeek,
  confidenceDelta,
}: {
  daysStudied: number;
  totalMinutes: number;
  problemsAttempted: number;
  problemsSolved: number;
  quizzesTaken: number;
  quizAccuracy: number;
  modulesTouchedNames: { name: string }[];
  hintsUsed: number;
  hintRatio: number;
  mistakeBreakdown: { type: string; count: number }[];
  avgThisWeek: number | null;
  confidenceDelta: number | null;
}): string {
  const parts: string[] = [];

  if (daysStudied === 0) {
    return "No activity was recorded this week. That's okay — start fresh tomorrow and aim for even one focused session.";
  }

  const moduleNames =
    modulesTouchedNames.length > 0
      ? modulesTouchedNames
          .slice(0, 2)
          .map((m) => m.name)
          .join(" and ")
      : "your current modules";

  parts.push(
    `This week you studied for ${daysStudied} day${daysStudied !== 1 ? "s" : ""} (${totalMinutes} minutes total), focusing on ${moduleNames}.`
  );

  if (problemsAttempted > 0) {
    parts.push(
      `You attempted ${problemsAttempted} problem${problemsAttempted !== 1 ? "s" : ""} and solved ${problemsSolved}, ` +
        (hintsUsed > 0
          ? `relying on hints in ${hintsUsed} of them.`
          : "without needing any hints — excellent independent thinking!")
    );
  }

  if (quizzesTaken > 0) {
    const quizMsg =
      quizAccuracy >= 70
        ? `Great quiz accuracy at ${quizAccuracy}%.`
        : quizAccuracy >= 50
        ? `Decent quiz accuracy at ${quizAccuracy}% — a bit more theory review could push this higher.`
        : `Quiz accuracy was ${quizAccuracy}% — theory review is recommended before more practice.`;
    parts.push(
      `You took ${quizzesTaken} quiz attempt${quizzesTaken !== 1 ? "s" : ""}. ${quizMsg}`
    );
  }

  if (mistakeBreakdown.length > 0) {
    const topMistake = mistakeBreakdown[0].type
      .replace(/([A-Z])/g, " $1")
      .trim();
    parts.push(
      `Your biggest challenge this week was ${topMistake} (${mistakeBreakdown[0].count} occurrence${mistakeBreakdown[0].count !== 1 ? "s" : ""}).`
    );
  }

  if (hintRatio > 60) {
    parts.push(
      `Hint dependency was high at ${hintRatio}% — next week, try spending more time thinking before reaching for hints.`
    );
  } else if (hintRatio > 0 && hintRatio <= 30) {
    parts.push(`Low hint usage at ${hintRatio}% — your independence is growing.`);
  }

  if (avgThisWeek !== null) {
    const confMsg =
      confidenceDelta === null
        ? `Average confidence was ${avgThisWeek}%.`
        : confidenceDelta > 0
        ? `Confidence improved by ${confidenceDelta} points to ${avgThisWeek}% — great trend!`
        : confidenceDelta < 0
        ? `Confidence dipped by ${Math.abs(confidenceDelta)} points to ${avgThisWeek}%. Don't worry — harder problems naturally lower confidence.`
        : `Confidence held steady at ${avgThisWeek}%.`;
    parts.push(confMsg);
  }

  return parts.join(" ");
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ReflectionPage() {
  const user = await requireUser();
  const data = await getReflectionData(user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Weekly Reflection
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          A look back at the past 7 days — what went well, what to improve.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — This Week at a Glance
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeader icon={<BarChart2 className="w-4 h-4 text-indigo-600" />} title="This Week at a Glance" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Days Studied"
            value={data.daysStudied}
            icon={Calendar}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            subtitle="out of 7"
          />
          <StatCard
            label="Minutes"
            value={data.totalMinutes}
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            subtitle="total study time"
          />
          <StatCard
            label="Problems"
            value={`${data.problemsSolved}/${data.problemsAttempted}`}
            icon={Target}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            subtitle="solved / attempted"
          />
          <StatCard
            label="Quiz Accuracy"
            value={data.quizzesTaken > 0 ? `${data.quizAccuracy}%` : "—"}
            icon={Brain}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            subtitle={`${data.quizzesTaken} attempts`}
          />
          <StatCard
            label="Modules Touched"
            value={data.modulesTouchedNames.length}
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            label="Reviews Done"
            value={data.reviewsDone}
            icon={CheckCircle2}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
            subtitle="spaced repetition"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — Patterns You Worked On
      ══════════════════════════════════════════════════════════════ */}
      {data.modulesTouchedNames.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
            title="Patterns You Worked On"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.modulesTouchedNames.map((mod) => (
              <Card key={mod.id}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-slate-800 text-sm">
                    {mod.name}
                  </p>
                  <Link
                    href={`/modules/${mod.slug}`}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline shrink-0"
                  >
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                  <span>
                    Problems:{" "}
                    <span className="font-semibold text-slate-700">
                      {mod.problemsSolved}/{mod.problemsAttempted}
                    </span>
                  </span>
                  {mod.quizzesTaken > 0 && (
                    <span>
                      Quiz:{" "}
                      <span className="font-semibold text-slate-700">
                        {mod.quizAccuracy}%
                      </span>{" "}
                      ({mod.quizzesTaken} q)
                    </span>
                  )}
                </div>
                {mod.problemsAttempted > 0 && (
                  <ProgressBar
                    value={
                      mod.problemsAttempted > 0
                        ? (mod.problemsSolved / mod.problemsAttempted) * 100
                        : 0
                    }
                    size="sm"
                    className="mt-3"
                  />
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — What You Got Right
      ══════════════════════════════════════════════════════════════ */}
      {data.correctAnswers.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
            title="What You Got Right"
          />
          <Card padding="none" className="divide-y divide-slate-100">
            {data.correctAnswers.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-green-50/30 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{q.prompt}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{q.moduleName}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — Mistakes Made
      ══════════════════════════════════════════════════════════════ */}
      {data.mistakeBreakdown.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            title="Mistakes Made This Week"
          />
          <div className="space-y-3">
            {data.mistakeBreakdown.map((m) => {
              const label = m.type.replace(/([A-Z])/g, " $1").trim();
              return (
                <div
                  key={m.type}
                  className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="font-semibold text-slate-800 text-sm">
                        {label}
                      </p>
                    </div>
                    <Badge variant="warning">{m.count}x</Badge>
                  </div>
                  {m.problems.length > 0 && (
                    <ul className="space-y-1 ml-6">
                      {m.problems.map((prob, i) => (
                        <li key={i} className="text-xs text-slate-600">
                          • {prob}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — Confidence Trend
      ══════════════════════════════════════════════════════════════ */}
      {data.confidenceTrend.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
            title="Confidence Trend"
            subtitle={
              data.confidenceDelta !== null
                ? data.confidenceDelta > 0
                  ? `+${data.confidenceDelta} pts vs last week`
                  : data.confidenceDelta < 0
                  ? `${data.confidenceDelta} pts vs last week`
                  : "Steady vs last week"
                : undefined
            }
          />
          <Card padding="none" className="divide-y divide-slate-100">
            {data.confidenceTrend.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors"
              >
                {item.improved === true ? (
                  <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
                ) : item.improved === false ? (
                  <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.problem}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.module} · {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ProgressBar value={item.confidence} size="sm" className="w-20" />
                  <span
                    className={cn(
                      "text-xs font-bold w-10 text-right",
                      item.confidence >= 70
                        ? "text-green-600"
                        : item.confidence >= 40
                        ? "text-amber-600"
                        : "text-red-500"
                    )}
                  >
                    {item.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </Card>

          {data.avgThisWeek !== null && (
            <div className="flex items-center gap-3 text-sm text-slate-600 px-1">
              <span>This week avg:</span>
              <span className="font-bold text-slate-900">{data.avgThisWeek}%</span>
              {data.avgLastWeek !== null && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>Last week:</span>
                  <span className="font-bold text-slate-900">
                    {data.avgLastWeek}%
                  </span>
                  {data.confidenceDelta !== null && (
                    <span
                      className={cn(
                        "font-bold",
                        data.confidenceDelta > 0
                          ? "text-green-600"
                          : data.confidenceDelta < 0
                          ? "text-red-500"
                          : "text-slate-400"
                      )}
                    >
                      ({data.confidenceDelta > 0 ? "+" : ""}
                      {data.confidenceDelta})
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — Hint Dependency
      ══════════════════════════════════════════════════════════════ */}
      {data.problemsAttempted > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<Lightbulb className="w-4 h-4 text-yellow-500" />}
            title="Hint Dependency"
          />
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">
                Overall hint usage this week
              </p>
              <span
                className={cn(
                  "text-sm font-bold",
                  data.hintRatio > 60
                    ? "text-red-600"
                    : data.hintRatio > 30
                    ? "text-amber-600"
                    : "text-green-600"
                )}
              >
                {data.hintRatio}%
              </span>
            </div>
            <ProgressBar
              value={data.hintRatio}
              showLabel
              barClassName={
                data.hintRatio > 60
                  ? "bg-red-400"
                  : data.hintRatio > 30
                  ? "bg-amber-400"
                  : "bg-green-500"
              }
            />
            <p className="text-xs text-slate-500 mt-3">
              {data.hintsUsed} out of {data.problemsAttempted} problems needed a hint.{" "}
              {data.hintRatio > 60
                ? "High dependency — spend more time re-reading theory before attempting problems."
                : data.hintRatio > 30
                ? "Moderate — try 15 minutes of solo thinking before hints."
                : "Excellent independence. Keep it up!"}
            </p>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Recent 5 attempts
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }, (_, i) => {
                  const hasHint =
                    i < data.problemsAttempted
                      ? (data.problemsAttempted > 0 &&
                          data.recentHintPct / 20 > i
                            ? true
                            : false)
                      : null;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        i >= data.problemsAttempted
                          ? "bg-slate-100 text-slate-300"
                          : hasHint
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {i >= data.problemsAttempted ? "—" : hasHint ? "H" : "✓"}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — Mentor Weekly Summary
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <h2 className="font-bold text-base">Mentor Weekly Summary</h2>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed">
            {data.mentorWeeklySummary}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 8 — Next Week Focus
      ══════════════════════════════════════════════════════════════ */}
      {data.nextWeekFocus.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<Target className="w-4 h-4 text-indigo-600" />}
            title="Next Week Focus"
          />
          <div className="space-y-3">
            {data.nextWeekFocus.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              See your training plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Reusable section header ───────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {subtitle && (
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {subtitle}
        </span>
      )}
    </div>
  );
}
