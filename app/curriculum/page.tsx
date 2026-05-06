export const dynamic = "force-dynamic";

import { GraduationCap, Trophy, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import WeekCard from "@/components/curriculum/WeekCard";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CurriculumTaskRow = {
  id: string;
  title: string;
  category: string;
  points: number;
  isCompleted: boolean;
  completedAt: Date | null;
  leetcodeNumber: number | null;
  leetcodeUrl: string | null;
  moduleSlug: string | null;
  orderIndex: number;
};

type WeekWithTasks = {
  id: string;
  weekNumber: number;
  title: string;
  totalPoints: number;
  tasks: CurriculumTaskRow[];
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function CurriculumPage() {
  const user = await requireUser();

  const weeks = (await prisma.curriculumWeek.findMany({
    orderBy: { weekNumber: "asc" },
    include: {
      tasks: {
        where: { userId: user.id },
        orderBy: { orderIndex: "asc" },
      },
    },
  })) as WeekWithTasks[];

  // ── Compute stats ──────────────────────────────────────────────────────────
  const totalPoints = weeks.reduce((sum, w) => sum + w.totalPoints, 0);
  const earnedPoints = weeks.reduce((sum, w) => {
    return sum + w.tasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.points, 0);
  }, 0);

  const completedWeeks = weeks.filter((w) => {
    const earned = w.tasks
      .filter((t) => t.isCompleted)
      .reduce((s, t) => s + t.points, 0);
    return earned >= w.totalPoints && w.totalPoints > 0;
  }).length;

  // Current week: first week with any incomplete tasks
  const currentWeek = weeks.find((w) => w.tasks.some((t) => !t.isCompleted)) ?? null;

  const overallPct =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              OutTalent Algorithm Curriculum
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              15-week structured program — track your progress through every task
            </p>
          </div>
        </div>

        {/* Overall progress card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {earnedPoints.toFixed(1)}
                  <span className="text-lg font-medium text-slate-400">
                    &nbsp;/&nbsp;{totalPoints} pts
                  </span>
                </p>
                <p className="text-sm text-slate-500 mt-0.5">Total points earned</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-3xl font-bold text-slate-900">{overallPct}%</p>
                <p className="text-sm text-slate-500 mt-0.5">Curriculum complete</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                {completedWeeks} week{completedWeeks !== 1 ? "s" : ""} completed
              </span>
              {currentWeek && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                  <Target className="w-3.5 h-3.5" />
                  Week {currentWeek.weekNumber} active
                </span>
              )}
            </div>
          </div>

          <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Week cards ── */}
      {weeks.length > 0 ? (
        <div className="space-y-3">
          {weeks.map((week) => {
            const weekEarned = week.tasks
              .filter((t) => t.isCompleted)
              .reduce((s, t) => s + t.points, 0);
            const isCurrentWeek = currentWeek?.id === week.id;
            const isComplete =
              weekEarned >= week.totalPoints && week.totalPoints > 0;
            const hasStarted = weekEarned > 0;

            return (
              <WeekCard
                key={week.id}
                week={week}
                weekEarned={weekEarned}
                isCurrentWeek={isCurrentWeek}
                isComplete={isComplete}
                hasStarted={hasStarted}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg">
            No curriculum data yet
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Run the curriculum seed to populate your 15-week program.
          </p>
          <code className="mt-4 inline-block text-xs bg-slate-100 text-slate-600 px-4 py-2 rounded-lg">
            npx tsx prisma/run-curriculum-seed.ts
          </code>
        </div>
      )}
    </div>
  );
}
