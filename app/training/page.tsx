export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Zap,
  BookOpen,
  Brain,
  Code2,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target,
  XCircle,
  Info,
  Sparkles,
  Flag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn, getMasteryLabel, getMasteryColor } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { computeInterviewReadiness } from "@/lib/mentor";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TaskType = "Review" | "Theory" | "Quiz" | "Practice" | "NewModule";
type Urgency = "Critical" | "High" | "Medium" | "Low";

interface TrainingTask {
  type: TaskType;
  priority: number;
  title: string;
  reason: string;
  estimatedMinutes: number;
  href: string;
  urgency: Urgency;
  moduleName?: string;
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getTrainingData(userId: string) {
  const now = new Date();

  const modules = await prisma.module.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      moduleProgress: {
        where: { userId },
      },
      practiceProblems: {
        include: {
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
      quizQuestions: {
        include: {
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  // Flatten moduleProgress for easier use
  const modulesFlat = modules.map((m) => ({
    ...m,
    moduleProgress: m.moduleProgress[0] ?? null,
  }));

  // ── Compute review debt ──────────────────────────────────────────────────────
  const overdueReviews = modulesFlat.filter((m) => {
    const due = m.moduleProgress?.reviewDueDate;
    return due && new Date(due) < new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }).length;

  const dueReviews = modulesFlat.filter((m) => {
    const due = m.moduleProgress?.reviewDueDate;
    return (
      due &&
      new Date(due) <= now &&
      new Date(due) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
  }).length;

  // ── Current in-progress module ───────────────────────────────────────────────
  const inProgressModules = modulesFlat
    .filter((m) => m.moduleProgress?.status === "InProgress")
    .sort(
      (a, b) =>
        new Date(b.moduleProgress!.updatedAt).getTime() -
        new Date(a.moduleProgress!.updatedAt).getTime()
    );
  const currentModule = inProgressModules[0] ?? null;

  // ── Completed slugs for prerequisite check ──────────────────────────────────
  const completedSlugs = modulesFlat
    .filter(
      (m) =>
        m.moduleProgress?.status === "Completed" ||
        m.moduleProgress?.status === "Mastered"
    )
    .map((m) => m.slug);

  // ── Next module to start ─────────────────────────────────────────────────────
  const nextModule =
    modulesFlat
      .filter(
        (m) => !m.moduleProgress || m.moduleProgress.status === "NotStarted"
      )
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .find((m) => {
        const prereqs = JSON.parse(m.prerequisites) as string[];
        return prereqs.length === 0 || prereqs.every((p) => completedSlugs.includes(p));
      }) ?? null;

  // ── "What to avoid" list ─────────────────────────────────────────────────────
  const avoidList: string[] = [];

  modulesFlat
    .filter(
      (m) => !m.moduleProgress || m.moduleProgress.status === "NotStarted"
    )
    .forEach((m) => {
      const prereqs = JSON.parse(m.prerequisites) as string[];
      const unmet = prereqs.filter((p) => !completedSlugs.includes(p));
      if (unmet.length > 0) {
        const prereqNames = unmet
          .map((slug) => modulesFlat.find((x) => x.slug === slug)?.name ?? slug)
          .join(", ");
        avoidList.push(
          `Don't start ${m.name} yet — complete ${prereqNames} first.`
        );
      }
    });

  if (overdueReviews > 0) {
    avoidList.push(
      `Don't start new modules until you clear ${overdueReviews} overdue review${overdueReviews > 1 ? "s" : ""}.`
    );
  }

  const highHintMods = modulesFlat.filter(
    (m) =>
      (m.moduleProgress?.hintDependencyScore ?? 0) > 60 &&
      m.moduleProgress?.status === "InProgress"
  );
  if (highHintMods.length > 0) {
    avoidList.push(
      `Don't pile on new problems in ${highHintMods[0].name} — your hint dependency is high. Re-read the theory first.`
    );
  }

  const lowQuizMods = modulesFlat.filter(
    (m) =>
      (m.moduleProgress?.quizScore ?? 0) < 50 &&
      m.moduleProgress?.status === "InProgress"
  );
  if (lowQuizMods.length > 0) {
    avoidList.push(
      `Don't skip quizzes for ${lowQuizMods[0].name} — your quiz score (${Math.round(lowQuizMods[0].moduleProgress?.quizScore ?? 0)}%) needs work before more practice.`
    );
  }

  // ── Build ranked task list ───────────────────────────────────────────────────
  const tasks: TrainingTask[] = [];
  let priority = 1;

  if (overdueReviews > 2) {
    tasks.push({
      type: "Review",
      priority: priority++,
      title: "Clear your overdue review queue",
      reason: `You have ${overdueReviews} overdue reviews. Spaced repetition breaks down without consistent follow-through.`,
      estimatedMinutes: overdueReviews * 5,
      href: "/review?filter=overdue",
      urgency: "Critical",
    });
  } else if (dueReviews > 0) {
    tasks.push({
      type: "Review",
      priority: priority++,
      title: `Complete ${dueReviews} due review${dueReviews > 1 ? "s" : ""}`,
      reason: "Reviews due today keep your retention strong.",
      estimatedMinutes: dueReviews * 5,
      href: "/review",
      urgency: "High",
    });
  }

  if (currentModule) {
    const p = currentModule.moduleProgress!;

    if (!p.theoryCompleted) {
      tasks.push({
        type: "Theory",
        priority: priority++,
        title: `Finish theory for ${currentModule.name}`,
        reason:
          "Theory is incomplete. Reading the concept guide first builds a stronger mental model.",
        estimatedMinutes: 20,
        href: `/modules/${currentModule.slug}`,
        urgency: "High",
        moduleName: currentModule.name,
      });
    } else if (p.quizScore < 50) {
      tasks.push({
        type: "Quiz",
        priority: priority++,
        title: `Retake the ${currentModule.name} concept quiz`,
        reason: `Your quiz score is ${Math.round(p.quizScore)}%. Solidify theory before doing more practice problems.`,
        estimatedMinutes: 15,
        href: `/quiz/${currentModule.slug}`,
        urgency: "High",
        moduleName: currentModule.name,
      });
    } else if (p.hintDependencyScore > 60) {
      tasks.push({
        type: "Quiz",
        priority: priority++,
        title: `Do concept checks for ${currentModule.name}`,
        reason: `Hint dependency is ${Math.round(p.hintDependencyScore)}%. Your fundamentals need reinforcement before attempting more problems.`,
        estimatedMinutes: 10,
        href: `/quiz/${currentModule.slug}`,
        urgency: "High",
        moduleName: currentModule.name,
      });
    } else if (p.practiceScore > 70 && p.quizScore > 70) {
      tasks.push({
        type: "Practice",
        priority: priority++,
        title: `Try a medium problem in ${currentModule.name}`,
        reason: `Strong scores (quiz: ${Math.round(p.quizScore)}%, practice: ${Math.round(p.practiceScore)}%). You're ready to level up difficulty.`,
        estimatedMinutes: 30,
        href: `/practice`,
        urgency: "Medium",
        moduleName: currentModule.name,
      });
    } else {
      tasks.push({
        type: "Practice",
        priority: priority++,
        title: `Continue practice in ${currentModule.name}`,
        reason: `Keep momentum — you're actively working on this module.`,
        estimatedMinutes: 25,
        href: `/modules/${currentModule.slug}`,
        urgency: "Medium",
        moduleName: currentModule.name,
      });
    }
  }

  for (const mod of inProgressModules.slice(1, 3)) {
    const p = mod.moduleProgress!;
    if (p.quizScore < 50 && p.theoryCompleted) {
      tasks.push({
        type: "Quiz",
        priority: priority++,
        title: `Quiz review for ${mod.name}`,
        reason: `Quiz score of ${Math.round(p.quizScore)}% is below threshold. A quick quiz session will help.`,
        estimatedMinutes: 15,
        href: `/quiz/${mod.slug}`,
        urgency: "Medium",
        moduleName: mod.name,
      });
    }
  }

  if (nextModule && overdueReviews === 0 && priority <= 5) {
    tasks.push({
      type: "NewModule",
      priority: priority++,
      title: `Start ${nextModule.name}`,
      reason:
        "All prerequisites are met. This is your natural next learning step.",
      estimatedMinutes: 30,
      href: `/modules/${nextModule.slug}`,
      urgency: priority <= 3 ? "Medium" : "Low",
      moduleName: nextModule.name,
    });
  }

  const startedWithPractice = modulesFlat
    .filter(
      (m) =>
        m.moduleProgress?.status === "InProgress" &&
        (m.moduleProgress?.practiceScore ?? 0) < 80
    )
    .sort(
      (a, b) =>
        (a.moduleProgress?.masteryScore ?? 0) - (b.moduleProgress?.masteryScore ?? 0)
    );

  for (const mod of startedWithPractice) {
    if (tasks.length >= 7) break;
    if (tasks.some((t) => t.moduleName === mod.name)) continue;
    tasks.push({
      type: "Practice",
      priority: priority++,
      title: `Solve a practice problem in ${mod.name}`,
      reason: `Practice score at ${Math.round(mod.moduleProgress?.practiceScore ?? 0)}% — more reps will cement the pattern.`,
      estimatedMinutes: 20,
      href: `/modules/${mod.slug}`,
      urgency: "Low",
      moduleName: mod.name,
    });
  }

  const finalTasks = tasks.slice(0, 7);

  // ── Interview readiness ──────────────────────────────────────────────────────
  const interviewReadiness = computeInterviewReadiness(modulesFlat);

  // ── Mentor summary ───────────────────────────────────────────────────────────
  const mentorSummary = buildMentorSummary({
    currentModule,
    overdueReviews,
    dueReviews,
    nextModule,
    interviewReadiness,
    inProgressCount: inProgressModules.length,
    completedCount: completedSlugs.length,
    totalModules: modulesFlat.length,
    topTask: finalTasks[0] ?? null,
  });

  return {
    modules: modulesFlat,
    tasks: finalTasks,
    overdueReviews,
    dueReviews,
    currentModule,
    nextModule,
    avoidList,
    interviewReadiness,
    mentorSummary,
    completedSlugs,
  };
}

// ─── Mentor summary generator ─────────────────────────────────────────────────

function buildMentorSummary({
  currentModule,
  overdueReviews,
  dueReviews,
  nextModule,
  interviewReadiness,
  inProgressCount,
  completedCount,
  totalModules,
  topTask,
}: {
  currentModule: { name: string; moduleProgress: { masteryScore: number; quizScore: number; hintDependencyScore: number } | null } | null;
  overdueReviews: number;
  dueReviews: number;
  nextModule: { name: string } | null;
  interviewReadiness: number;
  inProgressCount: number;
  completedCount: number;
  totalModules: number;
  topTask: TrainingTask | null;
}): string {
  const parts: string[] = [];

  if (overdueReviews > 2) {
    parts.push(
      `Your review queue needs attention — ${overdueReviews} overdue reviews are stacking up. Skipping reviews undermines everything you've learned.`
    );
  } else if (dueReviews > 0) {
    parts.push(
      `You have ${dueReviews} review${dueReviews > 1 ? "s" : ""} due today. Knocking those out first will keep your spaced repetition on track.`
    );
  }

  if (currentModule) {
    const p = currentModule.moduleProgress;
    const mastery = Math.round(p?.masteryScore ?? 0);
    const hint = Math.round(p?.hintDependencyScore ?? 0);
    parts.push(
      `Your active module is ${currentModule.name} at ${mastery}% mastery.${
        hint > 60
          ? ` Hint dependency is high (${hint}%) — spend time on concept checks before more coding.`
          : mastery > 60
          ? " Good progress — keep adding reps."
          : " Stay patient, early stages take more repetition."
      }`
    );
  }

  parts.push(
    `You've completed ${completedCount} of ${totalModules} modules with an overall interview readiness score of ${interviewReadiness}%.`
  );

  if (nextModule && overdueReviews === 0) {
    parts.push(
      `When you're ready to expand, ${nextModule.name} is next in your learning path.`
    );
  }

  if (topTask) {
    parts.push(
      `Today's top priority: ${topTask.title}. ${topTask.reason}`
    );
  }

  return parts.join(" ");
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function TrainingPage() {
  const user = await requireUser();
  const data = await getTrainingData(user.id);
  const topTasks = data.tasks.slice(0, 3);
  const remainingTasks = data.tasks.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          Training Plan
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Your personalized study plan for today. Follow this order to make
          maximum progress.
        </p>
      </div>

      {/* ── Overdue alert ── */}
      {data.overdueReviews > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {data.overdueReviews} overdue review
              {data.overdueReviews > 1 ? "s" : ""} — clear these first!
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Overdue reviews damage long-term retention. Deal with them before
              starting anything new.
            </p>
          </div>
          <Link
            href="/review?filter=overdue"
            className="shrink-0 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            Review Now
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Overview stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Today's Tasks"
          value={data.tasks.length}
          icon={Flag}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Overdue Reviews"
          value={data.overdueReviews}
          icon={AlertTriangle}
          iconColor={data.overdueReviews > 0 ? "text-red-600" : "text-green-600"}
          iconBg={data.overdueReviews > 0 ? "bg-red-50" : "bg-green-50"}
        />
        <StatCard
          label="Interview Readiness"
          value={`${data.interviewReadiness}%`}
          icon={Target}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          label="Modules Completed"
          value={data.completedSlugs.length}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TOP 3 TASKS — Prominent Action Cards
      ══════════════════════════════════════════════════════════════ */}
      {topTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Top Priorities Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topTasks.map((task) => (
              <TopTaskCard key={task.priority} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REMAINING TASKS — List
      ══════════════════════════════════════════════════════════════ */}
      {remainingTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            Additional Tasks
          </h2>
          <Card padding="none" className="divide-y divide-slate-100">
            {remainingTasks.map((task) => (
              <RemainingTaskRow key={task.priority} task={task} />
            ))}
          </Card>
        </section>
      )}

      {data.tasks.length === 0 && (
        <Card className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">
            All caught up — nothing urgent right now!
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Keep building and revisit tomorrow.
          </p>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODULE READINESS GRID
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Module Readiness Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.modules.map((mod) => {
            const p = mod.moduleProgress;
            const mastery = p?.masteryScore ?? 0;
            const status = p?.status ?? "NotStarted";
            const isReady = mastery > 75 && (p?.hintDependencyScore ?? 100) < 30;

            return (
              <Link
                key={mod.id}
                href={`/modules/${mod.slug}`}
                className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                    {mod.name}
                  </p>
                  {isReady ? (
                    <Badge variant="success">Interview Ready</Badge>
                  ) : (
                    <ModuleStatusBadge status={status} />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Mastery</span>
                    <span className="font-semibold text-slate-700">
                      {Math.round(mastery)}%
                    </span>
                  </div>
                  <ProgressBar value={mastery} size="sm" />
                </div>

                {p && (
                  <div className="mt-2 flex gap-3 text-xs text-slate-400">
                    <span>
                      Quiz:{" "}
                      <span className="font-medium text-slate-600">
                        {Math.round(p.quizScore)}%
                      </span>
                    </span>
                    <span>
                      Practice:{" "}
                      <span className="font-medium text-slate-600">
                        {Math.round(p.practiceScore)}%
                      </span>
                    </span>
                  </div>
                )}

                {p && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400">
                      Interview readiness
                    </p>
                    <ProgressBar
                      value={mastery}
                      size="sm"
                      className="mt-1"
                      barClassName={isReady ? "bg-green-500" : ""}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHAT TO AVOID
      ══════════════════════════════════════════════════════════════ */}
      {data.avoidList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            What to Avoid Right Now
          </h2>
          <div className="space-y-2">
            {data.avoidList.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MENTOR SUMMARY
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <h2 className="font-bold text-base">Mentor Summary</h2>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed">
            {data.mentorSummary}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${data.interviewReadiness}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">
              {data.interviewReadiness}% ready
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const urgencyConfig: Record<
  Urgency,
  { border: string; badge: string; icon: React.ReactNode }
> = {
  Critical: {
    border: "border-red-300 bg-red-50",
    badge: "bg-red-600 text-white",
    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
  },
  High: {
    border: "border-amber-300 bg-amber-50",
    badge: "bg-amber-500 text-white",
    icon: <Zap className="w-5 h-5 text-amber-600" />,
  },
  Medium: {
    border: "border-blue-300 bg-blue-50",
    badge: "bg-blue-500 text-white",
    icon: <Target className="w-5 h-5 text-blue-600" />,
  },
  Low: {
    border: "border-slate-200 bg-white",
    badge: "bg-slate-400 text-white",
    icon: <Info className="w-5 h-5 text-slate-400" />,
  },
};

const taskTypeIcon: Record<TaskType, React.ReactNode> = {
  Review: <RefreshCw className="w-4 h-4" />,
  Theory: <BookOpen className="w-4 h-4" />,
  Quiz: <Brain className="w-4 h-4" />,
  Practice: <Code2 className="w-4 h-4" />,
  NewModule: <PlusCircle className="w-4 h-4" />,
};

function TopTaskCard({ task }: { task: TrainingTask }) {
  const cfg = urgencyConfig[task.urgency];
  return (
    <div
      className={cn(
        "relative border-2 rounded-2xl p-5 shadow-sm flex flex-col gap-3",
        cfg.border
      )}
    >
      {/* Priority badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            cfg.badge
          )}
        >
          {task.urgency}
        </span>
      </div>

      {/* Icon + type */}
      <div className="flex items-center gap-2">
        {cfg.icon}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {task.type}
        </span>
      </div>

      {/* Title */}
      <p className="font-bold text-slate-900 text-sm leading-snug pr-16">
        {task.title}
      </p>

      {/* Reason */}
      <p className="text-xs text-slate-600 leading-relaxed flex-1">
        {task.reason}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          ~{task.estimatedMinutes} min
        </span>
        <Link
          href={task.href}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
            task.urgency === "Critical"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : task.urgency === "High"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          Start
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function RemainingTaskRow({ task }: { task: TrainingTask }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
        {taskTypeIcon[task.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{task.title}</p>
        <p className="text-xs text-slate-500 truncate">{task.reason}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {task.estimatedMinutes}m
        </span>
        <UrgencyPip urgency={task.urgency} />
        <Link
          href={task.href}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
        >
          Go
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function UrgencyPip({ urgency }: { urgency: Urgency }) {
  const colors: Record<Urgency, string> = {
    Critical: "bg-red-500",
    High: "bg-amber-500",
    Medium: "bg-blue-500",
    Low: "bg-slate-300",
  };
  return (
    <span
      className={cn("w-2 h-2 rounded-full", colors[urgency])}
      title={urgency}
    />
  );
}

function ModuleStatusBadge({ status }: { status: string }) {
  if (status === "NotStarted")
    return <Badge variant="default">Not Started</Badge>;
  if (status === "InProgress")
    return <Badge variant="warning">In Progress</Badge>;
  if (status === "Completed")
    return <Badge variant="info">Completed</Badge>;
  if (status === "Mastered")
    return <Badge variant="success">Mastered</Badge>;
  return <Badge variant="default">{status}</Badge>;
}
