import * as z from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nama minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter"),

    email: z
      .email("Format email tidak valid")
      .trim()
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf besar")
      .regex(/[a-z]/, "Password harus memiliki minimal 1 huruf kecil")
      .regex(/[0-9]/, "Password harus memiliki minimal 1 angka"),

    confirmPassword: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .email("Format email tidak valid")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;