"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { ClickerHousing, KeycapMesh, LegendMesh, useLine, type KeycapShape } from "@/components/models";
import { AccordionItem, ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, Slider, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { playMechanicalClick } from "@/lib/audio";
import { CLICKER, KEY_TOP_W, lowKeycapRings, type ClickerBodyStyle } from "@/lib/clickerProfile";
import { DEFAULT_FONT } from "@/lib/fonts";
import { type IconKind } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { CLICKER_BASE, CLICKER_EXTRA, clickerPrice, formatRp } from "@/lib/pricing";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Mod = { icon: IconKind | null; housing: string; key: string; legend: string };
type Design = { name: string; fontId: string; bodyStyle?: ClickerBodyStyle; mods: Mod[] };

const PAIRS: [string, string][] = [
  ["#f9a8c0", "#d9363e"],
  ["#b9a1f0", "#6d3fc9"],
  ["#9bd6f2", "#2d57d6"],
  ["#a9e8cf", "#1f7a4d"],
  ["#f7e08a", "#f58a2a"],
];

const newMod = (i: number): Mod => ({
  icon: null,
  housing: PAIRS[i % PAIRS.length][0],
  key: PAIRS[i % PAIRS.length][1],
  legend: "#f4f4f2",
});

const MAX_SLOTS = 10;
/** jarak antar modul: 1×1 housing persis menyatu dengan sambungan port */
const MOD_W = CLICKER.cell;

const ICON_LABEL: { id: IconKind | null; label: string }[] = [
  { id: null, label: "Aa" },
  { id: "heart", label: "♥" },
  { id: "star", label: "★" },
  { id: "bolt", label: "⚡" },
  { id: "flower", label: "✿" },
  { id: "paw", label: "🐾" },
  { id: "smile", label: "☺" },
];

function resize(mods: Mod[], n: number): Mod[] {
  if (n === mods.length) return mods;
  if (n < mods.length) return mods.slice(0, n);
  const out = [...mods];
  while (out.length < n) out.push(newMod(out.length));
  return out;
}

function makeDesign(base: Design, name: string): Design {
  return {
    ...base,
    name,
    mods: resize(base.mods, Math.max(1, Math.min(MAX_SLOTS, name.length))),
  };
}

const INITIAL: Design = makeDesign({ name: "", fontId: DEFAULT_FONT, bodyStyle: "rounded", mods: [] }, "AC3");

const KEY_RINGS = lowKeycapRings();
const SHAPE: KeycapShape = {
  w: CLICKER.key.base,
  d: CLICKER.key.base,
  h: CLICKER.key.h,
  taper: (CLICKER.key.base - CLICKER.key.top) / 2,
  radius: CLICKER.key.rBase,
};

function InteractiveModularKeycap({
  shape,
  color,
  line,
  legendColor,
  pitch,
  onSelect,
}: {
  shape: KeycapShape;
  color: string;
  line: ReturnType<typeof useLine>;
  legendColor: string;
  pitch: number;
  onSelect?: () => void;
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
    onSelect?.();
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

function ModuleMesh({
  m,
  char,
  fontId,
  bodyStyle = "rounded",
  slotIndex,
  totalSlots,
  onSelect,
}: {
  m: Mod;
  char: string;
  fontId: string;
  bodyStyle?: ClickerBodyStyle;
  slotIndex: number;
  totalSlots: number;
  onSelect?: () => void;
}) {
  const font = useFont(fontId);
  const line = useLine(font, m.icon ? "" : char, 6.5, KEY_TOP_W * 0.9, m.icon);
  const pitch = 0.9 + (slotIndex / Math.max(1, totalSlots)) * 0.18;

  return (
    <group>
      <ClickerHousing
        slots={1}
        port
        bodyStyle={bodyStyle}
        color={m.housing}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      />
      <InteractiveModularKeycap
        shape={SHAPE}
        color={m.key}
        line={line}
        legendColor={m.legend}
        pitch={pitch}
        onSelect={onSelect}
      />
    </group>
  );
}

type Tab = "nama" | "jumlah" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "nama", label: "Nama & Ikon" },
  { id: "jumlah", label: "Jumlah" },
  { id: "warna", label: "Warna" },
];

export default function ModularClickerGen() {
  const D = useDesigns<Design>(INITIAL, 8, "modular-clicker");
  const d = D.current;
  const [selMod, setSelMod] = useState(0);
  const toast = useToast();
  const mi = Math.min(selMod, Math.max(0, d.mods.length - 1));
  const m = d.mods[mi] || d.mods[0];

  const [openSec, setOpenSec] = useState({
    teks: true,
    modul: false,
    jumlah: false,
    warna: false,
  });
  const toggleSec = (k: keyof typeof openSec) =>
    setOpenSec((prev) => ({ ...prev, [k]: !prev[k] }));

  const setName = (raw: string) => {
    const name = raw.toUpperCase().slice(0, MAX_SLOTS);
    D.update({
      name,
      mods: name.length ? resize(d.mods, name.length) : d.mods,
    });
  };
  const setCount = (n: number) => D.update({ mods: resize(d.mods, n) });
  const patchMod = (patch: Partial<Mod>) =>
    D.update({ mods: d.mods.map((x, i) => (i === mi ? { ...x, ...patch } : x)) });

  const total = D.items.reduce((s, it) => s + clickerPrice(it.mods.length), 0);

  const ModChips = (
    <div className="chips">
      {d.mods.map((_, i) => (
        <button
          key={i}
          type="button"
          className={`chip ${i === mi ? "is-active" : ""}`}
          onClick={() => setSelMod(i)}
        >
          {d.name[i] || i + 1}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <FontPreviewLoader />
      <GeneratorShell
        title="Clicker Nama Susun"
        subtitle="Gabungkan 1–10 tombol. Tap bagian yang ingin kamu ubah warnanya."
        teaser={`1 slot ${formatRp(CLICKER_BASE)} · setiap tambahan slot naik ${formatRp(CLICKER_EXTRA)}.`}
        toast={toast.msg}
        top={
          <>
            <BulkNames
              title="Rangkaian clicker nama untuk semua nama"
              max={D.max}
              count={D.items.length}
              maxLen={MAX_SLOTS}
              onAdd={(names) => D.addNames(names, makeDesign)}
            />
            <DesignChips
              labels={D.items.map((i) => i.name)}
              sel={D.sel}
              onSel={(i) => {
                D.setSel(i);
                setSelMod(0);
              }}
              onRemove={D.remove}
            />
          </>
        }
        stage={
          <Viewport label="Ukuran rakitan" hint="Klik / tap tombolnya · geser untuk putar" fitKey={`${d.mods.length}`}>
            <group>
              {d.mods.map((mod, i) => (
                <group key={i} position={[(i - (d.mods.length - 1) / 2) * MOD_W, 0, 0]}>
                  <ModuleMesh
                    m={mod}
                    char={d.name[i] ?? ""}
                    fontId={d.fontId}
                    bodyStyle={d.bodyStyle ?? "rounded"}
                    slotIndex={i}
                    totalSlots={d.mods.length}
                    onSelect={() => setSelMod(i)}
                  />
                </group>
              ))}
            </group>
          </Viewport>
        }
        panel={
          <div className="acc-list">
            <AccordionItem
              id="acc-teks"
              title="1. Nama, Font & Model Body"
              subtitle="Ketik nama, pilih font, dan bentuk sudut casing"
              badge={`${d.name || "Nama"} · ${d.bodyStyle === "standar" ? "Kotak" : "Bulat"}`}
              isOpen={openSec.teks}
              onToggle={() => toggleSec("teks")}
            >
              <Field label="Ketik nama cepat" hint="Nama otomatis menjadi satu huruf per clicker. Setelah itu setiap modul masih bisa diganti jadi ikon.">
                <TextInput value={d.name} max={MAX_SLOTS} upper id="input-clicker-name" onChange={setName} />
              </Field>
              <Field label="Pilih gaya huruf">
                <FontPicker value={d.fontId} sample={d.name || "AC"} onChange={(fontId) => D.update({ fontId })} />
              </Field>
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
            </AccordionItem>

            <AccordionItem
              id="acc-modul"
              title="2. Isi Tiap Modul (Huruf / Ikon)"
              subtitle="Ganti huruf modul tertentu menjadi ikon lucu"
              badge={`Modul ${mi + 1}: ${m.icon ? `Ikon ${m.icon}` : d.name[mi] || "Huruf"}`}
              isOpen={openSec.modul}
              onToggle={() => toggleSec("modul")}
            >
              <Field label={`Pilih modul yang ingin diubah (Modul ${mi + 1})`}>
                {ModChips}
              </Field>
              <Field label="Pilih ikon atau huruf">
                <div className="icon-grid">
                  {ICON_LABEL.map((o) => (
                    <button
                      key={o.id ?? "huruf"}
                      type="button"
                      className={`icon-btn ${m.icon === o.id ? "is-active" : ""}`}
                      title={o.id ?? "Huruf"}
                      onClick={() => patchMod({ icon: o.id })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>
            </AccordionItem>

            <AccordionItem
              id="acc-jumlah"
              title="3. Jumlah Tombol (Panjang)"
              subtitle="Atur jumlah slot rangkaian clicker (1–10 slot)"
              badge={`${d.mods.length} Tombol`}
              isOpen={openSec.jumlah}
              onToggle={() => toggleSec("jumlah")}
            >
              <Slider label="Jumlah tombol" value={d.mods.length} min={1} max={MAX_SLOTS} unit="slot" onChange={setCount} id="slider-slots" />
              <p className="hint">
                Slot tanpa huruf akan jadi tombol kosong. Huruf diambil dari nama di bagian pertama.
              </p>
            </AccordionItem>

            <AccordionItem
              id="acc-warna"
              title="4. Pilihan Warna Modul"
              subtitle="Atur warna rumah tombol, keycap, dan karakter"
              badge={`Modul ${mi + 1}`}
              isOpen={openSec.warna}
              onToggle={() => toggleSec("warna")}
            >
              <Field label={`Pilih modul yang diwarnai (Modul ${mi + 1})`}>{ModChips}</Field>
              <ColorSelect label="Rumah tombol" value={m.housing} onChange={(housing) => patchMod({ housing })} />
              <ColorSelect label="Keycap" value={m.key} onChange={(key) => patchMod({ key })} />
              <ColorSelect
                label="Huruf / ikon"
                value={m.legend}
                onChange={(legend) => patchMod({ legend })}
                warn={lowContrast(m.key, m.legend) ? "Kontras rendah — pilih warna yang lebih berbeda." : undefined}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => D.update({ mods: d.mods.map(() => ({ ...m })) })}
              >
                Terapkan warna ini ke semua modul
              </button>
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
                `${formatRp(CLICKER_BASE)} untuk 1 tombol, tambah ${formatRp(CLICKER_EXTRA)} tiap tombol berikutnya. Termasuk carabiner.`,
              ]}
            />
            <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <button
                id="btn-save-order"
                type="button"
                className="btn btn-primary btn-block btn-glow"
                onClick={() => {
                  saveDraft("modular-clicker", D.items);
                  const modulesSummary = d.mods
                    .map((m, i) => `Modul ${i + 1}: ${d.name[i] || (m.icon ? `Ikon ${m.icon}` : "-")} (Rumah: ${m.housing}, Key: ${m.key}, Huruf: ${m.legend})`)
                    .join("\n• ");
                  const waMsg =
                    `Halo Aureate Craft, saya ingin memesan Clicker Nama Susun (Modular):\n` +
                    `• Rangkaian Nama: ${d.name}\n` +
                    `• Model Casing: ${d.bodyStyle === "standar" ? "Standar (Kotak)" : "Bulat (Rounded Gemas)"}\n` +
                    `• Jumlah Tombol: ${d.mods.length} Modul\n` +
                    `• Konfigurasi Tiap Modul:\n• ${modulesSummary}\n` +
                    `• Total Estimasi: ${formatRp(total)}\n` +
                    `Mohon info ketersediaan slot produksi dan pengerjaan.`;
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
                    saveDraft("modular-clicker", D.items)
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
