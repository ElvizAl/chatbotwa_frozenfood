import "server-only";

import { KirimError } from "@kirimdev/sdk";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";

export class ChatApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const conversationIdSchema = z.string().regex(/^cnv_[a-zA-Z0-9]+$/).max(100);
export const cursorSchema = z.string().min(1).max(4096).optional();

export function chatResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function requireChatAccess(request: Request, mutation = false) {
  if (mutation) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [new URL(request.url).origin, process.env.BETTER_AUTH_URL];
    if (!origin || !allowedOrigins.includes(origin)) {
      throw new ChatApiError("Permintaan harus berasal dari aplikasi ini.", 403);
    }
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new ChatApiError("Sesi berakhir. Silakan masuk kembali.", 401);

  const phoneNumberId = process.env.KIRIMDEV_PHONE_NUMBER_ID?.trim();
  if (!process.env.KIRIMDEV_API_KEY?.trim() || !phoneNumberId || !/^\d+$/.test(phoneNumberId)) {
    throw new ChatApiError("Konfigurasi API key dan Phone Number ID Kirimdev belum lengkap.", 503);
  }

  const { whatsapp } = await import("@/lib/kirim");
  return { phone: whatsapp, phoneNumberId, user: session.user };
}

export function chatErrorResponse(error: unknown) {
  // Next.js memakai exception untuk proses prerender; ini bukan kegagalan layanan.
  unstable_rethrow(error);
  if (error instanceof ChatApiError) return chatResponse({ error: error.message }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return chatResponse({ error: "Data permintaan tidak valid." }, 400);
  }
  if (error instanceof KirimError) {
    const messages: Record<string, string> = {
      outside_24h_window: "Jendela balasan 24 jam sudah berakhir. Gunakan template dari Kirimdev atau tunggu pesan baru pelanggan.",
      contact_blocked: "Kontak ini diblokir dan tidak dapat menerima balasan.",
      marketing_opted_out: "Pelanggan tidak mengizinkan jenis pesan ini.",
    };
    const message = messages[error.code] ?? (error.status === 401 || error.status === 403
      ? "API key Kirimdev ditolak atau tidak memiliki izin untuk chat."
      : error.status === 429 ? "Batas permintaan Kirimdev tercapai. Coba kembali sebentar lagi."
      : error.status === 404 ? "Percakapan tidak ditemukan pada nomor WhatsApp ini."
      : "Kirimdev belum dapat memproses permintaan. Coba kembali sebentar lagi.");
    return chatResponse({ error: message }, error.status === 404 ? 404 : error.status === 429 ? 429 : 502);
  }
  return chatResponse({ error: "Layanan chat belum tersedia. Coba kembali sebentar lagi." }, 503);
}
