"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, RefreshCw } from "lucide-react";
import type { PatternVisualization } from "@/lib/visualizations";

const AlgorithmVisualizer = dynamic(
  () => import("@/components/visual/AlgorithmVisualizer"),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#94a3b8", fontSize: "14px" }}>
        Loading visualizer…
      </div>
    ),
  }
);

interface Props {
  lcNumber: number;
  problemTitle: string;
  initialVisualization?: PatternVisualization;
}

export default function EmbedVisualClient({ lcNumber, problemTitle, initialVisualization }: Props) {
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">(
    initialVisualization ? "done" : "idle"
  );
  const [visualization, setVisualization] = useState<PatternVisualization | null>(
    initialVisualization ?? null
  );
  const [error, setError] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);

  const msgs = [
    "Analyzing the algorithm…",
    "Building step-by-step execution…",
    "Generating array states…",
    "Almost ready…",
  ];

  async function generate() {
    setStatus("generating");
    setError("");
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % msgs.length;
      setMsgIndex(i);
    }, 2000);

    try {
      const res = await fetch("/api/ai/visual-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leetcodeNumber: lcNumber,
          problemTitle,
          moduleSlug: "arrays-hashing",
        }),
      });
      const data = await res.json() as { visualization?: PatternVisualization; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");
      if (!data.visualization) throw new Error("No visualization returned");
      setVisualization(data.visualization);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStatus("error");
    } finally {
      clearInterval(interval);
    }
  }

  // Idle state
  if (status === "idle") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "20px", padding: "40px 24px",
        minHeight: "300px",
      }}>
        <div style={{
          width: "64px", height: "64px", background: "linear-gradient(135deg, #e0e7ff, #ede9fe)",
          borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles style={{ width: "32px", height: "32px", color: "#7c3aed" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", margin: "0 0 6px" }}>
            Visual Explanation
          </p>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            AI will generate step-by-step visualization for #{lcNumber}: {problemTitle}
          </p>
        </div>
        <button
          onClick={generate}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "white", fontWeight: 700, fontSize: "13px",
            padding: "10px 24px", borderRadius: "12px", border: "none",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
          }}
        >
          <Sparkles style={{ width: "14px", height: "14px" }} />
          Generate Visual Explanation
        </button>
      </div>
    );
  }

  // Generating state
  if (status === "generating") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "20px", padding: "40px 24px",
        minHeight: "300px",
      }}>
        <div style={{
          width: "56px", height: "56px", background: "#f0fdf4",
          borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #bbf7d0",
        }}>
          <div style={{
            width: "28px", height: "28px", border: "3px solid #bbf7d0",
            borderTopColor: "#22c55e", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", margin: "0 0 6px" }}>
            Generating…
          </p>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {msgs[msgIndex]}
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "16px", padding: "40px 24px",
        minHeight: "300px",
      }}>
        <p style={{ color: "#ef4444", fontWeight: 600, fontSize: "14px", textAlign: "center" }}>
          ⚠️ {error || "Generation failed"}
        </p>
        <button
          onClick={() => { setStatus("idle"); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "13px",
            padding: "8px 20px", borderRadius: "10px", border: "1px solid #e2e8f0",
            cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: "14px", height: "14px" }} />
          Try Again
        </button>
      </div>
    );
  }

  // Done — show visualizer
  return (
    <div style={{ padding: "8px" }}>
      {visualization && <AlgorithmVisualizer visualization={visualization} />}
    </div>
  );
}
