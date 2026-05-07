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

  const [cached, task] = await Promise.all([
    prisma.problemVisualCache
      .findFirst({ where: { leetcodeNumber: lcNumber } })
      .catch(() => null),
    prisma.curriculumTask
      .findFirst({ where: { leetcodeNumber: lcNumber }, select: { title: true } })
      .catch(() => null),
  ]);

  let initialVisualization: PatternVisualization | undefined;
  if (cached) {
    try {
      initialVisualization = JSON.parse(cached.visualJson) as PatternVisualization;
    } catch { /* corrupt — will regenerate */ }
  }

  const rawTitle = task?.title ?? `LeetCode #${lcNumber}`;
  const problemTitle = rawTitle.replace(/^solve:\s*/i, "").replace(/^\d+\.\s*/, "").trim();

  return (
    <EmbedVisualClient
      lcNumber={lcNumber}
      problemTitle={problemTitle}
      initialVisualization={initialVisualization}
    />
  );
}
