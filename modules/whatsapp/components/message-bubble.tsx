import { Check, CheckCheck, Clock3, ExternalLink, FileText, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../chat-types";

const statusLabels: Record<string, string> = { queued: "Antrean", pending: "Menunggu", sent: "Terkirim", delivered: "Diterima", read: "Dibaca", failed: "Gagal" };

function safeMediaUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; }
  catch { return null; }
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const outbound = message.direction === "outbound";
  const mediaUrl = safeMediaUrl(message.mediaUrl);
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <article aria-label={outbound ? "Pesan toko" : "Pesan pelanggan"} className={cn("max-w-[88%] rounded-2xl px-4 py-3 shadow-xs sm:max-w-[78%]", outbound ? "rounded-tr-sm bg-emerald-100 text-emerald-950" : "rounded-tl-sm border border-slate-200/60 bg-white text-slate-700")}>
        {message.type !== "text" && <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60"><FileText className="size-3" />{message.type}</p>}
        <p className="whitespace-pre-wrap break-words text-[13px] leading-6 [overflow-wrap:anywhere]">{message.content || (message.type === "unsupported" ? "Pesan ini belum didukung oleh WhatsApp API." : `[${message.type}]`)}</p>
        {mediaUrl && <a href={mediaUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4">Buka lampiran <ExternalLink className="size-3" /></a>}
        {message.error && <p className="mt-2 flex items-start gap-1 text-xs text-red-700"><TriangleAlert className="mt-0.5 size-3 shrink-0" />{message.error}</p>}
        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] text-slate-500"><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time>{outbound && <span className={cn("inline-flex items-center gap-1", message.status === "read" && "text-sky-600", message.status === "failed" && "text-red-600")}><span>{statusLabels[message.status] ?? message.status}</span>{message.status === "read" || message.status === "delivered" ? <CheckCheck className="size-3" /> : message.status === "sent" ? <Check className="size-3" /> : message.status === "failed" ? <TriangleAlert className="size-3" /> : <Clock3 className="size-3" />}</span>}</div>
      </article>
    </div>
  );
}
