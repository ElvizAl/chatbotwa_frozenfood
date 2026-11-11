import { randomUUID } from "node:crypto";
import { chatErrorResponse, chatResponse, cursorSchema, requireChatAccess } from "@/modules/whatsapp/server/chat-api";
import { mapConversation } from "@/modules/whatsapp/server/chat-mappers";
import { diagnosticErrorCode, logKirimDiagnostic } from "@/modules/whatsapp/server/diagnostics";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const { phone } = await requireChatAccess(request);
    const cursor = cursorSchema.parse(new URL(request.url).searchParams.get("cursor") ?? undefined);
    const page = await phone.conversations.list({ limit: "30" }, {
      timeout: 12_000, maxRetries: 0,
    }).page(cursor);
    logKirimDiagnostic("chat", "conversations_loaded", {
      requestId, count: page.data.length, hasMore: page.hasMore, paginated: Boolean(cursor),
      httpStatus: 200, durationMs: Date.now() - startedAt,
    });
    return chatResponse({ data: page.data.map(mapConversation), nextCursor: page.hasMore ? page.nextCursor : null });
  } catch (error) {
    const response = chatErrorResponse(error);
    logKirimDiagnostic("chat", "conversations_failed", {
      requestId, errorCode: diagnosticErrorCode(error), httpStatus: response.status, durationMs: Date.now() - startedAt,
    }, response.status >= 500 ? "error" : "warn");
    return response;
  }
}
