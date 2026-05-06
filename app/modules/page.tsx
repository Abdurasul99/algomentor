export const dynamic = "force-dynamic";

import Link from "next/link";
import { BookOpen, ChevronRight, Star, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  cn,
  getStatusColor,
  getMasteryLabel,
  getMasteryColor,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import StatCard from "@/components/ui/StatCard";

async function getData(userId: string) {
  return prisma.module.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      moduleProgress: {
        where: { userId },
      },
    },
  });
}

export default async function ModulesPage() {
  const user = await requireUser();
  const modules = await getData(user.id);

  const total = modules.length;
  const inProgress = modules.filter(
    (m) => m.moduleProgress[0]?.status === "InProgress"
  ).length;
  const completed = modules.filter((m) =>
    ["Completed", "Mastered"].includes(m.moduleProgress[0]?.status ?? "")
  ).length;
  const mastered = modules.filter(
    (m) => m.moduleProgress[0]?.status === "Mastered"
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Modules</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Browse all algorithm modules. Each module covers theory, concept
          checks, and practice problems.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={total}
          icon={BookOpen}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon={TrendingUp}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={ChevronRight}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Mastered"
          value={mastered}
          icon={Star}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const progress = module.moduleProgress[0] ?? null;
          const status = progress?.status ?? "NotStarted";
          const mastery = progress?.masteryScore ?? 0;

          return (
            <Link
              key={module.id}
              href={`/modules/${module.slug}`}
              className="group bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all block"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
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
                </div>
                <Badge className={getStatusColor(status)} size="sm">
                  {status}
                </Badge>
              </div>

              {/* Name & description */}
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                {module.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {module.description}
              </p>

              {/* Mastery */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      getMasteryColor(mastery)
                        .split(" ")
                        .find((c) => c.startsWith("text-")) ?? "text-slate-500"
                    )}
                  >
                    {getMasteryLabel(mastery)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {Math.round(mastery)}%
                  </span>
                </div>
                <ProgressBar value={mastery} size="sm" />
              </div>

              {/* Score row */}
              {progress && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
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
                </div>
              )}

              {/* CTA */}
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                {status === "NotStarted" ? "Start Module" : "Continue"}
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
