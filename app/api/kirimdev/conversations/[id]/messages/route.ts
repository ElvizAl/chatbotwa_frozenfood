import { z } from "zod";
import { ChatApiError, chatErrorResponse, chatResponse, conversationIdSchema, cursorSchema, requireChatAccess } from "@/modules/whatsapp/server/chat-api";
import { canReply, mapConversation, mapMessage } from "@/modules/whatsapp/server/chat-mappers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { phone } = await requireChatAccess(request);
    const id = conversationIdSchema.parse((await context.params).id);
    const cursor = cursorSchema.parse(new URL(request.url).searchParams.get("cursor") ?? undefined);
    const [conversation, page] = await Promise.all([
      phone.conversations.retrieve(id, { timeout: 12_000, maxRetries: 0 }),
      phone.messages.list({ conversation_id: id, limit: "50" }, { timeout: 12_000, maxRetries: 0 }).page(cursor),
    ]);
    return chatResponse({
      conversation: mapConversation(conversation),
      data: page.data.map(mapMessage).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
      nextCursor: page.hasMore ? page.nextCursor : null,
    });
  } catch (error) {
    return chatErrorResponse(error);
  }
}

const sendSchema = z.object({ text: z.string().trim().min(1).max(4096), requestId: z.uuid() });

export async function POST(request: Request, context: Context) {
  try {
    const { phone, user } = await requireChatAccess(request, true);
    const id = conversationIdSchema.parse((await context.params).id);
    const { text, requestId } = sendSchema.parse(await request.json());
    // Penerima ditentukan di server dari percakapan pada nomor yang dikonfigurasi.
    const conversation = await phone.conversations.retrieve(id, { timeout: 12_000, maxRetries: 0 });
    if (!canReply(conversation.last_inbound_at)) {
      throw new ChatApiError("Jendela balasan 24 jam telah berakhir. Gunakan template di Kirimdev atau tunggu pesan baru pelanggan.", 422);
    }

    let recipient: { to: string } | { recipient: string };
    if (conversation.contact.phone_number) {
      recipient = { to: conversation.contact.phone_number };
    } else {
      const contact = await phone.contacts.retrieve(conversation.contact.id, { timeout: 12_000, maxRetries: 0 });
      if (!contact.bsuid) throw new ChatApiError("Identitas penerima belum tersedia.", 422);
      recipient = { recipient: contact.bsuid };
    }

    const result = await phone.messages.send({
      messaging_product: "whatsapp", ...recipient, type: "text", text: { body: text },
    }, { idempotencyKey: `${user.id}:${requestId}`, timeout: 15_000, maxRetries: 0 });

    return chatResponse({
      message: {
        id: result.id, conversationId: id, direction: "outbound", type: "text",
        content: text, mediaUrl: null, status: result.status,
        createdAt: result.created_at ?? new Date().toISOString(),
        error: result.status === "failed" ? "Pesan gagal dikirim oleh WhatsApp." : null,
      },
    });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
