export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Sparkles, Brain } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { PatternVisualization } from "@/lib/visualizations";
import VisualGeneratorClient from "@/components/visual/VisualGeneratorClient";

export default async function ProblemVisualPage({
  params,
}: {
  params: Promise<{ lcNumber: string }>;
}) {
  // Visual pages are public — no auth required (safe to embed in iframes)

  const { lcNumber: lcNumberStr } = await params;
  const lcNumber = parseInt(lcNumberStr, 10);

  if (isNaN(lcNumber) || lcNumber <= 0) {
    notFound();
  }

  // ── 1. Look up cached visualization ─────────────────────────────────────────
  const cached = await prisma.problemVisualCache.findFirst({
    where: { leetcodeNumber: lcNumber },
  });

  // ── 2. Look up problem title from curriculum tasks ───────────────────────────
  const task = await prisma.curriculumTask.findFirst({
    where: { leetcodeNumber: lcNumber },
    select: { title: true, moduleSlug: true },
  });

  // Extract clean title: strip "Solve: " prefix if present
  let rawTitle = task?.title ?? `LeetCode Problem #${lcNumber}`;
  if (rawTitle.toLowerCase().startsWith("solve:")) {
    rawTitle = rawTitle.slice("solve:".length).trim();
  }
  const problemTitle = rawTitle;
  const moduleSlug = task?.moduleSlug ?? undefined;

  // ── 3. Parse cached visualization if available ───────────────────────────────
  let initialVisualization: PatternVisualization | undefined;
  if (cached) {
    try {
      initialVisualization = JSON.parse(cached.visualJson) as PatternVisualization;
    } catch {
      // Corrupt cache — will regenerate
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-purple-200 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Back link */}
            <Link
              href="/curriculum"
              className="inline-flex items-center gap-1 text-purple-200 hover:text-white text-sm font-medium mb-3 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Curriculum
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* LC number badge */}
                  <span className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30">
                    #{lcNumber}
                  </span>
                  {/* AI badge */}
                  <span className="inline-flex items-center gap-1 bg-amber-400/90 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </span>
                  {cached && (
                    <span className="inline-flex items-center bg-green-400/80 text-green-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      Cached
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white mt-1 leading-tight">
                  {problemTitle}
                </h1>
              </div>
            </div>

            <p className="text-purple-200 text-sm mt-2">
              Step-by-step AI-generated visual explanation
            </p>
          </div>

          {/* LeetCode link */}
          <a
            href={`https://leetcode.com/problems/${problemTitle
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Open on LeetCode
          </a>
        </div>
      </div>

      {/* ── Visualization ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <VisualGeneratorClient
          lcNumber={lcNumber}
          problemTitle={problemTitle}
          moduleSlug={moduleSlug}
          initialVisualization={initialVisualization}
        />
      </div>
    </div>
  );
}
