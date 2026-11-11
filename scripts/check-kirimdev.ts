import "dotenv/config";
import { Kirim, KirimError } from "@kirimdev/sdk";
import { prisma } from "../lib/db/prisma";

// Diagnostik read-only: tidak mencetak key, secret, nomor pelanggan, atau isi pesan.
async function main() {
  const apiKey = process.env.KIRIMDEV_API_KEY?.trim();
  const phoneId = process.env.KIRIMDEV_PHONE_NUMBER_ID?.trim();
  if (!apiKey || !phoneId) throw new Error("MissingKirimConfiguration");
  const kirim = new Kirim({ apiKey, timeout: 12_000, maxRetries: 0 });
  const phone = kirim.phoneNumbers(phoneId);
  const targetHost = "frozenchat.vercel.app";

  const results = await Promise.allSettled([
    (async () => {
      const accounts = await kirim.accounts.list();
      const account = accounts.find((item) => item.phone_number_id === phoneId);
      return { check: "account", configuredIdFound: Boolean(account), status: account?.status, metaStatus: account?.meta_status };
    })(),
    (async () => {
      const page = await phone.conversations.list({ limit: "5" }).page();
      return { check: "conversations", count: page.data.length, hasMore: page.hasMore, latest: page.data.map((item) => ({ lastMessageAt: item.last_message_at, lastInboundAt: item.last_inbound_at })) };
    })(),
    (async () => {
      const page = await phone.messages.list({ direction: "inbound", limit: "5" }).page();
      return { check: "inbound_messages", count: page.data.length, hasMore: page.hasMore, latest: page.data.map((item) => ({ type: item.type, createdAt: item.created_at })) };
    })(),
    (async () => {
      const page = await kirim.webhookSubscriptions.list().page();
      const subscriptions = await Promise.all(page.data.map(async (item) => {
        const url = new URL(item.url);
        const matchingHost = url.hostname === targetHost;
        const deliveries = matchingHost ? await kirim.webhookDeliveries.list({ subscription_id: item.id, limit: "5" }).page() : null;
        return {
          target: matchingHost ? `${url.origin}${url.pathname}` : url.hostname === "localhost" ? "localhost" : "other_host",
          status: item.status, events: item.events,
          configuredPhoneAllowed: !item.phone_number_ids || item.phone_number_ids.includes(phoneId),
          recentDeliveries: deliveries?.data.map((delivery) => ({ event: delivery.event_type, status: delivery.status, responseStatus: delivery.response_status, errorCode: delivery.error_code, createdAt: delivery.created_at })),
        };
      }));
      return { check: "subscriptions", hasMore: page.hasMore, subscriptions };
    })(),
    (async () => {
      const state = await prisma.whatsappSyncState.findUnique({ where: { phoneNumberId: phoneId } });
      return { check: "database_webhook_state", version: state?.version.toString() ?? "0", lastEventAt: state?.updatedAt.toISOString() ?? null };
    })(),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") console.log(JSON.stringify(result.value));
    else {
      const error = result.reason;
      console.log(JSON.stringify({ check: "failed", name: error instanceof Error ? error.name : "UnknownError", code: error instanceof KirimError ? error.code : error?.code, status: error instanceof KirimError ? error.status : undefined }));
      process.exitCode = 1;
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
