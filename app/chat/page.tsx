import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/modules/dashboard/components/dashboard";

export const metadata: Metadata = {
  title: "Chat WhatsApp | Frozen Food",
  description: "Baca dan balas percakapan WhatsApp pelanggan Frozen Food melalui Kirimdev.",
};

export default function ChatPage() {
  return (
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Memuat chat WhatsApp…</div>}>
      <Dashboard view="chat" />
    </Suspense>
  );
}
