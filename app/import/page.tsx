"use client";

import { useState } from "react";
import { CheckCircle, Circle, Upload, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { slug: "arrays-hashing",      name: "Arrays & Hashing",       order: 1 },
  { slug: "two-pointers",         name: "Two Pointers",            order: 2 },
  { slug: "sliding-window",       name: "Sliding Window",          order: 3 },
  { slug: "stack",                name: "Stack",                   order: 4 },
  { slug: "binary-search",        name: "Binary Search",           order: 5 },
  { slug: "linked-list",          name: "Linked List",             order: 6 },
  { slug: "trees",                name: "Trees",                   order: 7 },
  { slug: "backtracking",         name: "Backtracking",            order: 8 },
  { slug: "heap-priority-queue",  name: "Heap / Priority Queue",   order: 9 },
  { slug: "graphs",               name: "Graphs",                  order: 10 },
  { slug: "dynamic-programming",  name: "Dynamic Programming",     order: 11 },
];

type ModuleStatus = "NotStarted" | "InProgress" | "Completed" | "Mastered";

interface ModuleImport {
  slug: string;
  status: ModuleStatus;
  quizScore: number;
  practiceScore: number;
  confidenceAverage: number;
  theoryCompleted: boolean;
  problemsSolved: number;
}

const STATUS_OPTIONS: { value: ModuleStatus; label: string; color: string }[] = [
  { value: "NotStarted",  label: "Not Started",  color: "bg-slate-100 text-slate-600" },
  { value: "InProgress",  label: "In Progress",  color: "bg-blue-100 text-blue-700" },
  { value: "Completed",   label: "Completed",    color: "bg-indigo-100 text-indigo-700" },
  { value: "Mastered",    label: "Mastered",     color: "bg-green-100 text-green-700" },
];

export default function ImportPage() {
  const [modules, setModules] = useState<ModuleImport[]>(
    MODULES.map((m) => ({
      slug: m.slug,
      status: "NotStarted",
      quizScore: 0,
      practiceScore: 0,
      confidenceAverage: 0,
      theoryCompleted: false,
      problemsSolved: 0,
    }))
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(slug: string, field: keyof ModuleImport, value: string | number | boolean) {
    setModules((prev) =>
      prev.map((m) => (m.slug === slug ? { ...m, [field]: value } : m))
    );
  }

  function quickSet(slug: string, status: ModuleStatus) {
    const defaults: Record<ModuleStatus, Partial<ModuleImport>> = {
      NotStarted:  { theoryCompleted: false, quizScore: 0,  practiceScore: 0,  confidenceAverage: 0  },
      InProgress:  { theoryCompleted: true,  quizScore: 40, practiceScore: 30, confidenceAverage: 40 },
      Completed:   { theoryCompleted: true,  quizScore: 65, practiceScore: 60, confidenceAverage: 60 },
      Mastered:    { theoryCompleted: true,  quizScore: 85, practiceScore: 80, confidenceAverage: 80 },
    };
    setModules((prev) =>
      prev.map((m) => (m.slug === slug ? { ...m, status, ...defaults[status] } : m))
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/import/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Save failed");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const startedCount = modules.filter((m) => m.status !== "NotStarted").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import Your Progress</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Already studied on OutTalent, LeetCode, or NeetCode? Mark what you&apos;ve done — we&apos;ll sync your progress.
            </p>
          </div>
          <a
            href="https://launchpad.outtalent.com/home"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            OutTalent <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full font-semibold">{startedCount} / {MODULES.length} modules marked</span>
          <span className="text-indigo-200">Quick-select status per module, then save</span>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-2">
        {MODULES.map((mod) => {
          const data = modules.find((m) => m.slug === mod.slug)!;
          const isOpen = expanded === mod.slug;
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === data.status)!;

          return (
            <div
              key={mod.slug}
              className={cn(
                "bg-white border rounded-xl overflow-hidden transition-all",
                data.status === "Mastered"  ? "border-green-200" :
                data.status === "Completed" ? "border-indigo-200" :
                data.status === "InProgress"? "border-blue-200" :
                "border-slate-200"
              )}
            >
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {mod.order}
                </div>
                <span className="font-semibold text-slate-800 flex-1 text-sm">{mod.name}</span>

                {/* Quick status buttons */}
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => quickSet(mod.slug, s.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all border",
                        data.status === s.value
                          ? s.color + " border-current scale-105 shadow-sm"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Expand for fine-tuning */}
                <button
                  onClick={() => setExpanded(isOpen ? null : mod.slug)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded fine-tuning */}
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={data.theoryCompleted}
                      onChange={(e) => update(mod.slug, "theoryCompleted", e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">Theory / concepts completed</span>
                  </label>

                  {[
                    { label: "Quiz Score %",     field: "quizScore"          as const },
                    { label: "Practice Score %", field: "practiceScore"      as const },
                    { label: "Confidence %",     field: "confidenceAverage"  as const },
                    { label: "Problems Solved",  field: "problemsSolved"     as const },
                  ].map(({ label, field }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{label}</label>
                      <input
                        type="number"
                        min={0}
                        max={field === "problemsSolved" ? 999 : 100}
                        value={data[field] as number}
                        onChange={(e) => update(mod.slug, field, Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      {saved ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-5">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-bold text-green-800">Progress imported successfully!</p>
            <p className="text-green-600 text-sm mt-0.5">Your dashboard and analytics now reflect your OutTalent progress.</p>
          </div>
          <a href="/" className="ml-auto text-sm font-semibold text-green-700 underline">Go to Dashboard →</a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-slate-800">Ready to import?</p>
            <p className="text-sm text-slate-500">This will update your module progress scores across the platform.</p>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {saving ? "Saving…" : "Save Progress"}
          </button>
        </div>
      )}

      {/* Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">How to fill this in from OutTalent:</p>
        <p>• <strong>In Progress</strong> = you started the topic but haven&apos;t finished all tasks</p>
        <p>• <strong>Completed</strong> = you finished all tasks in the module on OutTalent</p>
        <p>• <strong>Mastered</strong> = you completed + can explain clearly + solved hard problems</p>
        <p>• Use the expand arrow ↓ to set exact scores if you know them</p>
      </div>
    </div>
  );
}
