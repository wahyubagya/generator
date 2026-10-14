import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { extrudeFlat } from "@/lib/geometry";
import type { ReliefSource } from "@/lib/imageRelief";
import { quantize } from "@/lib/imageRelief";

type Pt = [number, number];

/**
 * Tabel marching squares. Bit: tl=1, tr=2, br=4, bl=8.
 * Edge: 0=atas, 1=kanan, 2=bawah, 3=kiri. Arah segmen konsisten
 * (area "dalam" selalu di sisi yang sama) sehingga loop bisa disambung O(n).
 */
const EDGES: Record<number, [number, number][]> = {
  0: [],
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 0], [1, 2]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[2, 0]],
  10: [[0, 1], [2, 3]],
  11: [[2, 1]],
  12: [[1, 3]],
  13: [[1, 0]],
  14: [[0, 3]],
  15: [],
};
/** Saddle yang "tersambung" lewat tengah sel (nilai tengah >= iso). */
const SADDLE_JOINED: Record<number, [number, number][]> = {
  5: [[1, 0], [3, 2]],
  10: [[0, 3], [2, 1]],
};

/** Padding (px) di sekeliling field agar semua kontur tertutup & blur tidak terpotong. */
const PAD = 4;

function polygonArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return a / 2;
}

function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Mask biner -> field kontinu (0..1) yang di-blur Gaussian, dengan padding nol.
 * Kontur iso 0.5 dari field ini mengikuti bentuk asli tapi tanpa tangga piksel.
 */
function blurField(mask: Uint8Array, w: number, h: number, sigma: number) {
  const W = w + PAD * 2;
  const H = h + PAD * 2;
  const src = new Float32Array(W * H);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) src[(y + PAD) * W + x + PAD] = mask[y * w + x];
  }
  if (sigma <= 0) return { f: src, W, H };

  const r = Math.min(PAD, Math.max(1, Math.ceil(sigma * 2.5)));
  const k: number[] = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;

  const tmp = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) {
        const xx = x + i < 0 ? 0 : x + i >= W ? W - 1 : x + i;
        s += k[i + r] * src[row + xx];
      }
      tmp[row + x] = s;
    }
  }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) {
        const yy = y + i < 0 ? 0 : y + i >= H ? H - 1 : y + i;
        s += k[i + r] * tmp[yy * W + x];
      }
      out[y * W + x] = s;
    }
  }
  return { f: out, W, H };
}

/** Marching squares dengan interpolasi linear sub-piksel pada nilai iso. */
function traceField(f: Float32Array, W: number, H: number, iso: number): Pt[][] {
  const next = new Map<number, number>();
  const hE = (x: number, y: number) => (y * W + x) * 2;
  const vE = (x: number, y: number) => (y * W + x) * 2 + 1;

  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      const tl = f[y * W + x];
      const tr = f[y * W + x + 1];
      const br = f[(y + 1) * W + x + 1];
      const bl = f[(y + 1) * W + x];
      const idx = (tl >= iso ? 1 : 0) | (tr >= iso ? 2 : 0) | (br >= iso ? 4 : 0) | (bl >= iso ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      let pairs = EDGES[idx];
      if ((idx === 5 || idx === 10) && (tl + tr + br + bl) / 4 >= iso) pairs = SADDLE_JOINED[idx];
      const e = [hE(x, y), vE(x + 1, y), hE(x, y + 1), vE(x, y)];
      for (const [a, b] of pairs) next.set(e[a], e[b]);
    }
  }

  const edgePoint = (id: number): Pt => {
    const base = id >> 1;
    const x = base % W;
    const y = (base - x) / W;
    const a = f[base];
    if ((id & 1) === 0) {
      const b = f[base + 1];
      const t = (iso - a) / (b - a);
      return [x + t - PAD, y - PAD];
    }
    const b = f[base + W];
    const t = (iso - a) / (b - a);
    return [x - PAD, y + t - PAD];
  };

  const loops: Pt[][] = [];
  const visited = new Set<number>();
  for (const start of next.keys()) {
    if (visited.has(start)) continue;
    const loop: Pt[] = [];
    let cur: number | undefined = start;
    while (cur !== undefined && !visited.has(cur)) {
      visited.add(cur);
      const p = edgePoint(cur);
      const last = loop[loop.length - 1];
      if (!last || Math.abs(last[0] - p[0]) + Math.abs(last[1] - p[1]) > 1e-3) loop.push(p);
      cur = next.get(cur);
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

/** Taubin smoothing (λ/μ) — menghaluskan tanpa membuat bentuk menyusut. */
function taubin(pts: Pt[], iters = 2, lambda = 0.5, mu = -0.53): Pt[] {
  let cur = pts;
  const n = pts.length;
  if (n < 5) return pts;
  for (let it = 0; it < iters * 2; it++) {
    const f = it % 2 === 0 ? lambda : mu;
    const nxt: Pt[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = cur[(i - 1 + n) % n];
      const b = cur[i];
      const c = cur[(i + 1) % n];
      nxt[i] = [b[0] + f * ((a[0] + c[0]) / 2 - b[0]), b[1] + f * ((a[1] + c[1]) / 2 - b[1])];
    }
    cur = nxt;
  }
  return cur;
}

function dpOpen(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  const tol2 = tol * tol;
  while (stack.length) {
    const [s, e] = stack.pop() as [number, number];
    const [ax, ay] = pts[s];
    const [bx, by] = pts[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    let maxD = -1;
    let maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = pts[i];
      const cross = (px - ax) * dy - (py - ay) * dx;
      const d2 = (cross * cross) / len2;
      if (d2 > maxD) {
        maxD = d2;
        maxI = i;
      }
    }
    if (maxI >= 0 && maxD > tol2) {
      keep[maxI] = 1;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Douglas–Peucker untuk loop tertutup — membuang titik berlebih di bagian lurus. */
function simplifyClosed(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 8) return pts;
  let far = 0;
  let farD = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  const a = dpOpen(pts.slice(0, far + 1), tol);
  const b = dpOpen([...pts.slice(far), pts[0]], tol);
  const out = [...a.slice(0, -1), ...b.slice(0, -1)];
  return out.length >= 3 ? out : pts;
}

/**
 * Mask biner -> loop kontur halus (sub-piksel, tanpa efek tangga/kotak).
 */
function traceMaskLoops(mask: Uint8Array, w: number, h: number, minArea = 5, sigma = 0.9): Pt[][] {
  const { f, W, H } = blurField(mask, w, h, sigma);
  const raw = traceField(f, W, H, 0.5);
  const loops: Pt[][] = [];
  for (const loop of raw) {
    if (Math.abs(polygonArea(loop)) < minArea) continue;
    const smooth = simplifyClosed(taubin(loop, 2), 0.06);
    if (smooth.length >= 3) loops.push(smooth);
  }
  return loops;
}

/**
 * Builds THREE.Shape[] from loops. Orientasi loop dari marching squares konsisten,
 * jadi tanda area membedakan kontur luar vs lubang (pulau di dalam lubang tetap benar).
 */
function loopsToShapes(loops: Pt[][], w: number, h: number, cell: number): THREE.Shape[] {
  if (loops.length === 0) return [];

  const data = loops.map((pts) => {
    const a = polygonArea(pts);
    return { pts, area: a, absArea: Math.abs(a) };
  });
  const biggest = data.reduce((m, d) => (d.absArea > m.absArea ? d : m), data[0]);
  const outerSign = Math.sign(biggest.area) || 1;

  const toVec = (pts: Pt[]) =>
    pts.map(([px, py]) => new THREE.Vector2((px - w / 2) * cell, (py - h / 2) * cell));

  // Luar diurutkan dari terkecil agar lubang masuk ke induk terdekat.
  const outers = data
    .filter((d) => Math.sign(d.area) === outerSign)
    .sort((a, b) => a.absArea - b.absArea)
    .map((d) => ({ d, shape: new THREE.Shape(toVec(d.pts)) }));

  for (const hole of data) {
    if (Math.sign(hole.area) === outerSign) continue;
    const probe = hole.pts[0];
    const parent = outers.find((o) => o.d.absArea > hole.absArea && pointInPolygon(probe, o.d.pts));
    if (parent) parent.shape.holes.push(new THREE.Path(toVec(hole.pts)));
  }

  return outers.map((o) => o.shape);
}

/** Extrude + normal "creased": dinding lengkung ter-shading mulus, sudut tajam tetap tegas. */
function smoothExtrude(shapes: THREE.Shape[], depth: number, bevel: number): THREE.BufferGeometry {
  const raw = extrudeFlat(shapes, depth, { bevel, bevelSize: bevel });
  const geo = toCreasedNormals(raw, (40 * Math.PI) / 180);
  raw.dispose();
  return geo;
}

export type VectorReliefLayer = {
  geometry: THREE.BufferGeometry;
  color: string;
};

export type VectorReliefResult = {
  baseGeometry: THREE.BufferGeometry | null;
  baseColor: string;
  layers: VectorReliefLayer[];
  housingGeometry?: THREE.BufferGeometry | null;
  housingColor?: string;
  housingHeight?: number;
  top: { x: number; z: number };
  volume: number;
};

const BASE_BEVEL = 0.35;
const LAYER_BEVEL = 0.2;
/** Tumpang-tindih antar layer bertumpuk agar menyatu tanpa celah. */
const LAYER_OVERLAP = 0.3;

/**
 * Builds a vector-extruded, perfectly smooth 3D relief model with zero voxel artifacts.
 */
export function buildVectorRelief(
  src: ReliefSource,
  options: {
    width: number;
    k: number;
    baseThick: number;
    step: number;
    outline: number;
    baseColor: string;
    housingHeight?: number;
    housingColor?: string;
    overrides?: Record<number, string>;
  },
): VectorReliefResult {
  const { w, h, bg } = src;
  const q = quantize(src, options.k);
  const cell = options.width / w;
  const dil = Math.max(0, Math.round(options.outline / Math.max(0.15, cell)));

  // 1. Alas (foreground + perluasan outline)
  let baseGeo: THREE.BufferGeometry | null = null;
  let baseLoops: Pt[][] = [];
  if (dil > 0) {
    const baseMask = new Uint8Array(w * h);
    const d2 = dil * dil;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (bg[p] === 0) {
          baseMask[p] = 1;
          continue;
        }
        let hit = false;
        for (let dy = -dil; dy <= dil && !hit; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -dil; dx <= dil; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < w && dx * dx + dy * dy <= d2 && bg[ny * w + nx] === 0) {
              hit = true;
              break;
            }
          }
        }
        if (hit) baseMask[p] = 1;
      }
    }
    baseLoops = traceMaskLoops(baseMask, w, h, 12, 1.2);
    const baseShapes = loopsToShapes(baseLoops, w, h, cell);
    if (baseShapes.length > 0) baseGeo = smoothExtrude(baseShapes, options.baseThick, BASE_BEVEL);
  }

  // 1b. Bodi Housing Clicker (Mengikuti siluet luar gambar dengan offset casing kokoh)
  let housingGeo: THREE.BufferGeometry | null = null;
  let housingLoops: Pt[][] = [];
  if (options.housingHeight && options.housingHeight > 0) {
    const hDil = dil + Math.max(2, Math.round(1.5 / Math.max(0.15, cell)));
    const h2 = hDil * hDil;
    const housingMask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (bg[p] === 0) {
          housingMask[p] = 1;
          continue;
        }
        let hit = false;
        for (let dy = -hDil; dy <= hDil && !hit; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -hDil; dx <= hDil; dx++) {
            const nx = x + dx;
            if (nx >= 0 && nx < w && dx * dx + dy * dy <= h2 && bg[ny * w + nx] === 0) {
              hit = true;
              break;
            }
          }
        }
        if (hit) housingMask[p] = 1;
      }
    }
    housingLoops = traceMaskLoops(housingMask, w, h, 14, 1.4);
    const housingShapes = loopsToShapes(housingLoops, w, h, cell);
    if (housingShapes.length > 0) {
      housingGeo = smoothExtrude(housingShapes, options.housingHeight, 0.6);
    }
  }

  // 2. Layer warna bertumpuk. Layer ke-r = gabungan semua warna dengan rank >= r,
  //    sehingga batas antar warna menempel rapat tanpa celah/serpihan.
  const order = q.areas
    .map((a, i) => ({ a, i }))
    .sort((p, r) => r.a - p.a)
    .map((e) => e.i);
  const rank = new Array<number>(q.palette.length).fill(0);
  order.forEach((ci, r) => {
    rank[ci] = r;
  });

  const layers: VectorReliefLayer[] = [];
  let totalArea = 0;
  let prevTop = -1;
  let fgLoops: Pt[][] = [];

  for (let r = 0; r < order.length; r++) {
    const c = order[r];
    if (q.areas[c] < 10) continue;

    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (bg[i] === 0 && q.idx[i] !== 255 && rank[q.idx[i]] >= r) mask[i] = 1;
    }

    const loops = traceMaskLoops(mask, w, h, 6, 0.9);
    if (loops.length === 0) continue;
    if (prevTop < 0) fgLoops = loops;

    const shapes = loopsToShapes(loops, w, h, cell);
    if (shapes.length === 0) continue;

    const top = options.baseThick + (r + 1) * options.step + 2 * LAYER_BEVEL;
    const bottom = prevTop < 0 ? 0 : Math.max(0, prevTop - LAYER_OVERLAP);
    const depth = Math.max(0.01, top - bottom - 2 * LAYER_BEVEL);
    const geo = smoothExtrude(shapes, depth, LAYER_BEVEL);
    if (bottom > 0) geo.translate(0, bottom, 0);

    layers.push({ geometry: geo, color: options.overrides?.[c] ?? q.palette[c] });
    totalArea += q.areas[c] * cell * cell;
    prevTop = top;
  }

  // Titik paling atas (untuk ring gantungan)
  const topSrc = housingLoops.length ? housingLoops : baseLoops.length ? baseLoops : fgLoops;
  let topY = Infinity;
  let topX = 0;
  for (const loop of topSrc) {
    for (const [px, py] of loop) {
      if (py < topY) {
        topY = py;
        topX = px;
      }
    }
  }
  const topPos =
    topY < Infinity
      ? { x: (topX - w / 2) * cell, z: (topY - h / 2) * cell }
      : { x: 0, z: (-h / 2) * cell };

  const housingVol = (options.housingHeight ?? 0) > 0 ? totalArea * 1.25 * (options.housingHeight ?? 0) : 0;
  const volume = totalArea * (options.baseThick + options.step) + housingVol;

  return {
    baseGeometry: baseGeo,
    baseColor: options.baseColor,
    layers,
    housingGeometry: housingGeo,
    housingColor: options.housingColor ?? options.baseColor,
    housingHeight: options.housingHeight,
    top: topPos,
    volume,
  };
}
