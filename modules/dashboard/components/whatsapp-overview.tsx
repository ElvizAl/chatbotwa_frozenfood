"use client";

import { useState } from "react";
import { Bot, CheckCheck, ChevronDown, LoaderCircle, MessageCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { KirimConnectionResult } from "@/modules/whatsapp/types";

export function WhatsappOverview() {
  const [checking, setChecking] = useState(false);
  const [connection, setConnection] = useState<KirimConnectionResult | null>(null);

  async function checkConnection() {
    setChecking(true);

    try {
      const response = await fetch("/api/kirimdev/status", { cache: "no-store" });
      const result = await response.json() as KirimConnectionResult;

      if (typeof result.message !== "string" || typeof result.state !== "string") {
        throw new Error("InvalidStatusResponse");
      }

      setConnection(result);
    } catch {
      setConnection({
        state: "error",
        message: "Tidak dapat memeriksa koneksi. Periksa jaringan dan coba lagi.",
        webhookConfigured: false,
      });
    } finally {
      setChecking(false);
    }
  }

  const connected = connection?.state === "connected";
  const statusLabel = checking ? "Memeriksa…"
    : connected ? "Terhubung"
    : connection ? "Perlu diperiksa" : "Belum diperiksa";

  return (
    <section id="whatsapp" aria-labelledby="whatsapp-title" className="flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="bg-[#123e35] p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10"><MessageCircle className="size-5" aria-hidden="true" /></span>
          <span role="status" className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-emerald-100">
            {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}{statusLabel}
          </span>
        </div>
        <h1 id="whatsapp-title" className="mt-5 text-lg font-semibold tracking-tight">WhatsApp Overview</h1>
        <p className="mt-2 text-xs leading-5 text-emerald-100/65">Bantu pelanggan menemukan produk dan memesan melalui WhatsApp.</p>
        <button type="button" disabled={checking} onClick={checkConnection} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white/10 text-xs font-medium transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60">
          {checking ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {checking ? "Memeriksa koneksi…" : "Cek koneksi Kirimdev"}
        </button>
        <div aria-live="polite" aria-atomic="true">
          {connection && !checking && <div className="mt-3 space-y-1 text-[11px] leading-5 text-emerald-50">
            <p>{connection.message}</p>
            {connection.account?.phoneNumber && <p className="font-medium">{connection.account.name} · {connection.account.phoneNumber}</p>}
            {!connection.webhookConfigured && <p className="text-amber-200">Signing secret webhook belum terkonfigurasi atau belum dapat diperiksa.</p>}
          </div>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400"><Bot className="size-3.5" />Contoh percakapan</div>
        <div className="self-end rounded-2xl rounded-tr-sm bg-slate-100 px-3.5 py-2.5 text-[11px] leading-5 text-slate-600">Kak, chicken nugget masih ada?</div>
        <div className="mr-6 mt-3 rounded-2xl rounded-tl-sm bg-emerald-50 px-3.5 py-2.5 text-[11px] leading-5 text-emerald-900">Halo Kak! Chicken Nugget 500 g tersedia, harganya Rp45.000. Mau pesan berapa kemasan?<div className="mt-1 flex justify-end"><CheckCheck className="size-3 text-emerald-500" /></div></div>
        <details className="group mt-5 border-t border-slate-100 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-slate-600 focus-visible:outline-emerald-600">Pengaturan webhook <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
          <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-500">
            <p>Daftarkan URL HTTPS publik aplikasi dengan path berikut di dashboard Kirimdev:</p>
            <code className="block break-all rounded bg-slate-50 p-2 text-[10px] text-slate-700">/api/webhooks/kirimdev</code>
            <p>Pilih event <code>message.received</code> dan <code>message.status</code>. Signing secret harus sesuai dengan <code>KIRIMDEV_WEBHOOK_SECRET</code>.</p>
            <p>Webhook saat ini memverifikasi penerimaan. Penyimpanan pesan dan balasan chatbot belum diaktifkan; percakapan di atas adalah contoh.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
