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
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ─── Light-theme color maps ──────────────────────────────────────────────────

const CELL_STYLE: Record<CellColor, { bg: string; text: string; border: string; shadow?: string }> = {
  default:    { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  current:    { bg: "#fef3c7", text: "#92400e", border: "#f59e0b", shadow: "0 0 0 3px rgba(245,158,11,0.25), 0 4px 16px rgba(245,158,11,0.3)" },
  left:       { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6", shadow: "0 0 0 3px rgba(59,130,246,0.25)" },
  right:      { bg: "#ffedd5", text: "#9a3412", border: "#f97316", shadow: "0 0 0 3px rgba(249,115,22,0.25)" },
  mid:        { bg: "#ede9fe", text: "#5b21b6", border: "#8b5cf6", shadow: "0 0 0 3px rgba(139,92,246,0.25)" },
  window:     { bg: "#dcfce7", text: "#166534", border: "#22c55e" },
  found:      { bg: "#bbf7d0", text: "#14532d", border: "#16a34a", shadow: "0 0 0 3px rgba(22,163,74,0.3), 0 4px 20px rgba(22,163,74,0.4)" },
  eliminated: { bg: "#f8fafc", text: "#cbd5e1", border: "#e2e8f0" },
  match:      { bg: "#cffafe", text: "#0e7490", border: "#06b6d4" },
  duplicate:  { bg: "#fee2e2", text: "#991b1b", border: "#ef4444", shadow: "0 0 0 3px rgba(239,68,68,0.25)" },
};

const POINTER_COLORS: Record<string, string> = {
  L:    "#2563eb", R: "#ea580c", mid: "#7c3aed",
  curr: "#d97706", slow: "#059669", fast: "#ea580c",
  left: "#2563eb", right: "#ea580c", i: "#d97706", j: "#7c3aed",
};

function pointerColor(label: string) {
  return POINTER_COLORS[label] ?? "#64748b";
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepDots({ total, current, onJump }: { total: number; current: number; onJump: (i: number) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onJump(i)}
          style={{
            width:  i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === current ? "#6366f1" : i < current ? "#a5b4fc" : "#e2e8f0",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Array visualization ──────────────────────────────────────────────────────

function ArrayViz({ array, animKey }: { array: NonNullable<VisualStep["array"]>; animKey: number }) {
  const windowIndices = array.colors.map((c, i) => c === "window" ? i : -1).filter(i => i >= 0);
  const wStart = windowIndices[0] ?? -1;
  const wEnd   = windowIndices[windowIndices.length - 1] ?? -1;
  const cellSize = 72;
  const gap = 10;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label */}
      <div className="flex gap-1 items-center">
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
          Array
        </span>
      </div>

      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Window bracket */}
        {wStart >= 0 && (
          <div style={{
            position: "absolute",
            left:   wStart * (cellSize + gap),
            width:  (wEnd - wStart + 1) * (cellSize + gap) - gap,
            top: 0, bottom: 28,
            border: "2.5px solid #16a34a",
            borderRadius: 16,
            background: "rgba(22,163,74,0.04)",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        )}

        {/* Index row */}
        <div style={{ display: "flex", gap, marginBottom: 4 }}>
          {array.values.map((_, i) => (
            <div key={i} style={{ width: cellSize, textAlign: "center", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
              {i}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: "flex", gap, position: "relative", zIndex: 1 }}>
          {array.values.map((val, i) => {
            const cs = CELL_STYLE[array.colors[i] ?? "default"];
            const isActive = array.colors[i] === "current";
            const isFound  = array.colors[i] === "found";
            return (
              <div
                key={i}
                style={{
                  width: cellSize, height: cellSize,
                  borderRadius: 14,
                  background: cs.bg,
                  border: `2.5px solid ${cs.border}`,
                  boxShadow: cs.shadow ?? "0 1px 4px rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800,
                  color: cs.text,
                  transition: "all 0.35s cubic-bezier(.34,1.56,.64,1)",
                  transform: isActive ? "scale(1.15) translateY(-4px)" : isFound ? "scale(1.08)" : "scale(1)",
                  animation: isActive ? `bounceIn 0.4s ease ${animKey}` : isFound ? "pulseGlow 1.5s ease infinite" : "none",
                  userSelect: "none",
                  fontFamily: "monospace",
                }}
              >
                {String(val)}
              </div>
            );
          })}
        </div>

        {/* Pointer arrows */}
        <div style={{ display: "flex", gap, marginTop: 6 }}>
          {array.values.map((_, i) => {
            const label = array.labels?.[i];
            if (!label) return <div key={i} style={{ width: cellSize, height: 32 }} />;
            const color = pointerColor(label);
            return (
              <div key={i} style={{ width: cellSize, display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeSlideUp 0.3s ease" }}>
                <svg width="16" height="12" viewBox="0 0 16 12">
                  <path d="M8 0 L8 8 M4 5 L8 10 L12 5" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "monospace", marginTop: 1 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Hash map visualization ───────────────────────────────────────────────────

function HashmapViz({ entries }: { entries: HashmapEntry[] }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
        Hash Map
      </span>
      <div style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 16, overflow: "hidden", minWidth: 260, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", background: "#f8fafc", padding: "8px 16px", borderBottom: "1.5px solid #e2e8f0" }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>KEY</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>VALUE</span>
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#cbd5e1", fontSize: 13, fontStyle: "italic" }}>
            empty { }
          </div>
        ) : entries.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: i < entries.length - 1 ? "1px solid #f1f5f9" : "none",
              background: e.isNew ? "rgba(99,102,241,0.06)" : e.isLookup ? "rgba(59,130,246,0.06)" : "white",
              borderLeft: e.isNew ? "3px solid #6366f1" : e.isLookup ? "3px solid #3b82f6" : "3px solid transparent",
              animation: e.isNew ? "fadeSlideUp 0.35s ease" : "none",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: e.isNew ? "#4338ca" : "#374151" }}>
              {e.key}
            </span>
            <span style={{ fontSize: 15, fontFamily: "monospace", color: "#374151" }}>{String(e.value)}</span>
            {e.isNew && (
              <span style={{
                marginLeft: 10, fontSize: 10, fontWeight: 800, padding: "2px 8px",
                borderRadius: 100, background: "#eef2ff", color: "#4338ca",
                animation: "fadeSlideUp 0.3s ease",
              }}>NEW</span>
            )}
            {e.isLookup && (
              <span style={{
                marginLeft: 10, fontSize: 10, fontWeight: 800, padding: "2px 8px",
                borderRadius: 100, background: "#eff6ff", color: "#1d4ed8",
              }}>FOUND</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stack visualization ──────────────────────────────────────────────────────

function StackViz({ stack }: { stack: StackState }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
        Stack {stack.lastAction && <span style={{ color: stack.lastAction === "push" ? "#16a34a" : "#dc2626", marginLeft: 6 }}>{stack.lastAction === "push" ? "↓ push" : "↑ pop"}</span>}
      </span>
      <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 6, minHeight: 48 }}>
        {stack.items.length === 0 ? (
          <div style={{ border: "2px dashed #e2e8f0", borderRadius: 12, padding: "10px 32px", color: "#cbd5e1", fontSize: 13 }}>
            empty
          </div>
        ) : stack.items.map((item, i) => {
          const isTop = i === stack.items.length - 1;
          const justPushed = isTop && stack.lastAction === "push";
          return (
            <div
              key={i}
              style={{
                padding: "10px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "monospace",
                background: justPushed ? "#dcfce7" : "#f8fafc",
                border: `2px solid ${isTop ? "#22c55e" : "#e2e8f0"}`,
                color: justPushed ? "#14532d" : "#374151",
                boxShadow: justPushed ? "0 4px 12px rgba(34,197,94,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                animation: justPushed ? "fadeSlideUp 0.35s ease" : "none",
                transition: "all 0.3s ease",
                minWidth: 96, textAlign: "center",
              }}
            >
              {String(item)}
              {isTop && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8, fontWeight: 400 }}>← top</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Linked list visualization ────────────────────────────────────────────────

function LinkedListViz({ nodes, animKey }: { nodes: NonNullable<VisualStep["linkedListNodes"]>; animKey: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
        Linked List
      </span>
      {/* Labels */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        {nodes.values.map((_, i) => {
          const label = nodes.labels?.[i];
          return (
            <div key={i} style={{ width: 72, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {label ? (
                <>
                  <span style={{ fontSize: 12, fontWeight: 800, color: pointerColor(label), animation: "fadeSlideUp 0.3s ease" }}>{label}</span>
                  <svg width="10" height="12" viewBox="0 0 10 12">
                    <path d="M5 0 L5 8 M2 6 L5 10 L8 6" stroke={pointerColor(label)} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : <div style={{ height: 30 }} />}
            </div>
          );
        })}
      </div>
      {/* Nodes */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
        {nodes.values.map((val, i) => {
          const cs = CELL_STYLE[nodes.colors[i] ?? "default"];
          const isActive = nodes.colors[i] === "current";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: cs.bg, border: `2.5px solid ${cs.border}`,
                boxShadow: cs.shadow ?? "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: cs.text,
                fontFamily: "monospace",
                transition: "all 0.35s cubic-bezier(.34,1.56,.64,1)",
                transform: isActive ? "scale(1.15) translateY(-4px)" : "scale(1)",
                animation: isActive ? `bounceIn 0.4s ease ${animKey}` : "none",
              }}>
                {String(val)}
              </div>
              <svg width="28" height="20" viewBox="0 0 28 20">
                <path d="M2 10 L20 10 M16 5 L22 10 L16 15" stroke="#cbd5e1" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          );
        })}
        {nodes.nullAtEnd !== false && (
          <div style={{ width: 42, height: 36, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#cbd5e1" }}>
            null
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Grid visualization ───────────────────────────────────────────────────────

function GridViz({ grid }: { grid: NonNullable<VisualStep["grid"]> }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>Grid</span>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
        {grid.cells.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 6 }}>
            {row.map((cell, c) => {
              const cs = CELL_STYLE[grid.colors[r]?.[c] ?? "default"];
              return (
                <div key={c} style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: cs.bg, border: `2px solid ${cs.border}`,
                  boxShadow: cs.shadow ?? "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: cs.text, fontFamily: "monospace",
                  transition: "all 0.3s ease",
                }}>
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

// ─── DP table visualization ───────────────────────────────────────────────────

function DPTableViz({ dpTable }: { dpTable: NonNullable<VisualStep["dpTable"]> }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
        {dpTable.label ?? "DP Table"}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {/* Headers */}
        <div style={{ display: "flex", gap: 6 }}>
          {dpTable.headers.map((h, i) => (
            <div key={i} style={{ width: 52, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>
              {String(h)}
            </div>
          ))}
        </div>
        {/* Values */}
        <div style={{ display: "flex", gap: 6 }}>
          {dpTable.values.map((v, i) => {
            const cs = CELL_STYLE[dpTable.colors[i] ?? "default"];
            return (
              <div key={i} style={{
                width: 52, height: 52, borderRadius: 12,
                background: cs.bg, border: `2.5px solid ${cs.border}`,
                boxShadow: cs.shadow ?? "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: cs.text, fontFamily: "monospace",
                transition: "all 0.35s cubic-bezier(.34,1.56,.64,1)",
                transform: dpTable.colors[i] === "current" ? "scale(1.12)" : "scale(1)",
              }}>
                {String(v)}
              </div>
            );
          })}
        </div>
        {/* Current pointer */}
        <div style={{ display: "flex", gap: 6 }}>
          {dpTable.values.map((_, i) => (
            <div key={i} style={{ width: 52, display: "flex", justifyContent: "center" }}>
              {dpTable.colors[i] === "current" && (
                <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 800 }}>↑</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Variables strip ──────────────────────────────────────────────────────────

function VarsStrip({ variables }: { variables: NonNullable<VisualStep["variables"]> }) {
  if (!variables.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
      {variables.map((v, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "5px 12px", borderRadius: 100,
          background: "#f1f5f9", border: "1.5px solid #e2e8f0",
          fontSize: 13, fontFamily: "monospace", fontWeight: 700,
          animation: "fadeSlideUp 0.25s ease",
          transition: "all 0.3s ease",
        }}>
          <span style={{ color: "#7c3aed" }}>{v.name}</span>
          <span style={{ color: "#94a3b8", fontWeight: 400 }}>=</span>
          <span style={{ color: "#1e293b" }}>{String(v.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Inline code line highlight ───────────────────────────────────────────────

function CodeHighlight({ lines, activeLine }: { lines: string[]; activeLine: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLine]);

  return (
    <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", fontSize: 13, fontFamily: "monospace" }}>
      {/* title bar */}
      <div style={{ background: "#0f172a", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#ef4444" }} />
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#f59e0b" }} />
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e" }} />
        <span style={{ marginLeft: 8, color: "#475569", fontSize: 11 }}>Python</span>
      </div>
      <div style={{ overflowX: "auto", maxHeight: 220 }}>
        {lines.map((line, i) => {
          const isActive = i === activeLine;
          return (
            <div
              key={i}
              ref={isActive ? ref : undefined}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "4px 14px",
                background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                borderLeft: isActive ? "3px solid #f59e0b" : "3px solid transparent",
                transition: "background 0.3s ease",
              }}
            >
              <span style={{ width: 20, textAlign: "right", color: isActive ? "#f59e0b" : "#334155", fontSize: 11, paddingTop: 2, userSelect: "none", flexShrink: 0 }}>
                {i + 1}
              </span>
              {isActive ? <span style={{ color: "#f59e0b", fontSize: 11, paddingTop: 2, flexShrink: 0 }}>▶</span> : <span style={{ width: 10, flexShrink: 0 }} />}
              <span style={{
                color: isActive ? "#fef3c7" : "#64748b",
                fontWeight: isActive ? 700 : 400,
                whiteSpace: "pre",
                lineHeight: 1.6,
              }}>
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      Object.assign(ta.style, { position: "fixed", opacity: "0" });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
      borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white",
      fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
    }}>
      {copied ? <><Check size={13} color="#22c55e" />Copied!</> : <><Copy size={13} />Copy</>}
    </button>
  );
}

// ─── Collapsible edge case ────────────────────────────────────────────────────

function EdgeCard({ ec }: { ec: PatternVisualization["edgeCases"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1.5px solid #fde68a", borderRadius: 12, overflow: "hidden", background: "white" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>{ec.title}</span>
        <ChevronDown size={16} color="#d97706" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", animation: "fadeSlideUp 0.2s ease" }}>
          <code style={{ display: "block", padding: "8px 12px", background: "#fef9c3", borderRadius: 8, fontSize: 13, fontFamily: "monospace", color: "#92400e", marginBottom: 10 }}>
            {ec.input}
          </code>
          <p style={{ fontSize: 13, color: "#78350f", marginBottom: 8, lineHeight: 1.6 }}>{ec.explanation}</p>
          <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 4 }}>⚠ {ec.whatBreaks}</p>
          <p style={{ fontSize: 13, color: "#16a34a" }}>✓ {ec.howToHandle}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AlgorithmVisualizer({ visualization }: { visualization: PatternVisualization }) {
  const [step, setStep]         = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(1600);
  const [animKey, setAnimKey]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = visualization.steps.length;
  const cur   = visualization.steps[step];

  const goTo = useCallback((n: number) => {
    const c = Math.max(0, Math.min(total - 1, n));
    setStep(c);
    setAnimKey(k => k + 1);
  }, [total]);

  const advance = useCallback(() => {
    setStep(prev => {
      if (prev >= total - 1) { setPlaying(false); return prev; }
      setAnimKey(k => k + 1);
      return prev + 1;
    });
  }, [total]);

  useEffect(() => {
    if (playing) timerRef.current = setInterval(advance, speed);
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speed, advance]);

  const isFirst = step === 0;
  const isLast  = step === total - 1;

  return (
    <div style={{ background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", borderRadius: 20, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>

      {/* ── Header ── */}
      <div style={{ background: "white", padding: "20px 24px 16px", borderBottom: "1.5px solid #f1f5f9" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
          {visualization.title}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
          {visualization.problemTitle}
        </h2>
        <code style={{ fontSize: 13, color: "#475569", fontFamily: "monospace", display: "block", marginTop: 4 }}>
          {visualization.problemInput}
        </code>
      </div>

      {/* ── Step counter + dots ── */}
      <div style={{ background: "white", padding: "12px 24px", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", whiteSpace: "nowrap" }}>
          Step {step + 1} / {total}
        </span>
        <div style={{ flex: 1 }}>
          <StepDots total={total} current={step} onJump={(i) => { setPlaying(false); goTo(i); }} />
        </div>
        {/* Progress bar */}
        <div style={{ width: 80, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            width: `${total <= 1 ? 100 : Math.round((step / (total - 1)) * 100)}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* ── STEP EXPLANATION — big, prominent ── */}
      <div
        key={`desc-${step}`}
        style={{
          background: cur.isEdgeCase ? "#fffbeb" : "white",
          borderBottom: "1.5px solid #f1f5f9",
          padding: "20px 24px",
          animation: "fadeSlideUp 0.35s ease",
          borderLeft: `4px solid ${cur.isEdgeCase ? "#f59e0b" : "#6366f1"}`,
        }}
      >
        {cur.isEdgeCase && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={14} color="#d97706" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#d97706", letterSpacing: "0.1em", textTransform: "uppercase" }}>Edge Case</span>
          </div>
        )}
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0", lineHeight: 1.3 }}>
          {cur.title}
        </h3>
        <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7, margin: 0 }}>
          {cur.description}
        </p>
        {cur.isEdgeCase && cur.edgeCaseNote && (
          <code style={{ display: "block", marginTop: 10, padding: "8px 12px", background: "#fef9c3", borderRadius: 8, fontSize: 13, fontFamily: "monospace", color: "#92400e" }}>
            {cur.edgeCaseNote}
          </code>
        )}
        {cur.result && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#14532d" }}>Answer: {cur.result}</span>
          </div>
        )}
      </div>

      {/* ── MAIN VISUALIZATION CANVAS ── */}
      <div
        key={`canvas-${step}`}
        style={{
          background: "#f8fafc",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          animation: "fadeSlideUp 0.3s ease",
          minHeight: 200,
          overflowX: "auto",
        }}
      >
        {cur.array && <ArrayViz array={cur.array} animKey={animKey} />}
        {cur.linkedListNodes && <LinkedListViz nodes={cur.linkedListNodes} animKey={animKey} />}
        {cur.grid && <GridViz grid={cur.grid} />}
        {cur.dpTable && <DPTableViz dpTable={cur.dpTable} />}
        {cur.hashmap !== undefined && <HashmapViz entries={cur.hashmap} />}
        {cur.stack && <StackViz stack={cur.stack} />}
        {cur.variables && cur.variables.length > 0 && <VarsStrip variables={cur.variables} />}

        {!cur.array && !cur.linkedListNodes && !cur.grid && !cur.dpTable && cur.hashmap === undefined && !cur.stack && (
          <div style={{ color: "#cbd5e1", fontSize: 14, padding: "32px 0" }}>No visualization this step</div>
        )}
      </div>

      {/* ── CODE HIGHLIGHT ── */}
      <div style={{ padding: "0 24px 16px" }}>
        <CodeHighlight lines={visualization.templateCode} activeLine={cur.codeLineIndex} />
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ background: "white", borderTop: "1.5px solid #f1f5f9", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        {/* Playback */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => { setPlaying(false); goTo(0); }} disabled={isFirst} style={ctrlBtn(isFirst)} title="First">
            <ChevronFirst size={18} />
          </button>
          <button onClick={() => { setPlaying(false); goTo(step - 1); }} disabled={isFirst} style={ctrlBtn(isFirst)} title="Previous">
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setPlaying(p => !p)}
            disabled={isLast}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 22px", borderRadius: 10, border: "none", cursor: isLast ? "not-allowed" : "pointer",
              background: playing ? "linear-gradient(135deg,#f97316,#ef4444)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "white", fontSize: 14, fontWeight: 700,
              boxShadow: playing ? "0 4px 14px rgba(239,68,68,0.35)" : "0 4px 14px rgba(99,102,241,0.35)",
              opacity: isLast ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {playing ? <><Pause size={16} />Pause</> : <><Play size={16} />Play</>}
          </button>

          <button onClick={() => { setPlaying(false); goTo(step + 1); }} disabled={isLast} style={ctrlBtn(isLast)} title="Next">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => { setPlaying(false); goTo(total - 1); }} disabled={isLast} style={ctrlBtn(isLast)} title="Last">
            <ChevronLast size={18} />
          </button>
        </div>

        {/* Speed */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Speed:</span>
          {([{ l: "Slow", v: 2500 }, { l: "Normal", v: 1600 }, { l: "Fast", v: 700 }]).map(({ l, v }) => (
            <button
              key={v}
              onClick={() => setSpeed(v)}
              style={{
                padding: "5px 11px", borderRadius: 8, border: `1.5px solid ${speed === v ? "#6366f1" : "#e2e8f0"}`,
                background: speed === v ? "#eef2ff" : "white",
                color: speed === v ? "#4338ca" : "#94a3b8",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── FULL TEMPLATE CODE ── */}
      <details style={{ margin: "0 24px 0" }}>
        <summary style={{ padding: "12px 0", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 6 }}>
          {"</>"}  Full Solution Template
        </summary>
        <div style={{ paddingBottom: 16 }}>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Python</span>
              <CopyButton text={visualization.templateCode.join("\n")} />
            </div>
            <pre style={{ margin: 0, padding: "14px 16px", background: "#1e293b", color: "#94a3b8", fontSize: 13, fontFamily: "monospace", overflowX: "auto", lineHeight: 1.6 }}>
              <code>{visualization.templateCode.join("\n")}</code>
            </pre>
          </div>
        </div>
      </details>

      {/* ── KEY INSIGHTS ── */}
      <section style={{ margin: "0 24px 16px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "16px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={16} color="#16a34a" /> Key Insights
        </h3>
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
          {visualization.keyInsights.map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < visualization.keyInsights.length - 1 ? 10 : 0 }}>
              <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span>
              <p style={{ margin: 0, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>{ins}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMON MISTAKES ── */}
      <section style={{ margin: "0 24px 16px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={16} color="#f97316" /> Common Mistakes
        </h3>
        <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12, padding: "14px 16px" }}>
          {visualization.commonMistakes.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < visualization.commonMistakes.length - 1 ? 10 : 0 }}>
              <span style={{ color: "#f97316", marginTop: 2 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 13, color: "#9a3412", lineHeight: 1.6 }}>{m}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EDGE CASES ── */}
      {visualization.edgeCases.length > 0 && (
        <section style={{ margin: "0 24px 24px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} color="#f59e0b" /> Edge Cases
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {visualization.edgeCases.map((ec, i) => <EdgeCard key={i} ec={ec} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// small helper for nav button styles
function ctrlBtn(disabled: boolean) {
  return {
    padding: 8, borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    background: "white",
    color: disabled ? "#e2e8f0" : "#475569",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s ease",
  } as React.CSSProperties;
}
