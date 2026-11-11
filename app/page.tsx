import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/modules/dashboard/components/dashboard";

export const metadata: Metadata = {
  title: "Cek koneksi | Frozen Food",
  description: "Periksa koneksi WhatsApp dan pengaturan webhook Kirimdev Frozen Food.",
};

export default function Home() {
  return (
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Memuat dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}
