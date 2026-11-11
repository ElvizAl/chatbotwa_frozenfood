import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { KirimError } from "@kirimdev/sdk";
import { canReply } from "../modules/whatsapp/server/chat-mappers";
import { describeWebhook } from "../modules/whatsapp/server/webhook-event";

const phoneId = "123456789";
const conversationId = "cnv_TEST123";
const requestId = "5ca47e62-5911-47f5-81bc-2328d16d0b1b";
let authenticated = true;
let conversation;
let sendCalls;
let dbFailed;
let version;
let receipts;
let lastEventAt;

const phone = {
  conversations: {
    retrieve: async () => conversation,
    list: () => ({ page: async () => ({ data: [conversation], hasMore: true, nextCursor: "next-page" }) }),
  },
  contacts: { retrieve: async () => ({ bsuid: "ID.testrecipient" }) },
  messages: {
    list: () => ({ page: async () => ({ data: [], hasMore: false, nextCursor: null }) }),
    send: async (body, options) => {
      sendCalls.push({ body, options });
      return { id: "msg_TEST", status: "pending", created_at: new Date().toISOString() };
    },
  },
};

const db = {
  whatsappWebhookReceipt: {
    createMany: async ({ data }) => {
      if (dbFailed) throw new Error("database unavailable");
      const duplicate = receipts.has(data[0].id);
      receipts.add(data[0].id);
      return { count: duplicate ? 0 : 1 };
    },
  },
  whatsappSyncState: {
    upsert: async () => { version++; lastEventAt = new Date(); },
    findUnique: async () => version ? { version: BigInt(version), updatedAt: lastEventAt } : null,
  },
  $transaction: async (work) => work(db),
};

mock.module("server-only", () => ({}));
mock.module(fileURLToPath(new URL("../lib/auth.ts", import.meta.url)), () => ({
  auth: { api: { getSession: async () => authenticated ? { user: { id: "test-user" } } : null } },
}));
mock.module(fileURLToPath(new URL("../lib/kirim.ts", import.meta.url)), () => ({ whatsapp: phone }));
mock.module(fileURLToPath(new URL("../lib/db/prisma.ts", import.meta.url)), () => ({ prisma: db }));

const { GET: listChats } = await import("../app/api/kirimdev/conversations/route");
const { GET: getMessages, POST: sendMessage } = await import("../app/api/kirimdev/conversations/[id]/messages/route");
const { GET: getRevision } = await import("../app/api/kirimdev/revision/route");
const { POST: receiveWebhook } = await import("../app/api/webhooks/kirimdev/route");

beforeEach(() => {
  process.env.KIRIMDEV_PHONE_NUMBER_ID = phoneId;
  process.env.KIRIMDEV_API_KEY = "local-test-api-key";
  process.env.KIRIMDEV_WEBHOOK_SECRET = "local-test-webhook-secret";
  authenticated = true;
  sendCalls = [];
  receipts = new Set();
  version = 0;
  dbFailed = false;
  conversation = {
    id: conversationId, status: "open", contact: { id: "ctc_TEST", name: "Test", phone_number: "+62000000000" },
    unread_count: 1, last_message_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
  };
});

const context = () => ({ params: Promise.resolve({ id: conversationId }) });
function requestSend(body = { text: "Balasan uji", requestId }, origin = "http://localhost") {
  return new Request(`http://localhost/api/kirimdev/conversations/${conversationId}/messages`, {
    method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
function inbound(id = phoneId) {
  return { object: "whatsapp_business_account", entry: [{ changes: [{ value: { metadata: { phone_number_id: id }, messages: [{ id: "wamid_TEST", from: "62000000000", type: "text", text: { body: "Uji" } }] } }] }] };
}
function webhook(payload, options = {}) {
  const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", options.secret ?? process.env.KIRIMDEV_WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest("hex");
  return new Request("http://localhost/api/webhooks/kirimdev", {
    method: "POST", body: rawBody,
    headers: options.noSignature ? {} : { "x-kirim-signature": `t=${timestamp},v1=${signature}` },
  });
}

describe("chat API", () => {
  test("list, thread, revision dan send wajib login", async () => {
    authenticated = false;
    const request = new Request("http://localhost/api/kirimdev/conversations");
    expect((await listChats(request)).status).toBe(401);
    expect((await getMessages(request, context())).status).toBe(401);
    expect((await getRevision(request)).status).toBe(401);
    expect((await sendMessage(requestSend(), context())).status).toBe(401);
    expect(sendCalls).toHaveLength(0);
  });

  test("balasan lintas origin ditolak", async () => {
    expect((await sendMessage(requestSend(undefined, "https://untrusted.example"), context())).status).toBe(403);
    expect(sendCalls).toHaveLength(0);
  });

  test("penerima ditentukan server; retry memakai key idempotensi yang sama", async () => {
    const body = { text: "Balasan uji", requestId, to: "forged-recipient" };
    const first = await sendMessage(requestSend(body), context());
    const second = await sendMessage(requestSend(body), context());
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(sendCalls[0].body.to).toBe(conversation.contact.phone_number);
    expect(sendCalls[0].options.idempotencyKey).toBe(sendCalls[1].options.idempotencyKey);
    expect((await first.json()).message.status).toBe("pending");
  });

  test("pesan kosong dan request ID tidak valid ditolak", async () => {
    expect((await sendMessage(requestSend({ text: "  ", requestId }), context())).status).toBe(400);
    expect((await sendMessage(requestSend({ text: "Uji", requestId: "bad" }), context())).status).toBe(400);
    expect(sendCalls).toHaveLength(0);
  });

  test("jendela 24 jam diperiksa ulang di server", async () => {
    conversation.last_inbound_at = new Date(Date.now() - 25 * 3600_000).toISOString();
    expect((await sendMessage(requestSend(), context())).status).toBe(422);
    expect(sendCalls).toHaveLength(0);
  });

  test("kontak tanpa nomor menggunakan BSUID dari server", async () => {
    conversation.contact.phone_number = null;
    expect((await sendMessage(requestSend(), context())).status).toBe(200);
    expect(sendCalls[0].body.recipient).toBe("ID.testrecipient");
  });

  test("pagination dan respons chat tidak di-cache", async () => {
    const response = await listChats(new Request("http://localhost/api/kirimdev/conversations"));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).nextCursor).toBe("next-page");
  });

  test("identitas conversation yang tidak valid ditolak", async () => {
    const invalid = { params: Promise.resolve({ id: "../../other-account" }) };
    expect((await getMessages(new Request("http://localhost"), invalid)).status).toBe(400);
  });

  test("error upstream tidak membocorkan detail atau key", async () => {
    const original = phone.conversations.retrieve;
    phone.conversations.retrieve = async () => { throw new KirimError({ type: "permission_error", code: "denied", message: "private-provider-details", status: 403, requestId: null }); };
    try {
      const response = await sendMessage(requestSend(), context());
      expect(response.status).toBe(502);
      expect(await response.text()).not.toContain("private-provider-details");
      expect(sendCalls).toHaveLength(0);
    } finally { phone.conversations.retrieve = original; }
  });
});

describe("webhook", () => {
  test("valid diterima dan retry tidak menggandakan revision", async () => {
    expect((await receiveWebhook(webhook(inbound()))).status).toBe(200);
    expect((await receiveWebhook(webhook(inbound()))).status).toBe(200);
    expect(receipts.size).toBe(1);
    expect(version).toBe(1);
    const revision = await getRevision(new Request("http://localhost"));
    expect((await revision.json()).version).toBe("1");
  });

  test("perubahan status pesan yang sama tetap memperbarui inbox", async () => {
    const payload = (status) => ({ object: "whatsapp_business_account", entry: [{ changes: [{ value: { metadata: { phone_number_id: phoneId }, statuses: [{ id: "wamid_SAME", status }] } }] }] });
    await receiveWebhook(webhook(payload("delivered")));
    await receiveWebhook(webhook(payload("read")));
    expect(version).toBe(2);
  });

  test("signature kosong, salah, kedaluwarsa, JSON rusak ditolak tanpa write", async () => {
    expect((await receiveWebhook(webhook(inbound(), { noSignature: true }))).status).toBe(401);
    expect((await receiveWebhook(webhook(inbound(), { secret: "wrong" }))).status).toBe(401);
    expect((await receiveWebhook(webhook(inbound(), { timestamp: Math.floor(Date.now() / 1000) - 600 }))).status).toBe(401);
    expect((await receiveWebhook(webhook("invalid-json"))).status).toBe(400);
    expect(version).toBe(0);
  });

  test("event nomor lain diabaikan", async () => {
    expect((await receiveWebhook(webhook(inbound("987654321")))).status).toBe(200);
    expect(version).toBe(0);
  });

  test("database gagal menghasilkan 503 agar delivery diulang", async () => {
    dbFailed = true;
    expect((await receiveWebhook(webhook(inbound()))).status).toBe(503);
  });

  test("message.sent native dipetakan dari body; payload asing diabaikan", () => {
    const payload = { type: "message.sent", data: { meta: { phone_number_id: phoneId } } };
    expect(describeWebhook(payload, JSON.stringify(payload), phoneId)?.eventType).toBe("message.sent");
    expect(describeWebhook({ type: "made-up" }, "{}", phoneId)).toBeNull();
    expect(describeWebhook(null, "null", phoneId)).toBeNull();
  });
});

test("batas waktu balasan menangani null, masa depan, dan tepat 24 jam", () => {
  const now = Date.now();
  expect(canReply(null, now)).toBe(false);
  expect(canReply("not-a-date", now)).toBe(false);
  expect(canReply(new Date(now + 1000).toISOString(), now)).toBe(false);
  expect(canReply(new Date(now - 86400_000).toISOString(), now)).toBe(false);
  expect(canReply(new Date(now - 1000).toISOString(), now)).toBe(true);
});
