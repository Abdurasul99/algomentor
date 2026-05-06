"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const MODULES = [
  { index: 1, name: "Arrays & Hashing", slug: "arrays-hashing", color: "#6366f1" },
  { index: 2, name: "Two Pointers", slug: "two-pointers", color: "#8b5cf6" },
  { index: 3, name: "Sliding Window", slug: "sliding-window", color: "#a78bfa" },
  { index: 4, name: "Stack", slug: "stack", color: "#ec4899" },
  { index: 5, name: "Binary Search", slug: "binary-search", color: "#f59e0b" },
  { index: 6, name: "Linked List", slug: "linked-list", color: "#10b981" },
  { index: 7, name: "Trees", slug: "trees", color: "#06b6d4" },
  { index: 8, name: "Tries", slug: "tries", color: "#3b82f6" },
  { index: 9, name: "Heap / Priority Queue", slug: "heap", color: "#f97316" },
  { index: 10, name: "Graphs", slug: "graphs", color: "#84cc16" },
  { index: 11, name: "Dynamic Programming", slug: "dynamic-programming", color: "#ef4444" },
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string; delay: number }>
  >([]);

  // Generate celebration particles on mount
  useEffect(() => {
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
    const generated = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      color: colors[i % colors.length],
      delay: Math.random() * 2,
    }));
    setParticles(generated);
  }, []);

  const handleLeetCodeSync = async () => {
    if (!session?.user) return;
    setSyncLoading(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/leetcode/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      if (res.ok) {
        setSyncResult({ success: true, message: "LeetCode profile synced successfully!" });
      } else {
        setSyncResult({
          success: false,
          message: json.error ?? "Failed to sync. Check your LeetCode username.",
        });
      }
    } catch {
      setSyncResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSyncLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
      >
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
    >
      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-2 h-2 rounded-full opacity-70"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.color,
              animation: `bounce 2s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
        {/* Soft glow blobs */}
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "#6366f1", top: "-10%", left: "-10%" }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "#8b5cf6", bottom: "-10%", right: "-10%" }}
        />
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          to { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlideIn 0.5s ease-out forwards; }
      `}</style>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10 fade-in">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <Brain className="w-11 h-11 text-white" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">
              Welcome aboard!
            </span>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3">
            Hey {userName}! 👋
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Your Algorithm Mentor Academy journey begins now. You&apos;ve joined thousands of
            engineers mastering DS&A for top tech interviews.
          </p>
        </div>

        {/* LeetCode Sync Card */}
        <div
          className="rounded-2xl border border-slate-700/50 p-6 mb-8 fade-in"
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(12px)",
            animationDelay: "0.1s",
            opacity: 0,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(251, 191, 36, 0.15)" }}
            >
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">
                Sync Your LeetCode Profile
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Connect your LeetCode account to personalize your learning path based on your
                existing progress and skill level.
              </p>

              {syncResult && (
                <div
                  className="flex items-center gap-2 text-sm mb-4 px-4 py-2.5 rounded-xl"
                  style={{
                    background: syncResult.success
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${syncResult.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: syncResult.success ? "#34d399" : "#f87171",
                  }}
                >
                  {syncResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <span className="text-lg leading-none">⚠</span>
                  )}
                  {syncResult.message}
                </div>
              )}

              <button
                onClick={handleLeetCodeSync}
                disabled={syncLoading || syncResult?.success === true}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    syncResult?.success
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(251, 191, 36, 0.2)",
                  border: "1px solid rgba(251, 191, 36, 0.4)",
                  color: syncResult?.success ? "#34d399" : "#fbbf24",
                }}
              >
                {syncLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : syncResult?.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {syncLoading
                  ? "Syncing..."
                  : syncResult?.success
                  ? "Synced!"
                  : "Sync LeetCode Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div
          className="rounded-2xl border border-slate-700/50 p-6 mb-8 fade-in"
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(12px)",
            animationDelay: "0.2s",
            opacity: 0,
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold text-lg">Your 11-Module Learning Path</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULES.map((mod, idx) => (
              <div
                key={mod.slug}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid rgba(100, 116, 139, 0.15)",
                  animationDelay: `${0.3 + idx * 0.04}s`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: mod.color }}
                >
                  {mod.index}
                </div>
                <span className="text-sm text-slate-300 font-medium">{mod.name}</span>
                <div
                  className="ml-auto w-2 h-2 rounded-full shrink-0"
                  style={{ background: "rgba(100, 116, 139, 0.3)" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="text-center fade-in"
          style={{ animationDelay: "0.8s", opacity: 0 }}
        >
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
            }}
          >
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-slate-500">
            You can always access your profile settings later
          </p>
        </div>
      </div>
    </div>
  );
}
