"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildKeycapGeometry,
  composeLine,
  extrudeFlat,
  type IconKind,
  type Line,
} from "@/lib/geometry";
import type { Font } from "opentype.js";
import type { Relief } from "@/lib/imageRelief";
import type { VectorReliefResult } from "@/lib/vectorRelief";
import { clickerHousingGeometries, type ClickerBodyStyle } from "@/lib/clickerProfile";
import type { LoftRing } from "@/lib/geometry";

/* ---------------------------------------------------------------- Legend -- */

/** Teks/ikon timbul rebah di atas permukaan (y = 0 pada group). */
export function LegendMesh({
  line,
  depth,
  color,
  roughness = 0.5,
}: {
  line: Line | null;
  depth: number;
  color: string;
  roughness?: number;
}) {
  const parts = useMemo(
    () =>
      line
        ? line.parts.map((p) => ({
            x: p.x,
            geo: extrudeFlat(p.shapes, depth, { bevel: Math.min(0.15, depth * 0.25) }),
          }))
        : [],
    [line, depth],
  );
  useLayoutEffect(
    () => () => parts.forEach((p) => p.geo.dispose()),
    [parts],
  );
  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geo} position={[p.x, 0, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={roughness} />
        </mesh>
      ))}
    </group>
  );
}

export function useLine(
  font: Font | null,
  text: string,
  capHeight: number,
  maxW: number,
  icon?: IconKind | null,
): Line | null {
  return useMemo(
    () =>
      font || icon
        ? composeLine(font, text, { capHeight, maxW, icon: icon ?? null })
        : null,
    [font, text, capHeight, maxW, icon],
  );
}

/* ---------------------------------------------------------------- Keycap -- */

export type KeycapShape = {
  /** lebar dasar (X) mm */
  w: number;
  /** kedalaman dasar (Z) mm */
  d: number;
  /** tinggi total mm */
  h: number;
  /** jarak miring sisi ke puncak (mm per sisi) */
  taper: number;
  /** radius sudut dasar mm */
  radius: number;
};

export function keycapTop(s: KeycapShape) {
  return { w: s.w - 2 * s.taper - 3, d: s.d - 2 * s.taper - 3 };
}

export function KeycapMesh({
  shape,
  color,
  rings: customRings,
  children,
}: {
  shape: KeycapShape;
  color: string;
  /** profil loft khusus (mis. keycap low profile 3MF); default dari `shape` */
  rings?: LoftRing[];
  /** isi diletakkan di permukaan atas (y = tinggi keycap) */
  children?: React.ReactNode;
}) {
  const { side, cap } = useMemo(() => {
    if (customRings) return buildKeycapGeometry(customRings, 6);
    const { w, d, h, taper, radius } = shape;
    const fr = (y: number) => y / h;
    const wAt = (y: number, extra = 0) => w - 2 * taper * fr(y) - 2 * extra;
    const dAt = (y: number, extra = 0) => d - 2 * taper * fr(y) - 2 * extra;
    const ys: [number, number][] = [
      [0, 0],
      [h - 1.8, 0],
      [h - 1.1, 0.3],
      [h - 0.5, 0.85],
      [h, 1.5],
    ];
    const rings = ys.map(([y, ex]) => ({
      y,
      w: wAt(y, ex),
      d: dAt(y, ex),
      r: Math.max(0.6, radius - taper * fr(y) * 0.6 - ex * 0.3),
    }));
    return buildKeycapGeometry(rings, 5);
  }, [shape, customRings]);

  useLayoutEffect(
    () => () => {
      side.dispose();
      cap.dispose();
    },
    [side, cap],
  );

  return (
    <group>
      <mesh geometry={side} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh geometry={cap} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <group position={[0, shape.h, 0]}>{children}</group>
    </group>
  );
}

/* ------------------------------------------------------- Clicker housing -- */

/** Housing clicker profil 3MF (n slot). `port` = modul susun dengan celah + lidah. */
export function ClickerHousing({
  slots,
  port = false,
  bodyStyle = "rounded",
  color,
  roughness = 0.6,
  bumpMap,
  bumpScale = 2.2,
  onClick,
}: {
  slots: number;
  port?: boolean;
  bodyStyle?: ClickerBodyStyle;
  color: string;
  roughness?: number;
  bumpMap?: THREE.Texture | null;
  bumpScale?: number;
  onClick?: (e: { stopPropagation: () => void }) => void;
}) {
  const geos = useMemo(() => clickerHousingGeometries(slots, { port, bodyStyle }), [slots, port, bodyStyle]);
  useLayoutEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  return (
    <group onClick={onClick}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial
            key={bumpMap ? "bump" : "plain"}
            color={color}
            roughness={roughness}
            bumpMap={bumpMap ?? undefined}
            bumpScale={bumpMap ? bumpScale : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- Relief -- */

/** Relief piksel (instanced) — satu balok per sel gambar. */
export function ReliefMesh({
  relief,
  cell,
  colors,
  roughness = 0.6,
}: {
  relief: Relief;
  cell: number;
  colors: string[];
  roughness?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = relief.cells.length;

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const cache = colors.map((c) => new THREE.Color(c));
    relief.cells.forEach((c, i) => {
      dummy.position.set(c.x * cell, c.h / 2, c.z * cell);
      dummy.scale.set(cell * 1.02, c.h, cell * 1.02);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      col.copy(cache[c.c] ?? cache[0] ?? col.set("#888"));
      m.setColorAt(i, col);
    });
    m.count = count;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingBox();
    m.computeBoundingSphere();
  }, [relief, cell, colors, count]);

  if (!count) return null;
  return (
    <instancedMesh
      key={`${count}-${relief.cols}-${relief.rows}`}
      ref={ref}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={roughness} />
    </instancedMesh>
  );
}

/** Relief Vektor Mulus (ExtrudeGeometry) — dinding lengkung menyatu mulus tanpa balok piksel/pecah. */
export function VectorReliefMesh({
  relief,
}: {
  relief: VectorReliefResult;
}) {
  return (
    <group>
      {relief.baseGeometry && (
        <mesh geometry={relief.baseGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={relief.baseColor} roughness={0.38} metalness={0.06} />
        </mesh>
      )}
      {relief.layers.map((layer, idx) => (
        <mesh key={idx} geometry={layer.geometry} castShadow receiveShadow>
          <meshStandardMaterial color={layer.color} roughness={0.38} metalness={0.06} />
        </mesh>
      ))}
    </group>
  );
}

