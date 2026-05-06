import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Mastered": return "text-green-700 bg-green-50 border-green-200";
    case "Completed": return "text-blue-700 bg-blue-50 border-blue-200";
    case "InProgress": return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case "Solved": return "text-green-700 bg-green-50 border-green-200";
    case "Retry": return "text-red-700 bg-red-50 border-red-200";
    default: return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Beginner": return "text-green-700 bg-green-50";
    case "Easy": return "text-blue-700 bg-blue-50";
    case "Medium": return "text-yellow-700 bg-yellow-50";
    case "Hard": return "text-red-700 bg-red-50";
    default: return "text-slate-600 bg-slate-50";
  }
}

export function getMasteryLabel(score: number): string {
  if (score >= 80) return "Mastered";
  if (score >= 60) return "Proficient";
  if (score >= 40) return "Learning";
  if (score >= 20) return "Beginner";
  return "Not Started";
}

export function getMasteryColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (score >= 20) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export function getConfidenceColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}
