export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import WeekCard from "@/components/curriculum/WeekCard";
import { CheckCircle2, Circle, Target, Flame } from "lucide-react";

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

async function ensureUserTasks(userId: string) {
  const count = await prisma.curriculumTask.count({ where: { userId } });
  if (count > 0) return;

  // Find any existing user's tasks as the template
  const anyTask = await prisma.curriculumTask.findFirst();
  if (!anyTask) return;

  const template = await prisma.curriculumTask.findMany({
    where: { userId: anyTask.userId },
    orderBy: { orderIndex: "asc" },
  });
  if (template.length === 0) return;

  await prisma.curriculumTask.createMany({
    data: template.map((t) => ({
      weekId:            t.weekId,
      userId,
      title:             t.title,
      category:          t.category,
      points:            t.points,
      isCompleted:       false,
      leetcodeNumber:    t.leetcodeNumber,
      leetcodeUrl:       t.leetcodeUrl,
      moduleSlug:        t.moduleSlug,
      practiceProblemId: t.practiceProblemId,
      notes:             "",
      orderIndex:        t.orderIndex,
    })),
  });
}

export default async function CurriculumPage() {
  const user = await requireUser();

  // Auto-create tasks for this user if they don't have any yet
  await ensureUserTasks(user.id);

  const weeks = (await prisma.curriculumWeek.findMany({
    orderBy: { weekNumber: "asc" },
    include: {
      tasks: {
        where: { userId: user.id },
        orderBy: { orderIndex: "asc" },
      },
    },
  })) as WeekWithTasks[];

  const totalTasks = weeks.reduce((s, w) => s + w.tasks.length, 0);
  const doneTasks = weeks.reduce((s, w) => s + w.tasks.filter((t) => t.isCompleted).length, 0);
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const completedWeeks = weeks.filter((w) => w.tasks.length > 0 && w.tasks.every((t) => t.isCompleted)).length;

  // Current week = first week with incomplete tasks
  const currentWeekNum = weeks.find(
    (w) => w.tasks.some((t) => !t.isCompleted)
  )?.weekNumber ?? weeks.length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{pct}%</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Overall Progress</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-green-600">{doneTasks}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Tasks Done</p>
          <p className="text-xs text-slate-400 mt-0.5">of {totalTasks}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-amber-600">{completedWeeks}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Weeks Done</p>
          <p className="text-xs text-slate-400 mt-0.5">of {weeks.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-blue-600">W{currentWeekNum}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Current Week</p>
          <p className="text-xs text-slate-400 mt-0.5">In Progress</p>
        </div>
      </div>

      {/* Week list */}
      <div className="space-y-3">
        {weeks.map((week) => (
          <WeekCard
            key={week.id}
            week={week}
            isCurrentWeek={week.weekNumber === currentWeekNum}
          />
        ))}
      </div>
    </div>
  );
}
