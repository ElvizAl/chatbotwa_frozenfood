import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { auth } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";
import { StatsCards } from "./stats-cards";
import { SalesChart } from "./sales-chart";
import { RecentOrders } from "./recent-orders";
import { ProductOverview } from "./product-overview";
import { WhatsappOverview } from "./whatsapp-overview";
import Link from "next/link";

export async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  async function logout() {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect("/login");
  }

  return (
    <DashboardShell user={{ name: session.user.name, email: session.user.email }} logout={logout}>
      <section id="ringkasan" className="scroll-mt-24">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 text-sm text-slate-500">Ruang kerja Frozen Food</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Bisnis lancar, hati tenang<span className="text-emerald-600">.</span></h1>
            <p className="mt-2 text-sm text-slate-500">Pantau toko dan percakapan pelanggan dalam satu tempat.</p>
          </div>
          <Link href="#pesanan" className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Lihat pesanan <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-800">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p><strong className="font-semibold">Mode pratinjau.</strong> Angka penjualan, pesanan, dan produk di bawah adalah data contoh. WhatsApp belum terhubung.</p>
        </div>
        <StatsCards />
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SalesChart />
        <WhatsappOverview />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RecentOrders />
        <ProductOverview />
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-400">
        <span>Frozen Food · Dibuat untuk bisnis yang terus bertumbuh.</span>
        <a href="#ringkasan" className="hover:text-emerald-700">Kembali ke atas ↑</a>
      </footer>
    </DashboardShell>
  );
}
