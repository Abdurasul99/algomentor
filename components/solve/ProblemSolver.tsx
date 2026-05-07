"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Brain, Sparkles, CheckCircle, XCircle, Eye,
  RefreshCw, Video, Lightbulb, Clock, ChevronRight,
  ExternalLink, Search, Play, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatternVisualization } from "@/lib/visualizations";

// VisualGeneratorClient intentionally NOT loaded here — opens in /problems/[lcNumber] to avoid page crash

// ── Types ──────────────────────────────────────────────────────────────────────
type Stage = "input" | "loading" | "questions" | "answered" | "solution";
type Tab = "questions" | "solution" | "youtube" | "visual";

interface MCQuestion { type: "MultipleChoice"; question: string; options: string[]; correctIndex: number; explanation: string; }
interface FillQuestion { type: "FillInGap"; question: string; answer: string; explanation: string; }
interface TFQuestion { type: "TrueFalse"; question: string; answer: boolean; explanation: string; }
type Question = MCQuestion | FillQuestion | TFQuestion;

interface AiResponse {
  questions: Question[];
  solution: { keyInsight: string; steps: string[]; timeComplexity: string; spaceComplexity: string; };
  bigO?: { time: string; timeWhy: string; space: string; spaceWhy: string; optimizeNote: string; };
  bestApproach?: { name: string; pattern: string; why: string; whenToUse: string; };
  optimalSolution?: { language: string; code: string; lines: string[]; };
  alternativeApproach?: { applicable: boolean; name: string; description: string; timeComplexity: string; spaceComplexity: string; whenBetter: string; code?: string; tradeoff: string; };
  ru?: {
    questions?: Array<{ question?: string; options?: string[]; answer?: string; explanation?: string; }>;
    solution?: { keyInsight?: string; steps?: string[]; };
    bigO?: { timeWhy?: string; spaceWhy?: string; optimizeNote?: string; };
    bestApproach?: { name?: string; why?: string; whenToUse?: string; };
    optimalSolution?: { lines?: string[]; };
    alternativeApproach?: { description?: string; whenBetter?: string; tradeoff?: string; };
  };
}

interface VideoResult { id: string; title: string; channel: string; thumbnail: string; }

// ── Helpers ────────────────────────────────────────────────────────────────────
function extractLcNumber(title: string): number | null {
  const m = title.match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : null;
}
function cleanProblemName(title: string): string {
  return title.replace(/^\d+\.\s*/, "").trim();
}

const LOADING_MSGS = [
  "Analyzing the problem…", "Generating understanding questions…",
  "Building solution analysis…", "Almost ready…",
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function QuestionCard({ number, label, children }: { number: number; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">{number}</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function FeedbackCard({ number, correct, question, userAnswer, correctAnswer, explanation }: {
  number: number; correct: boolean; question: string; userAnswer: string; correctAnswer: string; explanation: string;
}) {
  return (
    <div className={cn("rounded-xl p-4 border", correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
      <div className="flex items-start gap-2 mb-2">
        {correct ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
        <p className="text-sm font-semibold text-slate-800">Q{number}: {question}</p>
      </div>
      {!correct && <p className="text-xs text-red-700 mb-1 ml-6">Your answer: <span className="font-mono">{userAnswer}</span></p>}
      <p className="text-xs text-green-700 ml-6 mb-2">Correct: <span className="font-semibold">{correctAnswer}</span></p>
      <p className="text-xs text-slate-600 ml-6 italic">{explanation}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProblemSolver({ userName, leetcodeUsername }: { userName: string; leetcodeUsername?: string }) {
  const params = useSearchParams();

  // Problem input state
  const [problemTitle, setProblemTitle] = useState(params?.get("problem") ?? "");
  const [problemDesc, setProblemDesc] = useState(params?.get("description") ?? "");

  // UI state
  const [stage, setStage] = useState<Stage>("input");
  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [lang, setLang] = useState<"en" | "ru">("en");

  // AI data
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState("");

  // Quiz state
  const [mcAnswer, setMcAnswer] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // YouTube
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videosLoading, setVideosLoading] = useState(false);

  // Visual tab opens in new page — no local state needed

  const msgRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle loading messages
  useEffect(() => {
    if (stage === "loading") {
      let i = 0;
      msgRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MSGS.length;
        setLoadingMsg(LOADING_MSGS[i]);
      }, 2000);
    }
    return () => { if (msgRef.current) clearInterval(msgRef.current); };
  }, [stage]);

  // Fetch YouTube when tab selected
  useEffect(() => {
    if (activeTab === "youtube" && videos.length === 0 && problemTitle) {
      fetchYoutube();
    }
  }, [activeTab, problemTitle]);

  const fetchYoutube = useCallback(async () => {
    if (!problemTitle) return;
    setVideosLoading(true);
    try {
      const name = cleanProblemName(problemTitle);
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(`neetcode ${name}`)}`);
      const data = await res.json() as { videos: VideoResult[] };
      if (data.videos.length > 0) {
        setVideos(data.videos);
        setActiveVideo(data.videos[0].id);
      } else {
        // fallback: show search links
        setVideos([]);
      }
    } catch { setVideos([]); }
    finally { setVideosLoading(false); }
  }, [problemTitle]);

  async function handleAiHelp() {
    if (!problemTitle.trim() || !problemDesc.trim()) return;
    setStage("loading");
    setError("");
    setAiData(null);
    setShowAnswers(false);
    setShowAnalysis(false);
    setMcAnswer(null);
    setFillAnswer("");
    setTfAnswer(null);
    setVideos([]);
    setActiveVideo(null);
    // visual opens externally

    try {
      const res = await fetch("/api/ai/problem-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemTitle, problemDescription: problemDesc }),
      });

      // Read as text first to handle HTML error pages
      const rawText = await res.text();
      let data: AiResponse & { error?: string };
      try {
        data = JSON.parse(rawText) as AiResponse & { error?: string };
      } catch {
        // Server returned HTML (crash) — show a clean error
        throw new Error(`Server error (${res.status}). Please try again.`);
      }

      if (!res.ok || data.error) throw new Error(data.error ?? "AI error");
      if (!data.questions?.length) throw new Error("AI response was incomplete. Please try again.");
      setAiData(data);
      setStage("questions");
      setActiveTab("questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStage("input");
    }
  }

  function handleReset() {
    setStage("input"); setAiData(null); setShowAnswers(false); setShowAnalysis(false);
    setMcAnswer(null); setFillAnswer(""); setTfAnswer(null);
    setVideos([]); setActiveVideo(null); // visual opens externally
  }

  function allAnswered() {
    return mcAnswer !== null && fillAnswer.trim() !== "" && tfAnswer !== null;
  }

  function handleCheck() {
    if (!allAnswered()) return;
    setShowAnswers(true);
    setActiveTab("questions");
  }

  // Derived text helpers
  const t = (en: string, ru: string) => lang === "ru" ? ru : en;

  const lcNumber = extractLcNumber(problemTitle);
  const problemName = cleanProblemName(problemTitle);

  // ── LEFT PANEL ──────────────────────────────────────────────────────────────
  const leftPanel = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Problem Solver</p>
            <p className="text-xs text-slate-400">Hi {userName.split(" ")[0]} — let&apos;s break it down</p>
          </div>
        </div>
        <button
          onClick={() => setLang(l => l === "en" ? "ru" : "en")}
          className={cn(
            "text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all",
            lang === "ru" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
          )}
        >
          {lang === "ru" ? "🇷🇺 RU" : "🇬🇧 EN"}
        </button>
      </div>

      {/* Problem input */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {t("Problem Title", "Название задачи")}
          </label>
          <input
            value={problemTitle}
            onChange={e => setProblemTitle(e.target.value)}
            placeholder='e.g. "57. Insert Interval"'
            disabled={stage !== "input"}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {t("Problem Description", "Описание задачи")}
          </label>
          <textarea
            value={problemDesc}
            onChange={e => setProblemDesc(e.target.value)}
            placeholder={t(
              "Paste the full problem description here — constraints, examples, everything...",
              "Вставь полное описание задачи сюда — ограничения, примеры, всё..."
            )}
            disabled={stage !== "input"}
            rows={18}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[320px] disabled:opacity-60 leading-relaxed"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Action button */}
      <div className="px-5 py-4 border-t border-slate-100 shrink-0">
        {stage === "input" ? (
          <button
            onClick={handleAiHelp}
            disabled={!problemTitle.trim() || !problemDesc.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm shadow-indigo-200"
          >
            <Sparkles className="w-4 h-4" />
            {t("AI Help", "AI Помощь")}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-indigo-600">{t("Solving", "Решаю")}</p>
              <p className="font-bold text-slate-900 text-sm truncate">{problemTitle}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {t("Start new problem", "Новая задача")}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── RIGHT PANEL ─────────────────────────────────────────────────────────────

  // Loading state
  if (stage === "loading") {
    return (
      <div className="flex h-full">
        <div className="w-[45%] shrink-0">{leftPanel}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-slate-50 p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-lg">{t("AI is analyzing…", "AI анализирует…")}</p>
            <p className="text-sm text-slate-500 mt-1">{loadingMsg}</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Input state (no AI data yet)
  if (stage === "input" || !aiData) {
    return (
      <div className="flex h-full">
        <div className="w-[45%] shrink-0">{leftPanel}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-slate-50 p-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-lg">{t("Ready to help you solve it", "Готов помочь с решением")}</p>
            <p className="text-sm text-slate-400 mt-1">{t("Paste a problem on the left and click AI Help", "Вставь задачу слева и нажми AI Помощь")}</p>
          </div>
          <div className="grid gap-3 w-full max-w-xs">
            {[
              { icon: Brain, label: t("Understanding Check", "Проверка понимания"), desc: t("AI quizzes you on the problem", "AI проверит, понял ли ты задачу") },
              { icon: Video, label: t("YouTube Videos", "Видео на YouTube"), desc: t("Watch embedded solutions", "Смотри решения прямо здесь") },
              { icon: Eye, label: t("Visual Walkthrough", "Визуальное объяснение"), desc: t("Step-by-step AI visualization", "Пошаговая визуализация от AI") },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tab content ─────────────────────────────────────────────────────────────
  const mc = aiData.questions[0] as MCQuestion;
  const fill = aiData.questions[1] as FillQuestion;
  const tf = aiData.questions[2] as TFQuestion;
  const mcCorrect = showAnswers && mcAnswer === mc.correctIndex;
  const fillCorrect = showAnswers && fillAnswer.trim().toLowerCase() === fill.answer.trim().toLowerCase();
  const tfCorrect = showAnswers && tfAnswer === tf.answer;
  const score = [mcCorrect, fillCorrect, tfCorrect].filter(Boolean).length;

  // Question tab
  const questionsContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Score banner if answered */}
      {showAnswers && (
        <div className={cn(
          "shrink-0 px-5 py-3 flex items-center gap-3 border-b",
          score >= 2 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        )}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black shrink-0", score >= 2 ? "bg-green-100" : "bg-amber-100")}>
            {score}/3
          </div>
          <div>
            <p className={cn("font-bold text-sm", score >= 2 ? "text-green-800" : "text-amber-800")}>
              {score >= 2 ? t("Great understanding!", "Отлично понимаешь!") : t("Review the feedback below", "Изучи объяснения ниже")}
            </p>
            <p className={cn("text-xs", score >= 2 ? "text-green-600" : "text-amber-600")}>
              {score >= 2 ? t("You got the key concepts.", "Ты понял ключевые концепции.") : t("Check the solution tab for help.", "Загляни во вкладку Решение.")}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Q1 */}
        <QuestionCard number={1} label={t("Multiple Choice", "Выбор ответа")}>
          <p className="text-sm font-medium text-slate-800">
            {lang === "ru" && aiData.ru?.questions?.[0]?.question ? aiData.ru.questions[0].question : mc.question}
          </p>
          <div className="space-y-2">
            {(lang === "ru" && aiData.ru?.questions?.[0]?.options?.length ? aiData.ru.questions[0].options : mc.options).map((opt, i) => {
              const isSelected = mcAnswer === i;
              const isCorrect = showAnswers && i === mc.correctIndex;
              const isWrong = showAnswers && isSelected && i !== mc.correctIndex;
              return (
                <button key={i} onClick={() => !showAnswers && setMcAnswer(i)}
                  className={cn("w-full text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    isCorrect ? "border-green-500 bg-green-50 text-green-800" :
                    isWrong ? "border-red-400 bg-red-50 text-red-700" :
                    isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-800" :
                    "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  )}>
                  {opt}
                </button>
              );
            })}
          </div>
          {showAnswers && (
            <p className="text-xs italic text-slate-500 mt-1">
              {lang === "ru" && aiData.ru?.questions?.[0]?.explanation ? aiData.ru.questions[0].explanation : mc.explanation}
            </p>
          )}
        </QuestionCard>

        {/* Q2 */}
        <QuestionCard number={2} label={t("Fill in the Gap", "Заполни пропуск")}>
          <p className="text-sm font-medium text-slate-800">
            {lang === "ru" && aiData.ru?.questions?.[1]?.question ? aiData.ru.questions[1].question : fill.question}
          </p>
          <input type="text" value={fillAnswer} onChange={e => !showAnswers && setFillAnswer(e.target.value)}
            placeholder={t("Type your answer…", "Введи ответ…")}
            disabled={showAnswers}
            className={cn("w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all",
              showAnswers
                ? fillCorrect ? "border-green-400 bg-green-50 text-green-800" : "border-red-400 bg-red-50 text-red-700"
                : "border-slate-200"
            )}
          />
          {showAnswers && (
            <div className="text-xs space-y-1">
              {!fillCorrect && <p className="text-green-700">Correct: <span className="font-semibold">{fill.answer}</span></p>}
              <p className="italic text-slate-500">{lang === "ru" && aiData.ru?.questions?.[1]?.explanation ? aiData.ru.questions[1].explanation : fill.explanation}</p>
            </div>
          )}
        </QuestionCard>

        {/* Q3 */}
        <QuestionCard number={3} label={t("True / False", "Верно / Неверно")}>
          <p className="text-sm font-medium text-slate-800">
            {lang === "ru" && aiData.ru?.questions?.[2]?.question ? aiData.ru.questions[2].question : tf.question}
          </p>
          <div className="flex gap-3">
            {[true, false].map(val => {
              const isSelected = tfAnswer === val;
              const isCorrect = showAnswers && val === tf.answer;
              const isWrong = showAnswers && isSelected && val !== tf.answer;
              return (
                <button key={String(val)} onClick={() => !showAnswers && setTfAnswer(val)}
                  className={cn("flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all",
                    isCorrect ? "border-green-500 bg-green-50 text-green-800" :
                    isWrong ? "border-red-400 bg-red-50 text-red-700" :
                    isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-800" :
                    "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  )}>
                  {val ? t("True", "Верно") : t("False", "Неверно")}
                </button>
              );
            })}
          </div>
          {showAnswers && (
            <p className="text-xs italic text-slate-500 mt-1">{lang === "ru" && aiData.ru?.questions?.[2]?.explanation ? aiData.ru.questions[2].explanation : tf.explanation}</p>
          )}
        </QuestionCard>

        {/* Check button or Analysis unlock */}
        {!showAnswers ? (
          <button onClick={handleCheck} disabled={!allAnswered()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm">
            <CheckCircle className="w-4 h-4" />
            {t("Check My Understanding", "Проверить понимание")}
          </button>
        ) : !showAnalysis ? (
          <button onClick={() => setShowAnalysis(true)}
            className="w-full group border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl py-4 flex flex-col items-center gap-1.5 transition-all hover:bg-indigo-50/50">
            <span className="text-xl">🔓</span>
            <p className="font-bold text-slate-800 text-sm">{t("Reveal Full Analysis", "Открыть полный разбор")}</p>
            <p className="text-xs text-slate-400">{t("Big O · Approach · Optimal Code · Alternative", "Big O · Подход · Код · Альтернатива")}</p>
          </button>
        ) : (
          <div className="space-y-4" style={{ animation: "fadeInUp 0.4s ease-out" }}>
            {/* Big O */}
            {aiData.bigO && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 space-y-3">
                <p className="font-bold text-white flex items-center gap-2">📊 {t("Big O Notation", "Big O нотация")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs font-bold text-indigo-300 mb-1">{t("TIME", "ВРЕМЯ")}</p>
                    <p className="text-xl font-black text-white font-mono">{aiData.bigO.time}</p>
                    <p className="text-xs text-slate-400 mt-1">{lang === "ru" && aiData.ru?.bigO?.timeWhy ? aiData.ru.bigO.timeWhy : aiData.bigO.timeWhy}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs font-bold text-purple-300 mb-1">{t("SPACE", "ПАМЯТЬ")}</p>
                    <p className="text-xl font-black text-white font-mono">{aiData.bigO.space}</p>
                    <p className="text-xs text-slate-400 mt-1">{lang === "ru" && aiData.ru?.bigO?.spaceWhy ? aiData.ru.bigO.spaceWhy : aiData.bigO.spaceWhy}</p>
                  </div>
                </div>
                {aiData.bigO.optimizeNote && (
                  <p className="text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-2">💡 {lang === "ru" && aiData.ru?.bigO?.optimizeNote ? aiData.ru.bigO.optimizeNote : aiData.bigO.optimizeNote}</p>
                )}
              </div>
            )}
            {/* Best Approach */}
            {aiData.bestApproach && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <p className="font-bold text-emerald-900 text-sm">{t("Best Approach", "Лучший подход")}</p>
                  <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{aiData.bestApproach.pattern}</span>
                </div>
                <p className="font-semibold text-emerald-800 text-sm">{lang === "ru" && aiData.ru?.bestApproach?.name ? aiData.ru.bestApproach.name : aiData.bestApproach.name}</p>
                <p className="text-sm text-emerald-700">{lang === "ru" && aiData.ru?.bestApproach?.why ? aiData.ru.bestApproach.why : aiData.bestApproach.why}</p>
              </div>
            )}
            {/* Optimal Solution */}
            {aiData.optimalSolution && (
              <div className="space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-2 text-sm">⚡ {t("Optimal Solution", "Оптимальное решение")}</p>
                <pre className="bg-slate-950 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{aiData.optimalSolution.code}</pre>
                <div className="space-y-1">
                  {(lang === "ru" && aiData.ru?.optimalSolution?.lines?.length ? aiData.ru.optimalSolution.lines : aiData.optimalSolution.lines).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Alternative */}
            {aiData.alternativeApproach?.applicable && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="font-bold text-amber-900 text-sm">🔄 {t("Alternative:", "Альтернатива:")} {aiData.alternativeApproach.name}</p>
                <p className="text-sm text-amber-700">{lang === "ru" && aiData.ru?.alternativeApproach?.description ? aiData.ru.alternativeApproach.description : aiData.alternativeApproach.description}</p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-amber-100 rounded px-2 py-1 font-mono">{aiData.alternativeApproach.timeComplexity}</span>
                  <span className="bg-amber-100 rounded px-2 py-1 font-mono">{aiData.alternativeApproach.spaceComplexity}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // YouTube tab
  const youtubeContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Embedded player */}
      {activeVideo ? (
        <div className="shrink-0 bg-black">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              key={activeVideo}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      ) : videosLoading ? (
        <div className="shrink-0 bg-slate-900 flex items-center justify-center" style={{ height: 200 }}>
          <div className="text-center space-y-2">
            <Search className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
            <p className="text-slate-400 text-sm">{t("Searching YouTube…", "Ищем на YouTube…")}</p>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-slate-900 flex items-center justify-center" style={{ height: 200 }}>
          <div className="text-center space-y-2">
            <Video className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm">{t("No videos found", "Видео не найдено")}</p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanProblemName(problemTitle) + " leetcode solution neetcode")}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="w-3 h-3" /> {t("Search on YouTube", "Найти на YouTube")}
            </a>
          </div>
        </div>
      )}

      {/* Video list */}
      <div className="flex-1 overflow-y-auto">
        {videos.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {videos.map(v => (
              <button key={v.id} onClick={() => setActiveVideo(v.id)}
                className={cn("w-full flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left", activeVideo === v.id && "bg-indigo-50 border-l-2 border-indigo-500")}>
                <div className="relative shrink-0 w-24 rounded-lg overflow-hidden bg-slate-200">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", activeVideo === v.id ? "bg-indigo-600" : "bg-black/60")}>
                      <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{v.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{v.channel}</p>
                </div>
              </button>
            ))}
          </div>
        ) : !videosLoading && (
          <div className="p-5 space-y-2">
            <p className="text-xs font-semibold text-slate-500 mb-3">{t("Search on YouTube:", "Поиск на YouTube:")}</p>
            {[
              { label: "NeetCode", q: `neetcode ${cleanProblemName(problemTitle)}` },
              { label: "Back To Back SWE", q: `back to back swe ${cleanProblemName(problemTitle)}` },
              { label: "Kevin Naughton Jr", q: `kevin naughton ${cleanProblemName(problemTitle)}` },
              { label: t("All results", "Все результаты"), q: `${cleanProblemName(problemTitle)} leetcode solution python` },
            ].map(({ label, q }) => (
              <a key={label} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl transition-all">
                <Video className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Visual tab — opens /problems/[lcNumber] in a new tab (avoids crashing the solve page)
  const visualContent = (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-6 py-8">
      {lcNumber ? (
        <>
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Eye className="w-10 h-10 text-purple-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-bold text-slate-900 text-lg">{t("Visual Step-by-Step Explanation", "Пошаговое визуальное объяснение")}</p>
            <p className="text-sm text-slate-500 max-w-xs">
              {t(
                `AI generates a step-by-step animation for problem #${lcNumber}: "${problemName}"`,
                `AI создаёт пошаговую анимацию для задачи #${lcNumber}: "${problemName}"`
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {/* Open in new tab — most reliable */}
            <a
              href={`/problems/${lcNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-200 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {t("Open Visual Explanation", "Открыть визуализацию")}
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>
            <p className="text-xs text-slate-400 text-center">
              {t("Opens in a new tab with full interactive visualizer", "Открывается в новой вкладке с полным интерактивным визуализатором")}
            </p>
          </div>

          {/* Preview info */}
          <div className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t("What you'll see", "Что там будет")}</p>
            {[
              t("8-10 step-by-step algorithm execution", "8-10 шагов выполнения алгоритма"),
              t("Colored array cells with pointers", "Цветные ячейки с указателями"),
              t("Code with line highlights", "Код с подсветкой строк"),
              t("Edge cases and key insights", "Edge cases и ключевые выводы"),
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">{i + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <Eye className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm max-w-xs">
            {t(
              'Add the LeetCode number to the title (e.g. "57. Insert Interval") to enable visual explanation.',
              'Добавь номер LeetCode в название (например "57. Insert Interval") для визуализации.'
            )}
          </p>
        </div>
      )}
    </div>
  );

  const tabs: { id: Tab; label: string; labelRu: string; icon: React.ReactNode }[] = [
    { id: "questions", label: "Questions", labelRu: "Вопросы", icon: <Brain className="w-3.5 h-3.5" /> },
    { id: "youtube", label: "YouTube", labelRu: "YouTube", icon: <Video className="w-3.5 h-3.5" /> },
    { id: "visual", label: "Visual", labelRu: "Визуал", icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[45%] shrink-0">{leftPanel}</div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Tab bar */}
        <div className="flex items-center border-b border-slate-200 px-4 shrink-0 bg-slate-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.icon}
              {lang === "ru" ? tab.labelRu : tab.label}
              {tab.id === "questions" && showAnswers && (
                <span className={cn("w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ml-0.5", score >= 2 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {score}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "questions" && questionsContent}
          {activeTab === "youtube" && youtubeContent}
          {activeTab === "visual" && visualContent}
        </div>
      </div>
    </div>
  );
}
