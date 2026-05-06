"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Brain,
  Send,
  Zap,
  User,
  BookOpen,
  Code2,
  Target,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

export default function MentorChat({
  initialMessages,
  userName,
  userContext,
}: MentorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          body: JSON.stringify({ message: trimmed }),
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
    // Override the default `p-6` padding from the app shell main wrapper
    <div className="-m-6 flex h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden">
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
              <p className="text-indigo-400 font-bold text-lg leading-none">
                {userContext.totalSolved}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Solved</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-green-400 font-bold text-lg leading-none">
                {userContext.strongModules.length}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Strong</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-amber-400 font-bold text-lg leading-none">
                {userContext.weakModules.length}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Weak</p>
            </div>
          </div>

          {userContext.weakModules.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Focus areas</p>
              <div className="flex flex-wrap gap-1">
                {userContext.weakModules.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Prompts
          </p>
          <div className="space-y-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.text)}
                disabled={isStreaming}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 group",
                  isStreaming && "opacity-50 cursor-not-allowed"
                )}
              >
                <qp.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:text-indigo-300" />
                <span className="leading-snug">{qp.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-5 gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI Mentor</p>
            <p className="text-xs text-slate-400">Personalized to your progress</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <div className="w-16 h-16 rounded-full bg-indigo-900/50 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">
                Hi {userName}, I&apos;m your AI Mentor
              </h2>
              <p className="text-slate-400 text-sm max-w-md">
                I know your progress, your weak areas, and your goals. Ask me
                anything about algorithms, request a problem, or start a mock
                interview.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4 text-white" />
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

function MessageBubble({ message }: { message: ChatMessage }) {
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
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
        <Brain className="w-4 h-4 text-white" />
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
