import "server-only";
import { Kirim } from "@kirimdev/sdk";

export const kirim = new Kirim({
  apiKey: process.env.KIRIMDEV_API_KEY!,
});

export const whatsapp = kirim.phoneNumbers(
  process.env.KIRIMDEV_PHONE_NUMBER_ID!,
);