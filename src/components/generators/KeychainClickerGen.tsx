"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { KeycapMesh, LegendMesh, keycapTop, useLine, type KeycapShape } from "@/components/models";
import { Chips, ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { playMechanicalClick } from "@/lib/audio";
import { DEFAULT_FONT } from "@/lib/fonts";
import { clickerEyeletShape, extrudeFlat, roundedRectShape } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { CLICKER_BASE, CLICKER_EXTRA, clickerPrice, formatRp } from "@/lib/pricing";
import { TEXTURE_TAGS, WALL_TEXTURES, getBumpTexture, textureThumb } from "@/lib/textures";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Design = {
  text: string;
  fontId: string;
  texture: string;
  housing: string;
  key: string;
  legend: string;
};

const INITIAL: Design = {
  text: "AC",
  fontId: DEFAULT_FONT,
  texture: "polos",
  housing: "#f4f4f2",
  key: "#f2686a",
  legend: "#f4f4f2",
};

const MAX_SLOTS = 10;
const PITCH = 22;
const SHAPE: KeycapShape = { w: 16.5, d: 16.5, h: 8.5, taper: 1.8, radius: 3 };

function InteractiveKeycap({
  shape,
  color,
  line,
  legendColor,
  pitch,
}: {
  shape: KeycapShape;
  color: string;
  line: ReturnType<typeof useLine>;
  legendColor: string;
  pitch: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const offset = useRef(0);
  const target = useRef(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hovered]);

  useFrame((_, delta) => {
    offset.current = THREE.MathUtils.damp(offset.current, target.current, 32, delta);
    if (ref.current) {
      ref.current.position.y = 11.2 + offset.current;
    }
    if (target.current !== 0) target.current = 0;
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    playMechanicalClick(pitch);
    target.current = -2.2;
  };

  return (
    <group
      ref={ref}
      position={[0, 11.2, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <KeycapMesh shape={shape} color={color}>
        <LegendMesh line={line} depth={0.8} color={legendColor} />
      </KeycapMesh>
    </group>
  );
}

function Cell({
  d,
  char,
  tex,
  slotIndex,
  totalSlots,
}: {
  d: Design;
  char: string;
  tex: ReturnType<typeof getBumpTexture>;
  slotIndex: number;
  totalSlots: number;
}) {
  const font = useFont(d.fontId);
  const housing = useMemo(
    () => extrudeFlat([roundedRectShape(PITCH, 22, 5.5)], 10, { bevel: 0.6, bevelSize: 0.6 }),
    [],
  );
  const top = keycapTop(SHAPE);
  const line = useLine(font, char, 6, top.w * 0.92);
  const pitch = 0.92 + (slotIndex / Math.max(1, totalSlots)) * 0.16;

  return (
    <group>
      <mesh geometry={housing} castShadow receiveShadow>
        <meshStandardMaterial
          key={tex ? "bump" : "plain"}
          color={d.housing}
          roughness={0.62}
          bumpMap={tex ?? undefined}
          bumpScale={tex ? 2.2 : 0}
        />
      </mesh>
      <InteractiveKeycap
        shape={SHAPE}
        color={d.key}
        line={line}
        legendColor={d.legend}
        pitch={pitch}
      />
    </group>
  );
}

function Scene({ d }: { d: Design }) {
  const n = Math.max(1, Math.min(MAX_SLOTS, d.text.length));
  const tex = useMemo(() => getBumpTexture(d.texture), [d.texture]);
  const total = n * PITCH;
  const eyeletGeo = useMemo(() => {
    const geo = extrudeFlat([clickerEyeletShape(4.8, 2.3, 9.2, 5.6)], 4.2, {
      bevel: 0.4,
      bevelSize: 0.35,
      curveSegments: 20,
    });
    geo.rotateY(Math.PI / 2);
    return geo;
  }, []);
  useEffect(() => () => eyeletGeo.dispose(), [eyeletGeo]);

  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[(i - (n - 1) / 2) * PITCH, 0, 0]}>
          <Cell d={d} char={d.text[i] ?? ""} tex={tex} slotIndex={i} totalSlots={n} />
        </group>
      ))}
      <mesh
        geometry={eyeletGeo}
        position={[-total / 2 + 1.2, 2.5, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          key={tex ? "bump" : "plain"}
          color={d.housing}
          roughness={0.62}
          side={THREE.DoubleSide}
          bumpMap={tex ?? undefined}
          bumpScale={tex ? 2.2 : 0}
        />
      </mesh>
    </group>
  );
}

type Tab = "isi" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "isi", label: "Isi tombol" },
  { id: "warna", label: "Warna" },
];

export default function KeychainClickerGen() {
  const D = useDesigns<Design>(INITIAL, 8);
  const d = D.current;
  const [tab, setTab] = useState<Tab>("isi");
  const [tag, setTag] = useState("Semua");
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const toast = useToast();

  useEffect(() => {
    const t: Record<string, string | null> = {};
    for (const w of WALL_TEXTURES) t[w.id] = textureThumb(w.id);
    // Thumbnail dibuat dari canvas (hanya ada di client), jadi harus setelah mount agar tidak hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThumbs(t);
  }, []);

  const n = Math.max(1, Math.min(MAX_SLOTS, d.text.length));
  const total = D.items.reduce(
    (s, it) => s + clickerPrice(Math.max(1, Math.min(MAX_SLOTS, it.text.length))),
    0,
  );
  const textures = WALL_TEXTURES.filter((w) => tag === "Semua" || w.tags.includes(tag));

  return (
    <>
      <FontPreviewLoader />
      <GeneratorShell
        title="Gantungan Clicker Nama"
        subtitle="Pilih 1–10 tombol, isi dengan huruf, angka, ikon, atau gambar milikmu."
        teaser={`Mulai ${formatRp(CLICKER_BASE)} · tambah slot ${formatRp(CLICKER_EXTRA)}. Sudah termasuk carabiner ring bulat.`}
        tabs={TABS}
        tab={tab}
        onTab={setTab}
        toast={toast.msg}
        top={
          <details className="bulk-details">
            <summary>Pesan banyak nama</summary>
            <BulkNames
              title="Gantungan clicker untuk semua nama"
              max={D.max}
              count={D.items.length}
              maxLen={MAX_SLOTS}
              onAdd={(names) => D.addNames(names, (base, name) => ({ ...base, text: name.toUpperCase() }))}
            />
            <DesignChips
              labels={D.items.map((i) => i.text)}
              sel={D.sel}
              onSel={D.setSel}
              onRemove={D.remove}
            />
          </details>
        }
        stage={
          <Viewport hint="Klik / tap tombolnya · geser untuk putar" fitKey={`${n}`}>
            <Scene d={d} />
          </Viewport>
        }
        panel={
          <>
            {tab === "isi" && (
              <>
                <Field label="Ketik nama kamu" hint={`Maksimal ${MAX_SLOTS} huruf. Satu huruf otomatis menjadi satu tombol.`}>
                  <TextInput
                    value={d.text}
                    max={MAX_SLOTS}
                    upper
                    id="input-keychain-text"
                    onChange={(text) => D.update({ text })}
                  />
                </Field>
                <Field label="Pilih gaya huruf">
                  <FontPicker value={d.fontId} sample={d.text || "AC"} onChange={(fontId) => D.update({ fontId })} />
                </Field>
                <Field label="Tekstur dinding" hint="Pilih pola yang kamu suka.">
                  <Chips options={TEXTURE_TAGS} value={tag} onChange={setTag} />
                  <div className="tex-grid">
                    {textures.map((w) => (
                      <button
                        key={w.id}
                        id={`tex-${w.id}`}
                        type="button"
                        className={`tex-card ${d.texture === w.id ? "is-active" : ""}`}
                        onClick={() => D.update({ texture: w.id })}
                      >
                        <span
                          className="tex-thumb"
                          style={thumbs[w.id] ? { backgroundImage: `url(${thumbs[w.id]})` } : undefined}
                        />
                        <span>{w.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
            {tab === "warna" && (
              <>
                <ColorSelect label="Dinding tombol" value={d.housing} onChange={(housing) => D.update({ housing })} />
                <ColorSelect label="Keycap" value={d.key} onChange={(key) => D.update({ key })} />
                <ColorSelect
                  label="Huruf"
                  value={d.legend}
                  onChange={(legend) => D.update({ legend })}
                  warn={lowContrast(d.key, d.legend) ? "Kontras rendah — pilih warna yang lebih berbeda." : undefined}
                />
              </>
            )}
          </>
        }
        foot={
          <>
            <PriceBox
              title="Harga cetak produk"
              price={total}
              notes={[
                "Harga yang tertera adalah harga cetak produk, bukan biaya desain.",
                "Belum termasuk ongkir.",
                `Termasuk carabiner ring bulat. ${n} slot untuk desain ini.`,
              ]}
            />
            <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <button
                id="btn-save-order"
                type="button"
                className="btn btn-primary btn-block btn-glow"
                onClick={() => {
                  saveDraft("gantungan-keycap", D.items);
                  const waMsg =
                    `Halo Aureate Craft, saya ingin memesan Gantungan Clicker Nama:\n` +
                    `• Teks / Huruf: ${d.text}\n` +
                    `• Warna Dinding: ${d.housing}\n` +
                    `• Warna Keycap: ${d.key}\n` +
                    `• Warna Huruf: ${d.legend}\n` +
                    `• Tekstur Dinding: ${d.texture}\n` +
                    `• Jumlah Tombol: ${n} Slot\n` +
                    `• Total Estimasi: ${formatRp(total)}\n` +
                    `Mohon informasi slot dan konfirmasi pesanan.`;
                  openWhatsAppOrder(waMsg);
                  toast.show("Membuka WhatsApp Admin...");
                }}
              >
                Pesan via WhatsApp →
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block btn-sm"
                onClick={() =>
                  toast.show(
                    saveDraft("gantungan-keycap", D.items)
                      ? "Desain tersimpan di browser ini."
                      : "Gagal menyimpan desain.",
                  )
                }
              >
                <SaveIcon /> Simpan ke Draft Saja
              </button>
            </div>
          </>
        }
      />
    </>
  );
}
