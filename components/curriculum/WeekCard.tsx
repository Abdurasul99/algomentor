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
  Sparkles,
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

function getTaskIcon(title: string) {
  if (title.startsWith("Solve:")) return <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
  if (title.startsWith("Read") || title.startsWith("Watch")) return <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
  if (title.startsWith("Participate") || title.startsWith("[Group")) return <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />;
}

function cleanTitle(title: string): string {
  // Remove "Solve: " prefix for cleaner display
  if (title.toLowerCase().startsWith("solve:")) return title.slice(6).trim();
  if (title.toLowerCase().startsWith("read:")) return title.slice(5).trim();
  if (title.toLowerCase().startsWith("watch:")) return title.slice(6).trim();
  return title;
}

function getTaskType(title: string): "solve" | "read" | "participate" | "other" {
  if (title.startsWith("Solve:")) return "solve";
  if (title.startsWith("Read") || title.startsWith("Watch")) return "read";
  if (title.startsWith("Participate") || title.startsWith("[Group") || title.startsWith("Prepare")) return "participate";
  return "other";
}

export default function WeekCard({ week, isCurrentWeek }: Props) {
  const done = week.tasks.filter((t) => t.isCompleted).length;
  const total = week.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && total > 0;
  const hasStarted = done > 0;

  const [expanded, setExpanded] = useState(isCurrentWeek);

  return (
    <div className={cn(
      "bg-white border rounded-xl overflow-hidden transition-shadow",
      isCurrentWeek ? "border-indigo-300 shadow-md shadow-indigo-100/50" :
      isComplete ? "border-green-200" : "border-slate-200 shadow-sm"
    )}>
      {/* Week header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        {/* Week badge */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 text-xs font-bold",
          isComplete ? "bg-green-100 text-green-700" :
          isCurrentWeek ? "bg-indigo-100 text-indigo-700" :
          "bg-slate-100 text-slate-500"
        )}>
          <span className="text-[9px] leading-none opacity-70">WK</span>
          <span className="text-sm leading-tight">{week.weekNumber}</span>
        </div>

        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 text-sm">{week.title}</span>
            {isCurrentWeek && (
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">NOW</span>
            )}
            {isComplete && (
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">✓ DONE</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  isComplete ? "bg-green-500" : hasStarted ? "bg-indigo-500" : "bg-slate-200"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0 tabular-nums">{done}/{total}</span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Task list */}
      {expanded && (
        <div className="border-t border-slate-100">
          {week.tasks.map((task, i) => {
            const type = getTaskType(task.title);
            const clean = cleanTitle(task.title);
            const isLeetcode = type === "solve" && task.leetcodeNumber;

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  i !== 0 && "border-t border-slate-50",
                  task.isCompleted ? "bg-green-50/30" : "hover:bg-slate-50/50"
                )}
              >
                {/* Checkbox */}
                <div className="shrink-0 mt-0.5">
                  <TaskToggle taskId={task.id} initialCompleted={task.isCompleted} points={task.points} />
                </div>

                {/* Icon */}
                {getTaskIcon(task.title)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm leading-snug",
                    task.isCompleted ? "text-slate-400 line-through" : "text-slate-800 font-medium"
                  )}>
                    {isLeetcode ? (
                      <a
                        href={`https://leetcode.com/problems/${clean.split("(")[0].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {task.leetcodeNumber}. {clean.replace(/^\d+\.\s*/, "")}
                        <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
                      </a>
                    ) : (
                      clean
                    )}
                  </div>

                  {/* Action links */}
                  {(task.leetcodeNumber || task.moduleSlug) && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {task.leetcodeNumber && (
                        <Link
                          href={`/problems/${task.leetcodeNumber}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Visual Explanation
                        </Link>
                      )}
                      {task.moduleSlug && (
                        <Link
                          href={`/modules/${task.moduleSlug}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          Theory
                        </Link>
                      )}
                      {task.moduleSlug && !task.leetcodeNumber && (
                        <Link
                          href={`/modules/${task.moduleSlug}/visual`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          Visual
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
