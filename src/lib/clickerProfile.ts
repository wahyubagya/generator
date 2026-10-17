import * as THREE from "three";
import { buildKeycapGeometry, extrudeFlat, roundedRectShape, type LoftRing } from "./geometry";

/**
 * Profil clicker diambil dari "ALL_CLICKER_PROFILES (3MF)" (model/…3mf):
 * - housing 1×1: 23.5 × 23.5 × 18 mm, sudut R2.4, fillet atas R1.5
 * - lubang keycap 19 × 19 mm, dalam 8 mm (lantai di y = 10)
 * - jarak antar slot pada housing 1×N: 21.55 mm
 * - keycap low profile: dasar 18.4 mm → atas 12.9 mm, tinggi 9.45 mm
 * Lubang gantungan bawaan 3MF sengaja tidak dipakai (diganti kuping / port).
 */
export const CLICKER = {
  cell: 23.5,
  pitch: 21.55,
  height: 18,
  radius: 2.4,
  fillet: 1.5,
  floor: 10,
  pocket: 19,
  pocketR: 0.6,
  /** posisi dasar keycap saat terpasang di switch */
  keyY: 16.5,
  key: { base: 18.4, top: 12.9, h: 9.45, rBase: 3.5, rTop: 2.4 },
  /** port sambungan modular:
   * - Sisi kiri (-X): Ceruk/jendela berongga di dinding bawah, di dalamnya ada lidah dasar + pasak silinder (pin) menghadap ke atas.
   * - Sisi kanan (+X): Lidah kuping menonjol ke luar dengan lubang tembus presisi (seperti gantungan kuping) yang pas meluncur masuk ke ceruk dan pasak.
   */
  port: {
    // Ceruk & pasak di sisi kiri (-X)
    slotDepth: 7.2,
    slotHalfW: 4.4,
    slotH: 5.2,
    baseT: 1.3,
    pegX: 3.8,
    pegR: 1.4,
    pegH: 2.8,
    // Kuping berlubang di sisi kanan (+X)
    earBaseHalfW: 4.1,
    earTipR: 2.7,
    earHoleR: 1.6,
    earY: 1.4,
    earT: 1.7,
  },
} as const;

export const housingWidth = (n: number) => CLICKER.cell + (Math.max(1, n) - 1) * CLICKER.pitch;
export const slotX = (i: number, n: number) => (i - (n - 1) / 2) * CLICKER.pitch;
/** lebar permukaan atas keycap yang rata (untuk huruf/ikon) */
export const KEY_TOP_W = 12.3;

/** Rounded-rect dengan ceruk berongga di sisi kiri (-X) untuk soket modular. */
function notchedRectShape(w: number, d: number, r: number, depth: number, halfW: number) {
  const x0 = -w / 2, x1 = w / 2, y0 = -d / 2, y1 = d / 2;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, halfW);
  s.lineTo(x0 + depth, halfW);
  s.lineTo(x0 + depth, -halfW);
  s.lineTo(x0, -halfW);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Lidah dasar lantai di dalam ceruk soket sisi kiri (-X). */
function internalBaseTabShape(w: number, depth: number, halfW: number) {
  const x0 = -w / 2;
  const x1 = -w / 2 + depth - 0.6;
  const hw = halfW - 0.8;
  const s = new THREE.Shape();
  s.moveTo(x0, -hw);
  s.lineTo(x1 - hw, -hw);
  s.absarc(x1 - hw, 0, hw, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(x0, hw);
  s.closePath();
  return s;
}

/** Lidah kuping menonjol di sisi kanan (+X) dengan lubang tembus untuk pasak. */
function modularEarShape(w: number, pegX: number, tipR: number, holeR: number, baseHalfW: number) {
  const xa = w / 2 - 0.6;
  const cx = w / 2 + pegX;
  const s = new THREE.Shape();
  s.moveTo(xa, -baseHalfW);
  s.lineTo(cx, -tipR);
  s.absarc(cx, 0, tipR, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(xa, baseHalfW);
  s.closePath();

  // Lubang tembus untuk pasak
  const hole = new THREE.Path();
  hole.absarc(cx, 0, holeR, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

export type ClickerBodyStyle = "standar" | "rounded";

function lift(geo: THREE.BufferGeometry, y: number) {
  geo.translate(0, y, 0);
  return geo;
}

/** Sisi luar housing (y = floor → height) termasuk fillet atas, dengan UV dalam mm. */
function housingSide(w: number, d: number, R: number, f: number): THREE.BufferGeometry {
  const { height: H, floor } = CLICKER;
  const rings: LoftRing[] = [{ y: floor, w, d, r: R }];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    const e = f * (1 - Math.cos(a));
    rings.push({ y: H - f + f * Math.sin(a), w: w - 2 * e, d: d - 2 * e, r: Math.max(0.3, R - e) });
  }
  const { side, cap } = buildKeycapGeometry(rings, 6);
  cap.dispose();
  const pos = side.getAttribute("position");
  const per = pos.count / rings.length;
  const uv = new Float32Array(pos.count * 2);
  for (let ri = 0; ri < rings.length; ri++) {
    let dist = 0;
    for (let k = 0; k < per; k++) {
      const i = ri * per + k;
      if (k > 0) dist += Math.hypot(pos.getX(i) - pos.getX(i - 1), pos.getZ(i) - pos.getZ(i - 1));
      uv[i * 2] = dist;
      uv[i * 2 + 1] = pos.getY(i);
    }
  }
  side.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return side;
}

/**
 * Housing clicker n-slot sesuai profil 3MF.
 * `port: true` → modul susun:
 * - Celah ceruk berongga di sisi kiri (-X) dengan lantai dasar dan pasak tegak (pin) di dalamnya.
 * - Lidah kuping dengan lubang tembus di sisi kanan (+X) untuk disambungkan ke modul berikutnya.
 * `bodyStyle: 'rounded'` → sudut luar R5.2mm dan lubang dalam (pocket) R3.8mm konsentris mengikuti lekukan keycap.
 */
export function clickerHousingGeometries(
  n: number,
  opts?: { port?: boolean; bodyStyle?: ClickerBodyStyle },
): THREE.BufferGeometry[] {
  const isRounded = opts?.bodyStyle === "rounded";
  const { cell: D, floor, height: H, pocket, port: P } = CLICKER;
  const R = isRounded ? 5.2 : CLICKER.radius;
  const f = isRounded ? 1.8 : CLICKER.fillet;
  const pocketR = isRounded ? 3.8 : CLICKER.pocketR;
  const W = housingWidth(n);
  const out: THREE.BufferGeometry[] = [];

  // Badan bawah (solid sampai lantai lubang keycap)
  if (opts?.port) {
    // Dinding dengan celah jendela/ceruk di sisi kiri
    out.push(extrudeFlat([notchedRectShape(W, D, R, P.slotDepth, P.slotHalfW)], P.slotH, { curveSegments: 10 }));

    // Di dalam ceruk: lidah lantai dasar
    out.push(extrudeFlat([internalBaseTabShape(W, P.slotDepth, P.slotHalfW)], P.baseT, { curveSegments: 16 }));

    // Di atas lidah lantai dasar: pasak silinder (pin) dengan ujung chamfer
    const pegBody = new THREE.CylinderGeometry(P.pegR, P.pegR, P.pegH - 0.5, 24);
    pegBody.translate(-W / 2 + P.pegX, P.baseT + (P.pegH - 0.5) / 2, 0);
    out.push(pegBody);

    const pegCap = new THREE.CylinderGeometry(P.pegR - 0.35, P.pegR, 0.5, 24);
    pegCap.translate(-W / 2 + P.pegX, P.baseT + P.pegH - 0.25, 0);
    out.push(pegCap);

    // Atap celah ceruk sampai ke lantai pocket switch
    out.push(lift(extrudeFlat([roundedRectShape(W, D, R)], floor - P.slotH, { curveSegments: 10 }), P.slotH));

    // Di sisi kanan (+X): kuping menonjol keluar dengan lubang tembus untuk pasak
    const earGeo = extrudeFlat([modularEarShape(W, P.pegX, P.earTipR, P.earHoleR, P.earBaseHalfW)], P.earT, {
      bevel: 0.2,
      bevelSize: 0.2,
      curveSegments: 20,
    });
    lift(earGeo, P.earY);
    out.push(earGeo);
  } else {
    out.push(extrudeFlat([roundedRectShape(W, D, R)], floor, { curveSegments: 10 }));
  }

  // Bibir atas berlubang (permukaan atas + dinding lubang keycap)
  const rim = roundedRectShape(W - 2 * f, D - 2 * f, Math.max(0.4, R - f));
  for (let i = 0; i < n; i++) {
    const sq = roundedRectShape(pocket, pocket, pocketR);
    const cx = slotX(i, n);
    rim.holes.push(new THREE.Path(sq.getPoints(isRounded ? 12 : 4).map((p) => new THREE.Vector2(p.x + cx, p.y))));
  }
  out.push(lift(extrudeFlat([rim], H - floor, { curveSegments: 10 }), floor));

  // Sisi luar + fillet atas
  out.push(housingSide(W, D, R, f));

  return out;
}

/** Ring loft keycap low profile 3MF (dinding miring lurus, atas rata, fillet kecil). */
export function lowKeycapRings(): LoftRing[] {
  const { base, top, h, rBase, rTop } = CLICKER.key;
  const at = (y: number) => {
    const t = y / h;
    return { w: base - (base - top) * t, r: rBase - (rBase - rTop) * t };
  };
  const a = at(h - 0.5);
  return [
    { y: 0, w: base, d: base, r: rBase },
    { y: h - 0.5, w: a.w, d: a.w, r: a.r },
    { y: h - 0.15, w: top - 0.05, d: top - 0.05, r: rTop - 0.1 },
    { y: h, w: KEY_TOP_W, d: KEY_TOP_W, r: rTop - 0.35 },
  ];
}
