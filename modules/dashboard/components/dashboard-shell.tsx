"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

export type DashboardUser = { name: string; email: string };

export function DashboardShell({ children, user, logout, activePage = "connection" }: { children: ReactNode; user: DashboardUser; logout: () => Promise<void>; activePage?: "connection" | "chat" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div lang="id" className="min-h-screen bg-[#f7f9fb] text-slate-800 selection:bg-emerald-100">
      <a href="#konten" className="sr-only z-50 rounded-lg bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Lewati ke konten</a>
      <DashboardSidebar user={user} logout={logout} open={menuOpen} onClose={() => setMenuOpen(false)} activePage={activePage} />
      <div className="lg:pl-60">
        <DashboardHeader name={user.name} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} title={activePage === "chat" ? "Chat WhatsApp" : "Cek koneksi"} />
        <main id="konten" className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-7 sm:px-7 lg:px-9 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
