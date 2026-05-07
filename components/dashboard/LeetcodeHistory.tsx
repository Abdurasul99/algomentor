"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ExternalLink, ArrowRight, RefreshCw, User } from "lucide-react";

interface Submission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  leetcodeUrl: string;
}

interface ApiResponse {
  submissions?: Submission[];
  username?: string;
  error?: string;
  noUsername?: boolean;
  rateLimited?: boolean;
}

function relativeTime(timestamp: string): string {
  const ts = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  const diff = now - ts;

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
}

export default function LeetcodeHistory() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leetcode/history")
      .then((r) => r.json())
      .then((d: ApiResponse) => setData(d))
      .catch(() => setData({ error: "Failed to load submissions" }))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-52 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-48 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
              </div>
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No username configured
  if (data?.noUsername) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">Sync Your LeetCode Activity</p>
          <p className="text-xs text-slate-500 mt-1">
            Add your LeetCode username in settings to track recent accepted submissions here.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Add LeetCode Username <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Rate limited or error
  if (data?.rateLimited || (data?.error && !data?.submissions)) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center">
        <RefreshCw className="w-5 h-5 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          {data?.rateLimited
            ? "LeetCode is rate-limiting requests. Try again in a few minutes."
            : data?.error}
        </p>
      </div>
    );
  }

  const submissions = data?.submissions ?? [];

  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
        <CheckCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No recent accepted submissions found for <strong>{data?.username}</strong>.</p>
      </div>
    );
  }

  const recent = submissions.slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Recent LeetCode Submissions
        </h2>
        <span className="text-xs text-slate-400">{data?.username}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {recent.map((sub) => (
          <div key={sub.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={sub.leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-800 truncate hover:text-indigo-700 flex items-center gap-1 group/link"
              >
                <span className="truncate">{sub.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
              <span className="inline-flex items-center gap-1 mt-0.5">
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">
                  Accepted
                </span>
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-slate-400">{relativeTime(sub.timestamp)}</span>
              <Link
                href={`/solve?problem=${encodeURIComponent(sub.title)}`}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Solve here <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      {submissions.length > 5 && (
        <div className="px-5 py-3 border-t border-slate-100">
          <a
            href={`https://leetcode.com/${data?.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            View all on LeetCode <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
