"use client";

import { useState } from "react";
import { ArrowUpRight, Search, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { orders, rupiah, type Order } from "../data/demo-data";

const statusColors: Record<Order["status"], string> = {
  Diproses: "bg-blue-50 text-blue-700", Dikirim: "bg-violet-50 text-violet-700", Selesai: "bg-emerald-50 text-emerald-700", Menunggu: "bg-amber-50 text-amber-700",
};

export function RecentOrders() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua status");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const filteredOrders = orders.filter((order) => (status === "Semua status" || order.status === status) && `${order.id} ${order.customer} ${order.product}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section id="pesanan" aria-labelledby="orders-title" className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="p-5 pb-4 sm:p-6 sm:pb-4"><div className="flex items-center justify-between gap-3"><div><h2 id="orders-title" className="text-sm font-semibold text-slate-900">Pesanan terbaru</h2><p className="mt-1 text-xs text-slate-400">Setiap pesanan, satu langkah lebih maju.</p></div><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">Data contoh</span></div>
        <div className="mt-5 flex flex-wrap gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Cari pesanan</span><Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau pesanan…" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label><span className="sr-only">Filter status pesanan</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 focus:outline-emerald-600">{["Semua status", "Menunggu", "Diproses", "Dikirim", "Selesai"].map((option) => <option key={option}>{option}</option>)}</select></label></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><caption className="sr-only">Daftar pesanan contoh, gunakan tombol detail untuk informasi produk.</caption><thead className="border-y border-slate-100 bg-slate-50/70 text-[10px] font-medium text-slate-400"><tr><th scope="col" className="px-6 py-3 font-medium">PESANAN / PELANGGAN</th><th scope="col" className="px-3 py-3 font-medium">TOTAL</th><th scope="col" className="px-3 py-3 font-medium">STATUS</th><th scope="col" className="px-5 py-3"><span className="sr-only">Detail</span></th></tr></thead><tbody className="divide-y divide-slate-100">{filteredOrders.map((order) => <tr key={order.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-500">{order.initials}</span><div><p className="font-medium text-slate-800">{order.customer}</p><p className="mt-1 text-[10px] text-slate-400">#{order.id} <span className="mx-1">·</span> {order.time}</p></div></div></td><td className="px-3 py-4 font-medium whitespace-nowrap text-slate-700 tabular-nums">{rupiah(order.total)}</td><td className="px-3 py-4"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium", statusColors[order.status])}><span className="size-1 rounded-full bg-current" />{order.status}</span></td><td className="px-5 py-4"><button type="button" onClick={() => setSelectedOrder(order)} aria-label={`Detail pesanan ${order.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-emerald-600"><ArrowUpRight className="size-4" /></button></td></tr>)}</tbody></table></div>
      {filteredOrders.length === 0 && <div className="px-6 py-12 text-center"><ShoppingBag className="mx-auto mb-3 size-7 text-slate-300" /><p className="text-sm font-medium text-slate-700">Pesanan tidak ditemukan</p><p className="mt-1 text-xs text-slate-400">Coba kata kunci atau status lainnya.</p><button type="button" onClick={() => { setQuery(""); setStatus("Semua status"); }} className="mt-4 text-xs font-medium text-emerald-700 hover:underline">Reset filter</button></div>}
      <p className="border-t border-slate-100 px-6 py-3.5 text-[11px] text-slate-400" aria-live="polite">Menampilkan {filteredOrders.length} dari {orders.length} pesanan contoh</p>
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Pesanan #{selectedOrder?.id}</DialogTitle><DialogDescription>Detail pesanan contoh. Transaksi ini tidak tersimpan di database.</DialogDescription></DialogHeader>{selectedOrder && <dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Pelanggan</dt><dd className="font-medium">{selectedOrder.customer}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Produk</dt><dd className="text-right font-medium">{selectedOrder.product}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Jumlah</dt><dd>{selectedOrder.quantity} kemasan</dd></div><div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className={cn("rounded-full px-2 py-1 text-xs", statusColors[selectedOrder.status])}>{selectedOrder.status}</dd></div><div className="flex justify-between border-t pt-4 font-semibold"><dt>Total</dt><dd>{rupiah(selectedOrder.total)}</dd></div></dl>}</DialogContent>
      </Dialog>
    </section>
  );
}
