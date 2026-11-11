"use client";

import { ChevronRight, LogOut, MessageCircle, Snowflake, Wifi, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import type { DashboardUser } from "./dashboard-shell";
import Link from "next/link";

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"><LogOut className="size-[18px]" aria-hidden="true" />{pending ? "Sedang keluar…" : "Keluar akun"}</button>;
}

export function DashboardSidebar({ user, logout, open, onClose, activePage = "connection" }: { user: DashboardUser; logout: () => Promise<void>; open: boolean; onClose: () => void; activePage?: "connection" | "chat" }) {
  return (
    <>
      {open && <button type="button" onClick={onClose} className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden" aria-label="Tutup menu navigasi" />}
      <aside id="dashboard-navigation" aria-label="Navigasi dashboard" className={cn("fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r border-slate-200/80 bg-white lg:translate-x-0", open ? "translate-x-0" : "invisible -translate-x-full lg:visible")}>
        <div className="flex h-[76px] shrink-0 items-center justify-between px-6">
          <Link href="/#whatsapp" onClick={onClose} className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white"><Snowflake className="size-[22px]" aria-hidden="true" /></span><span>frozen<span className="text-emerald-700">food.</span></span></Link>
          <button type="button" onClick={onClose} className="rounded p-1 lg:hidden" aria-label="Tutup navigasi"><X className="size-4" /></button>
        </div>
        <nav aria-label="Menu utama" className="mt-6 px-4">
          <Link href="/chat" onClick={onClose} aria-current={activePage === "chat" ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600", activePage === "chat" ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50")}>
            <MessageCircle className="size-[18px]" aria-hidden="true" />
            Chat WhatsApp
            {activePage === "chat" && <ChevronRight className="ml-auto size-3.5" aria-hidden="true" />}
          </Link>
        </nav>
        <nav aria-label="Pengaturan koneksi" className="mt-auto px-4 pb-4 pt-6">
          <Link
            href="/"
            onClick={onClose}
            aria-current={activePage === "connection" ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600", activePage === "connection" ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "text-slate-500 hover:bg-slate-50")}
          >
            <Wifi className="size-[18px]" aria-hidden="true" />
            Cek koneksi
            {activePage === "connection" && <ChevronRight className="ml-auto size-3.5" aria-hidden="true" />}
          </Link>
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="mb-3 flex items-center gap-3 px-2"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-800">{user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{user.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{user.email}</p></div></div>
          <form action={logout}><LogoutButton /></form>
        </div>
      </aside>
    </>
  );
}
