import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { describeWebhook } from "./webhook-event";

export async function recordWebhook(event: NonNullable<ReturnType<typeof describeWebhook>>) {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.whatsappWebhookReceipt.createMany({
      data: [event],
      skipDuplicates: true,
    });
    if (!receipt.count) return false;
    await tx.whatsappSyncState.upsert({
      where: { phoneNumberId: event.phoneNumberId },
      create: { phoneNumberId: event.phoneNumberId, version: BigInt(1) },
      update: { version: { increment: BigInt(1) } },
    });
    return true;
  });
}
