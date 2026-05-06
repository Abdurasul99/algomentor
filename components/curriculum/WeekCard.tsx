"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Code2,
  BookOpen,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TaskToggle from "@/components/curriculum/TaskToggle";

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

interface Props {
  week: WeekWithTasks;
  isCurrentWeek: boolean;
}

function getCategoryStyle(category: string) {
  if (category === "Onboarding")
    return { bg: "bg-slate-100", text: "text-slate-600", label: "Onboarding" };
  if (category.includes("Bonus"))
    return { bg: "bg-purple-100", text: "text-purple-700", label: "Bonus" };
  return { bg: "bg-blue-100", text: "text-blue-700", label: "Core" };
}

function getTaskIcon(title: string) {
  if (title.startsWith("Solve:"))
    return <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  if (title.startsWith("Read:") || title.startsWith("Watch:"))
    return <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  if (title.startsWith("Participate") || title.startsWith("[Group"))
    return <Users className="w-3.5 h-3.5 text-green-400 shrink-0" />;
  if (title.startsWith("Prepare"))
    return <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  return <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export default function WeekCard({ week, isCurrentWeek }: Props) {
  const done = week.tasks.filter((t) => t.isCompleted).length;
  const total = week.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && total > 0;
  const hasStarted = done > 0;

  const [expanded, setExpanded] = useState(isCurrentWeek);

  const barColor = isComplete ? "bg-green-500" : hasStarted ? "bg-blue-500" : "bg-slate-200";
  const trackColor = isComplete ? "bg-green-50" : hasStarted ? "bg-blue-50" : "bg-slate-100";
  const borderColor = isCurrentWeek
    ? "border-indigo-400 shadow-md shadow-indigo-100"
    : isComplete
    ? "border-green-200"
    : "border-slate-200";

  return (
    <div className={cn("bg-white border-2 rounded-2xl shadow-sm overflow-hidden transition-all duration-200", borderColor)}>
      {/* Week header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Week number badge */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-xs",
          isComplete ? "bg-green-100 text-green-700" :
          isCurrentWeek ? "bg-indigo-100 text-indigo-700" :
          hasStarted ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
        )}>
          <span className="text-[10px] font-medium leading-none opacity-70">WK</span>
          <span className="text-sm font-bold leading-tight">{week.weekNumber}</span>
        </div>

        {/* Title & progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm truncate">{week.title}</span>
            {isCurrentWeek && (
              <span className="inline-flex items-center bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                Current
              </span>
            )}
            {isComplete && (
              <span className="inline-flex items-center bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                Complete
              </span>
            )}
          </div>

          {/* Progress bar — tasks only, no pts */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", trackColor)}>
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0 tabular-nums">
              {done}/{total} tasks
            </span>
          </div>
        </div>

        <div className="text-slate-400 shrink-0 ml-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {week.tasks.map((task) => {
            const catStyle = getCategoryStyle(task.category);

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  task.isCompleted ? "bg-green-50/40" : "hover:bg-slate-50/60"
                )}
              >
                {/* Checkbox */}
                <div className="mt-0.5">
                  <TaskToggle taskId={task.id} initialCompleted={task.isCompleted} points={task.points} />
                </div>

                {/* Task icon */}
                <div className="mt-1">{getTaskIcon(task.title)}</div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={cn(
                      "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                      catStyle.bg, catStyle.text
                    )}>
                      {catStyle.label}
                    </span>

                    {/* Title — with LeetCode link if available */}
                    {task.leetcodeUrl ? (
                      <a
                        href={task.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-sm font-medium leading-snug flex items-center gap-1 hover:underline",
                          task.isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                        )}
                      >
                        {task.title}
                        <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                      </a>
                    ) : (
                      <span className={cn(
                        "text-sm font-medium leading-snug",
                        task.isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                      )}>
                        {task.title}
                      </span>
                    )}
                  </div>

                  {/* Action badges */}
                  {(task.moduleSlug || task.leetcodeNumber) && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {task.moduleSlug && (
                        <Link
                          href={`/modules/${task.moduleSlug}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          Pattern
                        </Link>
                      )}
                      {task.leetcodeNumber ? (
                        <Link
                          href={`/problems/${task.leetcodeNumber}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          Visual
                        </Link>
                      ) : task.moduleSlug ? (
                        <Link
                          href={`/modules/${task.moduleSlug}/visual`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          Visual
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
                {/* NO pts here — removed as requested */}
              </div>
            );
          })}

          {week.tasks.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              No tasks for this week yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
