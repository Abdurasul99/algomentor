"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import type { PatternVisualization } from "@/lib/visualizations";
import dynamic from "next/dynamic";

// AlgorithmVisualizer is client-only (heavy), load it lazily
const AlgorithmVisualizer = dynamic(
  () => import("@/components/visual/AlgorithmVisualizer"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm animate-pulse">
        Loading visualizer…
      </div>
    ),
  }
);

type Status = "idle" | "generating" | "done" | "error";

const PROGRESS_MESSAGES = [
  "Analyzing the algorithm pattern…",
  "Choosing the best example to demonstrate…",
  "Building 8-10 step-by-step execution states…",
  "Generating array positions and pointer states…",
  "Writing code with line-by-line highlights…",
  "Adding edge cases and key insights…",
  "Finalizing the visualization…",
];

interface Props {
  lcNumber: number;
  problemTitle: string;
  moduleSlug?: string;
  initialVisualization?: PatternVisualization;
}

export default function VisualGeneratorClient({
  lcNumber,
  problemTitle,
  moduleSlug,
  initialVisualization,
}: Props) {
  const [status, setStatus] = useState<Status>(
    initialVisualization ? "done" : "idle"
  );
  const [visualization, setVisualization] = useState<PatternVisualization | null>(
    initialVisualization ?? null
  );
  const [error, setError] = useState<string>("");
  const [progressIndex, setProgressIndex] = useState(0);

  // Cycle progress messages while generating
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "generating") {
      setProgressIndex(0);
      intervalRef.current = setInterval(() => {
        setProgressIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  async function handleGenerate() {
    setStatus("generating");
    setError("");

    try {
      const res = await fetch("/api/ai/visual-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leetcodeNumber: lcNumber,
          problemTitle,
          moduleSlug,
        }),
      });

      const data = await res.json() as {
        visualization?: PatternVisualization;
        error?: string;
        raw?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      if (!data.visualization) {
        throw new Error("No visualization returned from server");
      }

      setVisualization(data.visualization);
      setStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      setStatus("error");
    }
  }

  // ── Done state ────────────────────────────────────────────────────────────────
  if (status === "done" && visualization) {
    return <AlgorithmVisualizer visualization={visualization} />;
  }

  // ── Generating state ──────────────────────────────────────────────────────────
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="relative mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain className="w-10 h-10 text-white" />
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Generating Visual Explanation
        </h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
          AI Mentor is building a step-by-step walkthrough just for you
        </p>

        {/* Progress message */}
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-5 py-2.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
          <span className="text-sm font-medium text-indigo-700 min-w-[220px] text-center transition-all duration-500">
            {PROGRESS_MESSAGES[progressIndex]}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-5">
          Takes ~10-15 seconds. Generated once and cached forever.
        </p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Generation Failed
        </h3>
        <p className="text-sm text-slate-500 mb-2 text-center max-w-sm">
          {error}
        </p>
        <button
          onClick={handleGenerate}
          className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Idle state ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Card */}
      <div className="w-full max-w-lg bg-white border border-purple-100 rounded-2xl shadow-lg shadow-purple-50 p-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-purple-200">
          <Brain className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Visual Explanation for{" "}
          <span className="text-purple-700">{problemTitle}</span>
        </h2>

        <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm">
          This problem hasn&apos;t been visualized yet. Let the AI Mentor generate
          a step-by-step visual explanation just for you.
        </p>

        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-95 text-base"
        >
          <Sparkles className="w-5 h-5" />
          Generate Visual Explanation
        </button>

        <p className="text-xs text-slate-400 mt-5">
          Takes ~10-15 seconds. Generated once and cached forever.
        </p>
      </div>
    </div>
  );
}
