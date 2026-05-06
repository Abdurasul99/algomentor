export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Code2,
  Lightbulb,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Building2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cn, getDifficultyColor, getStatusColor } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";

const TARGET_COMPANIES = ["Google", "Meta", "Amazon", "Apple", "Microsoft"];

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{
    module?: string;
    difficulty?: string;
    status?: string;
    company?: string;
  }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const filterModule = sp.module ?? "";
  const filterDifficulty = sp.difficulty ?? "";
  const filterStatus = sp.status ?? "";
  const filterCompany = sp.company ?? "";

  // ── Data ──────────────────────────────────────────────────────────────────
  const [modules, problems] = await Promise.all([
    prisma.module.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.practiceProblem.findMany({
      orderBy: [{ module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
      include: {
        module: { select: { name: true, slug: true } },
        attempts: {
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total = problems.length;
  const solved = problems.filter((p) => {
    const s = p.attempts[0]?.status;
    return s === "Solved" || s === "Mastered";
  }).length;
  const mastered = problems.filter(
    (p) => p.attempts[0]?.status === "Mastered"
  ).length;
  const confidenceScores = problems
    .map((p) => p.attempts[0]?.confidenceScore ?? 0)
    .filter((s) => s > 0);
  const avgConfidence =
    confidenceScores.length > 0
      ? Math.round(
          confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        )
      : 0;

  // ── Company counts ────────────────────────────────────────────────────────
  const solvedProblemIds = new Set(
    problems
      .filter((p) => {
        const s = p.attempts[0]?.status;
        return s === "Solved" || s === "Mastered";
      })
      .map((p) => p.id)
  );

  const companyCounts: Record<string, number> = {};
  for (const company of TARGET_COMPANIES) {
    companyCounts[company] = problems.filter((p) => {
      try {
        const companies = JSON.parse(p.companies || "[]") as string[];
        return companies.includes(company) && !solvedProblemIds.has(p.id);
      } catch {
        return false;
      }
    }).length;
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = problems.filter((p) => {
    if (filterModule && p.module.slug !== filterModule) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    if (filterStatus) {
      const s = p.attempts[0]?.status ?? "NotStarted";
      if (s !== filterStatus) return false;
    }
    if (filterCompany) {
      try {
        const companies = JSON.parse(p.companies || "[]") as string[];
        if (!companies.includes(filterCompany)) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  const statusOptions = [
    "NotStarted",
    "InProgress",
    "Solved",
    "Mastered",
    "Retry",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Problems</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Work through algorithm problems with mentor-guided hints and track your confidence.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Problems"
          value={total}
          icon={Code2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="Solved"
          value={solved}
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Mastered"
          value={mastered}
          icon={Star}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Avg Confidence"
          value={avgConfidence > 0 ? `${avgConfidence}%` : "—"}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* ── Company Problems Section ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Company Problems
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Unsolved problems tagged with target companies</p>
        </div>
        <div className="p-5 flex flex-wrap gap-3">
          {TARGET_COMPANIES.map((company) => {
            const count = companyCounts[company] ?? 0;
            const isActive = filterCompany === company;
            return (
              <Link
                key={company}
                href={isActive ? "/practice" : `/practice?company=${encodeURIComponent(company)}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 border transition-all text-sm font-semibold",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-700"
                )}
              >
                {company}
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                )}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <Card className="!py-4 !px-5">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Module
            </label>
            <select
              name="module"
              defaultValue={filterModule}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Difficulty
            </label>
            <select
              name="difficulty"
              defaultValue={filterDifficulty}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[130px]"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </label>
            <select
              name="status"
              defaultValue={filterStatus}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[140px]"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {filterCompany && (
            <input type="hidden" name="company" value={filterCompany} />
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Filter
          </button>
          {(filterModule || filterDifficulty || filterStatus || filterCompany) && (
            <Link
              href="/practice"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {/* ── Problem list ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {filtered.length} problem{filtered.length !== 1 ? "s" : ""}
            {filterModule || filterDifficulty || filterStatus || filterCompany ? " (filtered)" : ""}
          </h2>
          {filterCompany && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {filterCompany} problems
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              No problems match your filters.
            </p>
            <Link
              href="/practice"
              className="mt-2 inline-flex text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          filtered.map((problem) => {
            const attempt = problem.attempts[0] ?? null;
            const status = attempt?.status ?? "NotStarted";
            const confidence = attempt?.confidenceScore ?? 0;
            const hintLevel = attempt?.hintUsedLevel ?? 0;

            // Parse company tags
            let problemCompanies: string[] = [];
            try {
              problemCompanies = JSON.parse(problem.companies || "[]") as string[];
            } catch {}
            const hasTargetCompany = problemCompanies.some((c) => TARGET_COMPANIES.includes(c));

            return (
              <Link
                key={problem.id}
                href={`/practice/${problem.id}`}
                className="group block bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          getDifficultyColor(problem.difficulty)
                        )}
                      >
                        {problem.difficulty}
                      </span>
                      <Badge className={getStatusColor(status)} size="sm">
                        {status}
                      </Badge>
                      {confidence > 0 && (
                        <Badge
                          variant={
                            confidence >= 70
                              ? "success"
                              : confidence >= 40
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {confidence}% conf.
                        </Badge>
                      )}
                      {hintLevel > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          <Lightbulb className="w-3 h-3" />
                          Hint {hintLevel}
                        </span>
                      )}
                      {attempt?.mistakeType && attempt.mistakeType !== "" && (
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {attempt.mistakeType}
                        </span>
                      )}
                      {hasTargetCompany && problemCompanies.filter((c) => TARGET_COMPANIES.includes(c)).map((c) => (
                        <span key={c} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      {problem.title}
                    </h3>

                    {/* Learning objective */}
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                      {problem.learningObjective}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">{problem.module.name}</p>
                      {problem.source && (
                        <p className="text-xs text-slate-300 mt-0.5">{problem.source}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>

                {/* Bottom row for mobile */}
                <div className="mt-2 sm:hidden text-xs text-slate-400">
                  {problem.module.name}
                  {problem.source && ` · ${problem.source}`}
                </div>

                {/* Status indicator strip */}
                {status === "Retry" && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <RefreshCw className="w-3 h-3" />
                    Marked for retry
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
