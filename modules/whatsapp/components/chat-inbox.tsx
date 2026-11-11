"use client";

import { useRef, useState } from "react";
import { LoaderCircle, MessageCircle, RefreshCw, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../chat-types";
import { ConversationList } from "./conversation-list";
import { ChatThread } from "./chat-thread";
import { chatRequest, useChatInbox } from "./use-chat-inbox";

export function ChatInbox() {
  const inbox = useChatInbox();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendErrors, setSendErrors] = useState<Record<string, string | null>>({});
  const [sending, setSending] = useState(false);
  const sendBusy = useRef(false);
  const requests = useRef<Record<string, { text: string; id: string }>>({});
  const selectedConversation = inbox.thread?.conversation ?? inbox.conversations.find((item) => item.id === inbox.selectedId);

  async function sendMessage() {
    const id = inbox.selectedId;
    const text = id ? drafts[id]?.trim() : "";
    if (!id || !text || sendBusy.current) return;
    sendBusy.current = true;
    setSending(true);
    setSendErrors((previous) => ({ ...previous, [id]: null }));
    // Retry teks yang sama memakai key yang sama, termasuk bila respons jaringan hilang.
    if (requests.current[id]?.text !== text) requests.current[id] = { text, id: crypto.randomUUID() };
    try {
      const result = await chatRequest<{ message: ChatMessage }>(`/api/kirimdev/conversations/${encodeURIComponent(id)}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, requestId: requests.current[id].id }),
      });
      inbox.appendSentMessage(result.message);
      if (result.message.status === "failed") {
        setSendErrors((previous) => ({ ...previous, [id]: result.message.error ?? "Pesan gagal dikirim." }));
      } else {
        setDrafts((previous) => ({ ...previous, [id]: "" }));
      }
      delete requests.current[id];
    } catch (error) {
      setSendErrors((previous) => ({ ...previous, [id]: error instanceof Error ? error.message : "Pesan gagal dikirim. Coba lagi." }));
    } finally {
      sendBusy.current = false;
      setSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-[11px] text-slate-500"><Wifi className="size-3.5 text-emerald-600" /><span>{inbox.revision?.lastEventAt ? "Pembaruan dari webhook" : "Menunggu webhook pertama"}</span>{inbox.updatedAt && <span className="hidden text-slate-400 sm:inline">· Diperbarui {new Date(inbox.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>}</div>
        <button type="button" disabled={inbox.refreshing} onClick={() => { void inbox.refresh().catch(() => {}); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{inbox.refreshing ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}Muat ulang</button>
      </div>
      {inbox.error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">{inbox.error}</p>}
      {inbox.syncError && <p role="status" className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-800">{inbox.syncError}</p>}
      <div className="grid h-[calc(100dvh-192px)] min-h-[440px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
        <ConversationList conversations={inbox.conversations} selectedId={inbox.selectedId} loading={inbox.loading} query={query} onQueryChange={setQuery} onSelect={(id) => { void inbox.selectConversation(id); }} hasMore={Boolean(inbox.conversationCursor)} onLoadMore={() => { void inbox.loadMoreConversations(); }} loadingMore={inbox.refreshing} />
        {selectedConversation ? <ChatThread conversation={selectedConversation} thread={inbox.thread} loading={inbox.loadingThread} draft={drafts[selectedConversation.id] ?? ""} onDraftChange={(value) => { setDrafts((previous) => ({ ...previous, [selectedConversation.id]: value })); }} onBack={() => { void inbox.selectConversation(null); }} onSend={() => { void sendMessage(); }} sending={sending} sendError={sendErrors[selectedConversation.id] ?? null} onLoadOlder={() => { void inbox.loadOlderMessages(); }} /> : <div className={cn("flex-col items-center justify-center bg-[#f2f6f4] px-8 text-center", inbox.selectedId ? "flex" : "hidden md:flex")}><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white shadow-xs"><MessageCircle className="size-8 text-emerald-700" /></span><h2 className="text-lg font-semibold tracking-tight text-slate-800">Lebih dekat dengan pelanggan.</h2><p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">Pilih percakapan untuk membaca pesan dan membalas langsung dari web.</p><span className="mt-6 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[10px] text-emerald-700">Terhubung melalui API & webhook Kirimdev</span></div>}
      </div>
    </div>
  );
}
