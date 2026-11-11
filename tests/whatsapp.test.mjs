import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { KirimError } from "@kirimdev/sdk";
import { redirect } from "next/navigation";
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
let account;
let diagnosticLogs;
let consoleSpies;
let authError;

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
  auth: { api: { getSession: async () => {
    if (authError) throw authError;
    return authenticated ? { user: { id: "test-user" } } : null;
  } } },
}));
mock.module(fileURLToPath(new URL("../lib/kirim.ts", import.meta.url)), () => ({
  whatsapp: phone,
  kirim: { accounts: { list: async () => [account] } },
}));
mock.module(fileURLToPath(new URL("../lib/db/prisma.ts", import.meta.url)), () => ({ prisma: db }));

const { GET: listChats } = await import("../app/api/kirimdev/conversations/route");
const { GET: getMessages, POST: sendMessage } = await import("../app/api/kirimdev/conversations/[id]/messages/route");
const { GET: getRevision } = await import("../app/api/kirimdev/revision/route");
const { POST: receiveWebhook } = await import("../app/api/webhooks/kirimdev/route");
const { GET: getConnectionStatus } = await import("../app/api/kirimdev/status/route");

beforeEach(() => {
  diagnosticLogs = [];
  consoleSpies = ["info", "warn", "error"].map((level) => spyOn(console, level).mockImplementation((entry) => {
    diagnosticLogs.push(JSON.parse(entry));
  }));
  process.env.KIRIMDEV_PHONE_NUMBER_ID = phoneId;
  process.env.KIRIMDEV_API_KEY = "local-test-api-key";
  process.env.KIRIMDEV_WEBHOOK_SECRET = "local-test-webhook-secret";
  authenticated = true;
  authError = null;
  sendCalls = [];
  receipts = new Set();
  version = 0;
  dbFailed = false;
  account = { phone_number_id: phoneId, phone_number: "+62000000000", name: "Test", status: "connected", meta_status: "CONNECTED" };
  conversation = {
    id: conversationId, status: "open", contact: { id: "ctc_TEST", name: "Test", phone_number: "+62000000000" },
    unread_count: 1, last_message_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
  };
});

afterEach(() => {
  consoleSpies.forEach((spy) => spy.mockRestore());
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

describe("diagnostic logs", () => {
  test("exception internal Next.js diteruskan tanpa log error palsu", async () => {
    try { redirect("/login"); } catch (error) { authError = error; }
    await expect(listChats(new Request("http://localhost/api/kirimdev/conversations"))).rejects.toThrow("NEXT_REDIRECT");
    expect(diagnosticLogs).toHaveLength(0);
  });

  test("tahap webhook dibedakan tanpa membocorkan payload atau secret", async () => {
    const payload = inbound();
    payload.entry[0].changes[0].value.messages[0].text.body = "private-message-body";
    await receiveWebhook(webhook(payload));
    await receiveWebhook(webhook(payload));
    await receiveWebhook(webhook(inbound("987654321")));
    await receiveWebhook(webhook(payload, { secret: "wrong-secret" }));
    dbFailed = true;
    await receiveWebhook(webhook(inbound()));

    const stages = diagnosticLogs.map((entry) => entry.stage);
    expect(stages).toContain("received");
    expect(stages).toContain("stored");
    expect(stages).toContain("duplicate");
    expect(stages).toContain("ignored");
    expect(stages).toContain("invalid_signature");
    expect(stages).toContain("processing_failed");
    expect(diagnosticLogs.find((entry) => entry.stage === "stored").messageCount).toBe(1);
    expect(diagnosticLogs.find((entry) => entry.stage === "ignored").phoneMatches).toBe(false);
    expect(diagnosticLogs[0].requestId).toBe(diagnosticLogs[1].requestId);

    const output = JSON.stringify(diagnosticLogs);
    for (const sensitive of ["private-message-body", process.env.KIRIMDEV_API_KEY, process.env.KIRIMDEV_WEBHOOK_SECRET, phoneId, "62000000000"]) {
      expect(output).not.toContain(sensitive);
    }
  });

  test("log daftar chat hanya mencatat jumlah dan pagination", async () => {
    await listChats(new Request("http://localhost/api/kirimdev/conversations"));
    const entry = diagnosticLogs.find((item) => item.stage === "conversations_loaded");
    expect(entry.count).toBe(1);
    expect(entry.httpStatus).toBe(200);
    expect(JSON.stringify(entry)).not.toContain(conversation.contact.name);
    expect(JSON.stringify(entry)).not.toContain(conversation.contact.phone_number);
  });
});

describe("connection status", () => {
  test("status Meta yang belum tersedia tidak dianggap terhubung", async () => {
    account.meta_status = null;
    const response = await getConnectionStatus(new Request("http://localhost/api/kirimdev/status"));
    expect(response.status).toBe(200);
    expect((await response.json()).state).toBe("unverified");
  });

  test("status Meta CONNECTED dikonfirmasi terhubung", async () => {
    const response = await getConnectionStatus(new Request("http://localhost/api/kirimdev/status"));
    expect((await response.json()).state).toBe("connected");
  });

  test("status Meta yang belum terhubung tetap ditandai perlu diperiksa", async () => {
    account.meta_status = "UNVERIFIED";
    const response = await getConnectionStatus(new Request("http://localhost/api/kirimdev/status"));
    expect((await response.json()).state).toBe("disconnected");
  });
});

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
