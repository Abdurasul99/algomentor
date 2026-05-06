"use client";

import { usePathname } from "next/navigation";

interface AppShellWrapperProps {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders the full app shell (sidebar + top bar) for regular pages,
 * but renders only {children} for /auth/* and /onboarding routes,
 * allowing those pages to have their own full-screen standalone layouts.
 */
export default function AppShellWrapper({ sidebar, topBar, children }: AppShellWrapperProps) {
  const pathname = usePathname();
  const isStandalonePage =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {topBar}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
