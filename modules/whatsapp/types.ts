export type KirimConnectionResult = {
  state: "connected" | "disconnected" | "not_found" | "not_configured" | "error";
  message: string;
  webhookConfigured: boolean;
  account?: {
    name: string | null;
    phoneNumber: string | null;
    status: string;
    metaStatus: string | null;
  };
};
