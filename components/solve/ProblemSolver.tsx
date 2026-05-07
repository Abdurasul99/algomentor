"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain, Sparkles, CheckCircle, XCircle, Eye,
  RefreshCw, Video, Play, ExternalLink, Search,
  ChevronDown, ChevronUp, Code2, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Stage = "input" | "loading" | "questions" | "answered";
type Tab = "questions" | "code" | "youtube" | "visual";
type LeftTab = "description" | "solution";
type RunStatus = "idle" | "running" | "passed" | "wrong_answer" | "runtime_error" | "compilation_error" | "time_limit_exceeded";

interface TestResult { input: string; expected: string; actual: string; passed: boolean; }
interface RunResult {
  status: RunStatus;
  passed: boolean;
  testResults: TestResult[];
  error?: { message: string; line?: number; type: string } | null;
  timeComplexity?: string;
  spaceComplexity?: string;
  feedback?: string;
  hint?: string;
}

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

function extractLcNumber(title: string): number | null {
  const m = title.match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : null;
}
function cleanName(title: string) { return title.replace(/^\d+\.\s*/, "").trim(); }

const LOADING_MSGS = [
  "Reading the problem…",
  "Building understanding questions…",
  "Generating solution analysis…",
  "Adding Russian translations…",
  "Almost ready…",
];

// ── LeetCode-style Code Editor ────────────────────────────────────────────────
const LANG_STARTERS: Record<string, string> = {
  Python: "class Solution:\n    def solve(self):\n        pass\n",
  Java: "class Solution {\n    public int[] solve() {\n        return new int[]{};\n    }\n}\n",
  "C++": "class Solution {\npublic:\n    vector<int> solve() {\n        return {};\n    }\n};\n",
  JavaScript: "var solve = function() {\n    \n};\n",
  TypeScript: "function solve(): void {\n    \n}\n",
};

function CodeEditor({ code, setCode, codeLang, setCodeLang, runCode, runStatus, runResult, t }: {
  code: string; setCode: (v: string) => void;
  codeLang: string; setCodeLang: (v: string) => void;
  runCode: () => void; runStatus: RunStatus; runResult: RunResult | null;
  t: (en: string, ru: string) => string;
}) {
  const [selectedCase, setSelectedCase] = useState(0);
  const lineCount = code ? code.split("\n").length : 1;
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  const passedCount = runResult?.testResults?.filter(r => r.passed).length ?? 0;
  const totalCount = runResult?.testResults?.length ?? 0;
  const allPassed = runResult?.passed ?? false;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4; }, 0);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const el = e.currentTarget;
      const pos = el.selectionStart;
      const selEnd = el.selectionEnd;
      const lineStart = code.lastIndexOf("\n", pos - 1) + 1;
      const indentMatch = code.slice(lineStart).match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : "";
      const extraIndent = code.slice(0, pos).trimEnd().endsWith(":") ? "    " : "";
      const newCode = code.substring(0, pos) + "\n" + indent + extraIndent + code.substring(selEnd);
      setCode(newCode);
      setTimeout(() => { el.selectionStart = el.selectionEnd = pos + 1 + indent.length + extraIndent.length; }, 0);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0, background: "#1e1e1e" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: "#1e1e1e", borderColor: "#3c3c3c" }}>
        <select
          value={codeLang}
          onChange={e => { setCodeLang(e.target.value); setCode(LANG_STARTERS[e.target.value] ?? ""); }}
          className="text-xs font-semibold rounded-md px-2.5 py-1.5 focus:outline-none cursor-pointer"
          style={{ background: "#2d2d2d", color: "#ccc", border: "1px solid #444" }}
        >
          {Object.keys(LANG_STARTERS).map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <button
          onClick={() => setCode(LANG_STARTERS[codeLang] ?? "")}
          className="text-xs px-2.5 py-1.5 rounded-md transition-colors"
          style={{ color: "#888", background: "transparent" }}
          title={t("Reset to starter", "Сбросить")}
        >
          ↺ {t("Reset", "Сброс")}
        </button>

        <div className="flex-1" />

        {/* Status badge */}
        {runResult && (
          <div className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full",
            allPassed ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
          )}>
            {allPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {allPassed
              ? t("Accepted", "Принято")
              : runResult.status === "wrong_answer" ? t("Wrong Answer", "Неверный ответ")
              : runResult.status === "compilation_error" ? t("Syntax Error", "Ошибка синтаксиса")
              : runResult.status === "time_limit_exceeded" ? t("Time Limit", "Лимит времени")
              : t("Runtime Error", "Ошибка выполнения")}
          </div>
        )}

        <button
          onClick={runCode}
          disabled={!code.trim() || runStatus === "running"}
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all disabled:opacity-40"
          style={{ background: runStatus === "running" ? "#1a5c2a" : "#2db55d", border: "none" }}
        >
          {runStatus === "running" ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> {t("Running…", "Запуск…")}</>
          ) : (
            <><Play className="w-3 h-3 fill-white" /> {t("Run Code", "Запустить")}</>
          )}
        </button>
      </div>

      {/* ── Editor with line numbers ── */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0, background: "#1e1e1e" }}>
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div
            className="text-right select-none pt-3 pb-3 pr-4 pl-3 shrink-0"
            style={{ color: "#555", fontSize: "13px", fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace", lineHeight: "1.6", background: "#1e1e1e", borderRight: "1px solid #2d2d2d", minWidth: "48px", userSelect: "none" }}
          >
            {lines.map(n => <div key={n}>{n}</div>)}
          </div>

          {/* Code textarea */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={LANG_STARTERS[codeLang]}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="flex-1 resize-none focus:outline-none pt-3 pb-3 pl-4 pr-4"
            style={{
              background: "#1e1e1e",
              color: "#d4d4d4",
              fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
              fontSize: "13px",
              lineHeight: "1.6",
              border: "none",
              caretColor: "#aeafad",
            }}
          />
        </div>
      </div>

      {/* ── Test results panel ── */}
      <div className="shrink-0" style={{ background: "#1e1e1e", borderTop: "1px solid #3c3c3c" }}>

        {runStatus === "running" && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex gap-1">
              {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <span className="text-xs" style={{ color: "#888" }}>{t("Running test cases…", "Запускаем тест-кейсы…")}</span>
          </div>
        )}

        {runResult && runStatus !== "running" && (
          <>
            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-2" style={{ borderBottom: "1px solid #3c3c3c" }}>
              <span className="text-xs font-bold" style={{ color: allPassed ? "#2db55d" : "#f04747" }}>
                {allPassed ? "✓ " : "✗ "}{t("Test Results", "Результаты тестов")}
              </span>
              <span className="text-xs" style={{ color: "#888" }}>
                {passedCount}/{totalCount} {t("passed", "прошли")}
              </span>
              {runResult.timeComplexity && (
                <span className="text-xs ml-auto" style={{ color: "#666" }}>
                  {t("Time:", "Время:")} <span style={{ color: "#9cdcfe" }}>{runResult.timeComplexity}</span>
                  {" · "}
                  {t("Space:", "Память:")} <span style={{ color: "#9cdcfe" }}>{runResult.spaceComplexity}</span>
                </span>
              )}
            </div>

            {/* Case selector tabs */}
            <div className="flex items-center gap-1 px-4 pt-2 pb-0">
              {runResult.testResults?.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCase(i)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-t-md transition-colors"
                  style={{
                    background: selectedCase === i ? "#252526" : "transparent",
                    color: r.passed ? (selectedCase === i ? "#2db55d" : "#2db55d99") : (selectedCase === i ? "#f04747" : "#f0474799"),
                    fontWeight: selectedCase === i ? "700" : "500",
                    borderBottom: selectedCase === i ? "2px solid " + (r.passed ? "#2db55d" : "#f04747") : "2px solid transparent",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: r.passed ? "#2db55d" : "#f04747" }} />
                  {t("Case", "Кейс")} {i + 1}
                </button>
              ))}
            </div>

            {/* Selected case detail */}
            {runResult.testResults?.[selectedCase] && (
              <div className="px-4 pb-4 pt-3" style={{ background: "#252526" }}>
                {(() => {
                  const r = runResult.testResults[selectedCase];
                  return (
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: "#9cdcfe" }}>{t("Input", "Входные данные")}</p>
                        <div className="px-3 py-2 rounded-md font-mono text-xs" style={{ background: "#1e1e1e", color: "#d4d4d4" }}>{r.input}</div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: "#9cdcfe" }}>{t("Expected Output", "Ожидаемый вывод")}</p>
                        <div className="px-3 py-2 rounded-md font-mono text-xs" style={{ background: "#1e1e1e", color: "#2db55d" }}>{r.expected}</div>
                      </div>
                      {!r.passed && (
                        <div>
                          <p className="text-[10px] font-bold mb-1" style={{ color: "#9cdcfe" }}>{t("Your Output", "Ваш вывод")}</p>
                          <div className="px-3 py-2 rounded-md font-mono text-xs" style={{ background: "#1e1e1e", color: "#f04747" }}>{r.actual}</div>
                        </div>
                      )}
                      {runResult.error && (
                        <div className="px-3 py-2 rounded-md font-mono text-xs" style={{ background: "#2a1515", color: "#f04747", border: "1px solid #3d2020" }}>
                          {runResult.error.type}{runResult.error.line ? ` (line ${runResult.error.line})` : ""}: {runResult.error.message}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {runStatus === "idle" && (
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-xs" style={{ color: "#555" }}>{t("Click Run Code to test your solution", "Нажми Запустить для проверки решения")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ProblemSolver({ userName }: { userName: string; leetcodeUsername?: string }) {
  const params = useSearchParams();

  const [title, setTitle] = useState(params?.get("problem") ?? "");
  const [desc, setDesc] = useState(params?.get("description") ?? "");
  const [stage, setStage] = useState<Stage>("input");
  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState("");

  // Quiz
  const [mcAnswer, setMcAnswer] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // YouTube
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videosLoading, setVideosLoading] = useState(false);

  // Visual
  const [showVisualIframe, setShowVisualIframe] = useState(false);

  // Code editor
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [code, setCode] = useState("");
  const [codeLang, setCodeLang] = useState("Python");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [selectedCase, setSelectedCase] = useState(0);

  const msgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const lcNumber = extractLcNumber(title);
  const problemName = cleanName(title);
  const t = (en: string, ru: string) => lang === "ru" ? ru : en;

  useEffect(() => {
    if (stage === "loading") {
      let i = 0;
      msgRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MSGS.length;
        setLoadingMsg(LOADING_MSGS[i]);
      }, 1800);
    }
    return () => { if (msgRef.current) clearInterval(msgRef.current); };
  }, [stage]);

  useEffect(() => {
    if (activeTab === "youtube" && videos.length === 0 && title) fetchYoutube();
  }, [activeTab, title]);

  const fetchYoutube = useCallback(async () => {
    if (!title) return;
    setVideosLoading(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(`neetcode ${problemName}`)}`);
      const data = await res.json() as { videos: VideoResult[] };
      if (data.videos.length > 0) { setVideos(data.videos); setActiveVideo(data.videos[0].id); }
    } catch { /* ignore */ } finally { setVideosLoading(false); }
  }, [title, problemName]);

  async function handleSubmit() {
    if (!title.trim() || !desc.trim()) return;
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
    setShowVisualIframe(false);

    try {
      const res = await fetch("/api/ai/problem-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemTitle: title, problemDescription: desc }),
      });
      const raw = await res.text();
      let data: AiResponse & { error?: string };
      try { data = JSON.parse(raw); } catch { throw new Error(`Server error (${res.status}). Try again.`); }
      if (!res.ok || data.error) throw new Error(data.error ?? "AI error");
      if (!data.questions?.length) throw new Error("Incomplete response. Try again.");
      setAiData(data);
      setStage("questions");
      setActiveTab("questions");
      setTimeout(() => rightRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStage("input");
    }
  }

  async function runCode() {
    if (!code.trim() || !title.trim()) return;
    setRunStatus("running");
    setRunResult(null);
    try {
      const res = await fetch("/api/ai/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: codeLang, problemTitle: title, problemDescription: desc }),
      });
      const data = await res.json() as RunResult & { error?: string };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Run failed");
      setRunResult(data);
      setRunStatus(data.status as RunStatus);
      // If passed, switch left tab to show solution summary
      if (data.passed) setLeftTab("solution");
    } catch {
      setRunStatus("runtime_error");
      setRunResult({ status: "runtime_error", passed: false, testResults: [], feedback: "Could not evaluate. Check your code syntax." });
    }
  }

  function reset() {
    setStage("input"); setAiData(null); setShowAnswers(false); setShowAnalysis(false);
    setMcAnswer(null); setFillAnswer(""); setTfAnswer(null);
    setVideos([]); setActiveVideo(null); setShowVisualIframe(false);
    setRunStatus("idle"); setRunResult(null); setLeftTab("description"); setCode(""); setSelectedCase(0);
  }

  const allAnswered = () => mcAnswer !== null && fillAnswer.trim() !== "" && tfAnswer !== null;

  const mc = aiData?.questions[0] as MCQuestion | undefined;
  const fill = aiData?.questions[1] as FillQuestion | undefined;
  const tf = aiData?.questions[2] as TFQuestion | undefined;
  const mcCorrect = showAnswers && mc ? mcAnswer === mc.correctIndex : false;
  const fillCorrect = showAnswers && fill ? fillAnswer.trim().toLowerCase() === fill.answer.trim().toLowerCase() : false;
  const tfCorrect = showAnswers && tf ? tfAnswer === tf.answer : false;
  const score = [mcCorrect, fillCorrect, tfCorrect].filter(Boolean).length;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-100" style={{ minHeight: 0 }}>

      {/* ── LEFT: Problem Input ──────────────────────────────────────────────── */}
      <div className="w-[42%] flex flex-col bg-white border-r border-slate-200" style={{ minHeight: 0 }}>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">Problem Solver</p>
              <p className="text-[11px] text-slate-400 leading-tight">Hi {userName.split(" ")[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === "en" ? "ru" : "en")}
              className={cn("text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all", lang === "ru" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300")}
            >
              {lang === "ru" ? "🇷🇺 RU" : "🇬🇧 EN"}
            </button>
            {aiData && (
              <button onClick={reset} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-3 h-3" /> {t("New", "Новая")}
              </button>
            )}
          </div>
        </div>

        {/* Left tabs: Description | Solution */}
        <div className="flex border-b border-slate-200 px-1 shrink-0">
          {([
            { id: "description" as LeftTab, label: t("Description", "Описание") },
            { id: "solution" as LeftTab, label: t("Solution", "Решение"), badge: runResult?.passed },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setLeftTab(tab.id)}
              className={cn("flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px",
                leftTab === tab.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-700"
              )}>
              {tab.label}
              {tab.badge && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Description tab */}
        {leftTab === "description" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: 0 }}>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t("Problem Title", "Название задачи")}
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={stage !== "input"}
                placeholder='e.g. "57. Insert Interval"'
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {t("Problem Description", "Описание задачи")}
              </label>
              <span className="text-[10px] text-slate-300">{t("Paste from LeetCode", "Вставь из LeetCode")}</span>
            </div>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              disabled={stage !== "input"}
              placeholder={t("Paste the full problem here…", "Вставь задачу сюда…")}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none font-mono leading-relaxed bg-slate-50 hover:bg-white disabled:opacity-60"
              style={{ minHeight: "300px", height: "calc(100vh - 400px)" }}
            />
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 text-sm text-red-700">
                <span className="shrink-0">⚠️</span><span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Solution tab — shown after successful submission */}
        {leftTab === "solution" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: 0 }}>
            {runResult?.passed ? (
              <>
                {/* Success banner */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-base">{t("Accepted!", "Принято!")}</p>
                      <p className="text-xs text-green-600">{t("All test cases passed", "Все тест-кейсы прошли")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-green-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("Time", "Время")}</p>
                      <p className="font-black text-slate-900 font-mono text-lg">{runResult.timeComplexity ?? "O(?)"}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-green-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("Space", "Память")}</p>
                      <p className="font-black text-slate-900 font-mono text-lg">{runResult.spaceComplexity ?? "O(?)"}</p>
                    </div>
                  </div>
                </div>
                {runResult.feedback && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-600 mb-1">{t("Feedback", "Отзыв")}</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{runResult.feedback}</p>
                  </div>
                )}
              </>
            ) : runResult ? (
              <>
                {/* Error / Wrong Answer */}
                <div className={cn("border rounded-2xl p-5", runResult.status === "wrong_answer" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", runResult.status === "wrong_answer" ? "bg-amber-500" : "bg-red-500")}>
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={cn("font-bold text-base", runResult.status === "wrong_answer" ? "text-amber-800" : "text-red-800")}>
                        {runResult.status === "wrong_answer" ? t("Wrong Answer", "Неверный ответ") :
                         runResult.status === "compilation_error" ? t("Compilation Error", "Ошибка компиляции") :
                         runResult.status === "time_limit_exceeded" ? t("Time Limit Exceeded", "Превышен лимит времени") :
                         t("Runtime Error", "Ошибка выполнения")}
                      </p>
                      {runResult.error && (
                        <p className="text-xs text-red-600 font-mono mt-0.5">{runResult.error.type}{runResult.error.line ? ` (line ${runResult.error.line})` : ""}</p>
                      )}
                    </div>
                  </div>
                  {runResult.error?.message && (
                    <div className="bg-white rounded-xl p-3 border border-red-100 font-mono text-xs text-red-700 mb-3">
                      {runResult.error.message}
                    </div>
                  )}
                  {runResult.hint && (
                    <div className="bg-white rounded-xl p-3 border border-amber-100">
                      <p className="text-xs font-bold text-amber-600 mb-1">💡 {t("Hint", "Подсказка")}</p>
                      <p className="text-sm text-amber-800">{runResult.hint}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                <Code2 className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-400 text-center">{t("Submit your code from the Code tab to see results here.", "Отправь код из вкладки Code чтобы увидеть результаты.")}</p>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          {stage === "input" ? (
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !desc.trim()}
              className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm shadow-indigo-200/60"
            >
              <Sparkles className="w-4 h-4" />
              {t("AI Help — Generate Questions", "AI Помощь — Создать вопросы")}
            </button>
          ) : stage === "loading" ? (
            <div className="w-full flex items-center justify-center gap-3 bg-indigo-50 border border-indigo-100 py-3 rounded-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-sm text-indigo-600 font-medium">{loadingMsg}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
              {lcNumber && (
                <span className="text-xs font-black text-indigo-400 font-mono shrink-0">#{lcNumber}</span>
              )}
              <p className="font-semibold text-indigo-900 text-sm truncate flex-1">{title}</p>
              <button onClick={reset} className="shrink-0 p-1.5 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: AI Panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white" style={{ minHeight: 0 }}>

        {/* Empty state */}
        {(stage === "input" || stage === "loading") && !aiData && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-slate-50">
            {stage === "loading" ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white border-2 border-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Brain className="w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">{t("Analyzing your problem…", "Анализирую задачу…")}</p>
                  <p className="text-sm text-slate-400 mt-1">{loadingMsg}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Sparkles className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-base">{t("Ready to help", "Готов помочь")}</p>
                  <p className="text-sm text-slate-400 mt-1">{t("Paste a problem on the left → click AI Help", "Вставь задачу слева → нажми AI Помощь")}</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                  {[
                    { icon: Brain, label: t("Understanding Check", "Проверка понимания"), desc: t("3 questions to test your grasp", "3 вопроса для проверки"), color: "text-indigo-500 bg-indigo-50" },
                    { icon: Video, label: t("YouTube Videos", "YouTube видео"), desc: t("Watch embedded solutions", "Смотри решения прямо здесь"), color: "text-red-500 bg-red-50" },
                    { icon: Eye, label: t("Visual Walkthrough", "Визуальное объяснение"), desc: t("Step-by-step animation", "Пошаговая анимация"), color: "text-purple-500 bg-purple-50" },
                  ].map(({ icon: Icon, label, desc, color }) => (
                    <div key={label} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{label}</p>
                        <p className="text-[11px] text-slate-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Active state with tabs */}
        {aiData && (
          <>
            {/* Tab bar */}
            <div className="flex items-center border-b border-slate-200 px-1 shrink-0 bg-white">
              {([
                { id: "questions" as Tab, label: t("Questions", "Вопросы"), icon: Brain, badge: showAnswers ? `${score}/3` : undefined, badgeColor: score >= 2 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700" },
                { id: "code" as Tab, label: t("Code", "Код"), icon: Code2, badge: runResult?.passed ? "✓" : runResult && !runResult.passed ? "✗" : undefined, badgeColor: runResult?.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" },
                { id: "youtube" as Tab, label: "YouTube", icon: Video, badge: undefined, badgeColor: "" },
                { id: "visual" as Tab, label: t("Visual", "Визуал"), icon: Eye, badge: undefined, badgeColor: "" },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all -mb-px",
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5", tab.badgeColor)}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }} ref={rightRef}>

              {/* ── QUESTIONS TAB ──────────────────────────────────────── */}
              {activeTab === "questions" && mc && fill && tf && (
                <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {/* Score banner */}
                  {showAnswers && (
                    <div className={cn("px-5 py-3.5 flex items-center gap-3 border-b shrink-0", score >= 2 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0", score >= 2 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                        {score}/3
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", score >= 2 ? "text-green-800" : "text-amber-800")}>
                          {score >= 2 ? t("Great! You understand it.", "Отлично! Ты понимаешь задачу.") : t("Review the explanations below.", "Изучи объяснения ниже.")}
                        </p>
                        <p className={cn("text-xs mt-0.5", score >= 2 ? "text-green-600" : "text-amber-600")}>
                          {score >= 2 ? t("Ready to try solving?", "Готов попробовать решить?") : t("Check the analysis to understand better.", "Изучи разбор для лучшего понимания.")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    {/* Q1 MC */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Multiple Choice", "Выбор ответа")}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {lang === "ru" && aiData.ru?.questions?.[0]?.question ? aiData.ru.questions[0].question : mc.question}
                      </p>
                      <div className="space-y-2">
                        {(lang === "ru" && aiData.ru?.questions?.[0]?.options?.length ? aiData.ru.questions[0].options : mc.options).map((opt, i) => {
                          const sel = mcAnswer === i;
                          const correct = showAnswers && i === mc.correctIndex;
                          const wrong = showAnswers && sel && i !== mc.correctIndex;
                          return (
                            <button key={i} onClick={() => !showAnswers && setMcAnswer(i)}
                              className={cn("w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all",
                                correct ? "border-green-400 bg-green-50 text-green-800 font-semibold" :
                                wrong ? "border-red-300 bg-red-50 text-red-700" :
                                sel ? "border-indigo-400 bg-indigo-50 text-indigo-800 font-semibold" :
                                "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                              )}>
                              <span className="font-mono text-[11px] mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                              {opt.replace(/^[A-D]\.\s*/, "")}
                            </button>
                          );
                        })}
                      </div>
                      {showAnswers && (
                        <p className="text-xs text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-100">
                          {lang === "ru" && aiData.ru?.questions?.[0]?.explanation ? aiData.ru.questions[0].explanation : mc.explanation}
                        </p>
                      )}
                    </div>

                    {/* Q2 Fill */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Fill in the Gap", "Заполни пропуск")}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {lang === "ru" && aiData.ru?.questions?.[1]?.question ? aiData.ru.questions[1].question : fill.question}
                      </p>
                      <input type="text" value={fillAnswer} onChange={e => !showAnswers && setFillAnswer(e.target.value)}
                        disabled={showAnswers}
                        placeholder={t("Your answer…", "Твой ответ…")}
                        className={cn("w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition",
                          showAnswers ? fillCorrect ? "border-green-400 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white"
                        )}
                      />
                      {showAnswers && (
                        <div className="text-xs space-y-1">
                          {!fillCorrect && <p className="text-green-700 font-medium">{t("Correct: ", "Правильно: ")}<span className="font-mono">{fill.answer}</span></p>}
                          <p className="text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-100">
                            {lang === "ru" && aiData.ru?.questions?.[1]?.explanation ? aiData.ru.questions[1].explanation : fill.explanation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Q3 T/F */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("True / False", "Верно / Неверно")}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {lang === "ru" && aiData.ru?.questions?.[2]?.question ? aiData.ru.questions[2].question : tf.question}
                      </p>
                      <div className="flex gap-2">
                        {[true, false].map(val => {
                          const sel = tfAnswer === val;
                          const correct = showAnswers && val === tf.answer;
                          const wrong = showAnswers && sel && val !== tf.answer;
                          return (
                            <button key={String(val)} onClick={() => !showAnswers && setTfAnswer(val)}
                              className={cn("flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all",
                                correct ? "border-green-400 bg-green-50 text-green-800" :
                                wrong ? "border-red-300 bg-red-50 text-red-700" :
                                sel ? "border-indigo-400 bg-indigo-50 text-indigo-800" :
                                "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                              )}>
                              {val ? t("✓ True", "✓ Верно") : t("✗ False", "✗ Неверно")}
                            </button>
                          );
                        })}
                      </div>
                      {showAnswers && (
                        <p className="text-xs text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-100">
                          {lang === "ru" && aiData.ru?.questions?.[2]?.explanation ? aiData.ru.questions[2].explanation : tf.explanation}
                        </p>
                      )}
                    </div>

                    {/* Check button */}
                    {!showAnswers ? (
                      <button onClick={() => { if (allAnswered()) setShowAnswers(true); }}
                        disabled={!allAnswered()}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm">
                        <CheckCircle className="w-4 h-4" />
                        {t("Check My Understanding", "Проверить понимание")}
                      </button>
                    ) : !showAnalysis ? (
                      <button onClick={() => setShowAnalysis(true)}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl py-4 transition-all">
                        <span className="text-lg">🔓</span>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">{t("Reveal Full Analysis", "Открыть полный разбор")}</p>
                          <p className="text-xs text-slate-400">{t("Big O · Best Approach · Optimal Code · Alternative", "Big O · Подход · Код · Альтернатива")}</p>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-4" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                        {/* Big O */}
                        {aiData.bigO && (
                          <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
                            <p className="font-bold text-white text-sm flex items-center gap-2">📊 {t("Big O Notation", "Big O нотация")}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white/10 rounded-xl p-3">
                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">{t("TIME", "ВРЕМЯ")}</p>
                                <p className="text-xl font-black text-white font-mono">{aiData.bigO.time}</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{lang === "ru" && aiData.ru?.bigO?.timeWhy ? aiData.ru.bigO.timeWhy : aiData.bigO.timeWhy}</p>
                              </div>
                              <div className="bg-white/10 rounded-xl p-3">
                                <p className="text-[10px] font-bold text-purple-300 uppercase mb-1">{t("SPACE", "ПАМЯТЬ")}</p>
                                <p className="text-xl font-black text-white font-mono">{aiData.bigO.space}</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{lang === "ru" && aiData.ru?.bigO?.spaceWhy ? aiData.ru.bigO.spaceWhy : aiData.bigO.spaceWhy}</p>
                              </div>
                            </div>
                            {aiData.bigO.optimizeNote && (
                              <p className="text-[11px] text-slate-300 bg-white/5 rounded-xl px-3 py-2 leading-relaxed">💡 {lang === "ru" && aiData.ru?.bigO?.optimizeNote ? aiData.ru.bigO.optimizeNote : aiData.bigO.optimizeNote}</p>
                            )}
                          </div>
                        )}
                        {/* Best Approach */}
                        {aiData.bestApproach && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span>🎯</span>
                              <p className="font-bold text-emerald-900 text-sm">{t("Best Approach", "Лучший подход")}</p>
                              <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{aiData.bestApproach.pattern}</span>
                            </div>
                            <p className="font-semibold text-emerald-800 text-sm">{lang === "ru" && aiData.ru?.bestApproach?.name ? aiData.ru.bestApproach.name : aiData.bestApproach.name}</p>
                            <p className="text-sm text-emerald-700 leading-relaxed">{lang === "ru" && aiData.ru?.bestApproach?.why ? aiData.ru.bestApproach.why : aiData.bestApproach.why}</p>
                          </div>
                        )}
                        {/* Optimal Solution */}
                        {aiData.optimalSolution && (
                          <div className="space-y-2.5">
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">⚡ {t("Optimal Solution", "Оптимальное решение")}</p>
                            <pre className="bg-slate-950 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{aiData.optimalSolution.code}</pre>
                            <div className="space-y-1.5">
                              {(lang === "ru" && aiData.ru?.optimalSolution?.lines?.length ? aiData.ru.optimalSolution.lines : aiData.optimalSolution.lines).map((line, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                  <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="leading-relaxed">{line}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Alternative */}
                        {aiData.alternativeApproach?.applicable && (
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                            <p className="font-bold text-amber-900 text-sm">🔄 {t("Alternative:", "Альтернатива:")} {aiData.alternativeApproach.name}</p>
                            <p className="text-sm text-amber-700 leading-relaxed">{lang === "ru" && aiData.ru?.alternativeApproach?.description ? aiData.ru.alternativeApproach.description : aiData.alternativeApproach.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs bg-amber-100 rounded-lg px-2 py-1 font-mono text-amber-800">{aiData.alternativeApproach.timeComplexity}</span>
                              <span className="text-xs bg-amber-100 rounded-lg px-2 py-1 font-mono text-amber-800">{aiData.alternativeApproach.spaceComplexity}</span>
                            </div>
                            <p className="text-xs text-amber-600 italic">{lang === "ru" && aiData.ru?.alternativeApproach?.tradeoff ? aiData.ru.alternativeApproach.tradeoff : aiData.alternativeApproach.tradeoff}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CODE TAB — LeetCode style ──────────────────────────── */}
              {activeTab === "code" && (
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  codeLang={codeLang}
                  setCodeLang={setCodeLang}
                  runCode={runCode}
                  runStatus={runStatus}
                  runResult={runResult}
                  t={t}
                />
              )}

              {/* ── YOUTUBE TAB ──────────────────────────────────────────── */}
              {activeTab === "youtube" && (
                <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
                  {activeVideo ? (
                    <div className="bg-black shrink-0">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          key={activeVideo}
                          src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=0&rel=0`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    </div>
                  ) : videosLoading ? (
                    <div className="bg-slate-900 flex items-center justify-center shrink-0" style={{ height: 200 }}>
                      <div className="text-center space-y-2">
                        <Search className="w-7 h-7 text-slate-500 mx-auto animate-pulse" />
                        <p className="text-slate-400 text-sm">{t("Searching YouTube…", "Ищем на YouTube…")}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                    {videos.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {videos.map(v => (
                          <button key={v.id} onClick={() => setActiveVideo(v.id)}
                            className={cn("w-full flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left", activeVideo === v.id && "bg-indigo-50 border-l-2 border-indigo-500 pl-3")}>
                            <div className="relative shrink-0 rounded-lg overflow-hidden bg-slate-200" style={{ width: 96, height: 54 }}>
                              <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className={cn("absolute inset-0 flex items-center justify-center", activeVideo === v.id ? "bg-indigo-600/80" : "bg-black/40")}>
                                <Play className="w-4 h-4 text-white" />
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
                        <p className="text-xs font-semibold text-slate-400 mb-3">{t("Search on YouTube:", "Поиск на YouTube:")}</p>
                        {[
                          { label: "NeetCode", q: `neetcode ${problemName}` },
                          { label: "Back To Back SWE", q: `back to back swe ${problemName} leetcode` },
                          { label: "Kevin Naughton Jr", q: `kevin naughton ${problemName} leetcode` },
                          { label: t("General search", "Общий поиск"), q: `${problemName} leetcode solution` },
                        ].map(({ label, q }) => (
                          <a key={label} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50/30 rounded-xl transition-all">
                            <Video className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 ml-auto" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── VISUAL TAB ───────────────────────────────────────────── */}
              {activeTab === "visual" && (
                <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
                  {lcNumber ? (
                    !showVisualIframe ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                          <Eye className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-slate-900 text-base">{t("Visual Step-by-Step", "Пошаговая визуализация")}</p>
                          <p className="text-sm text-slate-400 mt-1">#{lcNumber}: {problemName}</p>
                        </div>
                        <button
                          onClick={() => setShowVisualIframe(true)}
                          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-200/50 text-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          {t("Generate Visual Explanation", "Сгенерировать визуализацию")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
                          <p className="text-xs font-semibold text-slate-500">#{lcNumber} {problemName}</p>
                          <button onClick={() => setShowVisualIframe(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors">
                            ✕ {t("Close", "Закрыть")}
                          </button>
                        </div>
                        <iframe src={`/problems/${lcNumber}`} className="flex-1 w-full border-0" title={`Visual #${lcNumber}`} loading="lazy" />
                      </div>
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Eye className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-400 max-w-xs">{t('Add LC number to title (e.g. "57. Insert Interval")', 'Добавь номер в название (например "57. Insert Interval")')}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
