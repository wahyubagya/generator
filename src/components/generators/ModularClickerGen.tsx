"use client";

import { useMemo, useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { KeycapMesh, LegendMesh, keycapTop, useLine, type KeycapShape } from "@/components/models";
import { ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, Slider, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { DEFAULT_FONT } from "@/lib/fonts";
import { extrudeFlat, roundedRectShape, type IconKind } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { CLICKER_BASE, CLICKER_EXTRA, clickerPrice, formatRp } from "@/lib/pricing";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Mod = { icon: IconKind | null; housing: string; key: string; legend: string };
type Design = { name: string; fontId: string; mods: Mod[] };

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
const MOD_W = 26.8;

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

const INITIAL: Design = makeDesign({ name: "", fontId: DEFAULT_FONT, mods: [] }, "AC3");

const SHAPE: KeycapShape = { w: 18, d: 18, h: 9.5, taper: 2, radius: 3.2 };

function ModuleMesh({ m, char, fontId }: { m: Mod; char: string; fontId: string }) {
  const font = useFont(fontId);
  const housing = useMemo(
    () => extrudeFlat([roundedRectShape(26.2, 23.2, 5.5)], 12, { bevel: 0.6, bevelSize: 0.6 }),
    [],
  );
  const top = keycapTop(SHAPE);
  const line = useLine(font, char, 6.5, top.w * 0.92, m.icon);
  return (
    <group>
      <mesh geometry={housing} castShadow receiveShadow>
        <meshStandardMaterial color={m.housing} roughness={0.6} />
      </mesh>
      <group position={[0, 13.2, 0]}>
        <KeycapMesh shape={SHAPE} color={m.key}>
          <LegendMesh line={line} depth={0.8} color={m.legend} />
        </KeycapMesh>
      </group>
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
  const D = useDesigns<Design>(INITIAL, 8);
  const d = D.current;
  const [tab, setTab] = useState<Tab>("nama");
  const [selMod, setSelMod] = useState(0);
  const toast = useToast();
  const mi = Math.min(selMod, d.mods.length - 1);
  const m = d.mods[mi];

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
        tabs={TABS}
        tab={tab}
        onTab={setTab}
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
                  <ModuleMesh m={mod} char={d.name[i] ?? ""} fontId={d.fontId} />
                  <mesh
                    position={[0, 11, 0]}
                    visible={false}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelMod(i);
                    }}
                  >
                    <boxGeometry args={[MOD_W, 22, 24]} />
                  </mesh>
                </group>
              ))}
            </group>
          </Viewport>
        }
        panel={
          <>
            {tab === "nama" && (
              <>
                <Field label="Ketik nama cepat" hint="Nama otomatis menjadi satu huruf per clicker. Setelah itu setiap modul masih bisa diganti jadi ikon.">
                  <TextInput value={d.name} max={MAX_SLOTS} upper id="input-clicker-name" onChange={setName} />
                </Field>
                <Field label="Pilih gaya huruf">
                  <FontPicker value={d.fontId} sample={d.name || "AC"} onChange={(fontId) => D.update({ fontId })} />
                </Field>
                <Field label={`Isi modul ${mi + 1}`}>
                  {ModChips}
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
              </>
            )}
            {tab === "jumlah" && (
              <>
                <Slider label="Jumlah tombol" value={d.mods.length} min={1} max={MAX_SLOTS} unit="slot" onChange={setCount} id="slider-slots" />
                <p className="hint">
                  Slot tanpa huruf akan jadi tombol kosong. Huruf diambil dari nama di tab sebelumnya.
                </p>
              </>
            )}
            {tab === "warna" && (
              <>
                <Field label={`Modul ${mi + 1}`}>{ModChips}</Field>
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
