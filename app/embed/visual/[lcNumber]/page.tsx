// Lightweight embed page for visual explanations — no layout, no auth
// Used by the Problem Solver iframe
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import EmbedVisualClient from "@/components/visual/EmbedVisualClient";
import type { PatternVisualization } from "@/lib/visualizations";

export default async function EmbedVisualPage({
  params,
}: {
  params: Promise<{ lcNumber: string }>;
}) {
  const { lcNumber: raw } = await params;
  const lcNumber = parseInt(raw, 10);

  if (isNaN(lcNumber) || lcNumber <= 0) {
    return <EmbedVisualClient lcNumber={0} problemTitle="Unknown Problem" />;
  }

  // Check cache
  const cached = await prisma.problemVisualCache
    .findFirst({ where: { leetcodeNumber: lcNumber } })
    .catch(() => null);

  let initialVisualization: PatternVisualization | undefined;
  if (cached) {
    try {
      initialVisualization = JSON.parse(cached.visualJson) as PatternVisualization;
    } catch { /* corrupt cache, will regenerate */ }
  }

  // Get problem title
  const task = await prisma.curriculumTask
    .findFirst({ where: { leetcodeNumber: lcNumber }, select: { title: true } })
    .catch(() => null);

  const rawTitle = task?.title ?? `LeetCode #${lcNumber}`;
  const problemTitle = rawTitle.replace(/^solve:\s*/i, "").replace(/^\d+\.\s*/, "").trim();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{problemTitle} — Visual</title>
        <link rel="stylesheet" href="/_next/static/chunks/0grfbzt9r4ku_.css" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
        <EmbedVisualClient
          lcNumber={lcNumber}
          problemTitle={problemTitle}
          initialVisualization={initialVisualization}
        />
      </body>
    </html>
  );
}
