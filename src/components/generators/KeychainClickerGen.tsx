"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { ClickerHousing, KeycapMesh, LegendMesh, useLine, type KeycapShape } from "@/components/models";
import { AccordionItem, Chips, ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { playMechanicalClick } from "@/lib/audio";
import { CLICKER, KEY_TOP_W, housingWidth, lowKeycapRings, slotX, type ClickerBodyStyle } from "@/lib/clickerProfile";
import { DEFAULT_FONT } from "@/lib/fonts";
import { clickerEyeletShape, extrudeFlat } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { CLICKER_BASE, CLICKER_EXTRA, clickerPrice, formatRp } from "@/lib/pricing";
import { TEXTURE_TAGS, WALL_TEXTURES, getBumpTexture, textureThumb } from "@/lib/textures";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Design = {
  text: string;
  fontId: string;
  bodyStyle?: ClickerBodyStyle;
  texture: string;
  housing: string;
  key: string;
  legend: string;
};

const INITIAL: Design = {
  text: "AC",
  fontId: DEFAULT_FONT,
  bodyStyle: "rounded",
  texture: "polos",
  housing: "#f4f4f2",
  key: "#f2686a",
  legend: "#f4f4f2",
};

const MAX_SLOTS = 10;
const KEY_RINGS = lowKeycapRings();
const SHAPE: KeycapShape = {
  w: CLICKER.key.base,
  d: CLICKER.key.base,
  h: CLICKER.key.h,
  taper: (CLICKER.key.base - CLICKER.key.top) / 2,
  radius: CLICKER.key.rBase,
};

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
      ref.current.position.y = CLICKER.keyY + offset.current;
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
      position={[0, CLICKER.keyY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <KeycapMesh shape={shape} rings={KEY_RINGS} color={color}>
        <LegendMesh line={line} depth={0.8} color={legendColor} />
      </KeycapMesh>
    </group>
  );
}

function Cell({
  d,
  char,
  slotIndex,
  totalSlots,
}: {
  d: Design;
  char: string;
  slotIndex: number;
  totalSlots: number;
}) {
  const font = useFont(d.fontId);
  const line = useLine(font, char, 6, KEY_TOP_W * 0.9);
  const pitch = 0.92 + (slotIndex / Math.max(1, totalSlots)) * 0.16;

  return (
    <InteractiveKeycap
      shape={SHAPE}
      color={d.key}
      line={line}
      legendColor={d.legend}
      pitch={pitch}
    />
  );
}

function Scene({ d }: { d: Design }) {
  const n = Math.max(1, Math.min(MAX_SLOTS, d.text.length));
  const tex = useMemo(() => getBumpTexture(d.texture), [d.texture]);
  const total = housingWidth(n);
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
      <ClickerHousing slots={n} bodyStyle={d.bodyStyle ?? "rounded"} color={d.housing} roughness={0.62} bumpMap={tex} />
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[slotX(i, n), 0, 0]}>
          <Cell d={d} char={d.text[i] ?? ""} slotIndex={i} totalSlots={n} />
        </group>
      ))}
      <mesh
        geometry={eyeletGeo}
        position={[-total / 2 + 1.2, 0, 0]}
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
  const D = useDesigns<Design>(INITIAL, 8, "gantungan-keycap");
  const d = D.current;
  const [openSec, setOpenSec] = useState({
    teks: true,
    casing: false,
    warna: false,
  });
  const toggleSec = (k: keyof typeof openSec) =>
    setOpenSec((prev) => ({ ...prev, [k]: !prev[k] }));

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
        toast={toast.msg}
        top={
          <>
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
          </>
        }
        stage={
          <Viewport hint="Klik / tap tombolnya · geser untuk putar" fitKey={`${n}`}>
            <Scene d={d} />
          </Viewport>
        }
        panel={
          <div className="acc-list">
            <AccordionItem
              id="acc-teks"
              title="1. Teks & Gaya Huruf"
              subtitle="Ketik nama dan pilih font favorit kamu"
              badge={`${d.text || "Teks"} · ${n} Slot`}
              isOpen={openSec.teks}
              onToggle={() => toggleSec("teks")}
            >
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
            </AccordionItem>

            <AccordionItem
              id="acc-casing"
              title="2. Model Casing & Tekstur"
              subtitle="Pilih sudut membulat/kotak dan tekstur dinding"
              badge={`${d.bodyStyle === "standar" ? "Kotak" : "Bulat"} · ${d.texture}`}
              isOpen={openSec.casing}
              onToggle={() => toggleSec("casing")}
            >
              <Field label="Model body / casing" hint="Pilih sudut casing membulat atau standar kotak">
                <div className="chips">
                  <button
                    type="button"
                    className={`chip ${d.bodyStyle !== "standar" ? "is-active" : ""}`}
                    onClick={() => D.update({ bodyStyle: "rounded" })}
                  >
                    Bulat (Rounded)
                  </button>
                  <button
                    type="button"
                    className={`chip ${d.bodyStyle === "standar" ? "is-active" : ""}`}
                    onClick={() => D.update({ bodyStyle: "standar" })}
                  >
                    Standar (Kotak)
                  </button>
                </div>
              </Field>
              <Field label="Tekstur dinding" hint="Pilih pola dinding tombol yang kamu suka.">
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
            </AccordionItem>

            <AccordionItem
              id="acc-warna"
              title="3. Pilihan Warna"
              subtitle="Kombinasi warna dinding, tombol, dan huruf"
              badge="Warna"
              isOpen={openSec.warna}
              onToggle={() => toggleSec("warna")}
            >
              <ColorSelect label="Dinding tombol" value={d.housing} onChange={(housing) => D.update({ housing })} />
              <ColorSelect label="Keycap" value={d.key} onChange={(key) => D.update({ key })} />
              <ColorSelect
                label="Huruf"
                value={d.legend}
                onChange={(legend) => D.update({ legend })}
                warn={lowContrast(d.key, d.legend) ? "Kontras rendah — pilih warna yang lebih berbeda." : undefined}
              />
            </AccordionItem>
          </div>
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
                    `• Model Casing: ${d.bodyStyle === "standar" ? "Standar (Kotak)" : "Bulat (Rounded Gemas)"}\n` +
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
                      ? "Draf tersimpan di browser (berlaku 1 hari)."
                      : "Gagal menyimpan draf.",
                  )
                }
              >
                <SaveIcon /> Simpan ke Draft Saja
              </button>
              <span className="draft-expiry-hint">⏱️ Draf disimpan di browser & berlaku selama 1 hari</span>
            </div>
          </>
        }
      />
    </>
  );
}
