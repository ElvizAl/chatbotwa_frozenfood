import { LoaderCircle, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "../chat-types";

export function contactInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

export function ConversationList({ conversations, selectedId, loading, query, onQueryChange, onSelect, hasMore, onLoadMore, loadingMore }: {
  conversations: ChatConversation[]; selectedId: string | null; loading: boolean; query: string;
  onQueryChange: (query: string) => void; onSelect: (id: string) => void;
  hasMore: boolean; onLoadMore: () => void; loadingMore: boolean;
}) {
  const visible = conversations.filter((conversation) => `${conversation.name} ${conversation.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside aria-label="Daftar percakapan WhatsApp" className={cn("min-h-0 flex-col border-slate-200 bg-white md:flex md:border-r", selectedId ? "hidden" : "flex")}>
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center justify-between"><h1 className="text-lg font-semibold tracking-tight text-slate-900">Chat WhatsApp</h1><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{conversations.length}{hasMore ? "+" : ""}</span></div>
        <p className="mt-1 text-xs text-slate-400">Percakapan pelanggan dari Kirimdev</p>
        <label className="relative mt-5 block"><span className="sr-only">Cari percakapan yang sudah dimuat</span><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-slate-400" /><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cari nama atau nomor…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400"><LoaderCircle className="size-4 animate-spin" />Memuat percakapan…</p>}
        {!loading && visible.length === 0 && <div className="px-5 py-12 text-center"><MessageCircle className="mx-auto mb-3 size-8 text-slate-200" /><p className="text-sm font-medium text-slate-600">{query ? "Percakapan tidak ditemukan" : "Belum ada percakapan"}</p><p className="mt-2 text-xs leading-5 text-slate-400">{query ? "Coba nama atau nomor lainnya. Pencarian berlaku untuk percakapan yang sudah dimuat." : "Chat yang masuk ke nomor WhatsApp toko akan tampil di sini."}</p></div>}
        {visible.map((conversation) => <button type="button" key={conversation.id} onClick={() => onSelect(conversation.id)} aria-pressed={selectedId === conversation.id} className={cn("mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors focus-visible:outline-emerald-600", selectedId === conversation.id ? "bg-emerald-50" : "hover:bg-slate-50")}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">{contactInitials(conversation.name)}</span>
          <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-800">{conversation.name}</span>{conversation.lastMessageAt && <time dateTime={conversation.lastMessageAt} className="shrink-0 text-[10px] text-slate-400">{new Date(conversation.lastMessageAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</time>}</span><span className="mt-1 block truncate text-[11px] text-slate-400">{conversation.phone ?? "Kontak WhatsApp"}</span><span className="mt-2 flex items-center justify-between"><span className="text-[10px] text-slate-500">{conversation.status === "resolved" ? "Selesai" : conversation.status === "pending" ? "Menunggu" : "Terbuka"}</span>{conversation.unreadCount > 0 && <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white" aria-label={`${conversation.unreadCount} pesan belum dibaca`}>{conversation.unreadCount}</span>}</span></span>
        </button>)}
        {hasMore && <button type="button" disabled={loadingMore} onClick={onLoadMore} className="my-3 w-full rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{loadingMore ? "Memuat…" : "Muat percakapan lainnya"}</button>}
      </div>
    </aside>
  );
}
