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

## Chat WhatsApp di web

Buka **Chat WhatsApp** di sidebar atau `/chat` setelah login. Riwayat dan status
pesan dibaca langsung dari API Kirimdev, sehingga chat yang sudah ada dapat tampil
tanpa mengimpor ulang. Pilih percakapan untuk membalas teks; lampiran masuk dapat
dibuka dari tautannya. Percakapan dan pesan lama tersedia melalui tombol muat lagi.
Pencarian berlaku untuk daftar percakapan yang sudah dimuat.

Sebelum menjalankan versi ini, terapkan migrasi dan generate Prisma Client:

```bash
bunx prisma migrate deploy --config prisma7.config.ts
bunx prisma generate --config prisma7.config.ts
```

Webhook memverifikasi signature, membatasi event ke Phone Number ID yang
dikonfigurasi, lalu mencatat receipt dan menaikkan revision dalam satu transaksi.
Payload yang sama tidak menaikkan revision dua kali. Isi pesan tetap disimpan di
Kirimdev; database lokal hanya menyimpan receipt hash, jenis event, dan state
pembaruan. Jika database gagal, webhook mengembalikan 503 agar Kirimdev mengulang.

Inbox memeriksa revision lokal setiap 6 detik selama tab terlihat. Perubahan
revision memicu pembacaan ulang API. Refresh cadangan setiap 60 detik dan tombol
**Muat ulang** juga tersedia. Aktifkan `message.received`, `message.status`, dan
`message.sent` pada subscription agar pesan masuk, balasan dari sumber lain, serta
status terkirim/dibaca memperbarui inbox. Status koneksi nomor tidak membuktikan
webhook sudah dapat diakses.

Balasan teks hanya tersedia dalam 24 jam setelah pesan terakhir pelanggan.
Di luar jendela itu gunakan template melalui Kirimdev. Endpoint pengiriman wajib
login, memeriksa origin, mengambil penerima dari percakapan di server, dan memakai
key idempotensi agar retry permintaan yang sama tidak mengirim dua kali. Bot AI,
pengiriman template, serta upload lampiran dari web belum diaktifkan.

Jalankan pengujian dengan `bun test tests/whatsapp.test.mjs`.

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
