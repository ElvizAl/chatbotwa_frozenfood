import type { Metadata } from "next";
import { Snowflake } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { loginAction } from "@/modules/auth/service/auth.service";

export const metadata: Metadata = {
  title: "Masuk | Frozen Food",
  description: "Masuk untuk mengelola chatbot WhatsApp Frozen Food Anda.",
};

export default function LoginPage() {
  async function submitLogin(formData: FormData) {
    "use server";
    return loginAction(formData);
  }

  return (
    <main lang="id" className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Snowflake className="size-5" aria-hidden="true" />
          </span>
          Frozen Food
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Selamat datang kembali.</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Masuk untuk mengelola chatbot WhatsApp Anda.
          </p>
        </div>

        <LoginForm loginAction={submitLogin} />

        <p className="mt-10 border-t pt-5 text-xs text-muted-foreground">
          Chatbot WhatsApp untuk bisnis frozen food.
        </p>
      </div>
    </main>
  );
}
