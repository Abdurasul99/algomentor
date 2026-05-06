"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Lightbulb,
  Save,
  Target,
} from "lucide-react";
import { cn, getDifficultyColor, getStatusColor, formatDate } from "@/lib/utils";

// ── Schema ────────────────────────────────────────────────────────────────────

const attemptSchema = z.object({
  status: z.enum(["NotStarted", "InProgress", "Solved", "Mastered", "Retry"]),
  minutesSpent: z.number().min(0).max(600),
  solvedIndependently: z.boolean(),
  canExplainClearly: z.boolean(),
  confidenceScore: z.number().min(0).max(100),
  mistakeType: z.enum([
    "",
    "PatternNotRecognized",
    "ImplementationBug",
    "EdgeCaseMissed",
    "TimeComplexityMiss",
    "PointerOrIndexIssue",
    "CouldNotExplain",
    "PanickedUnderTime",
    "NeedMoreRepetition",
  ]),
  keyInsight: z.string().max(1000),
  notes: z.string().max(2000),
});

type AttemptForm = z.infer<typeof attemptSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Problem {
  id: string;
  title: string;
  source: string;
  url: string;
  difficulty: string;
  description: string;
  learningObjective: string;
  hintLevelOne: string;
  hintLevelTwo: string;
  hintLevelThree: string;
  hintLevelFour: string;
  finalExplanation: string;
  module: { id: string; name: string; slug: string };
}

interface ExistingAttempt {
  id: string;
  status: string;
  minutesSpent: number;
  hintUsedLevel: number;
  solvedIndependently: boolean;
  canExplainClearly: boolean;
  confidenceScore: number;
  mistakeType: string;
  keyInsight: string;
  notes: string;
  updatedAt: string;
}

interface Props {
  problem: Problem;
  existingAttempt: ExistingAttempt | null;
}

// ── Hint levels ───────────────────────────────────────────────────────────────

const HINTS = [
  { label: "Hint 1 — Approach Direction", key: "hintLevelOne" as const },
  { label: "Hint 2 — Data Structure Guidance", key: "hintLevelTwo" as const },
  { label: "Hint 3 — Algorithm Outline", key: "hintLevelThree" as const },
  { label: "Hint 4 — Near-Complete Solution", key: "hintLevelFour" as const },
];

const CONFIDENCE_LABELS = [
  { max: 20, label: "Very Low", color: "text-red-600" },
  { max: 40, label: "Low", color: "text-orange-600" },
  { max: 60, label: "Moderate", color: "text-yellow-600" },
  { max: 80, label: "Good", color: "text-blue-600" },
  { max: 100, label: "High", color: "text-green-600" },
];

function confidenceLabel(score: number) {
  return CONFIDENCE_LABELS.find((c) => score <= c.max) ?? CONFIDENCE_LABELS[4];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PracticeWorkspace({ problem, existingAttempt }: Props) {
  const [currentHintLevel, setCurrentHintLevel] = useState(
    existingAttempt?.hintUsedLevel ?? 0
  );
  const [showFinalExplanation, setShowFinalExplanation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AttemptForm>({
    resolver: zodResolver(attemptSchema),
    defaultValues: {
      status: (existingAttempt?.status as AttemptForm["status"]) ?? "NotStarted",
      minutesSpent: existingAttempt?.minutesSpent ?? 0,
      solvedIndependently: existingAttempt?.solvedIndependently ?? false,
      canExplainClearly: existingAttempt?.canExplainClearly ?? false,
      confidenceScore: existingAttempt?.confidenceScore ?? 50,
      mistakeType: (existingAttempt?.mistakeType as AttemptForm["mistakeType"]) ?? "",
      keyInsight: existingAttempt?.keyInsight ?? "",
      notes: existingAttempt?.notes ?? "",
    },
  });

  const confidence = watch("confidenceScore");
  const confInfo = confidenceLabel(confidence);

  const onSubmit = async (data: AttemptForm) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/practice/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceProblemId: problem.id,
          ...data,
          hintUsedLevel: currentHintLevel,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const hints = [
    problem.hintLevelOne,
    problem.hintLevelTwo,
    problem.hintLevelThree,
    problem.hintLevelFour,
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Practice Problems
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="space-y-5">
          {/* ── Problem Header ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    getDifficultyColor(problem.difficulty)
                  )}
                >
                  {problem.difficulty}
                </span>
                <span className="text-xs text-slate-400">{problem.module.name}</span>
                {problem.source && (
                  <span className="text-xs text-slate-500">{problem.source}</span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white">{problem.title}</h1>
              {problem.url && (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 mt-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open on {problem.source || "source"}
                </a>
              )}
            </div>
          </div>

          {/* ── Learning Objective ── */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                Learning Objective
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed">
                {problem.learningObjective}
              </p>
            </div>
          </div>

          {/* ── Problem Description ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Problem Statement</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>
          </div>

          {/* ── Hint Ladder ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Hint Ladder</h2>
              {currentHintLevel > 0 && (
                <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {currentHintLevel} hint{currentHintLevel !== 1 ? "s" : ""} used
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {HINTS.map((hint, idx) => {
                const hintNum = idx + 1;
                const isRevealed = currentHintLevel >= hintNum;
                const isNext = currentHintLevel === idx; // can reveal this one

                return (
                  <div key={hint.key} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                            isRevealed
                              ? "bg-amber-400 text-white"
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {hintNum}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isRevealed ? "text-slate-800" : "text-slate-400"
                          )}
                        >
                          {hint.label}
                        </span>
                      </div>

                      {!isRevealed && isNext && (
                        <button
                          onClick={() => {
                            setCurrentHintLevel(hintNum);
                            // sync form
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Reveal Hint {hintNum}
                        </button>
                      )}

                      {!isRevealed && !isNext && (
                        <span className="text-xs text-slate-300 italic">
                          Reveal hint {idx} first
                        </span>
                      )}
                    </div>

                    {isRevealed && (
                      <div className="mt-3 pl-8">
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                          <p className="text-sm text-amber-900 leading-relaxed">
                            {hints[idx]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final explanation */}
            <div className="border-t border-slate-100 px-5 py-4">
              {!showFinalExplanation ? (
                <button
                  onClick={() => setShowFinalExplanation(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-lg transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                  I Give Up — Show Full Explanation
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ChevronDown className="w-4 h-4" />
                    Full Explanation
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {problem.finalExplanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-5 sticky top-6">
          {/* ── Attempt Logger Form ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <Save className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Log Attempt</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-5">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="NotStarted">Not Started</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Solved">Solved</option>
                  <option value="Mastered">Mastered</option>
                  <option value="Retry">Retry</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-500">{errors.status.message}</p>
                )}
              </div>

              {/* Minutes spent */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Minutes Spent
                </label>
                <input
                  type="number"
                  {...register("minutesSpent")}
                  min={0}
                  max={600}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. 45"
                />
                {errors.minutesSpent && (
                  <p className="text-xs text-red-500">{errors.minutesSpent.message}</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register("solvedIndependently")}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors" />
                    <CheckCircle2 className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-slate-700">Solved independently</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register("canExplainClearly")}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors" />
                    <CheckCircle2 className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-slate-700">Can explain clearly</span>
                </label>
              </div>

              {/* Confidence slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Confidence Score
                  </label>
                  <span className={cn("text-sm font-bold", confInfo.color)}>
                    {confidence} — {confInfo.label}
                  </span>
                </div>
                <input
                  type="range"
                  {...register("confidenceScore")}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Hint level used (auto-synced) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Hint Level Used
                </label>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm text-amber-800 font-medium">
                    {currentHintLevel === 0
                      ? "No hints used"
                      : `Hint ${currentHintLevel} used`}
                  </span>
                  <span className="ml-auto text-xs text-amber-600">(auto)</span>
                </div>
              </div>

              {/* Mistake type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Mistake Type
                </label>
                <select
                  {...register("mistakeType")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">None / N/A</option>
                  <option value="PatternNotRecognized">Pattern Not Recognized</option>
                  <option value="ImplementationBug">Implementation Bug</option>
                  <option value="EdgeCaseMissed">Edge Case Missed</option>
                  <option value="TimeComplexityMiss">Time Complexity Miss</option>
                  <option value="PointerOrIndexIssue">Pointer or Index Issue</option>
                  <option value="CouldNotExplain">Could Not Explain</option>
                  <option value="PanickedUnderTime">Panicked Under Time</option>
                  <option value="NeedMoreRepetition">Need More Repetition</option>
                </select>
              </div>

              {/* Key insight */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Key Insight
                </label>
                <textarea
                  {...register("keyInsight")}
                  rows={2}
                  placeholder="What was the key insight you learned?"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Additional notes, edge cases, time complexity..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl transition-colors text-sm",
                  saveStatus === "saved"
                    ? "bg-green-600 text-white"
                    : saveStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                )}
              >
                {saveStatus === "saving" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </>
                ) : saveStatus === "error" ? (
                  "Error — Try Again"
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Attempt
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Previous attempt summary ── */}
          {existingAttempt && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Previous Attempt</h3>
                <span className="text-xs text-slate-400">
                  {formatDate(existingAttempt.updatedAt)}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full border",
                      getStatusColor(existingAttempt.status)
                    )}
                  >
                    {existingAttempt.status}
                  </span>
                  {existingAttempt.confidenceScore > 0 && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full border",
                        existingAttempt.confidenceScore >= 70
                          ? "bg-green-50 text-green-700 border-green-200"
                          : existingAttempt.confidenceScore >= 40
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {existingAttempt.confidenceScore}% confidence
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 block">Minutes Spent</span>
                    <span className="font-semibold text-slate-700">
                      {existingAttempt.minutesSpent}m
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 block">Hint Level</span>
                    <span className="font-semibold text-slate-700">
                      {existingAttempt.hintUsedLevel === 0
                        ? "None"
                        : `Level ${existingAttempt.hintUsedLevel}`}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 block">Independent</span>
                    <span className="font-semibold text-slate-700">
                      {existingAttempt.solvedIndependently ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 block">Can Explain</span>
                    <span className="font-semibold text-slate-700">
                      {existingAttempt.canExplainClearly ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {existingAttempt.mistakeType && (
                  <div className="text-xs text-slate-600">
                    <span className="text-slate-400">Mistake: </span>
                    <span className="font-medium">{existingAttempt.mistakeType}</span>
                  </div>
                )}

                {existingAttempt.keyInsight && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-medium text-indigo-600 mb-1">Key Insight</p>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      {existingAttempt.keyInsight}
                    </p>
                  </div>
                )}

                {existingAttempt.notes && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {existingAttempt.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Module link ── */}
          <Link
            href={`/modules/${problem.module.slug}`}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm group"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="flex-1">Review {problem.module.name} theory</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
