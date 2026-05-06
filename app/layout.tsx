import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import Providers from "@/components/layout/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Algorithm Mentor Academy",
  description: "Learn algorithms from zero to interview readiness with guided mentorship",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <Providers>
          <AppShellWrapper
            sidebar={<Sidebar />}
            topBar={<TopBar />}
          >
            {children}
          </AppShellWrapper>
        </Providers>
      </body>
    </html>
  );
}
