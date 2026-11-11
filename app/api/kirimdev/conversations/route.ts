import { chatErrorResponse, chatResponse, cursorSchema, requireChatAccess } from "@/modules/whatsapp/server/chat-api";
import { mapConversation } from "@/modules/whatsapp/server/chat-mappers";

export async function GET(request: Request) {
  try {
    const { phone } = await requireChatAccess(request);
    const cursor = cursorSchema.parse(new URL(request.url).searchParams.get("cursor") ?? undefined);
    const page = await phone.conversations.list({ limit: "30" }, {
      timeout: 12_000, maxRetries: 0,
    }).page(cursor);
    return chatResponse({ data: page.data.map(mapConversation), nextCursor: page.hasMore ? page.nextCursor : null });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
