import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { visualizations } from "@/lib/visualizations";
import { notFound } from "next/navigation";
import AlgorithmVisualizer from "@/components/visual/AlgorithmVisualizer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VisualPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();

  const module = await prisma.module.findUnique({ where: { slug } });
  if (!module) notFound();

  const viz = visualizations[slug];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/modules/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {module.name}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {module.name}{" "}
            <span className="text-purple-600">— Visual Explanation</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Step-by-step interactive walkthrough of the algorithm
          </p>
        </div>
      </div>

      {/* ── Visualizer or Placeholder ── */}
      {viz ? (
        <AlgorithmVisualizer visualization={viz} />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-10 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🚧</span>
          </div>
          <p className="text-amber-800 font-semibold text-base">
            Visual explanation coming soon for this module.
          </p>
          <p className="text-amber-600 text-sm mt-1">
            Check back after the next update.
          </p>
          <Link
            href={`/modules/${slug}`}
            className="inline-flex items-center gap-1.5 mt-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Module
          </Link>
        </div>
      )}
    </div>
  );
}
