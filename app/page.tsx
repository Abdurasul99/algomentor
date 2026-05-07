import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateMentorRecommendations, computeInterviewReadiness } from "@/lib/mentor";
import MentorPanel from "@/components/ui/MentorPanel";
import ProgressBar from "@/components/ui/ProgressBar";
import LeetcodeHistory from "@/components/dashboard/LeetcodeHistory";
import Link from "next/link";
import {
  BookOpen, CheckCircle, Clock, AlertCircle,
  ArrowRight, Zap, Brain, MessageSquare,
  Code2, ChevronRight, Sparkles, Trophy, Target,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── Company SVG logos ────────────────────────────────────────────────────────

function GoogleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.2 22.56 15.44 22.56 12.25z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MetaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.001 13.726c0 .85.192 1.51.56 1.976.368.467.89.7 1.565.7.716 0 1.38-.22 2.11-1.012.546-.594 1.1-1.514 1.756-2.748l-.795-1.362c-.53.92-1.004 1.617-1.404 2.075-.415.477-.734.654-1.022.654-.29 0-.498-.124-.638-.38-.14-.256-.21-.614-.21-1.073 0-.64.122-1.334.363-2.068.241-.735.572-1.375 1-1.92A1.97 1.97 0 0 1 6.469 9c.438 0 .8.17 1.1.528.297.359.545.92.748 1.68l.956-.534c-.228-.964-.58-1.72-1.068-2.245-.488-.526-1.092-.785-1.8-.785-.8 0-1.508.298-2.11.902-.603.603-1.065 1.42-1.387 2.44-.31 1.006-.462 2.04-.462 3.074-.035.52.023 1.098.018 1.666z" fill="#0081FB"/>
      <path d="M9.337 9.13c-.413-.567-.876-.9-1.456-.9-.41 0-.78.19-1.1.527-.317.337-.577.822-.78 1.456L7 11.28c.153-.517.335-.907.537-1.167.2-.26.42-.387.65-.387.338 0 .655.22.956.672.3.452.613 1.167.948 2.17l.372 1.11.373 1.11c.527 1.53 1.04 2.618 1.54 3.255.5.637 1.085.957 1.755.957.722 0 1.39-.3 2.004-.91.614-.61 1.107-1.497 1.466-2.67l-.976-.418c-.307.89-.64 1.543-1.002 1.958-.363.415-.74.626-1.133.626-.357 0-.68-.193-1.003-.588-.323-.394-.69-1.09-1.11-2.07l-.36-.865-.378-.883c-.37-.848-.716-1.473-1.1-2.04z" fill="#0081FB"/>
      <path d="M16.956 8.23c-.666 0-1.292.264-1.872.793-.58.53-1.094 1.31-1.535 2.35l.956.414c.335-.77.69-1.34 1.05-1.7.36-.36.718-.534 1.07-.534.344 0 .608.136.803.412.195.276.296.664.296 1.16 0 .605-.11 1.278-.32 2.01-.21.73-.5 1.38-.864 1.95-.363.57-.757.855-1.177.855-.285 0-.536-.13-.77-.4-.234-.27-.465-.72-.7-1.36l-.936.478c.272.82.622 1.44 1.063 1.863.44.422.94.633 1.496.633.743 0 1.43-.3 2.065-.906.634-.606 1.136-1.447 1.507-2.52.37-1.07.554-2.15.554-3.22 0-.907-.194-1.618-.58-2.138-.387-.52-.91-.84-1.573-.84h-.033z" fill="#0081FB"/>
    </svg>
  );
}

function AmazonLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.74 10.83c-.19.37-.5.56-.93.56a.86.86 0 0 1-.74-.37c-.18-.25-.27-.6-.27-1.04 0-.45.1-.82.3-1.1.2-.27.47-.41.83-.41.35 0 .62.13.8.38.19.26.28.63.28 1.1 0 .43-.09.8-.27 1.08m1.57-2.34c-.28-.4-.63-.7-1.06-.9-.43-.2-.9-.3-1.43-.3-.51 0-.97.1-1.37.3-.41.2-.73.5-.97.9-.24.4-.36.88-.36 1.43s.12 1.04.36 1.45c.24.41.57.72.98.93.41.21.88.31 1.4.31.52 0 .99-.1 1.4-.31.41-.21.73-.52.97-.93.24-.41.36-.9.36-1.45 0-.55-.09-1.02-.28-1.43m2.95 4.45c-.38.27-.92.4-1.64.38-.23 0-.46-.02-.7-.05l-.3-.05v-.4c.27.05.54.08.82.08.47 0 .82-.08 1.03-.25.21-.17.32-.43.32-.79V11.6h-.52v-.42h1.04v1.28c0 .6-.19 1.05-.55 1.32.5-.56.5-.56.5-.54M7.03 11.2c0 .43-.14.77-.43 1.02-.29.25-.68.38-1.18.38s-.87-.11-1.15-.32v-.48c.16.11.33.2.5.26.18.06.37.09.56.09.3 0 .54-.07.7-.2.17-.14.25-.33.25-.58 0-.22-.07-.4-.22-.54-.15-.14-.41-.28-.79-.43-.4-.16-.7-.33-.87-.53a.97.97 0 0 1-.27-.7c0-.4.13-.71.4-.93.27-.22.62-.33 1.07-.33.42 0 .82.09 1.18.27l-.17.4a2.22 2.22 0 0 0-.99-.25c-.27 0-.48.06-.63.19a.6.6 0 0 0-.22.48c0 .22.07.4.21.53.14.13.4.28.77.43.43.18.74.36.92.56.18.2.27.44.27.72M3.86 9.08H2.24L2 9.7H1.54l1.47-3.74h.47L4.97 9.7H4.5l-.23-.62H3.86zm-.13-.4-.66-1.8-.67 1.8h1.33zm17.16 4.95C18.5 15.18 15.5 16.29 12 16.29c-4.7 0-8.5-1.5-11.4-3.6-.24-.17-.02-.4.26-.27C3.8 14.07 7.73 15 12 15c3 0 6.3-.62 9.3-1.88.46-.2.85.3.39.61" fill="#FF9900"/>
    </svg>
  );
}

function AppleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-slate-800">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.02 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.36 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
    </svg>
  );
}

function MicrosoftLogo({ size = 28 }: { size?: number }) {
  const s = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width={s} height={s} fill="#F25022"/>
      <rect x={13} y="1"  width={s} height={s} fill="#7FBA00"/>
      <rect x="1"  y={13} width={s} height={s} fill="#00A4EF"/>
      <rect x={13} y={13} width={s} height={s} fill="#FFB900"/>
    </svg>
  );
}

function NetflixLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2h3.5l3.5 9.5V2H15v20h-3.5L8 12.3V22H5V2z" fill="#E50914"/>
      <path d="M14 2h3v20h-3V2z" fill="#B20710"/>
    </svg>
  );
}

const COMPANY_META: Record<string, { Logo: React.FC<{ size?: number }>; color: string; bg: string; border: string }> = {
  Google:    { Logo: GoogleLogo,    color: "#4285F4", bg: "#EFF6FF", border: "#BFDBFE" },
  Meta:      { Logo: MetaLogo,      color: "#0081FB", bg: "#EFF6FF", border: "#BFDBFE" },
  Amazon:    { Logo: AmazonLogo,    color: "#FF9900", bg: "#FFFBEB", border: "#FDE68A" },
  Apple:     { Logo: AppleLogo,     color: "#1D1D1F", bg: "#F8FAFC", border: "#E2E8F0" },
  Microsoft: { Logo: MicrosoftLogo, color: "#00A4EF", bg: "#F0F9FF", border: "#BAE6FD" },
  Netflix:   { Logo: NetflixLogo,   color: "#E50914", bg: "#FFF1F2", border: "#FECDD3" },
};

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const [modules, leetcodeProfile] = await Promise.all([
    prisma.module.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        moduleProgress: { where: { userId } },
        practiceProblems: {
          include: {
            attempts: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.leetCodeProfile.findFirst({ where: { userId } }).catch(() => null),
  ]);

  const allAttempts = await prisma.problemAttempt.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 5,
    include: { problem: { select: { title: true, difficulty: true } } },
  });

  const recentQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 5,
    include: { question: { include: { module: { select: { name: true } } } } },
  });

  const allProblemAttempts = await prisma.problemAttempt.findMany({
    where: { userId }, select: { status: true, practiceProblemId: true },
  });

  const allQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId }, select: { isCorrect: true },
  });

  const now = new Date();
  const totalProblems = modules.reduce((s, m) => s + m.practiceProblems.length, 0);
  const solved = allProblemAttempts.filter(a => a.status === "Solved" || a.status === "Mastered").length;

  const modulesInProgress = modules.filter(m => {
    const p = m.moduleProgress[0];
    return p && (p.status === "InProgress" || p.status === "Completed" || p.status === "Mastered");
  }).length;

  const overdueReviews = modules.filter(m => {
    const due = m.moduleProgress[0]?.reviewDueDate;
    return due && new Date(due) < new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }).length;

  const startedMods = modules.filter(m => m.moduleProgress[0] && m.moduleProgress[0].confidenceAverage > 0);
  const avgConfidence = startedMods.length > 0
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

  const quizAccuracy = allQuizAttempts.length > 0
    ? Math.round((allQuizAttempts.filter(a => a.isCorrect).length / allQuizAttempts.length) * 100)
    : 0;

  const hintDeps = startedMods.map(m => m.moduleProgress[0]?.hintDependencyScore ?? 0);
  const hintAvg = hintDeps.length > 0 ? hintDeps.reduce((a, b) => a + b, 0) / hintDeps.length : 0;

  const interviewReadiness = computeInterviewReadiness(
    modules.map(m => ({ ...m, moduleProgress: m.moduleProgress[0] ?? null }))
  );

  const mentorRecs = generateMentorRecommendations({
    modules: modules.map(m => ({ ...m, moduleProgress: m.moduleProgress[0] ?? null })),
    totalProblems, solvedProblems: solved, dueReviews: 0, overdueReviews,
    averageConfidence: avgConfidence, recentQuizAccuracy: quizAccuracy, hintDependencyAvg: hintAvg,
  });

  const allProblems = await prisma.practiceProblem.findMany({ select: { id: true, companies: true } });
  const solvedProblemIds = new Set(
    allProblemAttempts.filter(a => a.status === "Solved" || a.status === "Mastered").map(a => a.practiceProblemId)
  );

  const targetCompanies = ["Google", "Meta", "Amazon", "Apple", "Microsoft"];
  const companyCounts: Record<string, number> = {};
  for (const company of targetCompanies) {
    companyCounts[company] = allProblems.filter(p => {
      try {
        return (JSON.parse(p.companies || "[]") as string[]).includes(company) && !solvedProblemIds.has(p.id);
      } catch { return false; }
    }).length;
  }

  return {
    modules, totalProblems, solved, modulesInProgress, overdueReviews,
    weakest, strongest, interviewReadiness, mentorRecs, quizAccuracy,
    recentProblemAttempts: allAttempts, recentQuizAttempts, leetcodeProfile, companyCounts,
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";
  const data = await getDashboardData(user.id);
  const lc = data.leetcodeProfile;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Overdue banner */}
      {data.overdueReviews > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            <strong>{data.overdueReviews} overdue review{data.overdueReviews > 1 ? "s" : ""}</strong> waiting — keep your retention strong.
          </p>
          <Link href="/review" className="ml-auto text-xs font-bold text-amber-700 border border-amber-300 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap">
            Review Now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a2744 100%)",
          boxShadow: "0 20px 60px -10px rgba(15,23,42,0.4)",
        }}
      >
        {/* Top section */}
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">Active Session</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
            Welcome back,{" "}
            <span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {firstName.toUpperCase()}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Keep the momentum — every session counts.</p>
        </div>

        {/* LeetCode stats strip */}
        {lc ? (
          <div className="mx-5 mb-5 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* LeetCode header row */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
              {/* LeetCode logo */}
              <svg width="18" height="18" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7 36.2c-1.2 1.3-2.9 2-4.7 2H17.5c-1.8 0-3.5-.7-4.7-2L6.5 29.4c-1.2-1.3-1.2-3.3 0-4.6l6.3-6.8c1.2-1.3 2.9-2 4.7-2H32c1.8 0 3.5.7 4.7 2l6.3 6.8c1.2 1.3 1.2 3.3 0 4.6l-6.3 6.8z" fill="#FFA116"/>
                <path d="M21.5 12.5l-9 9.5M21.5 37.5l-9-9.5" stroke="#FFA116" strokeWidth="3" strokeLinecap="round"/>
                <rect x="20" y="23" width="16" height="4" rx="2" fill="white" opacity="0.9"/>
              </svg>
              <span className="text-xs font-bold text-slate-300">LeetCode</span>
              <span className="text-xs text-slate-500 ml-1">· synced</span>
              {lc.username && (
                <span className="text-xs text-slate-500 font-mono">@{lc.username}</span>
              )}
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="flex flex-col items-center py-4 px-3">
                <span className="text-2xl font-black text-white">{lc.totalSolved ?? 0}</span>
                <span className="text-slate-400 text-xs mt-0.5 font-medium">Total Solved</span>
              </div>
              <div className="flex flex-col items-center py-4 px-3">
                <span className="text-2xl font-black" style={{ color: "#4ade80" }}>{lc.easySolved ?? 0}</span>
                <span className="text-slate-400 text-xs mt-0.5 font-medium">Easy</span>
              </div>
              <div className="flex flex-col items-center py-4 px-3">
                <span className="text-2xl font-black" style={{ color: "#fb923c" }}>{lc.mediumSolved ?? 0}</span>
                <span className="text-slate-400 text-xs mt-0.5 font-medium">Medium</span>
              </div>
              <div className="flex flex-col items-center py-4 px-3">
                <span className="text-2xl font-black" style={{ color: "#f87171" }}>{lc.hardSolved ?? 0}</span>
                <span className="text-slate-400 text-xs mt-0.5 font-medium">Hard</span>
              </div>
              {(lc.contestRating ?? 0) > 0 ? (
                <div className="flex flex-col items-center py-4 px-3">
                  <span className="text-2xl font-black" style={{ color: "#fbbf24" }}>{Math.round(lc.contestRating!)}</span>
                  <span className="text-slate-400 text-xs mt-0.5 font-medium">Contest Rating</span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 px-3">
                  <span className="text-2xl font-black text-slate-600">—</span>
                  <span className="text-slate-500 text-xs mt-0.5 font-medium">Contest Rating</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-5 mb-5 rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg width="20" height="20" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7 36.2c-1.2 1.3-2.9 2-4.7 2H17.5c-1.8 0-3.5-.7-4.7-2L6.5 29.4c-1.2-1.3-1.2-3.3 0-4.6l6.3-6.8c1.2-1.3 2.9-2 4.7-2H32c1.8 0 3.5.7 4.7 2l6.3 6.8c1.2 1.3 1.2 3.3 0 4.6l-6.3 6.8z" fill="#FFA116" opacity="0.5"/>
              <rect x="20" y="23" width="16" height="4" rx="2" fill="white" opacity="0.4"/>
            </svg>
            <div>
              <p className="text-slate-400 text-sm font-medium">LeetCode not synced</p>
              <p className="text-slate-600 text-xs">Go to Settings to connect your LeetCode account</p>
            </div>
            <Link href="/settings" className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
              Connect →
            </Link>
          </div>
        )}
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Problems Solved", value: data.solved,
            sub: `of ${data.totalProblems} total`,
            accent: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle className="w-5 h-5" style={{ color: "#16a34a" }} />,
          },
          {
            label: "Quiz Accuracy", value: `${data.quizAccuracy}%`,
            sub: "correct answers",
            accent: "#7c3aed", bg: "#faf5ff", icon: <Brain className="w-5 h-5" style={{ color: "#7c3aed" }} />,
          },
          {
            label: "Modules Active", value: data.modulesInProgress,
            sub: "in progress / done",
            accent: "#2563eb", bg: "#eff6ff", icon: <BookOpen className="w-5 h-5" style={{ color: "#2563eb" }} />,
          },
          {
            label: "Interview Readiness", value: `${data.interviewReadiness}%`,
            sub: "overall score",
            accent: "#dc2626", bg: "#fff1f2", icon: <Zap className="w-5 h-5" style={{ color: "#dc2626" }} />,
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{card.label}</p>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full overflow-hidden bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{
                width: typeof card.value === "string" && card.value.endsWith("%")
                  ? card.value
                  : `${Math.min(100, (Number(card.value) / (i === 0 ? data.totalProblems || 1 : 100)) * 100)}%`,
                background: card.accent,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── FAANG COMPANIES ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Target Companies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Unsolved problems by company</p>
          </div>
          <Link href="/practice" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(data.companyCounts).map(([company, count]) => {
            const meta = COMPANY_META[company];
            if (!meta) return null;
            const { Logo, bg, border } = meta;
            return (
              <Link
                key={company}
                href={`/practice?company=${encodeURIComponent(company)}`}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:shadow-md transition-all group"
                style={{ background: bg, borderColor: border }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
                  style={{ background: "white", border: `1.5px solid ${border}` }}
                >
                  <Logo size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">{company}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: meta.color }}>
                    {count} unsolved
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── AI MENTOR ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid #2d3748",
          boxShadow: "0 4px 20px rgba(15,23,42,0.2)",
        }}
      >
        <div className="flex items-start gap-4 flex-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">AI Interview Mentor</h2>
            <p className="text-slate-400 text-sm mt-0.5">Personalized guidance, problems, and analysis.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["What should I study today?", "Give me a Google problem", "Analyze my weak areas"].map(q => (
                <Link
                  key={q}
                  href={`/mentor?q=${encodeURIComponent(q)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8" }}
                >
                  <ChevronRight className="w-3 h-3 text-indigo-400" />
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <Link
          href="/mentor"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", boxShadow: "0 4px 14px rgba(129,140,248,0.35)" }}
        >
          <MessageSquare className="w-4 h-4" />
          Open Mentor
        </Link>
      </div>

      {/* ── RECOMMENDATIONS + WEAK/STRONG ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MentorPanel recommendations={data.mentorRecs} />
        </div>
        <div className="space-y-4">
          {data.weakest?.moduleProgress[0] && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Needs Attention</p>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{data.weakest.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Mastery: {Math.round(data.weakest.moduleProgress[0].masteryScore)}%</p>
                  <ProgressBar value={data.weakest.moduleProgress[0].masteryScore} className="mt-2" />
                </div>
              </div>
              <Link href={`/modules/${data.weakest.slug}`} className="mt-3 text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                Go to module <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {data.strongest?.moduleProgress[0] && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Strongest Pattern</p>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{data.strongest.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Mastery: {Math.round(data.strongest.moduleProgress[0].masteryScore)}%</p>
                  <ProgressBar value={data.strongest.moduleProgress[0].masteryScore} className="mt-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODULE PROGRESS ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Module Progress</h2>
          <Link href="/path" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
            View Learning Path <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {data.modules.map(mod => {
            const p = mod.moduleProgress[0];
            const mastery = p?.masteryScore ?? 0;
            const status = p?.status ?? "NotStarted";
            return (
              <Link
                key={mod.id}
                href={`/modules/${mod.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                  status === "NotStarted" ? "bg-slate-100 text-slate-400" :
                  mastery >= 80 ? "bg-emerald-100 text-emerald-700" :
                  mastery >= 40 ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                )}>
                  {mod.orderIndex}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{mod.name}</p>
                    <span className="text-xs text-slate-400 shrink-0 font-medium">{Math.round(mastery)}%</span>
                  </div>
                  <ProgressBar value={mastery} size="sm" className="mt-1.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── RECENT ACTIVITY ──────────────────────────────────────────────────── */}
      {(data.recentProblemAttempts.length > 0 || data.recentQuizAttempts.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentProblemAttempts.map(attempt => (
              <div key={attempt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  attempt.status === "Solved" || attempt.status === "Mastered" ? "bg-emerald-50" : "bg-slate-50"
                )}>
                  <Code2 className={cn("w-3.5 h-3.5", attempt.status === "Solved" || attempt.status === "Mastered" ? "text-emerald-600" : "text-slate-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{attempt.problem.title}</p>
                  <p className="text-xs text-slate-400">{attempt.problem.difficulty} · {attempt.status}</p>
                </div>
                <span className="text-xs text-slate-300 shrink-0">{formatDate(attempt.createdAt)}</span>
              </div>
            ))}
            {data.recentQuizAttempts.map(attempt => (
              <div key={attempt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", attempt.isCorrect ? "bg-violet-50" : "bg-rose-50")}>
                  <Brain className={cn("w-3.5 h-3.5", attempt.isCorrect ? "text-violet-500" : "text-rose-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{attempt.question.prompt.slice(0, 60)}{attempt.question.prompt.length > 60 ? "…" : ""}</p>
                  <p className="text-xs text-slate-400">{attempt.question.module.name} · {attempt.isCorrect ? "Correct" : "Incorrect"}</p>
                </div>
                <span className="text-xs text-slate-300 shrink-0">{formatDate(attempt.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEETCODE HISTORY ─────────────────────────────────────────────────── */}
      <LeetcodeHistory />

      {/* ── QUICK LINKS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4">
        {[
          { href: "/modules",  label: "All Modules",   icon: BookOpen,  color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
          { href: "/quiz",     label: "Take a Quiz",   icon: Brain,     color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
          { href: "/review",   label: "Review Queue",  icon: Clock,     color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
          { href: "/training", label: "Training Plan", icon: Zap,       color: "#047857", bg: "#f0fdf4", border: "#a7f3d0" },
        ].map(({ href, label, icon: Icon, color, bg, border }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: bg, borderColor: border }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="font-bold text-sm text-slate-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
