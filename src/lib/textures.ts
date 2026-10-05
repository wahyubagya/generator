"use client";

import * as THREE from "three";

export type WallTexture = {
  id: string;
  label: string;
  tags: string[];
};

export const WALL_TEXTURES: WallTexture[] = [
  { id: "polos", label: "Polos", tags: ["Minimalis", "Elegan"] },
  { id: "kayu", label: "Serat kayu", tags: ["Natural", "Elegan"] },
  { id: "batu", label: "Batu alam", tags: ["Natural"] },
  { id: "gelombang", label: "Gelombang", tags: ["Elegan", "Lucu"] },
  { id: "garis", label: "Garis tegak", tags: ["Minimalis"] },
  { id: "titik", label: "Titik-titik", tags: ["Lucu", "Minimalis"] },
];

export const TEXTURE_TAGS = ["Semua", "Minimalis", "Elegan", "Lucu", "Natural"];

const SIZE = 256;

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Gambar peta tinggi (terang = menonjol) pada canvas 256px yang bisa di-tile. */
export function drawHeightCanvas(id: string): HTMLCanvasElement | null {
  if (id === "polos") return null;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, SIZE, SIZE);
  const r = rand(7);

  if (id === "kayu") {
    for (let y = 0; y < SIZE; y += 2) {
      const amp = 3 + r() * 6;
      const ph = r() * Math.PI * 2;
      const tone = 90 + Math.floor(r() * 110);
      g.strokeStyle = `rgb(${tone},${tone},${tone})`;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      for (let x = 0; x <= SIZE; x += 4) {
        const yy = y + Math.sin((x / SIZE) * Math.PI * 4 + ph) * amp * 0.5;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
  } else if (id === "batu") {
    for (let i = 0; i < 90; i++) {
      const x = r() * SIZE;
      const y = r() * SIZE;
      const rad = 14 + r() * 26;
      const tone = 110 + Math.floor(r() * 120);
      for (const [ox, oy] of [
        [0, 0],
        [SIZE, 0],
        [-SIZE, 0],
        [0, SIZE],
        [0, -SIZE],
      ]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, `rgb(${tone},${tone},${tone})`);
        gr.addColorStop(1, "rgba(128,128,128,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x + ox, y + oy, rad, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (id === "gelombang") {
    g.lineWidth = 9;
    for (let y = -16; y < SIZE + 32; y += 32) {
      g.strokeStyle = "#e6e6e6";
      g.beginPath();
      for (let x = 0; x <= SIZE; x += 4) {
        const yy = y + Math.sin((x / SIZE) * Math.PI * 2 * 2) * 9;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
  } else if (id === "garis") {
    for (let x = 0; x < SIZE; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, "#505050");
      gr.addColorStop(0.5, "#f0f0f0");
      gr.addColorStop(1, "#505050");
      g.fillStyle = gr;
      g.fillRect(x, 0, 16, SIZE);
    }
  } else if (id === "titik") {
    for (let y = 16; y < SIZE; y += 32) {
      for (let x = 16; x < SIZE; x += 32) {
        const gr = g.createRadialGradient(x, y, 0, x, y, 11);
        gr.addColorStop(0, "#f2f2f2");
        gr.addColorStop(1, "rgba(128,128,128,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, 11, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  return c;
}

const texCache = new Map<string, THREE.CanvasTexture | null>();

export function getBumpTexture(id: string, tileMm = 14): THREE.CanvasTexture | null {
  const key = `${id}:${tileMm}`;
  if (texCache.has(key)) return texCache.get(key) ?? null;
  const c = drawHeightCanvas(id);
  if (!c) {
    texCache.set(key, null);
    return null;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  // UV pada ExtrudeGeometry berskala mm -> 1 tile = tileMm
  t.repeat.set(1 / tileMm, 1 / tileMm);
  t.anisotropy = 4;
  t.needsUpdate = true;
  texCache.set(key, t);
  return t;
}

export function textureThumb(id: string): string | null {
  const c = drawHeightCanvas(id);
  return c ? c.toDataURL("image/png") : null;
}
