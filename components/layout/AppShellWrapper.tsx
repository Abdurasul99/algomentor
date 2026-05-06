"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface AppShellWrapperProps {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShellWrapper({ sidebar, topBar, children }: AppShellWrapperProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isStandalonePage =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  if (isStandalonePage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-60 z-10">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900 text-sm">Algorithm Mentor Academy</span>
        </div>

        {/* Desktop topbar */}
        <div className="hidden lg:block">
          {topBar}
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
