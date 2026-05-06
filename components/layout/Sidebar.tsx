"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  BookOpen,
  Brain,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  Lightbulb,
  Zap,
  Sparkles,
  LogOut,
  Settings,
  Download,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/path", label: "Learning Path", icon: Map },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/quiz", label: "Quiz Center", icon: Brain },
  { href: "/practice", label: "Practice", icon: ClipboardList },
  { href: "/review", label: "Review Queue", icon: CalendarCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/training", label: "Training Plan", icon: Zap },
  { href: "/curriculum", label: "Curriculum", icon: GraduationCap },
  { href: "/reflection", label: "Reflection", icon: Lightbulb },
  { href: "/mentor", label: "AI Mentor", icon: Sparkles },
  { href: "/import", label: "Import Progress", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Learner";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">Algorithm</div>
            <div className="text-indigo-600 font-semibold text-xs">Mentor Academy</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
            {userEmail && (
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
