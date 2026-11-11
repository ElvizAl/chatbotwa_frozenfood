"use client";

import { useId, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { rupiah, salesPeriods } from "../data/demo-data";

export function SalesChart() {
  const [period, setPeriod] = useState<keyof typeof salesPeriods>("week");
  const [selected, setSelected] = useState<number | null>(null);
  const gradientId = useId();
  const data = salesPeriods[period];
  const maximum = period === "week" ? 2000000 : 12000000;
  const x = (index: number) => 64 + index * (576 / (data.values.length - 1));
  const y = (value: number) => 204 - (value / maximum) * 174;
  const line = (values: readonly number[]) => values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");

  return (
    <section id="analitik" aria-labelledby="sales-title" className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="sales-title" className="text-sm font-semibold text-slate-900">Ringkasan penjualan</h2><p className="mt-1 text-xs text-slate-400">Perkembangan pendapatan toko · data contoh</p></div>
        <div className="flex rounded-lg bg-slate-100 p-1" aria-label="Periode penjualan">{(Object.keys(salesPeriods) as (keyof typeof salesPeriods)[]).map((key) => <button key={key} type="button" aria-pressed={key === period} onClick={() => { setPeriod(key); setSelected(null); }} className={cn("rounded-md px-3 py-1.5 text-[11px] font-medium transition", key === period ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800")}>{salesPeriods[key].label}</button>)}</div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{rupiah(data.total)}</p><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><ArrowUpRight className="size-3" />{data.change}</span></div>
      <p className="mt-1.5 text-[11px] text-slate-400">dibandingkan periode contoh sebelumnya</p>
      <div className="mt-2 flex min-h-6 justify-end text-xs text-emerald-700" aria-live="polite">{selected !== null ? `${data.labels[selected]}: ${rupiah(data.values[selected])}` : "Pilih titik untuk melihat penjualan"}</div>
      <svg viewBox="0 0 680 242" role="group" aria-label={`Grafik penjualan contoh ${data.label}`} className="mt-2 w-full overflow-visible">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity="0.16" /><stop offset="100%" stopColor="#059669" stopOpacity="0.01" /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map((tick) => { const value = maximum * tick / 4; return <g key={tick}><line x1="64" x2="640" y1={y(value)} y2={y(value)} stroke="#e8edf2" strokeDasharray="4 5" /><text x="48" y={y(value) + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{value === 0 ? "0" : `${value / 1000000} jt`}</text></g>; })}
        <path d={`${line(data.values)} L640,204 L64,204 Z`} fill={`url(#${gradientId})`} />
        <path d={line(data.previous)} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" strokeLinejoin="round" />
        <path d={line(data.values)} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.values.map((value, index) => <g key={`${period}-${index}`}><text x={x(index)} y="232" textAnchor="middle" fill="#94a3b8" fontSize="11">{data.labels[index]}</text><circle cx={x(index)} cy={y(value)} r={selected === index ? 6 : 4} fill="white" stroke="#059669" strokeWidth="2.5" /><circle cx={x(index)} cy={y(value)} r="15" fill="transparent" role="button" tabIndex={0} aria-label={`${data.labels[index]}: ${rupiah(value)}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setSelected(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(index); } }} className="cursor-pointer focus:outline-emerald-600" /></g>)}
      </svg>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-4 text-[10px] text-slate-500"><span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded bg-emerald-600" />Periode ini</span><span className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed border-slate-300" />Periode sebelumnya</span></div>
    </section>
  );
}
