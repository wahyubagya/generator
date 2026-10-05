import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Font } from "opentype.js";

type ExtrudeOpts = {
  bevel?: number;
  bevelSize?: number;
  /** perluas kontur (mm) sebelum bevel — untuk tepi alas yang mengikuti huruf */
  offset?: number;
  curveSegments?: number;
};

export function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (!geos.length) return null;
  const prepared = geos.map((g) => {
    const c = g.index ? g.toNonIndexed() : g;
    return c;
  });
  const merged = mergeGeometries(prepared, false);
  geos.forEach((g) => g.dispose());
  return merged;
}

/* -------------------------------------------------------------------------- */
/*  Teks -> Shape                                                              */
/* -------------------------------------------------------------------------- */

export type TextLayout = {
  /** Shape sudah di-center di (0,0), sumbu Y ke atas, satuan mm */
  shapes: THREE.Shape[];
  w: number;
  h: number;
  /** estimasi luas permukaan (mm²) */
  area: number;
};

function shapesArea(shapes: THREE.Shape[]): number {
  let total = 0;
  for (const s of shapes) {
    total += Math.abs(THREE.ShapeUtils.area(s.getPoints(6)));
    for (const hole of s.holes) {
      total -= Math.abs(THREE.ShapeUtils.area(hole.getPoints(6)));
    }
  }
  return Math.max(0, total);
}

export function layoutText(
  font: Font,
  text: string,
  o: { capHeight: number; maxW?: number; maxH?: number },
): TextLayout | null {
  if (!text.trim()) return null;
  const os2 = (font.tables as { os2?: { sCapHeight?: number } }).os2;
  const capRatio =
    (os2?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm;
  const fontSize = o.capHeight / capRatio;
  const path = font.getPath(text, 0, 0, fontSize);
  const bb = path.getBoundingBox();
  const bw = bb.x2 - bb.x1;
  const bh = bb.y2 - bb.y1;
  if (!isFinite(bw) || !isFinite(bh) || bw <= 0 || bh <= 0) return null;

  let s = 1;
  if (o.maxW) s = Math.min(s, o.maxW / bw);
  if (o.maxH) s = Math.min(s, o.maxH / bh);

  const cx = (bb.x1 + bb.x2) / 2;
  const cy = (bb.y1 + bb.y2) / 2;
  const X = (x: number) => (x - cx) * s;
  const Y = (y: number) => -(y - cy) * s;

  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    switch (c.type) {
      case "M":
        sp.moveTo(X(c.x), Y(c.y));
        break;
      case "L":
        sp.lineTo(X(c.x), Y(c.y));
        break;
      case "Q":
        sp.quadraticCurveTo(X(c.x1), Y(c.y1), X(c.x), Y(c.y));
        break;
      case "C":
        sp.bezierCurveTo(
          X(c.x1),
          Y(c.y1),
          X(c.x2),
          Y(c.y2),
          X(c.x),
          Y(c.y),
        );
        break;
      default:
        break;
    }
  }
  const shapes = sp.toShapes(false);
  if (!shapes.length) return null;
  return { shapes, w: bw * s, h: bh * s, area: shapesArea(shapes) };
}

/* -------------------------------------------------------------------------- */
/*  Extrude                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extrude shape (bidang XY) lalu putar agar menjadi "rebah" di meja:
 * XY-atas  -> sumbu -Z,   ketebalan -> sumbu +Y (dasar di y = 0).
 */
export function extrudeFlat(
  shapes: THREE.Shape[],
  depth: number,
  opts?: ExtrudeOpts,
): THREE.BufferGeometry {
  const bt = opts?.bevel ?? 0;
  const off = opts?.offset ?? 0;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.max(0.01, depth),
    bevelEnabled: bt > 0 || off > 0,
    bevelThickness: bt,
    bevelSize: opts?.bevelSize ?? bt * 0.8,
    bevelOffset: off,
    bevelSegments: 2,
    curveSegments: opts?.curveSegments ?? 6,
  });
  geo.translate(0, 0, bt);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Extrude tegak: shape tetap di bidang XY (Y ke atas), ketebalan ke +Z (depan),
 * sisi belakang di z = 0.
 */
export function extrudeUpright(
  shapes: THREE.Shape[],
  depth: number,
  opts?: ExtrudeOpts,
): THREE.BufferGeometry {
  const bt = opts?.bevel ?? 0;
  const off = opts?.offset ?? 0;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.max(0.01, depth),
    bevelEnabled: bt > 0 || off > 0,
    bevelThickness: bt,
    bevelSize: opts?.bevelSize ?? bt * 0.8,
    bevelOffset: off,
    bevelSegments: 2,
    curveSegments: opts?.curveSegments ?? 6,
  });
  geo.translate(0, 0, bt);
  return geo;
}

/** Shape luar saja (tanpa lubang) dari sebuah shape. */
export function outerOnly(shapes: THREE.Shape[]): THREE.Shape[] {
  return shapes.map((s) => new THREE.Shape(s.getPoints(8)));
}

export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const rr = Math.max(0.01, Math.min(r, w / 2, h / 2));
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - rr);
  s.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
  s.lineTo(x + rr, y + h);
  s.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + rr);
  s.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function annulusShape(rOut: number, rIn: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

/**
 * Profil "C" (penjepit pensil) memanjang di sumbu X, pusat di (0,0,0),
 * celah menghadap -Z (belakang). Panjang `length` di-center pada x = 0.
 */
export function clipTubeGeometry(
  innerR: number,
  wall: number,
  length: number,
): THREE.BufferGeometry {
  const outerR = innerR + wall;
  const slit = (42 * Math.PI) / 180;
  const a0 = slit;
  const a1 = Math.PI * 2 - slit;
  const steps = 40;
  const s = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const x = outerR * Math.cos(a);
    const y = outerR * Math.sin(a);
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    s.lineTo(innerR * Math.cos(a), innerR * Math.sin(a));
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 4,
  });
  // extrude sepanjang +Z -> putar ke sumbu X
  geo.rotateY(Math.PI / 2);
  geo.translate(-length / 2, 0, 0);
  return geo;
}

/* -------------------------------------------------------------------------- */
/*  Keycap (loft rounded-rect)                                                 */
/* -------------------------------------------------------------------------- */

export type LoftRing = { y: number; w: number; d: number; r: number };

function rrPoints(w: number, d: number, r: number, seg: number) {
  const hw = w / 2;
  const hd = d / 2;
  const rr = Math.max(0.01, Math.min(r, hw, hd));
  const corners: [number, number, number][] = [
    [hw - rr, hd - rr, 0],
    [-hw + rr, hd - rr, 90],
    [-hw + rr, -hd + rr, 180],
    [hw - rr, -hd + rr, 270],
  ];
  const pts: [number, number][] = [];
  for (const [cx, cz, start] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = ((start + (90 * i) / seg) * Math.PI) / 180;
      pts.push([cx + rr * Math.cos(a), cz + rr * Math.sin(a)]);
    }
  }
  return pts;
}

export function buildKeycapGeometry(
  rings: LoftRing[],
  seg = 5,
): { side: THREE.BufferGeometry; cap: THREE.BufferGeometry } {
  const ringPts = rings.map((r) => rrPoints(r.w, r.d, r.r, seg));
  const n = ringPts[0].length;
  const positions: number[] = [];
  rings.forEach((ring, i) => {
    for (const [x, z] of ringPts[i]) positions.push(x, ring.y, z);
  });
  const index: number[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n;
      const A = i * n + k;
      const B = i * n + k2;
      const C = (i + 1) * n + k2;
      const D = (i + 1) * n + k;
      index.push(A, C, B, A, D, C);
    }
  }
  const side = new THREE.BufferGeometry();
  side.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  side.setIndex(index);
  side.computeVertexNormals();

  const top = rings[rings.length - 1];
  const capPos: number[] = [0, top.y, 0];
  const capNormal: number[] = [0, 1, 0];
  for (const [x, z] of ringPts[ringPts.length - 1]) {
    capPos.push(x, top.y, z);
    capNormal.push(0, 1, 0);
  }
  const capIndex: number[] = [];
  for (let k = 0; k < n; k++) {
    const k2 = (k + 1) % n;
    capIndex.push(0, 1 + k2, 1 + k);
  }
  const cap = new THREE.BufferGeometry();
  cap.setAttribute("position", new THREE.Float32BufferAttribute(capPos, 3));
  cap.setAttribute("normal", new THREE.Float32BufferAttribute(capNormal, 3));
  cap.setIndex(capIndex);
  return { side, cap };
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

export type IconKind = "heart" | "star" | "bolt" | "flower" | "paw" | "smile";

export const ICON_OPTIONS: { id: IconKind; label: string }[] = [
  { id: "heart", label: "Hati" },
  { id: "star", label: "Bintang" },
  { id: "bolt", label: "Petir" },
  { id: "flower", label: "Bunga" },
  { id: "paw", label: "Jejak" },
  { id: "smile", label: "Senyum" },
];

function circle(cx: number, cy: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cx, cy, r, 0, Math.PI * 2, false);
  return s;
}

/** Ikon dalam kotak 1x1 berpusat di (0,0). */
function unitIcon(kind: IconKind): THREE.Shape[] {
  switch (kind) {
    case "heart": {
      const s = new THREE.Shape();
      s.moveTo(0, -0.5);
      s.bezierCurveTo(-0.15, -0.36, -0.5, -0.12, -0.5, 0.15);
      s.bezierCurveTo(-0.5, 0.4, -0.2, 0.5, 0, 0.28);
      s.bezierCurveTo(0.2, 0.5, 0.5, 0.4, 0.5, 0.15);
      s.bezierCurveTo(0.5, -0.12, 0.15, -0.36, 0, -0.5);
      return [s];
    }
    case "star": {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 0.5 : 0.22;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a) - 0.02;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      return [s];
    }
    case "bolt": {
      const s = new THREE.Shape();
      s.moveTo(0.12, 0.5);
      s.lineTo(-0.3, -0.04);
      s.lineTo(-0.03, -0.04);
      s.lineTo(-0.12, -0.5);
      s.lineTo(0.3, 0.08);
      s.lineTo(0.03, 0.08);
      s.closePath();
      return [s];
    }
    case "flower": {
      const out: THREE.Shape[] = [];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
        out.push(circle(0.3 * Math.cos(a), 0.3 * Math.sin(a), 0.19));
      }
      out.push(circle(0, 0, 0.17));
      return out;
    }
    case "paw": {
      return [
        circle(0, -0.15, 0.24),
        circle(-0.31, 0.1, 0.11),
        circle(-0.12, 0.3, 0.11),
        circle(0.12, 0.3, 0.11),
        circle(0.31, 0.1, 0.11),
      ];
    }
    case "smile": {
      const s = new THREE.Shape();
      s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
      const eye1 = new THREE.Path();
      eye1.absarc(-0.17, 0.13, 0.065, 0, Math.PI * 2, true);
      const eye2 = new THREE.Path();
      eye2.absarc(0.17, 0.13, 0.065, 0, Math.PI * 2, true);
      const mouth = new THREE.Path();
      const a0 = (205 * Math.PI) / 180;
      const a1 = (335 * Math.PI) / 180;
      const cy = 0.06;
      for (let i = 0; i <= 12; i++) {
        const a = a0 + ((a1 - a0) * i) / 12;
        const x = 0.3 * Math.cos(a);
        const y = cy + 0.3 * Math.sin(a);
        if (i === 0) mouth.moveTo(x, y);
        else mouth.lineTo(x, y);
      }
      for (let i = 12; i >= 0; i--) {
        const a = a0 + ((a1 - a0) * i) / 12;
        mouth.lineTo(0.21 * Math.cos(a), cy + 0.21 * Math.sin(a));
      }
      mouth.closePath();
      s.holes.push(eye1, eye2, mouth);
      return [s];
    }
  }
}

/** Ikon berukuran `size` mm (kotak), berpusat di (0,0), Y ke atas. */
export function iconShapes(kind: IconKind, size: number): THREE.Shape[] {
  const scale = (p: THREE.Vector2) => new THREE.Vector2(p.x * size, p.y * size);
  return unitIcon(kind).map((s) => {
    const outer = new THREE.Shape(s.getPoints(10).map(scale));
    for (const h of s.holes) {
      outer.holes.push(new THREE.Path(h.getPoints(10).map(scale)));
    }
    return outer;
  });
}

export function iconArea(kind: IconKind, size: number): number {
  return shapesArea(iconShapes(kind, size));
}

/* -------------------------------------------------------------------------- */
/*  Satu baris: teks + ikon opsional                                           */
/* -------------------------------------------------------------------------- */

export type Glyph = { shapes: THREE.Shape[]; x: number; w: number; h: number };
export type Line = { parts: Glyph[]; w: number; h: number; area: number };

export function composeLine(
  font: Font | null,
  text: string,
  o: { capHeight: number; maxW: number; icon?: IconKind | null },
): Line | null {
  const iconSize = o.capHeight * 1.2;
  const gap = o.capHeight * 0.3;
  const iconW = o.icon ? iconSize + gap : 0;
  const t = font
    ? layoutText(font, text, { capHeight: o.capHeight, maxW: o.maxW - iconW })
    : null;
  if (!t && !o.icon) return null;
  const tw = t ? t.w : 0;
  const total = tw + (o.icon ? iconSize : 0) + (t && o.icon ? gap : 0);
  const parts: Glyph[] = [];
  let area = 0;
  let h = 0;
  if (o.icon) {
    parts.push({
      shapes: iconShapes(o.icon, iconSize),
      x: -total / 2 + iconSize / 2,
      w: iconSize,
      h: iconSize,
    });
    area += iconArea(o.icon, iconSize);
    h = Math.max(h, iconSize);
  }
  if (t) {
    parts.push({ shapes: t.shapes, x: total / 2 - tw / 2, w: t.w, h: t.h });
    area += t.area;
    h = Math.max(h, t.h);
  }
  return { parts, w: total, h, area };
}
