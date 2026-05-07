import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateMentorRecommendations, computeInterviewReadiness } from "@/lib/mentor";
import MentorPanel from "@/components/ui/MentorPanel";
import ProgressBar from "@/components/ui/ProgressBar";
import StatCard from "@/components/ui/StatCard";
import LeetcodeHistory from "@/components/dashboard/LeetcodeHistory";
import Link from "next/link";
import {
  BookOpen, CheckCircle, Trophy, Clock, AlertCircle,
  TrendingUp, ArrowRight, Target, Zap, Brain, MessageSquare,
  Code2, ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  const [modules, leetcodeProfile] = await Promise.all([
    prisma.module.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        moduleProgress: {
          where: { userId },
        },
        practiceProblems: {
          include: {
            attempts: {
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.leetCodeProfile.findFirst({ where: { userId } }).catch(() => null),
  ]);

  const allAttempts = await prisma.problemAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      problem: { select: { title: true, difficulty: true } },
    },
  });

  const recentQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      question: { include: { module: { select: { name: true } } } },
    },
  });

  const allProblemAttempts = await prisma.problemAttempt.findMany({
    where: { userId },
    select: { status: true, practiceProblemId: true },
  });

  const allQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    select: { isCorrect: true },
  });

  const now = new Date();
  const totalProblems = modules.reduce((s, m) => s + m.practiceProblems.length, 0);
  const solved = allProblemAttempts.filter((a) => a.status === "Solved" || a.status === "Mastered").length;

  const modulesInProgress = modules.filter((m) => {
    const p = m.moduleProgress[0];
    return p && (p.status === "InProgress" || p.status === "Completed" || p.status === "Mastered");
  }).length;

  const overdueReviews = modules.filter((m) => {
    const due = m.moduleProgress[0]?.reviewDueDate;
    return due && new Date(due) < new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }).length;

  const startedMods = modules.filter((m) => m.moduleProgress[0] && m.moduleProgress[0].confidenceAverage > 0);
  const avgConfidence =
    startedMods.length > 0
      ? startedMods.reduce((s, m) => s + (m.moduleProgress[0]?.confidenceAverage ?? 0), 0) / startedMods.length
      : 0;

  const weakest = startedMods.reduce<(typeof modules)[0] | null>((prev, curr) => {
    if (!prev) return curr;
    return (curr.moduleProgress[0]?.masteryScore ?? 0) < (prev.moduleProgress[0]?.masteryScore ?? 0) ? curr : prev;
  }, null);

  const strongest = startedMods.reduce<(typeof modules)[0] | null>((prev, curr) => {
    if (!prev) return curr;
    return (curr.moduleProgress[0]?.masteryScore ?? 0) > (prev.moduleProgress[0]?.masteryScore ?? 0) ? curr : prev;
  }, null);

  const quizAccuracy =
    allQuizAttempts.length > 0
      ? Math.round((allQuizAttempts.filter((a) => a.isCorrect).length / allQuizAttempts.length) * 100)
      : 0;

  const hintDeps = startedMods.map((m) => m.moduleProgress[0]?.hintDependencyScore ?? 0);
  const hintAvg = hintDeps.length > 0 ? hintDeps.reduce((a, b) => a + b, 0) / hintDeps.length : 0;

  const interviewReadiness = computeInterviewReadiness(
    modules.map((m) => ({ ...m, moduleProgress: m.moduleProgress[0] ?? null }))
  );

  const mentorRecs = generateMentorRecommendations({
    modules: modules.map((m) => ({ ...m, moduleProgress: m.moduleProgress[0] ?? null })),
    totalProblems,
    solvedProblems: solved,
    dueReviews: 0,
    overdueReviews,
    averageConfidence: avgConfidence,
    recentQuizAccuracy: quizAccuracy,
    hintDependencyAvg: hintAvg,
  });

  // Company problem counts
  const allProblems = await prisma.practiceProblem.findMany({
    select: { id: true, companies: true },
  });

  const solvedProblemIds = new Set(
    allProblemAttempts
      .filter((a) => a.status === "Solved" || a.status === "Mastered")
      .map((a) => a.practiceProblemId)
  );

  const targetCompanies = ["Google", "Meta", "Amazon", "Apple", "Microsoft"];
  const companyCounts: Record<string, number> = {};
  for (const company of targetCompanies) {
    companyCounts[company] = allProblems.filter((p) => {
      try {
        const companies = JSON.parse(p.companies || "[]") as string[];
        return companies.includes(company) && !solvedProblemIds.has(p.id);
      } catch {
        return false;
      }
    }).length;
  }

  return {
    modules,
    totalProblems,
    solved,
    modulesInProgress,
    overdueReviews,
    weakest,
    strongest,
    interviewReadiness,
    mentorRecs,
    quizAccuracy,
    recentProblemAttempts: allAttempts,
    recentQuizAttempts,
    leetcodeProfile,
    companyCounts,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";
  const data = await getDashboardData(user.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {data.overdueReviews > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            You have <strong>{data.overdueReviews} overdue review{data.overdueReviews > 1 ? "s" : ""}</strong>.
            Clear your review queue to maintain long-term retention.
          </p>
          <Link href="/review" className="ml-auto text-sm font-semibold text-red-600 hover:underline whitespace-nowrap flex items-center gap-1">
            Review Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Personal Hero ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
            <p className="text-indigo-200 text-sm mt-1">Keep the momentum — every session counts.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-3xl font-black">{data.interviewReadiness}%</div>
              <div className="text-indigo-200 text-xs">Interview Ready</div>
            </div>
            <div className="w-20">
              <ProgressBar value={data.interviewReadiness} size="md" />
            </div>
          </div>
        </div>

        {/* LeetCode stats if synced */}
        {data.leetcodeProfile && (
          <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold">{data.leetcodeProfile.totalSolved ?? 0}</div>
              <div className="text-indigo-200 text-xs">Total Solved</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-300">{data.leetcodeProfile.easySolved ?? 0}</div>
              <div className="text-indigo-200 text-xs">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-300">{data.leetcodeProfile.mediumSolved ?? 0}</div>
              <div className="text-indigo-200 text-xs">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-300">{data.leetcodeProfile.hardSolved ?? 0}</div>
              <div className="text-indigo-200 text-xs">Hard</div>
            </div>
            {(data.leetcodeProfile.contestRating ?? 0) > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-amber-300">{Math.round(data.leetcodeProfile.contestRating)}</div>
                <div className="text-indigo-200 text-xs">Contest Rating</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stats Row (4 cards, no streak) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Problems Solved"
          value={data.solved}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle={`of ${data.totalProblems} total`}
        />
        <StatCard
          label="Quiz Accuracy"
          value={`${data.quizAccuracy}%`}
          icon={Brain}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="correct answers"
        />
        <StatCard
          label="Modules Active"
          value={data.modulesInProgress}
          icon={BookOpen}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          subtitle="in progress or done"
        />
        <StatCard
          label="Interview Readiness"
          value={`${data.interviewReadiness}%`}
          icon={Zap}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          subtitle="overall score"
        />
      </div>

      {/* ── AI Mentor Quick Access ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Talk to Your AI Mentor</h2>
            <p className="text-indigo-200 text-sm">Get personalized guidance, problems, and analysis.</p>
          </div>
          <Link
            href="/mentor"
            className="ml-auto inline-flex items-center gap-1.5 bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Open Mentor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "What should I study today?",
            "Give me a Google interview problem",
            "Analyze my weak areas",
          ].map((prompt) => (
            <Link
              key={prompt}
              href={`/mentor?q=${encodeURIComponent(prompt)}`}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />
              {prompt}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mentor Recommendations + Weak/Strong ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MentorPanel recommendations={data.mentorRecs} />
        </div>
        <div className="space-y-4">
          {data.weakest?.moduleProgress[0] && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Needs Attention</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{data.weakest.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mastery: {Math.round(data.weakest.moduleProgress[0].masteryScore)}%
                  </p>
                  <ProgressBar value={data.weakest.moduleProgress[0].masteryScore} className="mt-2" />
                </div>
              </div>
              <Link href={`/modules/${data.weakest.slug}`} className="mt-3 text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                Go to module <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {data.strongest?.moduleProgress[0] && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Strongest Pattern</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{data.strongest.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mastery: {Math.round(data.strongest.moduleProgress[0].masteryScore)}%
                  </p>
                  <ProgressBar value={data.strongest.moduleProgress[0].masteryScore} className="mt-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Company Problems Banner ── */}
      {Object.values(data.companyCounts).some((c) => c > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Problems from Your Target Companies
            </h2>
            <Link href="/practice" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5 flex flex-wrap gap-3">
            {Object.entries(data.companyCounts).map(([company, count]) => (
              <Link
                key={company}
                href={`/practice?company=${encodeURIComponent(company)}`}
                className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl px-4 py-2.5 transition-all"
              >
                <span className="font-semibold text-slate-800 text-sm">{company}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  {count} unsolved
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Module Progress ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Module Progress</h2>
          <Link href="/path" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
            View Learning Path <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.modules.map((mod) => {
            const p = mod.moduleProgress[0];
            const mastery = p?.masteryScore ?? 0;
            const status = p?.status ?? "NotStarted";
            return (
              <Link
                key={mod.id}
                href={`/modules/${mod.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                  status === "NotStarted" ? "bg-slate-100 text-slate-400" :
                  mastery >= 80 ? "bg-green-100 text-green-700" :
                  mastery >= 40 ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                )}>
                  {mod.orderIndex}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700">{mod.name}</p>
                    <span className="text-xs text-slate-500 shrink-0">{Math.round(mastery)}%</span>
                  </div>
                  <ProgressBar value={mastery} size="sm" className="mt-1.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {(data.recentProblemAttempts.length > 0 || data.recentQuizAttempts.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentProblemAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center gap-3 px-5 py-3">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  attempt.status === "Solved" || attempt.status === "Mastered" ? "bg-green-50" : "bg-slate-50"
                )}>
                  <Code2 className={cn("w-3.5 h-3.5", attempt.status === "Solved" || attempt.status === "Mastered" ? "text-green-600" : "text-slate-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{attempt.problem.title}</p>
                  <p className="text-xs text-slate-400">{attempt.problem.difficulty} · {attempt.status}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(attempt.createdAt)}</span>
              </div>
            ))}
            {data.recentQuizAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center gap-3 px-5 py-3">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  attempt.isCorrect ? "bg-purple-50" : "bg-red-50"
                )}>
                  <Brain className={cn("w-3.5 h-3.5", attempt.isCorrect ? "text-purple-600" : "text-red-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{attempt.question.prompt.slice(0, 60)}{attempt.question.prompt.length > 60 ? "…" : ""}</p>
                  <p className="text-xs text-slate-400">{attempt.question.module.name} · {attempt.isCorrect ? "Correct" : "Incorrect"}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(attempt.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LeetCode Recent Submissions ── */}
      <LeetcodeHistory />

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/modules", label: "All Modules", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100" },
          { href: "/quiz", label: "Take a Quiz", icon: Brain, color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
          { href: "/review", label: "Review Queue", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100" },
          { href: "/training", label: "Training Plan", icon: Zap, color: "text-green-600", bg: "bg-green-50 hover:bg-green-100" },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className={cn("flex items-center gap-3 p-4 rounded-xl border border-transparent hover:border-slate-200 transition-all", bg)}
          >
            <Icon className={cn("w-5 h-5", color)} />
            <span className="font-semibold text-sm text-slate-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
