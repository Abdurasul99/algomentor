"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Brain,
  ClipboardList,
  CalendarCheck,
  Zap,
  Sparkles,
  LogOut,
  Settings,
  Map,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const primaryNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/curriculum", label: "Outtalent Launchpad", icon: GraduationCap },
  { href: "/mentor", label: "AI Mentor", icon: Sparkles },
];

const learningNav = [
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: ClipboardList },
  { href: "/quiz", label: "Quiz Center", icon: Brain },
  { href: "/review", label: "Review Queue", icon: CalendarCheck },
  { href: "/training", label: "Training Plan", icon: Zap },
  { href: "/path", label: "Learning Path", icon: Map },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Learner";
  const userInitial = userName.charAt(0).toUpperCase();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-60 bg-slate-900 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">Algorithm Mentor</p>
            <p className="text-indigo-400 text-xs">Academy</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Primary */}
        <div className="space-y-0.5">
          {primaryNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive(href)
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive(href) && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          ))}
        </div>

        {/* Learning */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
            Learning
          </p>
          <div className="space-y-0.5">
            {learningNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive(href)
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User + Settings */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
            isActive("/settings")
              ? "bg-slate-800 text-white"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{userName}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
