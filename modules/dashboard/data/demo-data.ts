// Data pratinjau; ganti sumber ini setelah model transaksi dan produk tersedia.
export const orders = [
  { id: "FF-1028", customer: "Anisa Putri", initials: "AP", product: "Chicken Nugget 500 g", quantity: 3, total: 135000, time: "10.42", status: "Diproses" },
  { id: "FF-1027", customer: "Budi Santoso", initials: "BS", product: "Sosis Sapi 500 g", quantity: 2, total: 76000, time: "10.35", status: "Dikirim" },
  { id: "FF-1026", customer: "Dewi Lestari", initials: "DL", product: "Dimsum Ayam 20 pcs", quantity: 2, total: 110000, time: "10.18", status: "Selesai" },
  { id: "FF-1025", customer: "Rizky Pratama", initials: "RP", product: "Kentang Goreng 1 kg", quantity: 1, total: 42000, time: "09.56", status: "Menunggu" },
  { id: "FF-1024", customer: "Siti Rahma", initials: "SR", product: "Chicken Nugget 500 g", quantity: 2, total: 90000, time: "09.40", status: "Selesai" },
  { id: "FF-1023", customer: "Fajar Hidayat", initials: "FH", product: "Bakso Sapi 500 g", quantity: 3, total: 144000, time: "09.22", status: "Dikirim" },
] as const;

export type Order = (typeof orders)[number];

export const products = [
  { name: "Chicken Nugget", detail: "500 g · Ayam", sold: 86, stock: 42, color: "bg-amber-50 text-amber-600" },
  { name: "Dimsum Ayam", detail: "20 pcs · Siap kukus", sold: 64, stock: 8, color: "bg-orange-50 text-orange-500" },
  { name: "Sosis Sapi", detail: "500 g · Sapi", sold: 52, stock: 35, color: "bg-rose-50 text-rose-500" },
  { name: "Kentang Goreng", detail: "1 kg · Original", sold: 38, stock: 6, color: "bg-yellow-50 text-yellow-600" },
] as const;

export const salesPeriods = {
  week: { label: "7 hari", total: 8450000, change: "+18,6%", labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], values: [650000, 1100000, 850000, 1450000, 1200000, 1850000, 1350000], previous: [500000, 850000, 700000, 1100000, 950000, 1600000, 1425000] },
  month: { label: "30 hari", total: 32480000, change: "+12,8%", labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"], values: [6200000, 8450000, 7680000, 10150000], previous: [5500000, 7100000, 7200000, 8990000] },
} as const;

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
