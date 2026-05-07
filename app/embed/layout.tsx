import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visual Explanation" };

// No Providers, no Sidebar, no TopBar — clean embed for iframes
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
