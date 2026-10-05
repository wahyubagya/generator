import { parse, type Font } from "opentype.js";

export type FontOption = {
  id: string;
  label: string;
  file: string;
};

/** Semua font berlisensi OFL (Google Fonts), disimpan lokal di /public/fonts. */
export const FONT_OPTIONS: FontOption[] = [
  { id: "sniglet", label: "Bulat Ceria", file: "/fonts/Sniglet-ExtraBold.ttf" },
  { id: "chango", label: "Bubble Gemas", file: "/fonts/Chango-Regular.ttf" },
  { id: "bangers", label: "Kartun Komik", file: "/fonts/Bangers-Regular.ttf" },
  { id: "righteous", label: "Modern Bulat", file: "/fonts/Righteous-Regular.ttf" },
  { id: "bungee", label: "Blok Tebal", file: "/fonts/Bungee-Regular.ttf" },
  { id: "lobster", label: "Klasik Manis", file: "/fonts/Lobster-Regular.ttf" },
  { id: "pacifico", label: "Tulisan Santai", file: "/fonts/Pacifico-Regular.ttf" },
];

export const DEFAULT_FONT = FONT_OPTIONS[0].id;

const cache = new Map<string, Promise<Font>>();

export function loadFont(id: string): Promise<Font> {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  let p = cache.get(opt.id);
  if (!p) {
    p = fetch(opt.file)
      .then((r) => {
        if (!r.ok) throw new Error(`Font gagal dimuat: ${opt.file}`);
        return r.arrayBuffer();
      })
      .then((buf) => parse(buf));
    cache.set(opt.id, p);
  }
  return p;
}
