"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  PatternVisualization,
  CellColor,
  HashmapEntry,
  StackState,
  VisualStep,
} from "@/lib/visualizations";
import { cn } from "@/lib/utils";
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
  ChevronDown,
} from "lucide-react";

// ─── Color Maps ───────────────────────────────────────────────────────────────

const CELL_BG: Record<CellColor, string> = {
  default:    "#1e2130",
  current:    "#f59e0b",
  left:       "#3b82f6",
  right:      "#f97316",
  mid:        "#8b5cf6",
  window:     "#065f46",
  found:      "#22c55e",
  eliminated: "#1a1b25",
  match:      "#0ea5e9",
  duplicate:  "#ef4444",
};

const CELL_TEXT: Record<CellColor, string> = {
  default:    "#6b7280",
  current:    "#1a1a1a",
  left:       "#ffffff",
  right:      "#ffffff",
  mid:        "#ffffff",
  window:     "#6ee7b7",
  found:      "#ffffff",
  eliminated: "#2d3148",
  match:      "#ffffff",
  duplicate:  "#ffffff",
};

const POINTER_COLOR: Record<string, string> = {
  L:    "#3b82f6",
  R:    "#f97316",
  mid:  "#8b5cf6",
  curr: "#f59e0b",
  slow: "#6ee7b7",
  fast: "#f97316",
  left: "#3b82f6",
  right:"#f97316",
};

function getPointerColor(label: string): string {
  return POINTER_COLOR[label] ?? "#9ca3af";
}

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress({
  current,
  total,
  steps,
  onJump,
}: {
  current: number;
  total: number;
  steps: VisualStep[];
  onJump: (i: number) => void;
}) {
  const pct = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100);
  return (
    <div className="flex flex-col gap-3 px-6 py-4"
      style={{ background: "#0f1117", borderBottom: "1px solid #1e2130" }}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold text-2xl leading-none">{current + 1}</span>
          <span className="text-gray-500 text-sm">/ {total} steps</span>
        </div>
        <span className="text-gray-400 text-sm font-mono">{pct}%</span>
      </div>

      {/* Dot indicators */}
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            title={s.title}
            className="transition-all duration-200 rounded-full focus:outline-none"
            style={{
              width: i === current ? 12 : 8,
              height: i === current ? 12 : 8,
              background: i === current ? "#f59e0b" : i < current ? "#4ade80" : "#374151",
              transform: i === current ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2130" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6,#f59e0b)" }}
        />
      </div>
    </div>
  );
}

// ─── Array Display ────────────────────────────────────────────────────────────

function ArrayDisplay({ array, animKey }: { array: NonNullable<VisualStep["array"]>; animKey: number }) {
  // Detect window: consecutive cells with same "window" color
  const windowIndices = array.colors
    .map((c, i) => (c === "window" ? i : -1))
    .filter((i) => i >= 0);
  const windowStart = windowIndices.length > 0 ? windowIndices[0] : -1;
  const windowEnd   = windowIndices.length > 0 ? windowIndices[windowIndices.length - 1] : -1;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        Array
      </span>

      <div className="relative">
        {/* Window bracket overlay */}
        {windowStart >= 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: windowStart * 76,
              width: (windowEnd - windowStart + 1) * 76 - 8,
              top: 0,
              bottom: 28,
              border: "2px solid #22c55e",
              borderRadius: 12,
              zIndex: 0,
              boxShadow: "0 0 12px rgba(34,197,94,0.25)",
            }}
          />
        )}

        {/* Index labels above */}
        <div className="flex gap-3 mb-1">
          {array.values.map((_, idx) => (
            <div key={idx} className="w-16 flex justify-center">
              <span className="text-xs font-mono" style={{ color: "#374151" }}>{idx}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="flex gap-3">
          {array.values.map((val, idx) => {
            const color = array.colors[idx] ?? "default";
            const isActive = color === "current";
            const isFound  = color === "found";
            return (
              <div
                key={idx}
                className="relative z-10"
                style={{ width: 64, height: 64 }}
              >
                <div
                  className="w-full h-full flex items-center justify-center rounded-xl font-bold text-lg select-none"
                  style={{
                    background:  CELL_BG[color],
                    color:       CELL_TEXT[color],
                    transition:  "background-color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease",
                    transform:   isActive ? "scale(1.12)" : "scale(1)",
                    boxShadow:   isActive
                      ? "0 0 0 3px #f59e0b, 0 0 20px rgba(245,158,11,0.5)"
                      : isFound
                      ? "0 0 0 3px #22c55e, 0 0 20px rgba(34,197,94,0.5)"
                      : "none",
                    animation:   isActive
                      ? `bounceIn 0.35s ease ${animKey}`
                      : isFound
                      ? "pulseGlow 1.2s ease infinite"
                      : "none",
                    border: color === "eliminated" ? "1px solid #2d3148" : "none",
                  }}
                >
                  {String(val)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pointer arrows below cells */}
        <div className="flex gap-3 mt-2">
          {array.values.map((_, idx) => {
            const label = array.labels?.[idx];
            if (!label) return <div key={idx} style={{ width: 64, height: 28 }} />;
            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{ width: 64, height: 28, animation: "fadeSlideUp 0.3s ease" }}
              >
                <span className="text-base leading-none" style={{ color: getPointerColor(label) }}>↑</span>
                <span
                  className="text-xs font-bold font-mono mt-0.5"
                  style={{ color: getPointerColor(label) }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Hash Map Display ─────────────────────────────────────────────────────────

function HashmapDisplay({ entries }: { entries: HashmapEntry[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        Hash Map
      </span>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #1e2130", background: "#111318" }}
      >
        {/* Header */}
        <div
          className="flex px-4 py-2 text-xs font-bold uppercase tracking-wider"
          style={{ background: "#1e2130", color: "#4b5563", borderBottom: "1px solid #1e2130" }}
        >
          <span className="w-24">Key</span>
          <span style={{ color: "#374151" }}>→</span>
          <span className="ml-4">Value</span>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-4 text-sm font-mono italic" style={{ color: "#374151" }}>
            {"{ } — empty"}
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-300"
              style={{
                borderBottom: idx < entries.length - 1 ? "1px solid #1a1b25" : "none",
                background: entry.isNew
                  ? "rgba(245,158,11,0.12)"
                  : entry.isLookup
                  ? "rgba(59,130,246,0.12)"
                  : "transparent",
                boxShadow: entry.isNew
                  ? "inset 3px 0 0 #f59e0b"
                  : entry.isLookup
                  ? "inset 3px 0 0 #3b82f6"
                  : "none",
                animation: entry.isNew ? "fadeSlideUp 0.3s ease" : "none",
              }}
            >
              <span className="w-24 font-bold" style={{ color: entry.isNew ? "#fcd34d" : "#e5e7eb" }}>
                {entry.key}
              </span>
              <span style={{ color: "#374151" }}>→</span>
              <span className="ml-4" style={{ color: "#d1d5db" }}>{String(entry.value)}</span>
              {entry.isNew && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#78350f", color: "#fcd34d", animation: "fadeSlideUp 0.3s ease" }}
                >
                  NEW
                </span>
              )}
              {entry.isLookup && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#1e3a5f", color: "#93c5fd" }}
                >
                  🔍 FOUND
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Stack Display ────────────────────────────────────────────────────────────

function StackDisplay({ stack }: { stack: StackState }) {
  const items = [...stack.items];
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        Stack
      </span>
      <div className="flex flex-col-reverse items-center gap-1.5" style={{ minHeight: 64 }}>
        {items.length === 0 ? (
          <div
            className="px-6 py-3 rounded-xl text-sm font-mono italic"
            style={{
              border: "1.5px dashed #1e2130",
              color: "#374151",
              background: "#111318",
            }}
          >
            [ ] — empty
          </div>
        ) : (
          items.map((item, idx) => {
            const isTop = idx === items.length - 1;
            const justPushed = isTop && stack.lastAction === "push";
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-300"
                style={{
                  background: justPushed ? "#064e3b" : "#1e2130",
                  color:      justPushed ? "#6ee7b7" : "#e5e7eb",
                  border:     isTop ? "1.5px solid #22c55e" : "1.5px solid transparent",
                  boxShadow:  justPushed ? "0 0 12px rgba(34,197,94,0.3)" : "none",
                  animation:  justPushed ? "fadeSlideUp 0.3s ease" : "none",
                  minWidth:   80,
                  justifyContent: "center",
                }}
              >
                {String(item)}
                {isTop && (
                  <span className="text-xs font-normal ml-2" style={{ color: "#4b5563" }}>
                    {stack.lastAction === "push" ? "← pushed" : "← top"}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      {stack.lastAction && (
        <div className="flex justify-center">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: stack.lastAction === "push" ? "#064e3b" : "#450a0a",
              color:      stack.lastAction === "push" ? "#4ade80" : "#f87171",
              animation: "fadeSlideUp 0.3s ease",
            }}
          >
            {stack.lastAction === "push" ? "↓ push" : "↑ pop"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Linked List Display ──────────────────────────────────────────────────────

function LinkedListDisplay({
  nodes,
  animKey,
}: {
  nodes: NonNullable<VisualStep["linkedListNodes"]>;
  animKey: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        Linked List
      </span>

      {/* Labels above */}
      <div className="flex items-end gap-0">
        {nodes.values.map((_, idx) => {
          const label = nodes.labels?.[idx];
          return (
            <div key={idx} className="flex flex-col items-center" style={{ width: 80 }}>
              {label ? (
                <>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: getPointerColor(label), animation: "fadeSlideUp 0.3s ease" }}
                  >
                    {label}
                  </span>
                  <span className="text-sm" style={{ color: getPointerColor(label) }}>↓</span>
                </>
              ) : (
                <div style={{ height: 32 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Nodes row */}
      <div className="flex items-center gap-0 flex-wrap">
        {nodes.values.map((val, idx) => {
          const color = nodes.colors[idx] ?? "default";
          const isActive = color === "current";
          const isFound  = color === "found";
          return (
            <div key={idx} className="flex items-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-base select-none"
                style={{
                  background: CELL_BG[color],
                  color:      CELL_TEXT[color],
                  border:     `2px solid ${isActive ? "#f59e0b" : isFound ? "#22c55e" : "#1e2130"}`,
                  boxShadow:  isActive ? "0 0 14px rgba(245,158,11,0.5)" : isFound ? "0 0 14px rgba(34,197,94,0.5)" : "none",
                  transition: "background-color 0.35s ease, box-shadow 0.35s ease",
                  animation:  isActive ? `bounceIn 0.35s ease ${animKey}` : "none",
                }}
              >
                {String(val)}
              </div>
              <span className="text-xl mx-1 font-mono" style={{ color: "#374151" }}>→</span>
            </div>
          );
        })}
        {nodes.nullAtEnd !== false && (
          <div
            className="w-12 h-10 rounded-lg flex items-center justify-center text-xs font-mono"
            style={{ border: "1.5px dashed #1e2130", color: "#374151", background: "#0f1117" }}
          >
            null
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Grid Display ─────────────────────────────────────────────────────────────

function GridDisplay({ grid }: { grid: NonNullable<VisualStep["grid"]> }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>Grid</span>
      <div className="inline-flex flex-col gap-1.5">
        {/* Col headers */}
        <div className="flex gap-1.5 ml-7">
          {(grid.cells[0] ?? []).map((_, c) => (
            <div key={c} className="w-11 flex justify-center">
              <span className="text-xs font-mono" style={{ color: "#374151" }}>{c}</span>
            </div>
          ))}
        </div>
        {grid.cells.map((row, r) => (
          <div key={r} className="flex gap-1.5 items-center">
            <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: "#374151" }}>{r}</span>
            {row.map((cell, c) => {
              const color = grid.colors[r]?.[c] ?? "default";
              const isActive = color === "current";
              const isFound  = color === "found";
              return (
                <div
                  key={c}
                  className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm select-none"
                  style={{
                    background: CELL_BG[color],
                    color:      CELL_TEXT[color],
                    border:     `1.5px solid ${isActive ? "#f59e0b" : isFound ? "#22c55e" : "#1e2130"}`,
                    boxShadow:  isActive ? "0 0 10px rgba(245,158,11,0.4)" : isFound ? "0 0 10px rgba(34,197,94,0.4)" : "none",
                    transition: "background-color 0.35s ease, box-shadow 0.35s ease",
                    animation:  isFound ? "pulseGlow 1.2s ease infinite" : "none",
                  }}
                >
                  {String(cell)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DP Table Display ─────────────────────────────────────────────────────────

function DPTableDisplay({ dpTable }: { dpTable: NonNullable<VisualStep["dpTable"]> }) {
  const currentIdx = dpTable.colors.findIndex((c) => c === "current");
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        {dpTable.label ?? "DP Table"}
      </span>
      {/* Headers */}
      <div className="flex gap-1.5">
        {dpTable.headers.map((h, i) => (
          <div key={i} className="w-12 flex justify-center">
            <span className="text-xs font-mono font-bold" style={{ color: "#4b5563" }}>{String(h)}</span>
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="flex gap-1.5">
        {dpTable.values.map((v, i) => {
          const color = dpTable.colors[i] ?? "default";
          const isActive = color === "current";
          return (
            <div
              key={i}
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base select-none"
              style={{
                background: CELL_BG[color],
                color:      CELL_TEXT[color],
                border:     `1.5px solid ${isActive ? "#f59e0b" : "#1e2130"}`,
                boxShadow:  isActive ? "0 0 12px rgba(245,158,11,0.45)" : "none",
                transition: "background-color 0.35s ease, box-shadow 0.35s ease",
                animation:  isActive ? "bounceIn 0.35s ease" : "none",
              }}
            >
              {String(v)}
            </div>
          );
        })}
      </div>
      {/* Current pointer */}
      {currentIdx >= 0 && (
        <div className="flex gap-1.5">
          {dpTable.values.map((_, i) => (
            <div key={i} className="w-12 flex flex-col items-center" style={{ height: 28 }}>
              {i === currentIdx && (
                <>
                  <span className="text-sm" style={{ color: "#f59e0b" }}>↑</span>
                  <span className="text-xs font-bold font-mono" style={{ color: "#f59e0b" }}>curr</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Variables Display ────────────────────────────────────────────────────────

function VariablesDisplay({ variables }: { variables: NonNullable<VisualStep["variables"]> }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
        Variables
      </span>
      <div className="flex flex-wrap gap-2">
        {variables.map((v, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300"
            style={{
              background: "#1e2130",
              border: "1px solid #2d3148",
              color: "#c4b5fd",
              animation: "fadeSlideUp 0.25s ease",
            }}
          >
            <span style={{ color: "#a78bfa" }}>{v.name}</span>
            <span style={{ color: "#4b5563" }}>=</span>
            <span style={{ color: "#f3f4f6" }}>{String(v.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Code Editor Panel ────────────────────────────────────────────────────────

function CodePanel({
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
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>
          Code
        </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#1e2130", color: "#4b5563" }}>
          Python
        </span>
      </div>
      <div
        className="flex-1 overflow-auto rounded-xl text-sm font-mono"
        style={{
          background: "#090c10",
          border: "1px solid #1e2130",
          maxHeight: 300,
        }}
      >
        {lines.map((line, idx) => {
          const isActive = idx === activeLine;
          return (
            <div
              key={idx}
              ref={isActive ? activeRef : undefined}
              className="flex items-start gap-3 px-4 py-1.5 transition-all duration-300"
              style={{
                background:  isActive ? "rgba(245,158,11,0.10)" : "transparent",
                borderLeft:  isActive ? "3px solid #f59e0b" : "3px solid transparent",
              }}
            >
              <span
                className="select-none shrink-0 text-xs pt-0.5"
                style={{
                  width: 20,
                  textAlign: "right",
                  color: isActive ? "#f59e0b" : "#374151",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {idx + 1}
              </span>
              {isActive ? (
                <span className="shrink-0 text-xs pt-0.5" style={{ color: "#f59e0b" }}>▶</span>
              ) : (
                <span className="shrink-0 text-xs pt-0.5" style={{ width: 10 }} />
              )}
              <span
                className="whitespace-pre leading-relaxed"
                style={{
                  color:      isActive ? "#fef3c7" : "#9ca3af",
                  fontWeight: isActive ? 600 : 400,
                }}
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

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
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
    } catch { /* silent */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
      style={{ background: "#1e2130", color: "#9ca3af" }}
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />Copied!</>
      ) : (
        <><Copy className="w-3.5 h-3.5" />Copy</>
      )}
    </button>
  );
}

// ─── Collapsible Edge Case Card ───────────────────────────────────────────────

function EdgeCaseCard({ ec }: { ec: PatternVisualization["edgeCases"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ border: "1px solid #2d1f07", background: "#1a1200" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-semibold text-sm" style={{ color: "#fcd34d" }}>{ec.title}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{
            color: "#d97706",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2.5" style={{ animation: "fadeSlideUp 0.2s ease" }}>
          <code
            className="block text-xs font-mono px-3 py-1.5 rounded-lg"
            style={{ background: "#0f0900", color: "#fbbf24", border: "1px solid #2d1f07" }}
          >
            {ec.input}
          </code>
          <p className="text-xs leading-relaxed" style={{ color: "#d97706" }}>{ec.explanation}</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
              <p className="text-xs" style={{ color: "#fca5a5" }}>{ec.whatBreaks}</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#4ade80" }} />
              <p className="text-xs" style={{ color: "#86efac" }}>{ec.howToHandle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  visualization: PatternVisualization;
}

export default function AlgorithmVisualizer({ visualization }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [playSpeed, setPlaySpeed]     = useState(1500);
  const [animKey, setAnimKey]         = useState(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalSteps  = visualization.steps.length;
  const step        = visualization.steps[currentStep];

  const goToStep = useCallback(
    (n: number) => {
      const clamped = Math.max(0, Math.min(totalSteps - 1, n));
      setCurrentStep(clamped);
      setAnimKey((k) => k + 1);
    },
    [totalSteps]
  );

  const advance = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        setIsPlaying(false);
        return prev;
      }
      setAnimKey((k) => k + 1);
      return prev + 1;
    });
  }, [totalSteps]);

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

  const templateText = visualization.templateCode.join("\n");
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  const BtnBase =
    "p-2.5 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      className="space-y-5 rounded-2xl overflow-hidden"
      style={{ background: "#0f1117", fontFamily: "inherit" }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 pt-6 pb-0"
        style={{ borderBottom: "1px solid #1e2130" }}
      >
        <div className="pb-4">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "#6b7280" }}
          >
            {visualization.title}
          </p>
          <h2 className="text-white text-xl font-bold leading-tight">
            {visualization.problemTitle}
          </h2>
          <code
            className="text-sm font-mono mt-1 block"
            style={{ color: "#9ca3af" }}
          >
            {visualization.problemInput}
          </code>
        </div>
      </div>

      {/* ── Step Progress ── */}
      <StepProgress
        current={currentStep}
        total={totalSteps}
        steps={visualization.steps}
        onJump={(i) => { setIsPlaying(false); goToStep(i); }}
      />

      {/* ── Main Two-Column Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0" style={{ minHeight: 400 }}>
        {/* Left: Data Structures */}
        <div
          className="lg:col-span-3 p-6 space-y-8"
          style={{ borderRight: "1px solid #1e2130" }}
        >
          {step.array && (
            <ArrayDisplay array={step.array} animKey={animKey} />
          )}
          {step.linkedListNodes && (
            <LinkedListDisplay nodes={step.linkedListNodes} animKey={animKey} />
          )}
          {step.grid && (
            <GridDisplay grid={step.grid} />
          )}
          {step.dpTable && (
            <DPTableDisplay dpTable={step.dpTable} />
          )}
          {step.hashmap !== undefined && (
            <HashmapDisplay entries={step.hashmap} />
          )}
          {step.stack && (
            <StackDisplay stack={step.stack} />
          )}
          {step.variables && step.variables.length > 0 && (
            <VariablesDisplay variables={step.variables} />
          )}
          {/* Empty state */}
          {!step.array && !step.linkedListNodes && !step.grid &&
           !step.dpTable && step.hashmap === undefined && !step.stack && (
            <div
              className="flex items-center justify-center rounded-xl h-32 text-sm"
              style={{ border: "1.5px dashed #1e2130", color: "#374151" }}
            >
              No data structure this step
            </div>
          )}
        </div>

        {/* Right: Code Editor */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-6">
          <CodePanel
            lines={visualization.templateCode}
            activeLine={step.codeLineIndex}
          />

          {/* Complexity badges */}
          <div className="flex gap-2 flex-wrap">
            {(["Time: O(n)", "Space: O(n)"] as const).map((badge) => (
              <span
                key={badge}
                className="text-xs font-mono px-3 py-1 rounded-full"
                style={{ background: "#1e2130", color: "#6b7280", border: "1px solid #2d3148" }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Description ── */}
      <div
        className="mx-6 rounded-2xl p-5 transition-all duration-300"
        style={{
          background: step.isEdgeCase ? "#1a1200" : "#111318",
          border:     step.isEdgeCase ? "1px solid #2d1f07" : "1px solid #1e2130",
          animation:  "fadeSlideUp 0.3s ease",
        }}
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h3 className="font-bold text-lg text-white">{step.title}</h3>
          {step.isEdgeCase && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "#2d1f07", color: "#fcd34d", border: "1px solid #78350f" }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Edge Case
            </span>
          )}
        </div>
        <p className="text-base leading-relaxed" style={{ color: "#d1d5db" }}>
          {step.description}
        </p>
        {step.isEdgeCase && step.edgeCaseNote && (
          <div
            className="mt-3 px-4 py-2.5 rounded-xl text-sm font-mono"
            style={{ background: "#0f0900", color: "#fbbf24", border: "1px solid #2d1f07" }}
          >
            {step.edgeCaseNote}
          </div>
        )}
        {step.result && (
          <div
            className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ background: "#052e16", border: "1px solid #166534" }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#4ade80" }} />
            <span className="font-bold text-base" style={{ color: "#86efac" }}>
              ✅ Answer: {step.result}
            </span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div
        className="mx-6 rounded-2xl p-4"
        style={{ background: "#111318", border: "1px solid #1e2130" }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Playback */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setIsPlaying(false); goToStep(0); }}
              disabled={isFirst}
              className={cn(BtnBase, "hover:bg-white/5")}
              title="First step"
              style={{ color: "#9ca3af" }}
            >
              <ChevronFirst className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsPlaying(false); goToStep(currentStep - 1); }}
              disabled={isFirst}
              className={cn(BtnBase, "hover:bg-white/5")}
              title="Previous"
              style={{ color: "#9ca3af" }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={isLast}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isPlaying
                  ? "linear-gradient(135deg,#f97316,#ef4444)"
                  : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#ffffff",
                boxShadow: isPlaying
                  ? "0 0 16px rgba(249,115,22,0.4)"
                  : "0 0 16px rgba(99,102,241,0.4)",
              }}
            >
              {isPlaying ? (
                <><Pause className="w-4 h-4" />Pause</>
              ) : (
                <><Play className="w-4 h-4" />Play</>
              )}
            </button>

            <button
              onClick={() => { setIsPlaying(false); goToStep(currentStep + 1); }}
              disabled={isLast}
              className={cn(BtnBase, "hover:bg-white/5")}
              title="Next"
              style={{ color: "#9ca3af" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setIsPlaying(false); goToStep(totalSteps - 1); }}
              disabled={isLast}
              className={cn(BtnBase, "hover:bg-white/5")}
              title="Last step"
              style={{ color: "#9ca3af" }}
            >
              <ChevronLast className="w-5 h-5" />
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs font-medium" style={{ color: "#4b5563" }}>Speed:</span>
            {([
              { label: "Slow",   ms: 2500 },
              { label: "Normal", ms: 1500 },
              { label: "Fast",   ms: 600  },
            ] as const).map(({ label, ms }) => (
              <button
                key={ms}
                onClick={() => setPlaySpeed(ms)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: playSpeed === ms ? "#1e2130" : "transparent",
                  color:      playSpeed === ms ? "#a78bfa" : "#4b5563",
                  border:     playSpeed === ms ? "1px solid #4b5563" : "1px solid transparent",
                  boxShadow:  playSpeed === ms ? "0 0 8px rgba(167,139,250,0.2)" : "none",
                }}
              >
                {label}{playSpeed === ms ? " ●" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Template Code (full) ── */}
      <section className="mx-6 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#9ca3af" }}>
          <span
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-mono"
            style={{ background: "#1e2130", color: "#6b7280" }}
          >
            {"<>"}
          </span>
          Standard Template
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2130" }}>
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ background: "#111318", borderBottom: "1px solid #1e2130" }}
          >
            <span className="text-xs font-mono" style={{ color: "#4b5563" }}>Python</span>
            <CopyButton text={templateText} />
          </div>
          <pre
            className="p-4 text-sm font-mono overflow-auto leading-relaxed"
            style={{ background: "#090c10", color: "#9ca3af" }}
          >
            <code>{templateText}</code>
          </pre>
        </div>
      </section>

      {/* ── Key Insights ── */}
      <section className="mx-6 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#9ca3af" }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: "#4ade80" }} />
          Key Insights
        </h3>
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ background: "#052e16", border: "1px solid #166534" }}
        >
          {visualization.keyInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "#4ade80" }}>✓</span>
              <p className="text-sm leading-relaxed" style={{ color: "#86efac" }}>{insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Common Mistakes ── */}
      <section className="mx-6 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#9ca3af" }}>
          <AlertTriangle className="w-5 h-5" style={{ color: "#fb923c" }} />
          Common Mistakes
        </h3>
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ background: "#1c0a00", border: "1px solid #7c2d12" }}
        >
          {visualization.commonMistakes.map((mistake, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: "#fb923c" }}>⚠</span>
              <p className="text-sm leading-relaxed" style={{ color: "#fdba74" }}>{mistake}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Edge Cases ── */}
      <section className="mx-6 pb-6 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#9ca3af" }}>
          <AlertTriangle className="w-5 h-5" style={{ color: "#fbbf24" }} />
          Edge Cases to Know
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visualization.edgeCases.map((ec, idx) => (
            <EdgeCaseCard key={idx} ec={ec} />
          ))}
        </div>
      </section>
    </div>
  );
}
