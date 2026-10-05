export type PaletteColor = { name: string; hex: string };

/** Stok warna filamen contoh. Ganti sesuai stok sebenarnya. */
export const PALETTE: PaletteColor[] = [
  { name: "Putih Salju", hex: "#f4f4f2" },
  { name: "Hitam Pekat", hex: "#16181d" },
  { name: "Abu Beton", hex: "#8a8f98" },
  { name: "Merah Cabai", hex: "#d9363e" },
  { name: "Coral", hex: "#f2686a" },
  { name: "Pink Permen", hex: "#f58bb5" },
  { name: "Oranye Jeruk", hex: "#f58a2a" },
  { name: "Kuning Lemon", hex: "#f7d33c" },
  { name: "Lime", hex: "#a9dc3c" },
  { name: "Hijau Mint", hex: "#6fd8b0" },
  { name: "Hijau Hutan", hex: "#1f7a4d" },
  { name: "Teal Laut", hex: "#14a3a8" },
  { name: "Sky Blue", hex: "#5db7e8" },
  { name: "Biru Royal", hex: "#2d57d6" },
  { name: "Navy", hex: "#1c2a5c" },
  { name: "Ungu Anggur", hex: "#6d3fc9" },
  { name: "Lilac", hex: "#b9a1f0" },
  { name: "Peach", hex: "#f6c4a2" },
  { name: "Cokelat Kopi", hex: "#6b4429" },
  { name: "Krem", hex: "#efe2c4" },
];

export const SHOWY = [
  "#f2686a",
  "#f58a2a",
  "#f7d33c",
  "#6fd8b0",
  "#5db7e8",
  "#6d3fc9",
  "#f58bb5",
  "#2d57d6",
  "#a9dc3c",
  "#14a3a8",
];

export function colorName(hex: string): string {
  return PALETTE.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? "Kustom";
}

/** Kontras rendah antara dua warna? (luminansi relatif) */
export function lowContrast(a: string, b: string): boolean {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  const la = lum(a);
  const lb = lum(b);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return ratio < 1.8;
}
