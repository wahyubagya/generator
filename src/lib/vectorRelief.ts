import * as THREE from "three";
import { extrudeFlat } from "@/lib/geometry";
import type { ReliefSource } from "@/lib/imageRelief";
import { quantize } from "@/lib/imageRelief";

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

function polygonArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return a / 2;
}

function chaikin(pts: [number, number][], iters = 2): [number, number][] {
  let cur = pts;
  for (let it = 0; it < iters; it++) {
    const next: [number, number][] = [];
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      const p0 = cur[i];
      const p1 = cur[(i + 1) % n];
      next.push([0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]]);
      next.push([0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]]);
    }
    cur = next;
  }
  return cur;
}

function pointInPolygon(p: [number, number], poly: [number, number][]): boolean {
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
 * Traces binary mask into smoothed closed loops using Marching Squares + Chaikin.
 */
function traceMaskLoops(mask: Uint8Array, w: number, h: number, minArea = 5): [number, number][][] {
  const segments: [[number, number], [number, number]][] = [];

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const idx =
        mask[y * w + x] |
        (mask[y * w + (x + 1)] << 1) |
        (mask[(y + 1) * w + (x + 1)] << 2) |
        (mask[(y + 1) * w + x] << 3);
      const pairs = EDGES[idx];
      if (!pairs || pairs.length === 0) continue;
      for (const [e1, e2] of pairs) {
        const p1: [number, number] =
          e1 === 0 ? [x + 0.5, y] : e1 === 1 ? [x + 1, y + 0.5] : e1 === 2 ? [x + 0.5, y + 1] : [x, y + 0.5];
        const p2: [number, number] =
          e2 === 0 ? [x + 0.5, y] : e2 === 1 ? [x + 1, y + 0.5] : e2 === 2 ? [x + 0.5, y + 1] : [x, y + 0.5];
        segments.push([p1, p2]);
      }
    }
  }

  const loops: [number, number][][] = [];
  while (segments.length > 0) {
    const first = segments.shift()!;
    const loop: [number, number][] = [first[0], first[1]];
    let closed = false;
    while (!closed) {
      const last = loop[loop.length - 1];
      let found = false;
      for (let i = 0; i < segments.length; i++) {
        const [p1, p2] = segments[i];
        if (Math.hypot(p1[0] - last[0], p1[1] - last[1]) < 1e-4) {
          loop.push(p2);
          segments.splice(i, 1);
          found = true;
          break;
        } else if (Math.hypot(p2[0] - last[0], p2[1] - last[1]) < 1e-4) {
          loop.push(p1);
          segments.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) break;
      const start = loop[0];
      const curr = loop[loop.length - 1];
      if (Math.hypot(curr[0] - start[0], curr[1] - start[1]) < 1e-4) {
        loop.pop();
        closed = true;
      }
    }
    if (loop.length >= 6) {
      const area = Math.abs(polygonArea(loop));
      if (area >= minArea) {
        loops.push(chaikin(loop, 2));
      }
    }
  }
  return loops;
}

/**
 * Builds THREE.Shape[] from loops, correctly nesting holes inside outer shapes.
 */
function loopsToShapes(loops: [number, number][][], w: number, h: number, cell: number): THREE.Shape[] {
  if (loops.length === 0) return [];

  type LoopData = {
    pts: [number, number][];
    area: number;
    absArea: number;
    isCCW: boolean;
  };

  const data: LoopData[] = loops.map((pts) => {
    const a = polygonArea(pts);
    return { pts, area: a, absArea: Math.abs(a), isCCW: a > 0 };
  });

  // Sort descending by area
  data.sort((a, b) => b.absArea - a.absArea);

  const shapes: THREE.Shape[] = [];
  const shapeLoops: [number, number][][] = [];

  for (const item of data) {
    // Check if it's inside any existing outer shape
    let parentIndex = -1;
    for (let i = 0; i < shapes.length; i++) {
      if (pointInPolygon(item.pts[0], shapeLoops[i])) {
        parentIndex = i;
        break;
      }
    }

    const vectors = item.pts.map(
      ([px, py]) => new THREE.Vector2((px - w / 2) * cell, (py - h / 2) * cell),
    );

    if (parentIndex >= 0) {
      // It's a hole inside the parent shape
      const hole = new THREE.Path(vectors);
      shapes[parentIndex].holes.push(hole);
    } else {
      // It's an outer shape
      const s = new THREE.Shape(vectors);
      shapes.push(s);
      shapeLoops.push(item.pts);
    }
  }

  return shapes;
}

export type VectorReliefLayer = {
  geometry: THREE.BufferGeometry;
  color: string;
};

export type VectorReliefResult = {
  baseGeometry: THREE.BufferGeometry | null;
  baseColor: string;
  layers: VectorReliefLayer[];
  top: { x: number; z: number };
  volume: number;
};

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
    overrides?: Record<number, string>;
  },
): VectorReliefResult {
  const { w, h, bg } = src;
  const q = quantize(src, options.k);
  const cell = options.width / w;
  const dil = Math.max(0, Math.round(options.outline / Math.max(0.15, cell)));

  // 1. Build Base Backing Mask (Foreground with dilation)
  const baseMask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bg[p] === 0) {
        baseMask[p] = 1;
      } else if (dil > 0) {
        let hit = false;
        for (let dy = -dil; dy <= dil && !hit; dy++) {
          for (let dx = -dil; dx <= dil; dx++) {
            if (dx * dx + dy * dy <= dil * dil) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w && bg[ny * w + nx] === 0) {
                hit = true;
                break;
              }
            }
          }
        }
        if (hit) baseMask[p] = 1;
      }
    }
  }

  const baseLoops = traceMaskLoops(baseMask, w, h, 12);
  const baseShapes = loopsToShapes(baseLoops, w, h, cell);
  const baseGeo =
    baseShapes.length > 0
      ? extrudeFlat(baseShapes, options.baseThick, { bevel: 0.35, bevelSize: 0.35 })
      : null;

  // Find topmost point on the base for keychain ring attachment
  let topY = Infinity;
  let topX = 0;
  for (const loop of baseLoops) {
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

  // 2. Build Layers per Quantized Color
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

  for (let c = 0; c < q.palette.length; c++) {
    const colorMask = new Uint8Array(w * h);
    let count = 0;
    for (let i = 0; i < w * h; i++) {
      if (bg[i] === 0 && q.idx[i] === c) {
        colorMask[i] = 1;
        count++;
      }
    }
    if (count < 10) continue;

    const loops = traceMaskLoops(colorMask, w, h, 6);
    if (loops.length === 0) continue;

    const shapes = loopsToShapes(loops, w, h, cell);
    if (shapes.length === 0) continue;

    // Height of this color relief layer
    const layerDepth = options.baseThick + (rank[c] + 1) * options.step;
    const geo = extrudeFlat(shapes, layerDepth, { bevel: 0.2, bevelSize: 0.2 });

    const finalColor = options.overrides?.[c] ?? q.palette[c];
    layers.push({
      geometry: geo,
      color: finalColor,
    });
    totalArea += count * cell * cell;
  }

  const volume = totalArea * (options.baseThick + options.step);

  return {
    baseGeometry: baseGeo,
    baseColor: options.baseColor,
    layers,
    top: topPos,
    volume,
  };
}
