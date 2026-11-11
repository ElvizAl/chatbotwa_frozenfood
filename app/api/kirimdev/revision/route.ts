import { prisma } from "@/lib/db/prisma";
import { chatErrorResponse, chatResponse, requireChatAccess } from "@/modules/whatsapp/server/chat-api";

export async function GET(request: Request) {
  try {
    const { phoneNumberId } = await requireChatAccess(request);
    const state = await prisma.whatsappSyncState.findUnique({ where: { phoneNumberId } });
    return chatResponse({ version: state?.version.toString() ?? "0", lastEventAt: state?.updatedAt.toISOString() ?? null });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
