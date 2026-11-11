import { ChevronRight, Menu, Snowflake, X } from "lucide-react";

export function DashboardHeader({ name, menuOpen, onToggleMenu }: { name: string; menuOpen: boolean; onToggleMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-7 lg:px-9">
      <div className="flex items-center gap-3 text-xs"><button type="button" onClick={onToggleMenu} aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={menuOpen} aria-controls="dashboard-navigation" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button><span className="hidden text-slate-400 sm:inline">Workspace</span><ChevronRight className="hidden size-3 text-slate-300 sm:block" /><span className="font-medium text-slate-700">Dashboard</span></div>
      <div className="flex items-center gap-4"><span className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 sm:inline-flex"><span className="size-1.5 rounded-full bg-amber-400" />Pratinjau toko</span><span className="h-6 w-px bg-slate-200" /><span className="text-xs text-slate-500">Halo, <strong className="font-medium text-slate-800">{name.split(" ")[0]}</strong></span><span className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Snowflake className="size-4" aria-hidden="true" /></span></div>
    </header>
  );
}
