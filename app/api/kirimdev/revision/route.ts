import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { chatErrorResponse, chatResponse, requireChatAccess } from "@/modules/whatsapp/server/chat-api";
import { diagnosticErrorCode, logKirimDiagnostic } from "@/modules/whatsapp/server/diagnostics";

export async function GET(request: Request) {
  try {
    const { phoneNumberId } = await requireChatAccess(request);
    const state = await prisma.whatsappSyncState.findUnique({ where: { phoneNumberId } });
    return chatResponse({ version: state?.version.toString() ?? "0", lastEventAt: state?.updatedAt.toISOString() ?? null });
  } catch (error) {
    const response = chatErrorResponse(error);
    logKirimDiagnostic("chat", "revision_failed", {
      requestId: randomUUID(), errorCode: diagnosticErrorCode(error), httpStatus: response.status,
    }, response.status >= 500 ? "error" : "warn");
    return response;
  }
}
