import "server-only";

type DiagnosticFields = {
  requestId: string;
  durationMs?: number;
  signaturePresent?: boolean;
  hasWebhookSecret?: boolean;
  hasPhoneNumberId?: boolean;
  recognized?: boolean;
  phoneMatches?: boolean;
  eventType?: string | null;
  messageCount?: number;
  statusCount?: number;
  count?: number;
  hasMore?: boolean;
  paginated?: boolean;
  httpStatus?: number;
  errorCode?: string | null;
};

// Hanya metadata diagnostik; jangan kirim body, headers, token, atau isi error mentah.
export function logKirimDiagnostic(
  source: "webhook" | "chat",
  stage: string,
  fields: DiagnosticFields,
  level: "info" | "warn" | "error" = "info",
) {
  console[level](JSON.stringify({ source: `kirimdev.${source}`, stage, ...fields }));
}

export function diagnosticErrorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    // Kode database/network saja; pesan error dapat memuat data sensitif.
    return /^(?:P\d{4}|E[A-Z0-9_]{1,30})$/.test(error.code) ? error.code : null;
  }
  return null;
}
