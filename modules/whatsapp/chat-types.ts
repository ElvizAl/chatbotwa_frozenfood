export type ChatConversation = {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  unreadCount: number;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string | null;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
  error: string | null;
};

export type ChatPage<T> = { data: T[]; nextCursor: string | null };
export type ChatThread = ChatPage<ChatMessage> & { conversation: ChatConversation };
export type ChatRevision = { version: string; lastEventAt: string | null };
