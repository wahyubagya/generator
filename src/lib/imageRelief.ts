/**
 * Konversi gambar (PNG/JPG/WebP/SVG) menjadi relief berlapis warna (maks. 3 warna)
 * yang ramah dicetak FDM. Semua dilakukan di browser.
 */

export type ReliefSource = {
  w: number;
  h: number;
  rgba: Uint8ClampedArray;
  /** 1 = latar belakang (dibuang) */
  bg: Uint8Array;
};

export type ReliefCell = { x: number; z: number; h: number; c: number };

export type Relief = {
  cells: ReliefCell[];
  colors: string[];
  cols: number;
  rows: number;
  /** titik tengah paling atas (satuan sel) — untuk menaruh ring gantungan */
  top: { x: number; z: number };
  /** jumlah sel foreground (estimasi luas) */
  fgCount: number;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak bisa dibaca"));
    img.src = url;
  });
}

function dist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export async function loadReliefSource(
  url: string,
  maxSide = 110,
): Promise<ReliefSource> {
  const img = await loadImage(url);
  const iw = img.naturalWidth || img.width || 300;
  const ih = img.naturalHeight || img.height || 300;
  const sc = maxSide / Math.max(iw, ih);
  const w = Math.max(8, Math.round(iw * sc));
  const h = Math.max(8, Math.round(ih * sc));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const bg = new Uint8Array(w * h);

  let transparent = 0;
  for (let i = 0; i < w * h; i++) if (rgba[i * 4 + 3] < 128) transparent++;

  if (transparent > w * h * 0.02) {
    for (let i = 0; i < w * h; i++) bg[i] = rgba[i * 4 + 3] < 128 ? 1 : 0;
  } else {
    // latar polos: flood-fill dari tepi dengan warna sudut
    const corners = [0, w - 1, (h - 1) * w, h * w - 1];
    let cr = 0;
    let cg = 0;
    let cb = 0;
    for (const p of corners) {
      cr += rgba[p * 4];
      cg += rgba[p * 4 + 1];
      cb += rgba[p * 4 + 2];
    }
    cr /= 4;
    cg /= 4;
    cb /= 4;
    const near = (p: number) =>
      dist(rgba[p * 4], rgba[p * 4 + 1], rgba[p * 4 + 2], cr, cg, cb) < 56;
    const stack: number[] = [];
    const push = (p: number) => {
      if (!bg[p] && near(p)) {
        bg[p] = 1;
        stack.push(p);
      }
    };
    for (let x = 0; x < w; x++) {
      push(x);
      push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      push(y * w);
      push(y * w + w - 1);
    }
    while (stack.length) {
      const p = stack.pop() as number;
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (y > 0) push(p - w);
      if (y < h - 1) push(p + w);
    }
  }
  return { w, h, rgba, bg };
}

const toHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");

export type Quantized = { idx: Uint8Array; palette: string[]; areas: number[] };

export function quantize(src: ReliefSource, k: number): Quantized {
  const { w, h, rgba, bg } = src;
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) continue;
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const e = buckets.get(key);
    if (e) {
      e.n++;
      e.r += r;
      e.g += g;
      e.b += b;
    } else buckets.set(key, { n: 1, r, g, b });
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
  const chosen: [number, number, number][] = [];
  for (const e of sorted) {
    const c: [number, number, number] = [e.r / e.n, e.g / e.n, e.b / e.n];
    if (chosen.every((p) => dist(p[0], p[1], p[2], c[0], c[1], c[2]) > 64)) {
      chosen.push(c);
      if (chosen.length >= k) break;
    }
  }
  if (!chosen.length) chosen.push([128, 128, 128]);

  const idx = new Uint8Array(w * h).fill(255);
  const sums = chosen.map(() => ({ n: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) continue;
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    let best = 0;
    let bd = Infinity;
    for (let c = 0; c < chosen.length; c++) {
      const d = dist(r, g, b, chosen[c][0], chosen[c][1], chosen[c][2]);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    idx[i] = best;
    sums[best].n++;
    sums[best].r += r;
    sums[best].g += g;
    sums[best].b += b;
  }
  const palette = sums.map((s, i) =>
    s.n
      ? toHex(s.r / s.n, s.g / s.n, s.b / s.n)
      : toHex(chosen[i][0], chosen[i][1], chosen[i][2]),
  );
  return { idx, palette, areas: sums.map((s) => s.n) };
}

export function buildRelief(
  src: ReliefSource,
  o: {
    k: number;
    baseH: number;
    step: number;
    /** perluasan alas (dalam sel) di sekeliling gambar */
    dilate?: number;
    baseColor?: string;
  },
): Relief {
  const { w, h } = src;
  const q = quantize(src, o.k);
  const order = q.areas
    .map((a, i) => ({ a, i }))
    .sort((p, r) => r.a - p.a)
    .map((e) => e.i);
  const rank = new Array<number>(q.palette.length).fill(0);
  order.forEach((ci, r) => {
    rank[ci] = r;
  });

  const colors = [...q.palette];
  const baseIndex = colors.length;
  const dil = Math.max(0, Math.round(o.dilate ?? 0));
  if (dil > 0) colors.push(o.baseColor ?? "#222222");

  const cells: ReliefCell[] = [];
  let topRow = Infinity;
  let topXSum = 0;
  let topN = 0;
  let fgCount = 0;

  const fg = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && q.idx[y * w + x] !== 255;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const c = q.idx[p];
      const gx = x - w / 2 + 0.5;
      const gz = y - h / 2 + 0.5;
      if (c !== 255) {
        fgCount++;
        cells.push({ x: gx, z: gz, h: o.baseH + rank[c] * o.step, c });
        if (y < topRow) {
          topRow = y;
          topXSum = 0;
          topN = 0;
        }
        if (y === topRow) {
          topXSum += gx;
          topN++;
        }
      } else if (dil > 0) {
        let hit = false;
        for (let dy = -dil; dy <= dil && !hit; dy++) {
          for (let dx = -dil; dx <= dil; dx++) {
            if (dx * dx + dy * dy <= dil * dil && fg(x + dx, y + dy)) {
              hit = true;
              break;
            }
          }
        }
        if (hit) cells.push({ x: gx, z: gz, h: o.baseH, c: baseIndex });
      }
    }
  }
  const top =
    topN > 0
      ? { x: topXSum / topN, z: topRow - h / 2 + 0.5 }
      : { x: 0, z: -h / 2 };
  return { cells, colors, cols: w, rows: h, top, fgCount };
}
