/**
 * Gambar contoh bergaya kartun (SVG buatan sendiri, 100% orisinal) untuk
 * generator Clicker Karakter.
 */

const svg = (body: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${body}</svg>`,
  );

const INK = "#2a2a30";

export type Sample = { id: string; label: string; tag: string; url: string };

export const SAMPLES: Sample[] = [
  {
    id: "kucing",
    label: "Kucing",
    tag: "Hewan",
    url: svg(`
      <path d="M70 150 L90 40 L170 105 Z" fill="${INK}"/>
      <path d="M330 150 L310 40 L230 105 Z" fill="${INK}"/>
      <ellipse cx="200" cy="240" rx="150" ry="125" fill="#f4c27a" stroke="${INK}" stroke-width="16"/>
      <path d="M200 120 L200 175" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
      <path d="M150 128 L158 168 M250 128 L242 168" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M130 235 Q150 215 170 235" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M230 235 Q250 215 270 235" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M185 268 L215 268 L200 285 Z" fill="${INK}"/>
      <path d="M200 285 Q185 310 165 298 M200 285 Q215 310 235 298" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    `),
  },
  {
    id: "cake",
    label: "Birthday Cake",
    tag: "Cake",
    url: svg(`
      <rect x="185" y="40" width="30" height="75" rx="8" fill="#f4c27a" stroke="${INK}" stroke-width="14"/>
      <path d="M200 8 Q225 40 200 58 Q175 40 200 8 Z" fill="#ff6b5e" stroke="${INK}" stroke-width="10"/>
      <rect x="70" y="150" width="260" height="205" rx="36" fill="#f4c27a" stroke="${INK}" stroke-width="16"/>
      <path d="M70 195 Q100 240 130 195 Q160 240 190 195 Q220 240 250 195 Q280 240 330 195 L330 150 Q330 130 300 130 L100 130 Q70 130 70 150 Z" fill="#ff6b5e" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
      <circle cx="150" cy="285" r="9" fill="${INK}"/>
      <circle cx="250" cy="285" r="9" fill="${INK}"/>
      <path d="M180 305 Q200 330 220 305" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    `),
  },
  {
    id: "stroberi",
    label: "Stroberi",
    tag: "Buah",
    url: svg(`
      <path d="M200 95 C80 85 40 190 90 270 C125 330 170 365 200 372 C230 365 275 330 310 270 C360 190 320 85 200 95 Z" fill="#ff5a5f" stroke="${INK}" stroke-width="16" stroke-linejoin="round"/>
      <path d="M200 100 L150 40 L185 70 L200 20 L215 70 L250 40 Z" fill="#6fcf6f" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>
      <circle cx="155" cy="205" r="11" fill="${INK}"/>
      <circle cx="245" cy="205" r="11" fill="${INK}"/>
      <path d="M180 240 Q200 262 220 240" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="140" cy="150" rx="9" ry="14" fill="#fff4d6"/>
      <ellipse cx="260" cy="150" rx="9" ry="14" fill="#fff4d6"/>
      <ellipse cx="200" cy="315" rx="9" ry="14" fill="#fff4d6"/>
    `),
  },
  {
    id: "sushi",
    label: "Sushi",
    tag: "Makanan",
    url: svg(`
      <rect x="55" y="190" width="290" height="150" rx="60" fill="#f4e6c8" stroke="${INK}" stroke-width="16"/>
      <path d="M45 215 Q40 110 150 100 Q200 90 255 100 Q365 110 355 215 Q200 255 45 215 Z" fill="#ff6b5e" stroke="${INK}" stroke-width="16" stroke-linejoin="round"/>
      <path d="M120 128 Q135 170 120 200 M200 118 Q215 165 200 205 M280 128 Q295 170 280 200" fill="none" stroke="#fff4d6" stroke-width="10" stroke-linecap="round"/>
      <circle cx="155" cy="285" r="9" fill="${INK}"/>
      <circle cx="245" cy="285" r="9" fill="${INK}"/>
      <path d="M180 305 Q200 325 220 305" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
    `),
  },
];
