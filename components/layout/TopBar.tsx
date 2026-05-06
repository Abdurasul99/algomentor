"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Your learning overview and mentor recommendations" },
  "/path": { title: "Learning Path", subtitle: "Your structured algorithm curriculum" },
  "/modules": { title: "Modules", subtitle: "All algorithm pattern modules" },
  "/quiz": { title: "Quiz Center", subtitle: "Test your understanding with concept checks" },
  "/practice": { title: "Practice", subtitle: "Guided coding practice with hints" },
  "/review": { title: "Review Queue", subtitle: "Spaced repetition for long-term retention" },
  "/analytics": { title: "Analytics", subtitle: "Deep dive into your learning progress" },
  "/training": { title: "Training Plan", subtitle: "Your personalized next steps" },
  "/reflection": { title: "Reflection", subtitle: "Weekly learning review and insights" },
};

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const key = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || (k !== "/" && pathname.startsWith(k)));
  const info = pageTitles[key ?? "/"] ?? { title: "Algorithm Mentor Academy", subtitle: "" };

  const userName = session?.user?.name ?? "Learner";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{info.title}</h1>
        {info.subtitle && <p className="text-sm text-slate-500 mt-0.5">{info.subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{userInitial}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              Hey, {userName.split(" ")[0]}
            </span>
          </div>
        )}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {session?.user && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
