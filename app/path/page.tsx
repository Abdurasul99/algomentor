export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Star,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronRight,
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
} from "@/lib/utils";
import { computeInterviewReadiness } from "@/lib/mentor";
import type { ModuleWithProgress } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import StatCard from "@/components/ui/StatCard";

async function getData(userId: string) {
  const modules = await prisma.module.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      moduleProgress: {
        where: { userId },
      },
    },
  });
  return modules;
}

export default async function LearningPathPage() {
  const user = await requireUser();
  const modules = await getData(user.id);

  // Build slug → status map for prerequisite checking
  const statusMap: Record<string, string> = {};
  for (const m of modules) {
    statusMap[m.slug] = m.moduleProgress[0]?.status ?? "NotStarted";
  }

  const totalModules = modules.length;
  const startedCount = modules.filter(
    (m) => m.moduleProgress[0] && m.moduleProgress[0].status !== "NotStarted"
  ).length;
  const masteredCount = modules.filter(
    (m) => m.moduleProgress[0]?.status === "Mastered"
  ).length;

  // Build the ModuleWithProgress shape for computeInterviewReadiness
  const modulesForReadiness: ModuleWithProgress[] = modules.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    description: m.description,
    difficultyLevel: m.difficultyLevel,
    orderIndex: m.orderIndex,
    prerequisites: m.prerequisites,
    moduleProgress: m.moduleProgress[0]
      ? {
          status: m.moduleProgress[0].status,
          quizScore: m.moduleProgress[0].quizScore,
          practiceScore: m.moduleProgress[0].practiceScore,
          masteryScore: m.moduleProgress[0].masteryScore,
          confidenceAverage: m.moduleProgress[0].confidenceAverage,
          theoryCompleted: m.moduleProgress[0].theoryCompleted,
          hintDependencyScore: m.moduleProgress[0].hintDependencyScore,
          reviewDueDate: m.moduleProgress[0].reviewDueDate,
        }
      : null,
  }));

  const interviewReadiness = computeInterviewReadiness(modulesForReadiness);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learning Path</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Follow this structured sequence to build deep algorithm intuition for
          technical interviews.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Modules"
          value={totalModules}
          icon={BookOpen}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Started"
          value={startedCount}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Mastered"
          value={masteredCount}
          icon={Star}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Interview Ready"
          value={`${interviewReadiness}%`}
          icon={Target}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Interview Readiness Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Overall Interview Readiness
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              interviewReadiness >= 70
                ? "text-green-600"
                : interviewReadiness >= 40
                ? "text-yellow-600"
                : "text-slate-500"
            )}
          >
            {interviewReadiness}%
          </span>
        </div>
        <ProgressBar value={interviewReadiness} size="lg" />
        <p className="text-xs text-slate-400 mt-2">
          Based on average mastery across all modules you&apos;ve started (70%
          weight) and coverage (30% weight).
        </p>
      </div>

      {/* Module Path */}
      <div className="space-y-3">
        {modules.map((module, idx) => {
          const prereqs = JSON.parse(module.prerequisites) as string[];
          const isLocked =
            prereqs.length > 0 &&
            !prereqs.every((slug) =>
              ["Completed", "Mastered"].includes(statusMap[slug] ?? "NotStarted")
            );

          const progress = module.moduleProgress[0] ?? null;
          const status = progress?.status ?? "NotStarted";
          const mastery = progress?.masteryScore ?? 0;
          const reviewDue = progress?.reviewDueDate ?? null;
          const reviewDays = daysUntil(reviewDue);
          const isReviewDue =
            reviewDays !== null && reviewDays <= 0 && status !== "NotStarted";

          return (
            <div key={module.id} className="relative flex gap-4">
              {/* Connector line */}
              {idx < modules.length - 1 && (
                <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-slate-100 z-0" />
              )}

              {/* Step indicator */}
              <div className="relative z-10 shrink-0">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-colors",
                    status === "Mastered"
                      ? "bg-green-500 border-green-500 text-white"
                      : status === "Completed"
                      ? "bg-blue-500 border-blue-500 text-white"
                      : status === "InProgress"
                      ? "bg-yellow-400 border-yellow-400 text-white"
                      : isLocked
                      ? "bg-slate-100 border-slate-200 text-slate-400"
                      : "bg-white border-slate-300 text-slate-500"
                  )}
                >
                  {status === "Mastered" ? (
                    <Star className="w-5 h-5" />
                  ) : status === "Completed" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    module.orderIndex
                  )}
                </div>
              </div>

              {/* Card */}
              <div
                className={cn(
                  "flex-1 bg-white border border-slate-200 rounded-xl shadow-sm mb-2 overflow-hidden",
                  isLocked && "opacity-60"
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-medium">
                          #{module.orderIndex}
                        </span>
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
                        <Badge
                          className={getStatusColor(status)}
                          size="sm"
                        >
                          {status}
                        </Badge>
                        {isReviewDue && (
                          <Badge variant="warning" size="sm">
                            Review Due
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge variant="default" size="sm">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-base">
                        {module.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {module.description}
                      </p>
                    </div>

                    {!isLocked && (
                      <Link
                        href={`/modules/${module.slug}`}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-1"
                      >
                        {status === "NotStarted" ? "Start" : "Open"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Mastery bar */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Mastery:{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            getMasteryColor(mastery)
                              .split(" ")
                              .find((c) => c.startsWith("text-"))
                          )}
                        >
                          {getMasteryLabel(mastery)}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {Math.round(mastery)}%
                      </span>
                    </div>
                    <ProgressBar value={mastery} size="sm" />
                  </div>

                  {/* Score row */}
                  {progress && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Quiz:{" "}
                        <span className="font-medium text-slate-700">
                          {Math.round(progress.quizScore)}%
                        </span>
                      </span>
                      <span>
                        Practice:{" "}
                        <span className="font-medium text-slate-700">
                          {Math.round(progress.practiceScore)}%
                        </span>
                      </span>
                      {reviewDue && (
                        <span>
                          Review:{" "}
                          <span
                            className={cn(
                              "font-medium",
                              isReviewDue ? "text-red-600" : "text-slate-700"
                            )}
                          >
                            {isReviewDue
                              ? "Overdue"
                              : reviewDays === 0
                              ? "Today"
                              : `in ${reviewDays}d`}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Prerequisites note */}
                  {isLocked && prereqs.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        Requires:{" "}
                        {prereqs
                          .map((slug) => {
                            const mod = modules.find((m) => m.slug === slug);
                            return mod?.name ?? slug;
                          })
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
