export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  RefreshCw,
  Star,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn, formatDate, daysUntil, getDifficultyColor, getMasteryLabel } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type FilterMode = "all" | "due" | "overdue" | "upcoming";

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = (sp.filter ?? "all") as FilterMode;
  const now = new Date();

  // ── Fetch modules with progress that have a review date ───────────────────
  const modules = await prisma.module.findMany({
    where: {
      moduleProgress: {
        some: {
          userId: user.id,
          reviewDueDate: { not: null },
        },
      },
    },
    orderBy: { orderIndex: "asc" },
    include: {
      moduleProgress: {
        where: { userId: user.id },
      },
    },
  });

  // ── Fetch problem attempts where revisitDate is due ───────────────────────
  const dueProblems = await prisma.problemAttempt.findMany({
    where: {
      userId: user.id,
      revisitDate: { lte: now },
    },
    orderBy: { revisitDate: "asc" },
    include: {
      problem: {
        include: {
          module: { select: { name: true, slug: true } },
        },
      },
    },
  });

  // ── Module review categorization ──────────────────────────────────────────
  type ModuleWithProgress = (typeof modules)[0];

  function getModuleReviewStatus(m: ModuleWithProgress): "overdue" | "due" | "upcoming" {
    const days = daysUntil(m.moduleProgress[0]?.reviewDueDate ?? null);
    if (days === null) return "upcoming";
    if (days < 0) return "overdue";
    if (days === 0) return "due";
    return "upcoming";
  }

  const categorized = modules.map((m) => ({
    module: m,
    reviewStatus: getModuleReviewStatus(m),
    daysUntilReview: daysUntil(m.moduleProgress[0]?.reviewDueDate ?? null),
  }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const overdueMods = categorized.filter((c) => c.reviewStatus === "overdue").length;
  const dueTodayMods = categorized.filter((c) => c.reviewStatus === "due").length;
  const upcomingMods = categorized.filter((c) => c.reviewStatus === "upcoming").length;
  const dueProblemsCount = dueProblems.length;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredModules = categorized.filter((c) => {
    if (filter === "overdue") return c.reviewStatus === "overdue";
    if (filter === "due") return c.reviewStatus === "due";
    if (filter === "upcoming") return c.reviewStatus === "upcoming";
    return true;
  });

  const showProblems = filter === "all" || filter === "due" || filter === "overdue";

  // ── Review status styling ─────────────────────────────────────────────────
  function reviewStatusStyle(status: string) {
    if (status === "overdue")
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle,
        iconColor: "text-red-500",
        border: "border-l-4 border-l-red-400",
        label: "Overdue",
      };
    if (status === "due")
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
        iconColor: "text-amber-500",
        border: "border-l-4 border-l-amber-400",
        label: "Due Today",
      };
    return {
      badge: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-500",
      border: "border-l-4 border-l-green-300",
      label: "Upcoming",
    };
  }

  const FILTERS: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "All Reviews", count: categorized.length },
    { key: "overdue", label: "Overdue", count: overdueMods },
    { key: "due", label: "Due Today", count: dueTodayMods },
    { key: "upcoming", label: "Upcoming", count: upcomingMods },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Spaced repetition review schedule. Stay consistent to maximize retention.
        </p>
      </div>

      {/* ── Alert banner for overdue ── */}
      {overdueMods > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {overdueMods} overdue review{overdueMods !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Overdue reviews hurt retention. Clear them before starting new
              material.
            </p>
          </div>
          <Link
            href="/review?filter=overdue"
            className="text-xs font-semibold text-red-700 hover:text-red-900 whitespace-nowrap"
          >
            View All
            <ChevronRight className="inline w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Overdue"
          value={overdueMods}
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          label="Due Today"
          value={dueTodayMods}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <StatCard
          label="Upcoming"
          value={upcomingMods}
          icon={CalendarClock}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Problems Due"
          value={dueProblemsCount}
          icon={Code2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/review?filter=${f.key}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                  filter === f.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {f.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Module review items ── */}
      {filteredModules.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Star className="w-4 h-4" />
            Module Reviews
          </h2>

          <div className="space-y-3">
            {filteredModules.map(({ module: m, reviewStatus, daysUntilReview: days }) => {
              const style = reviewStatusStyle(reviewStatus);
              const StatusIcon = style.icon;
              const progress = m.moduleProgress[0]!;
              const mastery = progress.masteryScore ?? 0;

              return (
                <div
                  key={m.id}
                  className={cn(
                    "bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden",
                    style.border
                  )}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Status + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                              style.badge
                            )}
                          >
                            <StatusIcon className={cn("w-3 h-3", style.iconColor)} />
                            {style.label}
                          </span>
                          <Badge variant="default" size="sm">
                            {getMasteryLabel(mastery)}
                          </Badge>
                          {m.difficultyLevel && (
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded font-medium",
                                getDifficultyColor(m.difficultyLevel)
                              )}
                            >
                              {m.difficultyLevel}
                            </span>
                          )}
                        </div>

                        {/* Module name */}
                        <h3 className="font-semibold text-slate-900 text-base">
                          {m.name}
                        </h3>

                        {/* Due date text */}
                        <p
                          className={cn(
                            "text-xs mt-1 font-medium",
                            reviewStatus === "overdue"
                              ? "text-red-600"
                              : reviewStatus === "due"
                              ? "text-amber-600"
                              : "text-slate-400"
                          )}
                        >
                          {reviewStatus === "overdue"
                            ? `Overdue by ${Math.abs(days ?? 0)} day${Math.abs(days ?? 0) !== 1 ? "s" : ""}`
                            : reviewStatus === "due"
                            ? "Due today"
                            : `Due in ${days} day${days !== 1 ? "s" : ""} · ${formatDate(progress.reviewDueDate)}`}
                        </p>

                        {/* Scores */}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>
                            Mastery:{" "}
                            <span className="font-semibold text-slate-700">
                              {Math.round(mastery)}%
                            </span>
                          </span>
                          <span>
                            Confidence:{" "}
                            <span className="font-semibold text-slate-700">
                              {Math.round(progress.confidenceAverage)}%
                            </span>
                          </span>
                          <span>
                            Quiz:{" "}
                            <span className="font-semibold text-slate-700">
                              {Math.round(progress.quizScore)}%
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/modules/${m.slug}`}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors",
                          reviewStatus === "overdue"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : reviewStatus === "due"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        )}
                      >
                        Review Module
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Due Problems ── */}
      {showProblems && dueProblems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Problems Due for Revisit
            <span className="text-xs font-normal bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">
              {dueProblems.length}
            </span>
          </h2>

          <div className="space-y-3">
            {dueProblems.map((attempt) => {
              const prob = attempt.problem;
              const overdueDays = daysUntil(attempt.revisitDate);

              return (
                <div
                  key={attempt.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 border-l-4 border-l-indigo-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded font-medium",
                            getDifficultyColor(prob.difficulty)
                          )}
                        >
                          {prob.difficulty}
                        </span>
                        {attempt.mistakeType && attempt.mistakeType !== "" && (
                          <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {attempt.mistakeType}
                          </span>
                        )}
                        {attempt.confidenceScore > 0 && (
                          <Badge
                            variant={
                              attempt.confidenceScore >= 70
                                ? "success"
                                : attempt.confidenceScore >= 40
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                          >
                            {attempt.confidenceScore}% conf.
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm">
                        {prob.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {prob.module.name}
                        {attempt.revisitDate && (
                          <span
                            className={cn(
                              "ml-2 font-medium",
                              (overdueDays ?? 0) < 0
                                ? "text-red-600"
                                : "text-amber-600"
                            )}
                          >
                            {(overdueDays ?? 0) < 0
                              ? `Overdue by ${Math.abs(overdueDays ?? 0)}d`
                              : "Due today"}
                          </span>
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/practice/${prob.id}`}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Practice Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {filteredModules.length === 0 && (!showProblems || dueProblems.length === 0) && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {filter === "overdue"
              ? "No overdue reviews!"
              : filter === "due"
              ? "Nothing due today"
              : filter === "upcoming"
              ? "No upcoming reviews scheduled"
              : "All clear!"}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            {filter === "all"
              ? "Complete some modules and practice problems to build your review queue."
              : "Switch to a different filter to see other items."}
          </p>
          {filter !== "all" && (
            <Link
              href="/review"
              className="mt-4 inline-flex text-sm text-indigo-600 font-semibold hover:underline"
            >
              View all reviews
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
