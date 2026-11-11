import { ArrowUpRight, Banknote, MessageCircle, ShoppingBag, Users } from "lucide-react";

const stats = [
  { label: "Total penjualan", value: "Rp8.450.000", change: "+18,6%", icon: Banknote, bars: [3, 5, 4, 7, 5, 8, 10] },
  { label: "Pesanan masuk", value: "128", change: "+12,3%", icon: ShoppingBag, bars: [5, 3, 6, 5, 7, 6, 9] },
  { label: "Pelanggan baru", value: "42", change: "+8,2%", icon: Users, bars: [3, 4, 3, 6, 5, 7, 8] },
  { label: "Percakapan chatbot", value: "356", change: "+24,5%", icon: MessageCircle, bars: [2, 4, 3, 5, 7, 6, 10] },
];

export function StatsCards() {
  return <div className="grid gap-4 sm:grid-cols-2 min-[1360px]:grid-cols-4">{stats.map(({ label, value, change, icon: Icon, bars }) => <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs shadow-slate-200/20"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><Icon className="size-[18px] text-slate-400" aria-hidden="true" /></div><p className="text-[27px] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p><div className="mt-4 flex items-end justify-between gap-2"><div><span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700"><ArrowUpRight className="size-3" />{change}</span><p className="mt-1 text-[10px] text-slate-400">7 hari terakhir · data contoh</p></div><div className="flex h-8 items-end gap-[3px]" aria-hidden="true">{bars.map((bar, index) => <span key={index} className={index === bars.length - 1 ? "w-1.5 rounded-t-sm bg-emerald-600" : "w-1.5 rounded-t-sm bg-emerald-100"} style={{ height: `${bar * 3}px` }} />)}</div></div></article>)}</div>;
}
