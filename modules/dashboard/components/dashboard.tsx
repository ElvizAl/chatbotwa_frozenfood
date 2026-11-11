import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";
import { WhatsappOverview } from "./whatsapp-overview";
import { ChatInbox } from "@/modules/whatsapp/components/chat-inbox";

export async function Dashboard({ view = "connection" }: { view?: "connection" | "chat" }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  async function logout() {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect("/login");
  }

  return (
    <DashboardShell user={{ name: session.user.name, email: session.user.email }} logout={logout} activePage={view}>
      {view === "chat" ? <ChatInbox /> : <div className="w-full max-w-2xl">
        <WhatsappOverview />
      </div>}
    </DashboardShell>
  );
}
