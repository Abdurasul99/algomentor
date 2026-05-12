"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Send, User, Volume2, VolumeX, Video, VideoOff, Brain, Target, BookOpen, TrendingUp, Zap, MessageSquare, Code2 } from "lucide-react";

const VideoMentor = dynamic(() => import("./VideoMentor"), { ssr: false });
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PERSONAS } from "@/lib/personas";
import type { Persona } from "@/lib/personas";

// ─── Voice config per persona ─────────────────────────────────────────────────

const VOICE_CONFIG: Record<string, { pitch: number; rate: number; gender: "male" | "female" }> = {
  alex:   { pitch: 0.9, rate: 1.05, gender: "male" },
  sarah:  { pitch: 1.2, rate: 1.1,  gender: "female" },
  marcus: { pitch: 0.7, rate: 0.9,  gender: "male" },
  priya:  { pitch: 1.1, rate: 0.95, gender: "female" },
  diana:  { pitch: 1.15, rate: 1.0, gender: "female" },
};

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/^[-*]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

function useSpeech(personaId: string) {
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => synthRef.current?.cancel();
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || !voiceOn) return;
    synth.cancel();
    if (!synth) return;

    const cfg = VOICE_CONFIG[personaId] ?? VOICE_CONFIG.alex;
    const clean = stripMarkdown(text);
    if (!clean.trim()) return;

    const chunks = clean.match(/.{1,200}(?:\s|$)/g) ?? [clean];

    let idx = 0;
    setSpeaking(true);

    function speakNext() {
      if (!synth || idx >= chunks.length) { setSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(chunks[idx++]);
      utt.pitch = cfg.pitch;
      utt.rate  = cfg.rate;
      utt.lang  = "en-US";

      const voices = synth.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith("en") &&
        v.name.toLowerCase().includes(cfg.gender === "female" ? "female" : "male")
      ) ?? voices.find(v =>
        v.lang.startsWith("en") &&
        (cfg.gender === "female"
          ? v.name.toLowerCase().match(/zira|hazel|samantha|victoria|karen|moira/)
          : v.name.toLowerCase().match(/david|mark|daniel|alex|james|thomas/))
      ) ?? voices.find(v => v.lang.startsWith("en")) ?? voices[0];

      if (preferred) utt.voice = preferred;
      utt.onend = speakNext;
      utt.onerror = () => setSpeaking(false);
      synth.speak(utt);
    }

    speakNext();
  }, [voiceOn, personaId]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return { voiceOn, setVoiceOn, speaking, speak, stop };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: string;
  content: string;
  createdAt: Date;
}

interface UserContext {
  weakModules: string[];
  strongModules: string[];
  totalSolved: number;
  experienceLevel: string;
}

interface MentorChatProps {
  initialMessages: ChatMessage[];
  userName: string;
  userContext: UserContext;
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Google interview simulation", icon: Target, text: "Create a Google interview simulation for me based on my current level." },
  { label: "Explain Two Pointers", icon: BookOpen, text: "Explain Two Pointers with clear examples and when to use it." },
  { label: "What should I study next?", icon: TrendingUp, text: "What should I study next based on my progress data?" },
  { label: "Hard Binary Search problem", icon: Zap, text: "Give me a hard Binary Search problem with hints." },
  { label: "Quiz me on Sliding Window", icon: Brain, text: "Quiz me on Sliding Window with 3 questions." },
  { label: "Analyze my weak areas", icon: MessageSquare, text: "Analyze my weak areas and give me a targeted study plan." },
  { label: "Meta-style problem", icon: Code2, text: "Generate a Meta-style coding problem appropriate for my level." },
  { label: "Explain Dynamic Programming", icon: BookOpen, text: "Help me understand Dynamic Programming — start with the core intuition." },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <pre
          key={`code-${i}`}
          className="bg-slate-900 text-green-400 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono leading-relaxed"
        >
          {lang && (
            <div className="text-slate-500 text-xs mb-2 font-sans">{lang}</div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      result.push(
        <h3 key={`h3-${i}`} className="font-bold text-slate-800 mt-4 mb-1 text-sm">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      result.push(
        <h2 key={`h2-${i}`} className="font-bold text-slate-900 mt-5 mb-2 text-base">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      result.push(
        <ul key={`ul-${i}`} className="list-disc list-inside my-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-700">
              {inlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      result.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside my-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-700">
              {inlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      result.push(<div key={`space-${i}`} className="my-1" />);
      i++;
      continue;
    }

    // Regular paragraph
    result.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed my-1">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return result;
}

function inlineMarkdown(text: string): React.ReactNode {
  // **bold**, `code`, plain
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Persona Avatar ───────────────────────────────────────────────────────────

function PersonaAvatar({ persona, size = 32 }: { persona: Persona; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: persona.bgGradient,
      border: `2.5px solid ${persona.borderColor}`,
      flexShrink: 0, overflow: "hidden",
      boxShadow: `0 0 0 2px white, 0 0 0 3px ${persona.borderColor}33`,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={persona.avatarUrl}
        alt={persona.name}
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

export default function MentorChat({
  initialMessages,
  userName,
  userContext,
}: MentorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [personaId, setPersonaId] = useState("alex");
  const [showPersonaModal, setShowPersonaModal] = useState(messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activePersona = PERSONAS.find(p => p.id === personaId) ?? PERSONAS[0];
  const { voiceOn, setVoiceOn, speaking, speak, stop } = useSpeech(personaId);
  const [videoOn, setVideoOn]     = useState(false);
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, personaId }),
        });

        // Handle non-OK responses (auth errors, server errors)
        if (!response.ok) {
          let errMsg = `Server error (${response.status})`;
          try {
            const errData = await response.json();
            errMsg = errData.error ?? errMsg;
          } catch { /* ignore parse error */ }
          throw new Error(errMsg);
        }

        // Check content-type — if JSON, it's an error payload
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(errData.error ?? "Unknown error");
        }

        if (!response.body) throw new Error("No response body from server");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingContent(accumulated);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulated, createdAt: new Date() },
        ]);
        setStreamingContent("");
        speak(accumulated);
        setLastSpoken(accumulated);
      } catch (err) {
        console.error("Chat error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ **Error:** ${msg}\n\nPlease check your connection and try again.`,
            createdAt: new Date(),
          },
        ]);
        setStreamingContent("");
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden">

      {/* ── Persona select modal (shown on first load) ──────────────────── */}
      {showPersonaModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white mb-2">Choose Your Mentor</h2>
              <p className="text-slate-400 text-sm">Each mentor has a unique style, personality, and specialty. You can switch anytime.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPersonaId(p.id); setShowPersonaModal(false); }}
                  className="text-left rounded-2xl p-5 border-2 transition-all hover:scale-[1.02] hover:shadow-xl"
                  style={{ background: p.bgGradient, borderColor: p.borderColor }}
                >
                  {/* Big face */}
                  <div className="flex justify-center mb-4">
                    <div style={{
                      width: 96, height: 96, borderRadius: 48,
                      background: p.bgGradient,
                      border: `3px solid ${p.borderColor}`,
                      overflow: "hidden",
                      boxShadow: `0 8px 24px ${p.borderColor}44`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatarUrl} alt={p.name} width={96} height={96} style={{ width: "100%", height: "100%" }} />
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <p className="font-black text-slate-900 text-lg">{p.name}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: p.tagColor }}>{p.title}</p>
                    <p className="text-xs font-semibold text-slate-500">{p.company}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-600"><span className="font-bold">Specialty:</span> {p.specialty}</p>
                    <p className="text-xs text-slate-400 italic">"{p.catchphrase}"</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto">
        {/* Profile card */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{userName}</p>
              <p className="text-slate-400 text-xs">{userContext.experienceLevel}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-indigo-400 font-bold text-lg leading-none">{userContext.totalSolved}</p>
              <p className="text-slate-400 text-xs mt-0.5">Solved</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-green-400 font-bold text-lg leading-none">{userContext.strongModules.length}</p>
              <p className="text-slate-400 text-xs mt-0.5">Strong</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-amber-400 font-bold text-lg leading-none">{userContext.weakModules.length}</p>
              <p className="text-slate-400 text-xs mt-0.5">Weak</p>
            </div>
          </div>
        </div>

        {/* Mentor selector */}
        <div className="p-4 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Mentor</p>
          <div className="space-y-2">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => { stop(); setPersonaId(p.id); }}
                className="w-full text-left rounded-xl px-3 py-2.5 transition-all flex items-center gap-3 border"
                style={personaId === p.id
                  ? { background: p.bgGradient, borderColor: p.borderColor }
                  : { background: "transparent", borderColor: "transparent" }
                }
              >
                <PersonaAvatar persona={p} size={40} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold truncate", personaId === p.id ? "text-slate-900" : "text-slate-300")}>{p.name}</p>
                  <p className="text-xs truncate" style={{ color: personaId === p.id ? p.tagColor : "#64748b" }}>{p.company} · {p.specialty}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick prompts */}
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Prompts</p>
          <div className="space-y-1.5">
            {activePersona.quickPrompts.map((text) => (
              <button
                key={text}
                onClick={() => sendMessage(text)}
                disabled={isStreaming}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all",
                  isStreaming && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="leading-snug">{text}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Face / Video panel (always visible on desktop) ──────────────── */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-l border-slate-700 bg-slate-900">
        {videoOn ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4 gap-3">
            <VideoMentor
              persona={activePersona}
              textToSpeak={lastSpoken}
              onClose={() => setVideoOn(false)}
            />
            <p className="text-xs text-slate-600 text-center">Powered by D-ID</p>
          </div>
        ) : (
          /* Static face card */
          <div className="flex flex-col items-center justify-center flex-1 p-5 gap-4">
            {/* Big photo */}
            <div style={{
              width: 200, height: 200, borderRadius: 100,
              overflow: "hidden",
              border: `4px solid ${activePersona.borderColor}`,
              boxShadow: `0 0 0 6px ${activePersona.borderColor}22, 0 16px 48px ${activePersona.borderColor}44`,
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePersona.avatarUrl}
                alt={activePersona.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Name & status */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-400">Online</span>
              </div>
              <h3 className="text-white font-black text-lg">{activePersona.name}</h3>
              <p className="text-xs font-bold mt-0.5" style={{ color: activePersona.companyColor }}>
                {activePersona.company}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">{activePersona.title}</p>
            </div>

            {/* Catchphrase */}
            <div className="px-4 py-3 rounded-xl text-xs italic text-center w-full"
              style={{ background: activePersona.bgGradient, color: activePersona.tagColor, border: `1px solid ${activePersona.borderColor}44` }}>
              "{activePersona.catchphrase}"
            </div>

            {/* Speaking indicator */}
            {speaking && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: activePersona.borderColor + "22" }}>
                <div className="flex gap-0.5 items-end h-4">
                  {[3,5,7,5,3].map((h, i) => (
                    <div key={i} className="w-1 rounded-full animate-bounce"
                      style={{
                        height: h * 2,
                        background: activePersona.companyColor,
                        animationDelay: `${i * 0.1}s`,
                      }} />
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: activePersona.tagColor }}>Speaking…</span>
              </div>
            )}

            {/* Video call button */}
            <button
              onClick={() => setVideoOn(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${activePersona.borderColor}, ${activePersona.companyColor})`,
                color: "white",
                boxShadow: `0 4px 14px ${activePersona.borderColor}44`,
              }}
            >
              <Video className="w-4 h-4" />
              Start Video Call
            </button>
            <p className="text-xs text-slate-600 text-center">Requires D-ID API key</p>
          </div>
        )}
      </div>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 border-b border-slate-700 flex items-center px-5 gap-3 shrink-0"
          style={{ background: activePersona.bgGradient }}>
          <PersonaAvatar persona={activePersona} size={38} />
          <div>
            <p className="font-black text-slate-900 text-sm">{activePersona.name}</p>
            <p className="text-xs font-semibold" style={{ color: activePersona.tagColor }}>
              {activePersona.title} @ {activePersona.company} · {activePersona.specialty}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {speaking && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: activePersona.borderColor + "22", color: activePersona.tagColor }}>
                <span className="flex gap-0.5">
                  {[0,1,2,3].map(i => (
                    <span key={i} className="w-0.5 rounded-full animate-bounce"
                      style={{ height: `${8 + i * 3}px`, background: activePersona.tagColor, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </span>
                Speaking…
              </div>
            )}
            <button
              onClick={() => { if (speaking) stop(); else setVoiceOn(v => !v); }}
              title={voiceOn ? "Voice on" : "Voice off"}
              className="p-2 rounded-lg transition-colors"
              style={voiceOn
                ? { background: activePersona.borderColor + "22", color: activePersona.tagColor }
                : { background: "rgba(255,255,255,0.07)", color: "#64748b" }}
            >
              {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setVideoOn(v => !v)}
              title={videoOn ? "End video call" : "Start video call"}
              className="p-2 rounded-lg transition-colors flex items-center gap-1.5"
              style={videoOn
                ? { background: "#ef444422", color: "#ef4444" }
                : { background: activePersona.borderColor + "22", color: activePersona.tagColor }}
            >
              {videoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              <span style={{ fontSize: 11, fontWeight: 700 }}>{videoOn ? "End" : "Video"}</span>
            </button>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full pb-6">
              {/* Big persona card */}
              <div className="rounded-2xl overflow-hidden shadow-2xl w-72" style={{ border: `2px solid ${activePersona.borderColor}` }}>
                {/* Face — big */}
                <div className="relative flex justify-center items-center py-6" style={{ background: activePersona.bgGradient }}>
                  <div style={{
                    width: 160, height: 160, borderRadius: 80,
                    border: `4px solid ${activePersona.borderColor}`,
                    overflow: "hidden",
                    boxShadow: `0 12px 40px ${activePersona.borderColor}55`,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activePersona.avatarUrl} alt={activePersona.name}
                      width={160} height={160} style={{ width: "100%", height: "100%" }} />
                  </div>
                  {/* Online badge */}
                  <div className="absolute bottom-5 right-[72px] w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
                </div>

                {/* Info */}
                <div className="bg-slate-800 px-5 py-4 text-center">
                  <h2 className="text-white font-black text-lg">{activePersona.name}</h2>
                  <p className="text-xs font-bold mt-0.5" style={{ color: activePersona.companyColor }}>
                    {activePersona.company}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">{activePersona.title}</p>
                  <div className="mt-3 px-3 py-2 rounded-xl text-xs font-medium italic text-center"
                    style={{ background: activePersona.bgGradient, color: activePersona.tagColor }}>
                    "{activePersona.catchphrase}"
                  </div>
                  <p className="text-slate-500 text-xs mt-3">
                    Hi <span className="text-white font-semibold">{userName}</span> — ask me anything or pick a prompt
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} persona={activePersona} />
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <PersonaAvatar persona={activePersona} size={32} />
              </div>
              <div className="max-w-[75%] bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 px-4 py-3">
                {streamingContent ? (
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(streamingContent)}
                  </div>
                ) : (
                  <TypingDots />
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-700 bg-slate-800 shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? "Mentor is thinking..."
                  : "Ask anything — concepts, problems, mock interviews..."
              }
              disabled={isStreaming}
              rows={1}
              className={cn(
                "flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all",
                isStreaming && "opacity-60 cursor-not-allowed"
              )}
              style={{ minHeight: "48px", maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                isStreaming || !input.trim()
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, persona }: { message: ChatMessage; persona: Persona }) {
  const isUser = message.role === "user";

  const timeString = (() => {
    try {
      return format(new Date(message.createdAt), "h:mm a");
    } catch {
      return "";
    }
  })();

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          {timeString && (
            <p className="text-xs text-slate-500 mt-1 text-right">{timeString}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        <PersonaAvatar persona={persona} size={32} />
      </div>
      <div className="max-w-[75%]">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 px-4 py-3">
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(message.content)}
          </div>
        </div>
        {timeString && (
          <p className="text-xs text-slate-500 mt-1">{timeString}</p>
        )}
      </div>
    </div>
  );
}
