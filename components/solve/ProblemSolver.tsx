"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Zap,
  Brain,
  CheckCircle,
  XCircle,
  Play,
  ExternalLink,
  Eye,
  Lightbulb,
  Clock,
  Video,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// Lazy-load the visual generator
const VisualGeneratorClient = dynamic(
  () => import("@/components/visual/VisualGeneratorClient"),
  { ssr: false, loading: () => <div className="h-48 bg-slate-50 rounded-xl animate-pulse" /> }
);

// ── Types ────────────────────────────────────────────────────────────────────

type Stage = "input" | "questioning" | "answered" | "solution";

interface MCQuestion {
  type: "MultipleChoice";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface FillQuestion {
  type: "FillInGap";
  question: string;
  answer: string;
  explanation: string;
}

interface TFQuestion {
  type: "TrueFalse";
  question: string;
  answer: boolean;
  explanation: string;
}

type Question = MCQuestion | FillQuestion | TFQuestion;

interface SolutionData {
  approach: string;
  keyInsight: string;
  timeComplexity: string;
  spaceComplexity: string;
  steps: string[];
}

interface AiResponse {
  questions: Question[];
  solution: SolutionData;
}

interface YoutubeLinkData {
  channel: string;
  title: string;
  url: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractLcNumber(title: string): number | null {
  const match = title.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : null;
}

function extractProblemName(title: string): string {
  return title.replace(/^\d+\.\s*/, "").trim();
}

function buildYoutubeLinks(problemTitle: string): YoutubeLinkData[] {
  const slug = extractProblemName(problemTitle).toLowerCase().replace(/\s+/g, "+");
  const full = problemTitle.toLowerCase().replace(/\s+/g, "+");
  return [
    {
      channel: "NeetCode",
      title: `${problemTitle} - LeetCode Solution`,
      url: `https://www.youtube.com/results?search_query=neetcode+${slug}`,
    },
    {
      channel: "Abdul Bari",
      title: `${extractProblemName(problemTitle)} Algorithm Explained`,
      url: `https://www.youtube.com/results?search_query=abdul+bari+${slug}`,
    },
    {
      channel: "Back To Back SWE",
      title: `${extractProblemName(problemTitle)} LeetCode`,
      url: `https://www.youtube.com/results?search_query=back+to+back+swe+${slug}`,
    },
    {
      channel: "Search All",
      title: `${problemTitle} LeetCode Solution`,
      url: `https://www.youtube.com/results?search_query=${full}+leetcode+solution+python`,
    },
  ];
}

const LOADING_MESSAGES = [
  "Analyzing your problem...",
  "Crafting understanding questions...",
  "Building solution walkthrough...",
  "Identifying key algorithmic insights...",
  "Finalizing your study session...",
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userName: string;
  leetcodeUsername?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProblemSolver({ userName }: Props) {
  const searchParams = useSearchParams();

  // Input state
  const [problemTitle, setProblemTitle] = useState(
    searchParams.get("problem") ?? ""
  );
  const [problemDesc, setProblemDesc] = useState(
    searchParams.get("description") ?? ""
  );

  // Stage state
  const [stage, setStage] = useState<Stage>("input");

  // AI data
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState("");

  // Answers tracking
  const [mcAnswer, setMcAnswer] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showVisual, setShowVisual] = useState(false);

  // Loading message cycling
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      let i = 0;
      setLoadingMsg(LOADING_MESSAGES[0]);
      intervalRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMsg(LOADING_MESSAGES[i]);
      }, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleAiHelp() {
    if (!problemTitle.trim() || !problemDesc.trim()) {
      setError("Please fill in both the problem title and description.");
      return;
    }
    setError("");
    setLoading(true);
    setShowFeedback(false);
    setMcAnswer(null);
    setFillAnswer("");
    setTfAnswer(null);

    try {
      const res = await fetch("/api/ai/problem-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: problemTitle.trim(),
          problemDescription: problemDesc.trim(),
        }),
      });

      const data = (await res.json()) as AiResponse & { error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      if (!data.questions || !data.solution) {
        throw new Error("Invalid AI response format.");
      }

      setAiData(data);
      setStage("questioning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function allAnswered(): boolean {
    return mcAnswer !== null && fillAnswer.trim().length > 0 && tfAnswer !== null;
  }

  function handleCheckAnswers() {
    if (!allAnswered()) return;
    setShowFeedback(true);
    setStage("answered");
  }

  function computeScore(): number {
    if (!aiData) return 0;
    const q = aiData.questions;
    let score = 0;

    const mc = q[0] as MCQuestion;
    if (mcAnswer === mc.correctIndex) score++;

    const fill = q[1] as FillQuestion;
    if (fillAnswer.trim().toLowerCase() === fill.answer.toLowerCase()) score++;

    const tf = q[2] as TFQuestion;
    if (tfAnswer === tf.answer) score++;

    return score;
  }

  function handleReset() {
    setStage("input");
    setAiData(null);
    setShowFeedback(false);
    setShowVisual(false);
    setMcAnswer(null);
    setFillAnswer("");
    setTfAnswer(null);
    setError("");
  }

  // ── Sub-renders ───────────────────────────────────────────────────────────

  const firstName = userName.split(" ")[0];
  const lcNumber = extractLcNumber(problemTitle);
  const problemName = extractProblemName(problemTitle);
  const youtubeLinks = buildYoutubeLinks(problemTitle || "LeetCode Problem");

  // ── Left Panel ────────────────────────────────────────────────────────────

  const LeftPanel = (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">Problem Solver</h1>
          <p className="text-xs text-slate-500">Hi {firstName} — let's break it down</p>
        </div>
      </div>

      {/* Input fields — always shown */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Problem Title
          </label>
          <input
            type="text"
            value={problemTitle}
            onChange={(e) => setProblemTitle(e.target.value)}
            placeholder='e.g. "57. Insert Interval"'
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Problem Description
          </label>
          <textarea
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            placeholder="Paste the full problem description here — constraints, examples, everything..."
            rows={9}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y min-h-[200px]"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleAiHelp}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI Help
          </>
        )}
      </button>

      {/* Reference card when past input stage */}
      {stage !== "input" && problemTitle && (
        <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-indigo-600 mb-0.5">Solving</p>
          <p className="font-bold text-slate-900 text-sm">{problemTitle}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Start new problem
          </button>
        </div>
      )}
    </div>
  );

  // ── Right Panel: EMPTY STATE ──────────────────────────────────────────────

  const EmptyState = (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="font-bold text-slate-900 text-lg">Ready to help you solve it</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            Paste a problem on the left and click AI Help to start your study session.
          </p>
        </div>

        <div className="grid gap-3 w-full max-w-sm">
          {[
            {
              icon: Brain,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              label: "Understanding Check",
              desc: "AI quizzes you on the problem before showing the solution",
            },
            {
              icon: Video,
              color: "text-red-600",
              bg: "bg-red-50",
              label: "YouTube Solutions",
              desc: "Find the best video explanations from top channels",
            },
            {
              icon: Eye,
              color: "text-purple-600",
              bg: "bg-purple-50",
              label: "Visual Walkthrough",
              desc: "Step-by-step visual explanation generated by AI",
            },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm"
            >
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Right Panel: LOADING ──────────────────────────────────────────────────

  const LoadingState = (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-slate-800 text-lg">AI Mentor is thinking...</h3>
        <p className="text-sm text-slate-500 mt-1">Crafting your personalized study session</p>
      </div>
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-5 py-2.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
        <span className="text-sm font-medium text-indigo-700 min-w-[220px] text-center">
          {loadingMsg}
        </span>
      </div>
    </div>
  );

  // ── Right Panel: QUESTIONING ──────────────────────────────────────────────

  const QuestioningState = aiData ? (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Do you understand this problem?</h2>
          <p className="text-xs text-slate-500">Answer all 3 questions, then check your understanding</p>
        </div>
      </div>

      {/* Q1: Multiple Choice */}
      {(() => {
        const q = aiData.questions[0] as MCQuestion;
        return (
          <QuestionCard number={1} label="Multiple Choice">
            <p className="text-sm font-medium text-slate-800 mb-3">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setMcAnswer(i)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    mcAnswer === i
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </QuestionCard>
        );
      })()}

      {/* Q2: Fill in the Gap */}
      {(() => {
        const q = aiData.questions[1] as FillQuestion;
        return (
          <QuestionCard number={2} label="Fill in the Gap">
            <p className="text-sm font-medium text-slate-800 mb-3">{q.question}</p>
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </QuestionCard>
        );
      })()}

      {/* Q3: True/False */}
      {(() => {
        const q = aiData.questions[2] as TFQuestion;
        return (
          <QuestionCard number={3} label="True / False">
            <p className="text-sm font-medium text-slate-800 mb-3">{q.question}</p>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setTfAnswer(val)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    tfAnswer === val
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  {val ? "True" : "False"}
                </button>
              ))}
            </div>
          </QuestionCard>
        );
      })()}

      <button
        onClick={handleCheckAnswers}
        disabled={!allAnswered()}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm shadow-indigo-200"
      >
        <CheckCircle className="w-4 h-4" />
        Check My Understanding
      </button>
    </div>
  ) : null;

  // ── Right Panel: ANSWERED ─────────────────────────────────────────────────

  const AnsweredState = aiData && showFeedback ? (() => {
    const score = computeScore();
    const mc = aiData.questions[0] as MCQuestion;
    const fill = aiData.questions[1] as FillQuestion;
    const tf = aiData.questions[2] as TFQuestion;

    const mcCorrect = mcAnswer === mc.correctIndex;
    const fillCorrect = fillAnswer.trim().toLowerCase() === fill.answer.toLowerCase();
    const tfCorrect = tfAnswer === tf.answer;

    const scoreLabel =
      score === 3
        ? "Excellent understanding!"
        : score === 2
        ? "Good understanding!"
        : score === 1
        ? "Let's review the solution"
        : "Let's walk through this together";

    return (
      <div className="flex flex-col gap-5">
        {/* Score banner */}
        <div className={`rounded-xl px-5 py-4 flex items-center gap-4 ${
          score >= 2 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
        }`}>
          <div className={`text-3xl font-black ${score >= 2 ? "text-green-700" : "text-amber-700"}`}>
            {score}/3
          </div>
          <div>
            <p className={`font-bold text-sm ${score >= 2 ? "text-green-800" : "text-amber-800"}`}>
              {scoreLabel}
            </p>
            <p className={`text-xs mt-0.5 ${score >= 2 ? "text-green-600" : "text-amber-600"}`}>
              {score >= 2 ? "You have a strong grasp of the problem." : "Check the feedback below and study the solution."}
            </p>
          </div>
        </div>

        {/* Q1 feedback */}
        <FeedbackCard
          number={1}
          correct={mcCorrect}
          question={mc.question}
          userAnswer={mc.options[mcAnswer ?? 0]}
          correctAnswer={mc.options[mc.correctIndex]}
          explanation={mc.explanation}
        />

        {/* Q2 feedback */}
        <FeedbackCard
          number={2}
          correct={fillCorrect}
          question={fill.question}
          userAnswer={fillAnswer}
          correctAnswer={fill.answer}
          explanation={fill.explanation}
        />

        {/* Q3 feedback */}
        <FeedbackCard
          number={3}
          correct={tfCorrect}
          question={tf.question}
          userAnswer={tfAnswer === null ? "—" : tfAnswer ? "True" : "False"}
          correctAnswer={tf.answer ? "True" : "False"}
          explanation={tf.explanation}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStage("input")}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-all text-sm"
          >
            <Brain className="w-4 h-4" />
            Try to Solve
          </button>
          <button
            onClick={() => setStage("solution")}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-sm shadow-indigo-200"
          >
            <Eye className="w-4 h-4" />
            Show Solution
          </button>
        </div>
      </div>
    );
  })() : null;

  // ── Right Panel: SOLUTION ─────────────────────────────────────────────────

  const SolutionState = aiData ? (
    <div className="flex flex-col gap-6">
      {/* Section A: Key Approach */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="font-bold text-slate-900">Key Approach</h2>
        </div>

        {/* Key insight callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-bold text-amber-700 mb-1">Key Insight</p>
          <p className="text-sm text-amber-900">{aiData.solution.keyInsight}</p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {aiData.solution.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Complexity */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Time</p>
              <p className="text-sm font-bold text-slate-800">{aiData.solution.timeComplexity}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Space</p>
              <p className="text-sm font-bold text-slate-800">{aiData.solution.spaceComplexity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: YouTube */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="font-bold text-slate-900">Watch on YouTube</h2>
        </div>
        <div className="space-y-2">
          {youtubeLinks.map((link) => (
            <a
              key={link.channel}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl px-4 py-3 transition-all group"
            >
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-red-700">
                  {link.channel}
                </p>
                <p className="text-xs text-slate-500 truncate">{link.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-red-500 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Section C: Visual Explanation */}
      {lcNumber && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-bold text-slate-900">Visual Explanation</h2>
          </div>

          {!showVisual ? (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-200">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1">
                Visual for Problem #{lcNumber}: {problemName}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Generate a step-by-step animated walkthrough with code highlights.
              </p>
              <button
                onClick={() => setShowVisual(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-md shadow-indigo-200"
              >
                <Sparkles className="w-4 h-4" />
                Generate Visual
              </button>
            </div>
          ) : (
            <div className="border border-purple-100 rounded-2xl overflow-hidden">
              <VisualGeneratorClient
                lcNumber={lcNumber}
                problemTitle={problemName}
              />
            </div>
          )}
        </div>
      )}

      {/* Start over */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium py-2 rounded-xl hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Solve a different problem
        </button>
      </div>
    </div>
  ) : null;

  // ── Right panel content selector ──────────────────────────────────────────
  let rightContent: React.ReactNode;
  if (loading) {
    rightContent = LoadingState;
  } else if (stage === "input") {
    rightContent = EmptyState;
  } else if (stage === "questioning") {
    rightContent = QuestioningState;
  } else if (stage === "answered") {
    rightContent = AnsweredState;
  } else {
    rightContent = SolutionState;
  }

  // ── Full layout ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Left panel */}
      <div className="lg:w-[420px] xl:w-[460px] shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:sticky lg:top-6">
          {LeftPanel}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[500px]">
          {rightContent}
        </div>
      </div>
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function QuestionCard({
  number,
  label,
  children,
}: {
  number: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function FeedbackCard({
  number,
  correct,
  question,
  userAnswer,
  correctAnswer,
  explanation,
}: {
  number: number;
  correct: boolean;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        correct
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          correct ? "bg-green-100" : "bg-red-100"
        }`}>
          {correct ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Q{number}
            </span>
            <span className={`text-xs font-bold ${correct ? "text-green-700" : "text-red-600"}`}>
              {correct ? "Correct" : "Incorrect"}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 mb-2">{question}</p>
          {!correct && (
            <div className="bg-white/70 rounded-lg px-3 py-2 mb-2 text-xs">
              <span className="text-red-700 font-semibold">Your answer: </span>
              <span className="text-slate-700">{userAnswer}</span>
              <br />
              <span className="text-green-700 font-semibold">Correct answer: </span>
              <span className="text-slate-700">{correctAnswer}</span>
            </div>
          )}
          <p className="text-xs text-slate-600 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
