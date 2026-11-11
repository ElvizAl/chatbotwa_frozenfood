import {
  verifyWebhookSignature,
  KirimWebhookError,
  MalformedPayloadError,
} from "@kirimdev/sdk/webhooks";

export async function POST(request: Request) {
  const secret = process.env.KIRIMDEV_WEBHOOK_SECRET;

  if (!secret) {
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

    // Simpan/proses payload di sini.
    // Handler awal ini hanya memverifikasi penerimaan webhook.
    void payload;

    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof KirimWebhookError) {
      return Response.json(
        { error: "Webhook tidak valid" },
        { status: error instanceof MalformedPayloadError ? 400 : 401 },
      );
    }

    throw error;
  }
}