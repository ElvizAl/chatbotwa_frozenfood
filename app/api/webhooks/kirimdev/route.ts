import { randomUUID } from "node:crypto";
import {
  verifyWebhookSignature,
  KirimWebhookError,
  MalformedPayloadError,
  SignatureExpiredError,
} from "@kirimdev/sdk/webhooks";
import { describeWebhook, summarizeWebhook } from "@/modules/whatsapp/server/webhook-event";
import { recordWebhook } from "@/modules/whatsapp/server/webhook-store";
import { diagnosticErrorCode, logKirimDiagnostic } from "@/modules/whatsapp/server/diagnostics";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const secret = process.env.KIRIMDEV_WEBHOOK_SECRET;
  const phoneNumberId = process.env.KIRIMDEV_PHONE_NUMBER_ID?.trim();
  logKirimDiagnostic("webhook", "received", {
    requestId,
    signaturePresent: Boolean(request.headers.get("x-kirim-signature")),
  });

  if (!secret || !phoneNumberId) {
    logKirimDiagnostic("webhook", "not_configured", {
      requestId, hasWebhookSecret: Boolean(secret), hasPhoneNumberId: Boolean(phoneNumberId), httpStatus: 503,
    }, "error");
    return Response.json(
      { error: "Webhook belum dikonfigurasi" },
      { status: 503 },
    );
  }

  try {
    const rawBody = await request.text();
    const payload = await verifyWebhookSignature({
      rawBody,
      signatureHeader: request.headers.get("x-kirim-signature"),
      secrets: [secret],
    });

    const event = describeWebhook(payload, rawBody, phoneNumberId);
    const summary = summarizeWebhook(payload, phoneNumberId);
    if (event) {
      const stored = await recordWebhook(event);
      logKirimDiagnostic("webhook", stored ? "stored" : "duplicate", {
        requestId, ...summary, httpStatus: 200, durationMs: Date.now() - startedAt,
      });
    } else {
      logKirimDiagnostic("webhook", "ignored", {
        requestId, ...summary, httpStatus: 200, durationMs: Date.now() - startedAt,
      }, "warn");
    }

    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof KirimWebhookError) {
      logKirimDiagnostic("webhook", error instanceof MalformedPayloadError ? "invalid_json"
        : error instanceof SignatureExpiredError ? "signature_expired" : "invalid_signature", {
        requestId, httpStatus: error instanceof MalformedPayloadError ? 400 : 401,
        durationMs: Date.now() - startedAt,
      }, "warn");
      return Response.json(
        { error: "Webhook tidak valid" },
        { status: error instanceof MalformedPayloadError ? 400 : 401 },
      );
    }

    // Respons non-2xx meminta Kirimdev mengulang delivery saat database pulih.
    logKirimDiagnostic("webhook", "processing_failed", {
      requestId, errorCode: diagnosticErrorCode(error), httpStatus: 503, durationMs: Date.now() - startedAt,
    }, "error");
    return Response.json({ error: "Webhook belum dapat diproses. Coba kembali." }, { status: 503 });
  }
}
