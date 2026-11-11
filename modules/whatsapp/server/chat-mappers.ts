import type { Conversation, MessageListItem } from "@kirimdev/sdk";
import type { ChatConversation, ChatMessage } from "../chat-types";

export function mapConversation(item: Conversation): ChatConversation {
  return {
    id: item.id,
    name: item.contact.name || item.contact.phone_number || "Pelanggan WhatsApp",
    phone: item.contact.phone_number,
    status: item.status,
    unreadCount: item.unread_count,
    lastMessageAt: item.last_message_at,
    lastInboundAt: item.last_inbound_at,
  };
}

export function mapMessage(item: MessageListItem): ChatMessage {
  return {
    id: item.id,
    conversationId: item.conversation_id,
    direction: item.direction,
    type: item.type,
    content: item.content,
    mediaUrl: item.media_url,
    status: item.status,
    createdAt: item.created_at,
    error: item.error?.code === "outside_24h_window"
      ? "Jendela balasan 24 jam telah berakhir."
      : item.error ? "Pesan gagal dikirim oleh WhatsApp." : null,
  };
}

export function canReply(lastInboundAt: string | null, now = Date.now()) {
  if (!lastInboundAt) return false;
  const timestamp = Date.parse(lastInboundAt);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp < 24 * 60 * 60 * 1000;
}
