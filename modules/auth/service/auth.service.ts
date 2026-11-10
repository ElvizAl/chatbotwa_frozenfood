import { auth } from "@/lib/auth";
import { loginSchema } from "../schema/auth.schema";
import { prisma } from "@/lib/db/prisma";
import z from "zod";

export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    const flattenedErrors = z.flattenError(validated.error);

    return {
      success: false,
      message: "Validasi gagal",
      error: flattenedErrors.fieldErrors,
    };
  }

  const { email, password } = validated.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return {
        success: false,
        message: "Email belum terdaftar.",
      };
    }

    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Login berhasil",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "INTERNAL_SERVER_ERROR",
    };
  }
}
