This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Seed satu akun

Setelah `DATABASE_URL` dikonfigurasi dan tabel auth tersedia, jalankan secara manual:

```bash
bun run db:seed
```

Seed membuat satu akun melalui Better Auth dengan nama `Admin` dan email
`admin@frozenfood.test`. Password acak ditampilkan sekali saat akun dibuat.
Untuk menentukan kredensial sendiri, isi `SEED_NAME`, `SEED_EMAIL`, dan
`SEED_PASSWORD` di `.env` sebelum menjalankan seed.

Jika email sudah terdaftar, seed melewati pembuatan akun tanpa mengubah password.
Seed tidak dijalankan otomatis saat aplikasi dimulai.

## Menghubungkan Kirimdev

SDK dan endpoint webhook sudah tersedia. Isi `.env` di root proyek:

```dotenv
KIRIMDEV_API_KEY=isi_api_key
KIRIMDEV_PHONE_NUMBER_ID=isi_phone_number_id
KIRIMDEV_WEBHOOK_SECRET=isi_signing_secret_subscription
```

`KIRIMDEV_PHONE_NUMBER_ID` berisi ID nomor dari Kirimdev, bukan nomor WhatsApp
pelanggan. Restart `bun run dev` setelah mengubah environment.

1. Login di aplikasi, buka dashboard `/`, lalu klik **Cek koneksi Kirimdev**.
   Pemeriksaan membaca akun Kirimdev; tidak mengirim pesan. Endpoint
   `GET /api/kirimdev/status` hanya dapat diakses pengguna yang login.
2. Untuk menerima webhook di komputer lokal, jalankan tunnel HTTPS menuju port
   Next.js yang digunakan, misalnya `ngrok http 3000` jika ngrok sudah terpasang.
3. Pada dashboard Kirimdev, daftarkan URL publik
   `https://domain-publik-kamu/api/webhooks/kirimdev` dan pilih event
   `message.received` serta `message.status`. Jika tunnel berubah, perbarui URL.
4. Cocokkan `KIRIMDEV_WEBHOOK_SECRET` dengan signing secret subscription tersebut.
   Kirim test delivery dari dashboard Kirimdev, lalu periksa respons 200 pada
   riwayat delivery. Request tanpa signature valid akan ditolak (401).

Handler saat ini memverifikasi signature dan mengakui penerimaan webhook.
Pesan belum disimpan atau dibalas otomatis. Sebelum memproses transaksi atau
balasan chatbot, tambahkan penyimpanan pesan dan deduplikasi event secara persisten.
Status koneksi nomor tidak membuktikan webhook sudah dapat diakses.

Panduan resmi: [SDK](https://docs.kirimdev.com/sdks/typescript/),
[Webhook](https://docs.kirimdev.com/webhooks/overview/).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
