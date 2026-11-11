"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { ChatConversation, ChatThread as Thread } from "../chat-types";
import { MessageBubble } from "./message-bubble";
import { contactInitials } from "./conversation-list";

export function ChatThread({ conversation, thread, loading, draft, onDraftChange, onBack, onSend, sending, sendError, onLoadOlder }: {
  conversation: ChatConversation; thread?: Thread; loading: boolean; draft: string;
  onDraftChange: (value: string) => void; onBack: () => void; onSend: () => void;
  sending: boolean; sendError: string | null; onLoadOlder: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = thread?.data.at(-1)?.id;

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lastMessageId, conversation.id]);

  const recentInbound = conversation.lastInboundAt ? Date.parse(conversation.lastInboundAt) : NaN;
  const [replyWindow, setReplyWindow] = useState<{ timestamp: number | null; open: boolean }>({
    timestamp: null,
    open: false,
  });

  useEffect(() => {
    function updateReplyWindow() {
      const now = Date.now();
      const open = Number.isFinite(recentInbound) && recentInbound <= now && now - recentInbound < 86_400_000;
      setReplyWindow({ timestamp: recentInbound, open });

      const nextChange = recentInbound > now ? recentInbound : recentInbound + 86_400_000;
      if (Number.isFinite(nextChange) && nextChange > now) {
        timer = setTimeout(updateReplyWindow, Math.min(nextChange - now, 2_147_483_647));
      }
    }

    // Baca waktu setelah mount; render server dan render awal client tetap sama.
    let timer = setTimeout(updateReplyWindow, 0);
    return () => clearTimeout(timer);
  }, [recentInbound]);

  const canReply = replyWindow.timestamp === recentInbound && replyWindow.open;

  return (
    <section aria-label={`Percakapan dengan ${conversation.name}`} className="flex min-h-0 min-w-0 flex-col bg-[#f2f6f4]">
      <div className="flex min-h-[78px] items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Kembali ke daftar chat" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"><ArrowLeft className="size-5" /></button>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">{contactInitials(conversation.name)}</span>
        <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-slate-800">{conversation.name}</h2><p className="mt-0.5 text-[11px] text-slate-400">{conversation.phone ?? "Kontak WhatsApp"}</p></div>
        <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-slate-400 sm:inline-flex"><ShieldCheck className="size-3.5" />Via Kirimdev</span>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-busy={loading}>
        {thread?.nextCursor && <button type="button" disabled={loading} onClick={onLoadOlder} className="mx-auto block rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-500 hover:text-emerald-700 disabled:opacity-50">{loading ? "Memuat…" : "Muat pesan sebelumnya"}</button>}
        {!thread && loading && <p role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400"><LoaderCircle className="size-4 animate-spin" />Memuat pesan…</p>}
        {thread?.data.length === 0 && <div className="py-16 text-center text-slate-400"><MessageCircle className="mx-auto mb-3 size-8" /><p className="text-xs">Belum ada pesan pada percakapan ini.</p></div>}
        {thread?.data.map((message, index) => <div key={message.id}>{(index === 0 || new Date(message.createdAt).toDateString() !== new Date(thread.data[index - 1].createdAt).toDateString()) && <div className="mb-5 text-center"><time dateTime={message.createdAt} className="rounded-full bg-white/80 px-3 py-1 text-[9px] text-slate-400">{new Date(message.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time></div>}<MessageBubble message={message} /></div>)}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); onSend(); }} className="border-t border-slate-200 bg-white p-4">
        {!canReply && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">Balasan teks tersedia selama 24 jam setelah pesan terakhir pelanggan. Tunggu pesan baru atau kirim template melalui Kirimdev.</p>}
        {sendError && <p role="alert" className="mb-3 text-xs leading-5 text-red-600">{sendError}</p>}
        <div className="flex items-end gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Tulis balasan untuk {conversation.name}</span><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} maxLength={4096} rows={2} disabled={!thread || !canReply || sending} placeholder="Tulis balasan…" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (draft.trim() && canReply && !sending && thread) onSend(); } }} className="max-h-36 min-h-12 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50" /></label><button type="submit" disabled={!thread || !draft.trim() || !canReply || sending} aria-label="Kirim balasan WhatsApp" className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-40">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>
        <p className="mt-2 text-[9px] text-slate-400">Enter untuk kirim · Shift + Enter untuk baris baru · {draft.length}/4096</p>
      </form>
    </section>
  );
}
