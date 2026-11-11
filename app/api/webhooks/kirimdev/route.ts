import {
  verifyWebhookSignature,
  KirimWebhookError,
  MalformedPayloadError,
} from "@kirimdev/sdk/webhooks";
import { describeWebhook } from "@/modules/whatsapp/server/webhook-event";
import { recordWebhook } from "@/modules/whatsapp/server/webhook-store";

export async function POST(request: Request) {
  const secret = process.env.KIRIMDEV_WEBHOOK_SECRET;
  const phoneNumberId = process.env.KIRIMDEV_PHONE_NUMBER_ID?.trim();

  if (!secret || !phoneNumberId) {
    return Response.json(
      { error: "Webhook belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();

  try {
    const payload = await verifyWebhookSignature({
      rawBody,
      signatureHeader: request.headers.get("x-kirim-signature"),
      secrets: [secret],
    });

    const event = describeWebhook(payload, rawBody, phoneNumberId);
    if (event) await recordWebhook(event);

    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof KirimWebhookError) {
      return Response.json(
        { error: "Webhook tidak valid" },
        { status: error instanceof MalformedPayloadError ? 400 : 401 },
      );
    }

    // Respons non-2xx meminta Kirimdev mengulang delivery saat database pulih.
    return Response.json({ error: "Webhook belum dapat diproses. Coba kembali." }, { status: 503 });
  }
}
