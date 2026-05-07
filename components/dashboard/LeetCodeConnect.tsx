"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeetCodeConnect() {
  const [username, setUsername] = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [error, setError]       = useState("");
  const router = useRouter();

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim();
    if (!u) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/leetcode/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
    }
  }

  return (
    <div className="mx-5 mb-5 rounded-xl px-5 py-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-2 mb-3">
        {/* LeetCode logo */}
        <svg width="18" height="18" viewBox="0 0 50 50" fill="none">
          <path d="M36.7 36.2c-1.2 1.3-2.9 2-4.7 2H17.5c-1.8 0-3.5-.7-4.7-2L6.5 29.4c-1.2-1.3-1.2-3.3 0-4.6l6.3-6.8c1.2-1.3 2.9-2 4.7-2H32c1.8 0 3.5.7 4.7 2l6.3 6.8c1.2 1.3 1.2 3.3 0 4.6l-6.3 6.8z" fill="#FFA116"/>
          <rect x="20" y="23" width="16" height="4" rx="2" fill="white" opacity="0.9"/>
        </svg>
        <span className="text-sm font-bold text-white">Connect LeetCode</span>
        <span className="text-xs text-slate-400 ml-1">— enter your username to sync stats</span>
      </div>

      <form onSubmit={handleConnect} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono select-none">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setStatus("idle"); setError(""); }}
            placeholder="your-leetcode-username"
            className="w-full pl-7 pr-4 py-2 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            disabled={status === "loading"}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || status === "loading"}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#FFA116", color: "#1a1a1a" }}
        >
          {status === "loading" ? "Syncing…" : "Sync"}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
