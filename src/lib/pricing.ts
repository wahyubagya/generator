export const MARKETPLACE_FEE = 0.15;

export const formatRp = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

export const formatRupiah = formatRp;

export const roundUp = (n: number, step = 500) => Math.ceil(n / step) * step;

/** Harga bila bayar lewat marketplace (+15%), dibulatkan ke puluhan. */
export const marketplacePrice = (n: number) =>
  Math.round((n * (1 + MARKETPLACE_FEE)) / 5) * 5;

/** Keycap: harga tetap per desain. */
export const KEYCAP_PRICE = 25000;

/** Clicker: mulai dari harga dasar, tiap slot tambahan +10.000. */
export const CLICKER_BASE = 29900;
export const CLICKER_EXTRA = 10000;
export const clickerPrice = (slots: number) =>
  CLICKER_BASE + CLICKER_EXTRA * Math.max(0, slots - 1);

/**
 * Estimasi harga cetak dari volume (mm³) dan jumlah warna.
 * Rumus sederhana: biaya dasar + bahan (gram) + penggantian warna.
 */
export function estimateByVolume(volumeMm3: number, colors: number) {
  const grams = (volumeMm3 / 1000) * 1.24;
  const raw = 9000 + grams * 1100 + Math.max(0, colors - 1) * 2500;
  return { grams, price: roundUp(raw, 500) };
}
