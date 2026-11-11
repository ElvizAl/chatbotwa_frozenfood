import { randomBytes } from "node:crypto";
import { auth } from "../lib/auth";
import { prisma } from "../lib/db/prisma";
import { registerSchema } from "../modules/auth/schema/auth.schema";

async function main() {
  const password = process.env.SEED_PASSWORD ?? `Ff1!${randomBytes(18).toString("base64url")}`;
  const { name, email } = registerSchema.parse({
    name: process.env.SEED_NAME ?? "Admin",
    email: (process.env.SEED_EMAIL ?? "admin@frozenfood.test").trim().toLowerCase(),
    password,
    confirmPassword: password,
  });

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Akun ${email} sudah ada. Tidak ada perubahan.`);
    return;
  }

  await auth.api.signUpEmail({ body: { name, email, password } });

  console.log(`Satu akun berhasil dibuat: ${email}`);
  if (process.env.SEED_PASSWORD === undefined) {
    console.log(`Password: ${password}`);
  } else {
    console.log("Password menggunakan SEED_PASSWORD dari environment.");
  }
}

main()
  .catch((error: unknown) => {
    console.error("Seed akun gagal:", error instanceof Error ? error.name : "UnknownError");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
