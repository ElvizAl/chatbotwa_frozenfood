"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatConversation, ChatMessage, ChatPage, ChatRevision, ChatThread } from "../chat-types";

export async function chatRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(25_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Permintaan chat gagal.");
  return body as T;
}

function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  const messages = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function useChatInbox() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ChatThread>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [revision, setRevision] = useState<ChatRevision | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const listSequence = useRef(0);
  const refreshBusy = useRef(false);
  const loadedMore = useRef(false);

  const loadConversations = useCallback(async (cursor?: string) => {
    const sequence = ++listSequence.current;
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const page = await chatRequest<ChatPage<ChatConversation>>(`/api/kirimdev/conversations${suffix}`);
    if (sequence !== listSequence.current) return;
    setConversations((previous) => {
      const items = new Map(previous.map((item) => [item.id, item]));
      page.data.forEach((item) => items.set(item.id, item));
      return [...items.values()].sort((a, b) => Date.parse(b.lastMessageAt ?? "1970-01-01") - Date.parse(a.lastMessageAt ?? "1970-01-01"));
    });
    if (cursor) loadedMore.current = true;
    if (cursor || !loadedMore.current) setConversationCursor(page.nextCursor);
  }, []);

  const loadThread = useCallback(async (id: string, cursor?: string) => {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const page = await chatRequest<ChatThread>(`/api/kirimdev/conversations/${encodeURIComponent(id)}/messages${suffix}`);
    setThreads((previous) => ({
      ...previous,
      [id]: { ...page, data: mergeMessages(previous[id]?.data ?? [], page.data), nextCursor: cursor ? page.nextCursor : previous[id] ? previous[id].nextCursor : page.nextCursor },
    }));
    setConversations((previous) => previous.map((item) => item.id === id ? page.conversation : item));
  }, []);

  const refresh = useCallback(async () => {
    if (refreshBusy.current) return;
    refreshBusy.current = true;
    setRefreshing(true);
    try {
      await Promise.all([
        loadConversations(),
        selectedRef.current ? loadThread(selectedRef.current) : Promise.resolve(),
      ]);
      setError(null);
      setUpdatedAt(new Date().toISOString());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Percakapan belum dapat dimuat.");
      throw error;
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshBusy.current = false;
    }
  }, [loadConversations, loadThread]);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let version: string | null = null;
    let lastRefresh = 0;

    async function poll() {
      let delay = 6_000;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(poll, delay);
        return;
      }
      try {
        const current = await chatRequest<ChatRevision>("/api/kirimdev/revision");
        if (disposed) return;
        setRevision(current);
        setSyncError(null);
        if (version !== current.version || Date.now() - lastRefresh > 60_000) {
          await refresh();
          version = current.version;
          lastRefresh = Date.now();
        }
      } catch {
        if (disposed) return;
        setSyncError("Pembaruan webhook belum tersedia. Gunakan tombol Muat ulang untuk memperbarui chat.");
        delay = 30_000;
        if (Date.now() - lastRefresh > 60_000) {
          try { await refresh(); } catch { /* Pesan error sudah ditampilkan oleh refresh. */ }
          lastRefresh = Date.now();
        }
      }
      if (!disposed) timer = setTimeout(poll, delay);
    }

    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [refresh]);

  async function selectConversation(id: string | null) {
    selectedRef.current = id;
    setSelectedId(id);
    setError(null);
    if (!id) return;
    setLoadingThreadId(id);
    try { await loadThread(id); }
    catch (error) { setError(error instanceof Error ? error.message : "Pesan belum dapat dimuat."); }
    finally { setLoadingThreadId((current) => current === id ? null : current); }
  }

  async function loadMoreConversations() {
    if (!conversationCursor || refreshBusy.current) return;
    refreshBusy.current = true;
    setRefreshing(true);
    try { await loadConversations(conversationCursor); }
    catch (error) { setError(error instanceof Error ? error.message : "Percakapan belum dapat dimuat."); }
    finally { setRefreshing(false); refreshBusy.current = false; }
  }

  async function loadOlderMessages() {
    const id = selectedRef.current;
    if (!id || !threads[id]?.nextCursor) return;
    setLoadingThreadId(id);
    try { await loadThread(id, threads[id].nextCursor!); }
    catch (error) { setError(error instanceof Error ? error.message : "Riwayat belum dapat dimuat."); }
    finally { setLoadingThreadId((current) => current === id ? null : current); }
  }

  function appendSentMessage(message: ChatMessage) {
    setThreads((previous) => {
      const thread = previous[message.conversationId];
      if (!thread) return previous;
      return { ...previous, [message.conversationId]: { ...thread, data: mergeMessages(thread.data, [message]) } };
    });
  }

  return {
    conversations, conversationCursor, selectedId, thread: selectedId ? threads[selectedId] : undefined,
    loading, refreshing, loadingThread: loadingThreadId === selectedId, error, syncError, revision, updatedAt,
    refresh, selectConversation, loadMoreConversations, loadOlderMessages, appendSentMessage,
  };
}
