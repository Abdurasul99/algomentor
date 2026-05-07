"use client";

import Link from "next/link";
import { User, Shield, Bell, Code2, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm">
        {[
          {
            icon: User,
            label: "Profile",
            sub: "Your name, email and experience level",
            href: "#",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: Code2,
            label: "LeetCode Integration",
            sub: "Sync your LeetCode account to track solved problems",
            href: "/import",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: Shield,
            label: "Privacy & Security",
            sub: "Password and account security",
            href: "#",
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            icon: Bell,
            label: "Notifications",
            sub: "Email and reminder preferences",
            href: "#",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map(({ icon: Icon, label, sub, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
