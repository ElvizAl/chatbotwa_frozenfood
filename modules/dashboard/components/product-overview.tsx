import { ArrowUpRight, Package, TriangleAlert } from "lucide-react";
import { products } from "../data/demo-data";
import { cn } from "@/lib/utils";

export function ProductOverview() {
  const lowStock = products.filter((product) => product.stock < 10);
  return (
    <section id="produk" aria-labelledby="products-title" className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between"><h2 id="products-title" className="text-sm font-semibold text-slate-900">Produk terlaris</h2><ArrowUpRight className="size-4 text-slate-400" aria-hidden="true" /></div>
      <p className="mt-1 text-xs text-slate-400">Favorit pelanggan · data contoh 7 hari</p>
      <div className="mt-5 divide-y divide-slate-100">{products.map((product, index) => <div key={product.name} className="flex items-center gap-3 py-4 first:pt-0"><span className="w-2 text-[10px] text-slate-400">{index + 1}</span><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", product.color)}><Package className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{product.name}</p><p className="mt-1 text-[10px] text-slate-400">{product.detail}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-800">{product.sold}</p><p className="mt-1 text-[10px] text-slate-400">terjual</p></div></div>)}</div>
      <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5"><div className="flex items-center gap-2 text-xs font-semibold text-amber-800"><TriangleAlert className="size-3.5" />{lowStock.length} produk perlu restok</div><div className="mt-3 space-y-2">{lowStock.map((product) => <p key={product.name} className="flex justify-between gap-2 text-[11px] text-amber-800/80"><span>{product.name}</span><span className="font-medium">Sisa {product.stock}</span></p>)}</div><p className="mt-3 border-t border-amber-200/60 pt-2 text-[10px] text-amber-700">Peringatan contoh untuk stok di bawah 10.</p></div>
    </section>
  );
}
