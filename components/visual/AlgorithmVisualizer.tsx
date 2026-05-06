"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  PatternVisualization,
  CellColor,
  HashmapEntry,
  StackState,
  VisualStep,
} from "@/lib/visualizations";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Pause,
  Play,
  XCircle,
} from "lucide-react";

// ─── Cell Color Map ───────────────────────────────────────────────────────────

const cellColorClass: Record<CellColor, string> = {
  default:    "bg-slate-100 text-slate-700 border-slate-200",
  left:       "bg-blue-500 text-white border-blue-400 ring-2 ring-blue-300",
  right:      "bg-orange-500 text-white border-orange-400 ring-2 ring-orange-300",
  mid:        "bg-purple-500 text-white border-purple-400 ring-2 ring-purple-300",
  window:     "bg-green-100 text-green-800 border-2 border-green-400",
  found:      "bg-emerald-500 text-white border-emerald-400 animate-pulse",
  eliminated: "bg-slate-200 text-slate-400 border-slate-200 opacity-50",
  current:    "bg-yellow-400 text-slate-900 border-yellow-400",
  duplicate:  "bg-red-400 text-white border-red-400",
  match:      "bg-teal-400 text-white border-teal-400",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArrayDisplay({ array }: { array: NonNullable<VisualStep["array"]> }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Array</span>
      <div className="flex flex-wrap gap-2">
        {array.values.map((val, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div
              className={`
                w-11 h-11 flex items-center justify-center rounded-lg border font-bold text-sm
                transition-all duration-300
                ${cellColorClass[array.colors[idx] ?? "default"]}
              `}
            >
              {String(val)}
            </div>
            <span className="text-xs text-slate-400 font-medium h-4">
              {array.labels?.[idx] ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashmapDisplay({ entries }: { entries: HashmapEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hashmap</span>
        <div className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
          {"{ } — empty"}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hashmap</span>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className={`
              flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-mono border
              transition-all duration-300
              ${entry.isNew
                ? "bg-yellow-50 border-yellow-400 text-yellow-900 ring-2 ring-yellow-300"
                : entry.isLookup
                ? "bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-300"
                : "bg-white border-slate-200 text-slate-700"
              }
            `}
          >
            <span className="font-semibold">{entry.key}</span>
            <span className="text-slate-400 mx-0.5">→</span>
            <span>{entry.value}</span>
            {entry.isNew && (
              <span className="ml-1 text-xs text-yellow-600 font-semibold">NEW</span>
            )}
            {entry.isLookup && (
              <span className="ml-1 text-xs text-blue-600 font-semibold">FOUND</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StackDisplay({ stack }: { stack: StackState }) {
  const items = [...stack.items];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stack</span>
      <div className="flex flex-col-reverse gap-1.5 min-h-[48px]">
        {items.length === 0 ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2 border border-dashed border-slate-300">
            [ ] — empty stack
          </div>
        ) : (
          items.map((item, idx) => {
            const isTop = idx === items.length - 1;
            return (
              <div
                key={idx}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-mono
                  transition-all duration-300
                  ${isTop
                    ? stack.lastAction === "push"
                      ? "bg-green-50 border-green-400 text-green-800 ring-1 ring-green-300"
                      : "bg-slate-100 border-slate-300 text-slate-700"
                    : "bg-white border-slate-200 text-slate-600"
                  }
                `}
              >
                <span className="font-bold">{String(item)}</span>
                {isTop && (
                  <span className="text-xs text-slate-400 ml-2">← top</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function VariablesDisplay({
  variables,
}: {
  variables: NonNullable<VisualStep["variables"]>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variables</span>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono px-2.5 py-1 rounded-full transition-all duration-300"
          >
            <span className="font-semibold">{v.name}</span>
            <span className="text-indigo-400">=</span>
            <span>{String(v.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function CodeDisplay({
  lines,
  activeLine,
}: {
  lines: string[];
  activeLine: number;
}) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLine]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</span>
      <div className="bg-slate-900 rounded-xl overflow-auto text-sm font-mono flex-1 max-h-64 shadow-inner">
        {lines.map((line, idx) => {
          const isActive = idx === activeLine;
          return (
            <div
              key={idx}
              ref={isActive ? activeRef : undefined}
              className={`
                flex items-start gap-3 px-4 py-1.5 transition-all duration-300
                ${isActive
                  ? "bg-yellow-400/20 border-l-2 border-yellow-400"
                  : "border-l-2 border-transparent hover:bg-white/5"
                }
              `}
            >
              <span
                className={`select-none w-5 text-right shrink-0 text-xs pt-0.5
                  ${isActive ? "text-yellow-400 font-bold" : "text-slate-600"}`}
              >
                {idx + 1}
              </span>
              {isActive && (
                <span className="text-yellow-400 shrink-0 text-xs pt-0.5">▶</span>
              )}
              <span
                className={`whitespace-pre leading-relaxed
                  ${isActive ? "text-yellow-100 font-semibold" : "text-slate-300"}`}
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP (non-secure) contexts
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently — not critical
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  visualization: PatternVisualization;
}

export default function AlgorithmVisualizer({ visualization }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = visualization.steps.length;
  const step = visualization.steps[currentStep];

  const goToStep = useCallback(
    (n: number) => {
      const clamped = Math.max(0, Math.min(totalSteps - 1, n));
      setCurrentStep(clamped);
    },
    [totalSteps]
  );

  const advance = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [totalSteps]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(advance, playSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playSpeed, advance]);

  const progress = ((currentStep) / (totalSteps - 1)) * 100;

  const templateText = visualization.templateCode.join("\n");

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-0.5">
                {visualization.title}
              </p>
              <h2 className="text-white text-lg font-bold">{visualization.problemTitle}</h2>
              <p className="text-purple-200 text-sm mt-0.5 font-mono">{visualization.problemInput}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-white text-2xl font-bold">
                {currentStep + 1}
              </span>
              <span className="text-purple-300 text-sm"> / {totalSteps}</span>
              <p className="text-purple-300 text-xs">steps</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium shrink-0">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Data Structures */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Data Structures
          </h3>

          {step.array && <ArrayDisplay array={step.array} />}

          {step.linkedListNodes && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Linked List</p>
              <div className="flex items-center gap-1 flex-wrap">
                {step.linkedListNodes.values.map((val, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border-2 text-sm font-bold transition-all duration-300 ${cellColorClass[step.linkedListNodes!.colors[i] ?? "default"]}`}>
                      <span>{val}</span>
                      {step.linkedListNodes!.labels?.[i] && (
                        <span className="text-[9px] font-normal opacity-75">{step.linkedListNodes!.labels![i]}</span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono text-lg">→</span>
                  </div>
                ))}
                {step.linkedListNodes.nullAtEnd !== false && (
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-mono">null</div>
                )}
              </div>
            </div>
          )}

          {step.grid && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Grid</p>
              <div className="inline-flex flex-col gap-1">
                {step.grid.cells.map((row, r) => (
                  <div key={r} className="flex gap-1">
                    {row.map((cell, c) => (
                      <div key={c} className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${cellColorClass[step.grid!.colors[r]?.[c] ?? "default"]}`}>
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step.dpTable && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {step.dpTable.label ?? "DP Table"}
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {step.dpTable.headers.map((h, i) => (
                    <div key={i} className="w-10 h-6 flex items-center justify-center text-xs font-bold text-slate-500">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {step.dpTable.values.map((v, i) => (
                    <div key={i} className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${cellColorClass[step.dpTable!.colors[i] ?? "default"]}`}>
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step.hashmap !== undefined && (
            <HashmapDisplay entries={step.hashmap} />
          )}

          {step.stack && <StackDisplay stack={step.stack} />}

          {step.variables && step.variables.length > 0 && (
            <VariablesDisplay variables={step.variables} />
          )}
        </div>

        {/* Right: Code */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <CodeDisplay
            lines={visualization.templateCode}
            activeLine={step.codeLineIndex}
          />
        </div>
      </div>

      {/* ── Step Description ── */}
      <div
        className={`
          border rounded-xl p-5 transition-all duration-300
          ${step.isEdgeCase
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-slate-200 shadow-sm"
          }
        `}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
          {step.isEdgeCase && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-300">
              <AlertTriangle className="w-3 h-3" />
              Edge Case
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono ml-auto">
            Step {step.stepNumber + 1} of {totalSteps}
          </span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{step.description}</p>

        {step.isEdgeCase && step.edgeCaseNote && (
          <div className="mt-3 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-800 font-mono">
            {step.edgeCaseNote}
          </div>
        )}

        {step.result && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-800">{step.result}</span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Playback buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setIsPlaying(false); goToStep(0); }}
              disabled={currentStep === 0}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Reset"
            >
              <ChevronFirst className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsPlaying(false); goToStep(currentStep - 1); }}
              disabled={currentStep === 0}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={currentStep === totalSteps - 1}
              className={`
                px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors
                ${isPlaying
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
                }
                disabled:opacity-30 disabled:cursor-not-allowed
              `}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </button>
            <button
              onClick={() => { setIsPlaying(false); goToStep(currentStep + 1); }}
              disabled={currentStep === totalSteps - 1}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsPlaying(false); goToStep(totalSteps - 1); }}
              disabled={currentStep === totalSteps - 1}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last"
            >
              <ChevronLast className="w-5 h-5" />
            </button>
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 font-medium">Speed:</span>
            {([
              { label: "Slow", ms: 2500 },
              { label: "Normal", ms: 1500 },
              { label: "Fast", ms: 700 },
            ] as const).map(({ label, ms }) => (
              <button
                key={ms}
                onClick={() => setPlaySpeed(ms)}
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold transition-colors
                  ${playSpeed === ms
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Step dot indicators */}
        <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
          {visualization.steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setIsPlaying(false); goToStep(idx); }}
              title={s.title}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-200
                ${idx === currentStep
                  ? "bg-purple-600 scale-125"
                  : s.isEdgeCase
                  ? "bg-amber-400 hover:bg-amber-500"
                  : "bg-slate-300 hover:bg-slate-400"
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* ── Edge Cases Section ── */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Edge Cases to Know
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visualization.edgeCases.map((ec, idx) => (
            <div
              key={idx}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2"
            >
              <h4 className="font-semibold text-amber-900 text-sm">{ec.title}</h4>
              <code className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono block">
                {ec.input}
              </code>
              <p className="text-xs text-amber-800 leading-relaxed">{ec.explanation}</p>
              <div className="flex gap-1 flex-col">
                <div className="flex items-start gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{ec.whatBreaks}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-700">{ec.howToHandle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Template Code ── */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 bg-slate-700 text-white rounded text-xs flex items-center justify-center font-mono">
            {"</>"}
          </span>
          Standard Template
        </h3>
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono">Python</span>
            <CopyButton text={templateText} />
          </div>
          <pre className="p-4 text-sm font-mono text-slate-300 overflow-auto leading-relaxed">
            <code>{templateText}</code>
          </pre>
        </div>
      </section>

      {/* ── Key Insights ── */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Key Insights
        </h3>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2.5">
          {visualization.keyInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Common Mistakes ── */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Common Mistakes
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-2.5">
          {visualization.commonMistakes.map((mistake, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">{mistake}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
