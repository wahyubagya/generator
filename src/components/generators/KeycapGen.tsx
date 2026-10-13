"use client";

import { useMemo } from "react";
import { GeneratorShell, IconImage, IconText, ModeSwitch, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { KeycapMesh, LegendMesh, keycapTop, useLine, type KeycapShape } from "@/components/models";
import { ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, Segmented, Slider, TextInput, UploadBox } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { DEFAULT_FONT } from "@/lib/fonts";
import { saveDraft, useDesigns, useFont, useReliefSource, useToast } from "@/lib/hooks";
import { buildVectorRelief } from "@/lib/vectorRelief";
import { lowContrast } from "@/lib/palette";
import { KEYCAP_PRICE, formatRp } from "@/lib/pricing";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { useState } from "react";

type Design = {
  text: string;
  fontId: string;
  mode: "text" | "image";
  imageUrl?: string;
  widthU: number;
  profile: "rendah" | "standar" | "tinggi";
  corner: "tajam" | "sedang" | "bulat";
  body: string;
  legend: string;
  legendSize: number;
};

const INITIAL: Design = {
  text: "AC",
  fontId: DEFAULT_FONT,
  mode: "text",
  widthU: 1,
  profile: "standar",
  corner: "sedang",
  body: "#16181d",
  legend: "#f4f4f2",
  legendSize: 5.5,
};

const HEIGHTS = { rendah: 8, standar: 11, tinggi: 14 } as const;
const RADII = { tajam: 1.2, sedang: 2.6, bulat: 4.6 } as const;

type Tab = "desain" | "bentuk" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "desain", label: "Desain" },
  { id: "bentuk", label: "Bentuk" },
  { id: "warna", label: "Warna" },
];

function KeycapScene({ d }: { d: Design }) {
  const font = useFont(d.fontId);
  const shape: KeycapShape = useMemo(
    () => ({
      w: 18 * d.widthU,
      d: 18,
      h: HEIGHTS[d.profile],
      taper: 2.2,
      radius: RADII[d.corner],
    }),
    [d.widthU, d.profile, d.corner],
  );
  const top = keycapTop(shape);
  const line = useLine(font, d.text, d.legendSize, top.w * 0.94);
  const { source } = useReliefSource(d.mode === "image" ? d.imageUrl : undefined, 160);
  const vectorRelief = useMemo(() => {
    if (!source) return null;
    const wMm = Math.min(top.w * 0.95, (d.legendSize / 5.5) * 9);
    return buildVectorRelief(source, {
      width: wMm,
      k: 1,
      baseThick: 0.05,
      step: 0.8,
      outline: 0,
      baseColor: d.body,
      overrides: { 0: d.legend },
    });
  }, [source, top.w, d.legendSize, d.body, d.legend]);

  return (
    <KeycapMesh shape={shape} color={d.body}>
      {d.mode === "text" ? (
        <LegendMesh line={line} depth={0.8} color={d.legend} />
      ) : (
        vectorRelief && (
          <group position={[0, 0, 0]}>
            {vectorRelief.layers.map((layer, idx) => (
              <mesh key={idx} geometry={layer.geometry} castShadow receiveShadow>
                <meshStandardMaterial color={d.legend} roughness={0.38} metalness={0.06} />
              </mesh>
            ))}
          </group>
        )
      )}
    </KeycapMesh>
  );
}

export default function KeycapGen() {
  const D = useDesigns<Design>(INITIAL, 8);
  const d = D.current;
  const [tab, setTab] = useState<Tab>("desain");
  const toast = useToast();
  const total = D.items.length * KEYCAP_PRICE;

  return (
    <>
      <FontPreviewLoader />
      <GeneratorShell
        title="Tombol Keyboard Custom"
        subtitle="Tulis teks atau upload gambar, lalu pilih warnanya."
        tabs={TABS}
        tab={tab}
        onTab={setTab}
        toast={toast.msg}
        top={
          <>
            <BulkNames
              title="Keycap custom untuk semua nama"
              max={D.max}
              count={D.items.length}
              maxLen={8}
              onAdd={(names) => D.addNames(names, (base, n) => ({ ...base, mode: "text", text: n }))}
              placeholder={"A\nB"}
            />
            <DesignChips
              labels={D.items.map((i) => (i.mode === "image" ? "Gambar" : i.text))}
              sel={D.sel}
              onSel={D.setSel}
              onRemove={D.remove}
            />
          </>
        }
        beforeGrid={
          <ModeSwitch
            value={d.mode}
            onChange={(mode) => D.update({ mode })}
            options={[
              { id: "text", label: "Pakai Teks", icon: IconText },
              { id: "image", label: "Upload Gambar", icon: IconImage },
            ]}
          />
        }
        stage={
          <Viewport fitKey={`${d.widthU}`}>
            <KeycapScene d={d} />
          </Viewport>
        }
        panel={
          <>
            {tab === "desain" && d.mode === "text" && (
              <>
                <Field label="Tulisan di keycap" hint="Huruf, angka, atau simbol singkat.">
                  <TextInput value={d.text} max={8} id="input-keycap-text" onChange={(text) => D.update({ text })} />
                </Field>
                <Field label="Pilih gaya huruf">
                  <FontPicker value={d.fontId} sample={d.text || "AC"} onChange={(fontId) => D.update({ fontId })} />
                </Field>
                <Slider label="Ukuran tulisan" value={d.legendSize} min={3} max={8} step={0.5} onChange={(legendSize) => D.update({ legendSize })} />
              </>
            )}
            {tab === "desain" && d.mode === "image" && (
              <>
                <Field label="Gambar di keycap" hint="Gambar dengan latar polos dan kontras tinggi paling bagus. Hasilnya satu warna.">
                  <UploadBox compact title={d.imageUrl ? "Ganti gambar" : "Upload gambar"} onData={(imageUrl) => D.update({ imageUrl })} />
                </Field>
                <Slider label="Ukuran gambar" value={d.legendSize} min={3} max={8} step={0.5} onChange={(legendSize) => D.update({ legendSize })} />
              </>
            )}
            {tab === "bentuk" && (
              <>
                <Field label="Lebar keycap">
                  <Segmented
                    value={d.widthU}
                    onChange={(widthU) => D.update({ widthU })}
                    options={[
                      { id: 1, label: "1u" },
                      { id: 1.5, label: "1.5u" },
                      { id: 2, label: "2u" },
                    ]}
                  />
                </Field>
                <Field label="Tinggi">
                  <Segmented
                    value={d.profile}
                    onChange={(profile) => D.update({ profile })}
                    options={[
                      { id: "rendah", label: "Rendah" },
                      { id: "standar", label: "Standar" },
                      { id: "tinggi", label: "Tinggi" },
                    ]}
                  />
                </Field>
                <Field label="Sudut">
                  <Segmented
                    value={d.corner}
                    onChange={(corner) => D.update({ corner })}
                    options={[
                      { id: "tajam", label: "Tajam" },
                      { id: "sedang", label: "Sedang" },
                      { id: "bulat", label: "Bulat" },
                    ]}
                  />
                </Field>
              </>
            )}
            {tab === "warna" && (
              <>
                <ColorSelect label="Warna keycap" value={d.body} onChange={(body) => D.update({ body })} />
                <ColorSelect
                  label={d.mode === "text" ? "Warna tulisan" : "Warna gambar"}
                  value={d.legend}
                  onChange={(legend) => D.update({ legend })}
                  warn={lowContrast(d.body, d.legend) ? "Kontras rendah — pilih warna yang lebih berbeda agar terlihat jelas." : undefined}
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
                D.items.length > 1
                  ? `${D.items.length} desain × ${formatRp(KEYCAP_PRICE)}.`
                  : "Harga tetap untuk desain ini.",
              ]}
            />
            <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <button
                id="btn-save-order"
                type="button"
                className="btn btn-primary btn-block btn-glow"
                onClick={() => {
                  saveDraft("keycap", D.items);
                  const waMsg =
                    `Halo Aureate Craft, saya ingin memesan Keycap Custom:\n` +
                    `• Tipe Konten: ${d.mode === "text" ? `Teks "${d.text}"` : "Gambar/Logo Custom"}\n` +
                    `• Profil Keycap: ${d.profile.toUpperCase()} (Tinggi ${HEIGHTS[d.profile]}mm)\n` +
                    `• Sudut Keycap: ${d.corner}\n` +
                    `• Lebar Keycap: ${d.widthU}U\n` +
                    `• Warna Bodi Keycap: ${d.body}\n` +
                    `• Warna Tulisan/Legenda: ${d.legend}\n` +
                    `• Jumlah Pesanan: ${D.items.length} pcs\n` +
                    `• Total Estimasi: ${formatRp(total)}\n` +
                    `Mohon info ketersediaan slot produksi.`;
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
                    saveDraft("keycap", D.items)
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
