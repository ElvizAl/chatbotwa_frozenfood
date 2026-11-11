import { createHash } from "node:crypto";

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

const nativeEvents = new Set([
  "message.sent", "message.revoked", "message.edited", "conversation.assigned",
  "conversation.closed", "contact.created", "contact.updated", "contact.identity_updated",
]);

function inspectWebhook(payload: unknown) {
  const body = object(payload);
  let eventType: string | null = null;
  const phoneIds = new Set<string>();
  let messageCount = 0;
  let statusCount = 0;
  if (!body) return { eventType, phoneIds, messageCount, statusCount };

  if (body.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const changes = object(entry)?.changes;
      if (!Array.isArray(changes)) continue;
      for (const change of changes) {
        const value = object(object(change)?.value);
        messageCount += Array.isArray(value?.messages) ? value.messages.length : 0;
        statusCount += Array.isArray(value?.statuses) ? value.statuses.length : 0;
        const phoneId = object(value?.metadata)?.phone_number_id;
        if (typeof phoneId !== "string") continue;
        if (Array.isArray(value?.messages) && value.messages.length) {
          phoneIds.add(phoneId);
          eventType = "message.received";
        }
        if (Array.isArray(value?.statuses) && value.statuses.length) {
          phoneIds.add(phoneId);
          eventType ??= "message.status";
        }
      }
    }
  } else if (typeof body.type === "string" && nativeEvents.has(body.type)) {
    const data = object(body.data);
    const phoneId = object(data?.meta)?.phone_number_id ?? data?.phone_number_id ??
      data?.session ?? object(data?.whatsapp_account)?.phone_number_id;
    if (typeof phoneId === "string") phoneIds.add(phoneId);
    eventType = body.type;
    messageCount = body.type === "message.sent" ? 1 : 0;
  }

  return { eventType, phoneIds, messageCount, statusCount };
}

// Ringkasan untuk log setelah verifikasi; ID nomor dan isi pesan tidak diekspos.
export function summarizeWebhook(payload: unknown, configuredPhoneId: string) {
  const { eventType, phoneIds, messageCount, statusCount } = inspectWebhook(payload);
  return { eventType, recognized: eventType !== null, phoneMatches: phoneIds.has(configuredPhoneId), messageCount, statusCount };
}

// Tentukan cakupan dari body yang ditandatangani; header event saja tidak dipercaya.
export function describeWebhook(payload: unknown, rawBody: string, configuredPhoneId: string) {
  const { eventType, phoneIds } = inspectWebhook(payload);
  if (!eventType || !phoneIds.has(configuredPhoneId)) return null;
  return {
    // Status berbeda untuk pesan yang sama tetap mendapat receipt terpisah.
    id: createHash("sha256").update(`${configuredPhoneId}:${rawBody}`).digest("hex"),
    phoneNumberId: configuredPhoneId,
    eventType,
  };
}
