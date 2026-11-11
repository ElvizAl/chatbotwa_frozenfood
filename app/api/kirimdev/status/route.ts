import { KirimError } from "@kirimdev/sdk";
import { auth } from "@/lib/auth";
import type { KirimConnectionResult } from "@/modules/whatsapp/types";

function respond(body: KirimConnectionResult, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const webhookConfigured = Boolean(process.env.KIRIMDEV_WEBHOOK_SECRET?.trim());

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return respond({
        state: "error",
        message: "Silakan masuk terlebih dahulu untuk memeriksa koneksi.",
        webhookConfigured: false,
      }, 401);
    }

    const apiKey = process.env.KIRIMDEV_API_KEY?.trim();
    const phoneNumberId = process.env.KIRIMDEV_PHONE_NUMBER_ID?.trim();

    if (!apiKey || !phoneNumberId || !/^\d+$/.test(phoneNumberId)) {
      return respond({
        state: "not_configured",
        message: "Isi KIRIMDEV_API_KEY dan KIRIMDEV_PHONE_NUMBER_ID di .env. Phone Number ID harus berupa angka, bukan nomor WhatsApp dengan tanda +.",
        webhookConfigured,
      }, 400);
    }

    // Import setelah validasi agar konfigurasi yang belum diisi tidak menggagalkan build.
    const { kirim } = await import("@/lib/kirim");
    const accounts = await kirim.accounts.list(undefined, {
      timeout: 10_000,
      maxRetries: 0,
    });
    const account = accounts.find((item) => item.phone_number_id === phoneNumberId);

    if (!account) {
      return respond({
        state: "not_found",
        message: "API key diterima, tetapi Phone Number ID tidak ditemukan pada akun Kirimdev ini.",
        webhookConfigured,
      }, 404);
    }

    const connected = account.status === "connected" &&
      (account.meta_status === null || account.meta_status === "CONNECTED");

    return respond({
      state: connected ? "connected" : "disconnected",
      message: connected
        ? "Nomor WhatsApp terhubung ke Kirimdev. Penerimaan webhook perlu diuji terpisah."
        : "Nomor ditemukan, tetapi belum siap mengirim pesan. Periksa status nomor di dashboard Kirimdev.",
      webhookConfigured,
      account: {
        name: account.name,
        phoneNumber: account.phone_number,
        status: account.status,
        metaStatus: account.meta_status,
      },
    });
  } catch (error) {
    let message = "Koneksi belum dapat diperiksa. Coba lagi dalam beberapa saat.";

    if (error instanceof KirimError) {
      if (error.status === 401) {
        message = "API key ditolak Kirimdev. Periksa KIRIMDEV_API_KEY di .env.";
      } else if (error.status === 403) {
        message = "API key tidak memiliki izin membaca akun Kirimdev.";
      } else if (error.status === 429) {
        message = "Batas permintaan Kirimdev tercapai. Tunggu sebelum mencoba lagi.";
      } else {
        message = "Kirimdev belum dapat dihubungi. Periksa koneksi server atau coba lagi nanti.";
      }
    }

    return respond({ state: "error", message, webhookConfigured }, 503);
  }
}
