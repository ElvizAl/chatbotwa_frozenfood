import { createHash } from "node:crypto";

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

const nativeEvents = new Set([
  "message.sent", "message.revoked", "message.edited", "conversation.assigned",
  "conversation.closed", "contact.created", "contact.updated", "contact.identity_updated",
]);

// Tentukan cakupan dari body yang ditandatangani; header event saja tidak dipercaya.
export function describeWebhook(payload: unknown, rawBody: string, configuredPhoneId: string) {
  const body = object(payload);
  if (!body) return null;
  let eventType: string | null = null;
  const phoneIds = new Set<string>();

  if (body.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const changes = object(entry)?.changes;
      if (!Array.isArray(changes)) continue;
      for (const change of changes) {
        const value = object(object(change)?.value);
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
  }

  if (!eventType || !phoneIds.has(configuredPhoneId)) return null;
  return {
    // Status berbeda untuk pesan yang sama tetap mendapat receipt terpisah.
    id: createHash("sha256").update(`${configuredPhoneId}:${rawBody}`).digest("hex"),
    phoneNumberId: configuredPhoneId,
    eventType,
  };
}
