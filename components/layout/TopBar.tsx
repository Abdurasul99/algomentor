"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Your learning overview and recommendations" },
  "/curriculum": { title: "Outtalent Launchpad", subtitle: "Your weekly algorithm curriculum" },
  "/mentor": { title: "AI Mentor", subtitle: "Your personal algorithm coach" },
  "/modules": { title: "Modules", subtitle: "All algorithm pattern modules" },
  "/quiz": { title: "Quiz Center", subtitle: "Test your understanding" },
  "/practice": { title: "Practice", subtitle: "Guided coding practice with hints" },
  "/review": { title: "Review Queue", subtitle: "Spaced repetition review" },
  "/training": { title: "Training Plan", subtitle: "What to do next" },
  "/path": { title: "Learning Path", subtitle: "Your structured algorithm curriculum" },
  "/settings": { title: "Settings", subtitle: "Configure your account and AI" },
  "/problems": { title: "Visual Explanation", subtitle: "Step-by-step AI visualization" },
};

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const key = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || (k !== "/" && pathname.startsWith(k)));
  const info = pageTitles[key ?? "/"] ?? { title: "Algorithm Mentor Academy", subtitle: "" };

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{info.title}</h1>
        {info.subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{info.subtitle}</p>
        )}
      </div>
      {firstName && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm text-slate-600 hidden sm:block">
            {firstName}
          </span>
        </div>
      )}
    </header>
  );
}
