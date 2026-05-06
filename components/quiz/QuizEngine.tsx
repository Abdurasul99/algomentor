"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface FillGapAnswer {
  id: string;
  correctAnswer: string;
}

interface QuizAttempt {
  id: string;
  isCorrect: boolean;
  selectedAnswer: string;
  createdAt: Date | string;
}

interface QuizQuestion {
  id: string;
  questionType: string;
  prompt: string;
  explanation: string;
  difficultyLevel: string;
  options: QuizOption[];
  fillGapAnswers: FillGapAnswer[];
  attempts: QuizAttempt[];
  module?: { name: string; slug: string };
}

interface Props {
  questions: QuizQuestion[];
  moduleSlug: string;
  moduleName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  MultipleChoice: "Multiple Choice",
  FillInTheGap: "Fill in the Gap",
  TrueFalse: "True / False",
  ConceptCheck: "Concept Check",
};

const TYPE_VARIANT_CLS: Record<string, string> = {
  MultipleChoice: "bg-slate-100 text-slate-700 border-slate-200",
  FillInTheGap: "bg-indigo-50 text-indigo-700 border-indigo-200",
  TrueFalse: "bg-blue-50 text-blue-700 border-blue-200",
  ConceptCheck: "bg-amber-50 text-amber-700 border-amber-200",
};

function checkAnswer(q: QuizQuestion, answer: string): boolean {
  if (q.questionType === "FillInTheGap") {
    return q.fillGapAnswers.some(
      (a) => a.correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
    );
  }
  const correct = q.options.find((o) => o.isCorrect);
  return correct?.text === answer || correct?.id === answer;
}

function getCorrectAnswerText(q: QuizQuestion): string {
  if (q.questionType === "FillInTheGap") {
    return q.fillGapAnswers.map((a) => a.correctAnswer).join(" / ");
  }
  return q.options.find((o) => o.isCorrect)?.text ?? "";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function OptionButton({
  text,
  onClick,
  state,
}: {
  text: string;
  onClick: () => void;
  state: "idle" | "selected-correct" | "selected-wrong" | "revealed-correct" | "disabled";
}) {
  const base =
    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-150 flex items-center gap-3";

  const styles: Record<typeof state, string> = {
    idle: "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 cursor-pointer",
    "selected-correct":
      "bg-green-50 border-green-400 text-green-800 cursor-default",
    "selected-wrong": "bg-red-50 border-red-400 text-red-800 cursor-default",
    "revealed-correct":
      "bg-green-50 border-green-300 text-green-700 cursor-default",
    disabled: "bg-slate-50 border-slate-100 text-slate-400 cursor-default",
  };

  return (
    <button
      type="button"
      onClick={state === "idle" ? onClick : undefined}
      className={cn(base, styles[state])}
    >
      <span className="shrink-0">
        {state === "selected-correct" || state === "revealed-correct" ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : state === "selected-wrong" ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block" />
        )}
      </span>
      {text}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Phase = "idle" | "question" | "feedback" | "complete";

interface QuizState {
  phase: Phase;
  currentIndex: number;
  answers: Record<string, { answer: string; isCorrect: boolean }>;
  selectedAnswer: string;
  queueIds: string[];
}

export default function QuizEngine({ questions, moduleSlug, moduleName }: Props) {
  const [state, setState] = useState<QuizState>({
    phase: "idle",
    currentIndex: 0,
    answers: {},
    selectedAnswer: "",
    queueIds: questions.map((q) => q.id),
  });
  const [fillInput, setFillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));

  const currentQ = questionMap[state.queueIds[state.currentIndex]];
  const totalInQueue = state.queueIds.length;

  // ── Start ──────────────────────────────────────────────────────────────────
  const handleStart = () => {
    setState((s) => ({ ...s, phase: "question", currentIndex: 0 }));
  };

  // ── Select answer ──────────────────────────────────────────────────────────
  const handleSelectOption = useCallback(
    async (optionText: string) => {
      if (!currentQ || state.phase !== "question" || isSubmitting) return;
      setIsSubmitting(true);

      const isCorrect = checkAnswer(currentQ, optionText);
      setState((s) => ({
        ...s,
        phase: "feedback",
        selectedAnswer: optionText,
        answers: {
          ...s.answers,
          [currentQ.id]: { answer: optionText, isCorrect },
        },
      }));

      try {
        await fetch("/api/quiz/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizQuestionId: currentQ.id,
            selectedAnswer: optionText,
            isCorrect,
            attemptMode: moduleSlug === "mixed" ? "Mixed" : "Module",
          }),
        });
      } catch {
        // silent — don't block UX
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentQ, state.phase, moduleSlug, isSubmitting]
  );

  // ── Submit fill-in ─────────────────────────────────────────────────────────
  const handleSubmitFill = useCallback(async () => {
    if (!currentQ || state.phase !== "question" || isSubmitting || !fillInput.trim())
      return;
    await handleSelectOption(fillInput.trim());
    setFillInput("");
  }, [currentQ, state.phase, fillInput, handleSelectOption, isSubmitting]);

  // ── Next question ──────────────────────────────────────────────────────────
  const handleNext = () => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= totalInQueue) {
      setState((s) => ({ ...s, phase: "complete" }));
    } else {
      setFillInput("");
      setState((s) => ({
        ...s,
        phase: "question",
        currentIndex: nextIndex,
        selectedAnswer: "",
      }));
    }
  };

  // ── Retry incorrect ────────────────────────────────────────────────────────
  const handleRetryIncorrect = () => {
    const incorrectIds = Object.entries(state.answers)
      .filter(([, v]) => !v.isCorrect)
      .map(([id]) => id);

    if (incorrectIds.length === 0) return;
    setFillInput("");
    setState({
      phase: "question",
      currentIndex: 0,
      answers: {},
      selectedAnswer: "",
      queueIds: incorrectIds,
    });
  };

  // ── Restart all ────────────────────────────────────────────────────────────
  const handleRestart = () => {
    setFillInput("");
    setState({
      phase: "idle",
      currentIndex: 0,
      answers: {},
      selectedAnswer: "",
      queueIds: questions.map((q) => q.id),
    });
  };

  // ── Score summary ──────────────────────────────────────────────────────────
  const answered = Object.values(state.answers);
  const correctCount = answered.filter((a) => a.isCorrect).length;
  const scorePercent =
    answered.length > 0 ? Math.round((correctCount / answered.length) * 100) : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: IDLE
  // ═══════════════════════════════════════════════════════════════════════════
  if (state.phase === "idle") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quiz Center
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{moduleName}</h1>
            <p className="text-indigo-200 text-sm mt-2">
              {questions.length} question{questions.length !== 1 ? "s" : ""} ready
            </p>
          </div>

          <div className="px-8 py-6 space-y-4">
            {/* Type breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {(["MultipleChoice", "FillInTheGap", "TrueFalse", "ConceptCheck"] as const).map(
                (type) => {
                  const count = questions.filter((q) => q.questionType === type).length;
                  if (!count) return null;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5"
                    >
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border",
                          TYPE_VARIANT_CLS[type]
                        )}
                      >
                        {count}
                      </span>
                      <span className="text-xs text-slate-600">
                        {TYPE_LABELS[type]}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Start Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: COMPLETE
  // ═══════════════════════════════════════════════════════════════════════════
  if (state.phase === "complete") {
    const incorrectCount = answered.length - correctCount;
    const perfLabel =
      scorePercent >= 90
        ? "Excellent!"
        : scorePercent >= 70
        ? "Good job!"
        : scorePercent >= 50
        ? "Keep going!"
        : "Needs review";

    const perfColor =
      scorePercent >= 90
        ? "text-green-700"
        : scorePercent >= 70
        ? "text-blue-700"
        : scorePercent >= 50
        ? "text-amber-700"
        : "text-red-700";

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Score header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className={cn("text-5xl font-black", perfColor.replace("text-", "text-white/90 "))}>
              {scorePercent}%
            </div>
            <p className="text-slate-300 text-sm mt-1">{perfLabel}</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-700">{correctCount}</div>
                <div className="text-xs text-green-600 font-medium mt-0.5">Correct</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-xs text-red-500 font-medium mt-0.5">Wrong</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-slate-700">{answered.length}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Total</div>
              </div>
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Question Breakdown</h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {state.queueIds.map((qId, idx) => {
                  const q = questionMap[qId];
                  const ans = state.answers[qId];
                  if (!q) return null;
                  return (
                    <div
                      key={qId}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                        ans?.isCorrect
                          ? "bg-green-50 border border-green-100"
                          : "bg-red-50 border border-red-100"
                      )}
                    >
                      {ans?.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="flex-1 line-clamp-1 text-xs text-slate-700">
                        {idx + 1}. {q.prompt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {incorrectCount > 0 && (
                <button
                  onClick={handleRetryIncorrect}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry {incorrectCount} Incorrect
                </button>
              )}
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Restart All
              </button>
            </div>

            <Link
              href="/quiz"
              className="block text-center text-sm text-indigo-600 font-semibold hover:underline"
            >
              Back to Quiz Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: QUESTION / FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════
  if (!currentQ) return null;

  const inFeedback = state.phase === "feedback";
  const userAnswer = state.answers[currentQ.id];
  const correctText = getCorrectAnswerText(currentQ);
  const isFillIn = currentQ.questionType === "FillInTheGap";
  const isTextArea =
    currentQ.questionType === "ConceptCheck" && currentQ.options.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Link>
        <span className="text-sm font-semibold text-slate-600">
          Question {state.currentIndex + 1} of {totalInQueue}
        </span>
        <span className="text-sm font-semibold text-slate-400">
          {moduleName}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar current={state.currentIndex + (inFeedback ? 1 : 0)} total={totalInQueue} />
      </div>

      {/* Question card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                TYPE_VARIANT_CLS[currentQ.questionType] ??
                  "bg-slate-100 text-slate-600 border-slate-200"
              )}
            >
              {TYPE_LABELS[currentQ.questionType] ?? currentQ.questionType}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                currentQ.difficultyLevel === "Hard"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : currentQ.difficultyLevel === "Medium"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-green-50 text-green-700 border-green-200"
              )}
            >
              {currentQ.difficultyLevel}
            </span>
            {currentQ.module && moduleSlug === "mixed" && (
              <span className="text-xs text-slate-400">{currentQ.module.name}</span>
            )}
          </div>
          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            {currentQ.prompt}
          </p>
        </div>

        {/* Answer area */}
        <div className="px-6 py-5 space-y-3">
          {/* MultipleChoice / TrueFalse / ConceptCheck with options */}
          {(currentQ.questionType === "MultipleChoice" ||
            currentQ.questionType === "TrueFalse" ||
            (currentQ.questionType === "ConceptCheck" &&
              currentQ.options.length > 0)) &&
            currentQ.options.map((opt) => {
              let btnState: "idle" | "selected-correct" | "selected-wrong" | "revealed-correct" | "disabled" =
                "idle";
              if (inFeedback) {
                if (opt.text === userAnswer?.answer) {
                  btnState = userAnswer.isCorrect
                    ? "selected-correct"
                    : "selected-wrong";
                } else if (opt.isCorrect) {
                  btnState = "revealed-correct";
                } else {
                  btnState = "disabled";
                }
              }
              return (
                <OptionButton
                  key={opt.id}
                  text={opt.text}
                  onClick={() => handleSelectOption(opt.text)}
                  state={btnState}
                />
              );
            })}

          {/* FillInTheGap */}
          {isFillIn && !inFeedback && (
            <div className="flex gap-2">
              <input
                type="text"
                value={fillInput}
                onChange={(e) => setFillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitFill();
                }}
                placeholder="Type your answer..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
              <button
                onClick={handleSubmitFill}
                disabled={!fillInput.trim() || isSubmitting}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Submit
              </button>
            </div>
          )}

          {/* ConceptCheck text area */}
          {isTextArea && !inFeedback && (
            <div className="space-y-2">
              <textarea
                value={fillInput}
                onChange={(e) => setFillInput(e.target.value)}
                placeholder="Write your explanation..."
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <button
                onClick={() => handleSelectOption(fillInput.trim() || "submitted")}
                disabled={isSubmitting}
                className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Feedback block */}
          {inFeedback && (
            <div
              className={cn(
                "rounded-xl border p-4 space-y-3",
                userAnswer?.isCorrect
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-center gap-2">
                {userAnswer?.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span
                  className={cn(
                    "font-semibold text-sm",
                    userAnswer?.isCorrect ? "text-green-800" : "text-red-800"
                  )}
                >
                  {userAnswer?.isCorrect ? "Correct!" : "Not quite."}
                </span>
              </div>

              {!userAnswer?.isCorrect && correctText && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500 font-medium shrink-0">Correct answer:</span>
                  <span className="text-slate-800 font-semibold">{correctText}</span>
                </div>
              )}

              {isFillIn && userAnswer && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500 font-medium shrink-0">Your answer:</span>
                  <span className="text-slate-700">{userAnswer.answer}</span>
                </div>
              )}

              {currentQ.explanation && (
                <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {inFeedback && (
          <div className="px-6 pb-6">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {state.currentIndex + 1 >= totalInQueue ? (
                <>
                  <Trophy className="w-4 h-4" />
                  See Results
                </>
              ) : (
                <>
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mini score tracker */}
      {answered.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {answered.filter((a) => a.isCorrect).length} correct
          </span>
          <span className="flex items-center gap-1.5 text-red-500 font-medium">
            <XCircle className="w-4 h-4" />
            {answered.filter((a) => !a.isCorrect).length} wrong
          </span>
        </div>
      )}
    </div>
  );
}
