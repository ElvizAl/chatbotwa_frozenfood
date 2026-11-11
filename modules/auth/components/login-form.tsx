"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "../schema/auth.schema";
import type { loginAction as loginService } from "../service/auth.service";
import { toast } from "sonner";

export function LoginForm({ loginAction }: { loginAction: typeof loginService }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    try {
      const result = await loginAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="space-y-5">
        <legend className="sr-only">Masuk ke akun</legend>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@email.com"
            className="h-11 rounded-xl bg-background"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password"
              className="h-11 rounded-xl bg-background pr-12"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1.5 top-1.5 rounded-lg text-muted-foreground"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
              aria-controls="password"
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root?.server && (
          <p role="alert" className="rounded-xl bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {errors.root.server.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl">
          {isSubmitting ? (
            <><LoaderCircle className="animate-spin" aria-hidden="true" /> Sedang masuk…</>
          ) : (
            <>Masuk <ArrowRight aria-hidden="true" /></>
          )}
        </Button>
      </fieldset>
    </form>
  );
}
