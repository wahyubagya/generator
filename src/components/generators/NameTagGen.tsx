"use client";

import { useEffect, useMemo, useState } from "react";
import type * as THREE from "three";
import { GeneratorShell, IconImage, IconText, ModeSwitch, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { LegendMesh, VectorReliefMesh, useLine } from "@/components/models";
import { AccordionItem, ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, Segmented, Slider, TextInput, UploadBox } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { DEFAULT_FONT } from "@/lib/fonts";
import { annulusShape, extrudeFlat, mergeGeos, outerOnly, roundedRectShape, type Line } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useReliefSource, useToast } from "@/lib/hooks";
import { buildRelief } from "@/lib/imageRelief";
import { buildVectorRelief } from "@/lib/vectorRelief";
import { lowContrast } from "@/lib/palette";
import { estimateByVolume, formatRp } from "@/lib/pricing";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Design = {
  mode: "text" | "image";
  text: string;
  fontId: string;
  imageUrl?: string;
  imgWidth: number;
  imgColors: number;
  imgOverrides: Record<number, string>;
  shape: "outline" | "kotak" | "kapsul";
  outline: number;
  ring: "kiri" | "kanan" | "atas" | "tanpa";
  baseThick: number;
  reliefH: number;
  baseColor: string;
  textColor: string;
};

const INITIAL: Design = {
  mode: "text",
  text: "NAMA",
  fontId: DEFAULT_FONT,
  imgWidth: 50,
  imgColors: 3,
  imgOverrides: {},
  shape: "outline",
  outline: 2.2,
  ring: "kiri",
  baseThick: 2.4,
  reliefH: 1.4,
  baseColor: "#16181d",
  textColor: "#f4f4f2",
};

const CAP = 14;
const BT = 0.35;
const RING_OUT = 4.4;
const RING_IN = 1.9;

function baseSize(d: Design, line: Line) {
  const pad = d.shape === "outline" ? d.outline : d.outline + 1.5;
  return { pad, w: line.w + 2 * pad, h: Math.max(line.h * (d.shape === "outline" ? 0.5 : 1) + 2 * pad, 0) };
}

function ringPos(d: Design, line: Line): [number, number] | null {
  const { pad } = baseSize(d, line);
  const rr = RING_OUT - 1.6;
  if (d.ring === "kiri") return [-(line.w / 2 + pad) - rr, 0];
  if (d.ring === "kanan") return [line.w / 2 + pad + rr, 0];
  if (d.ring === "atas") return [-line.w / 2 + RING_OUT, -(line.h / 2 + pad) - rr];
  return null;
}

function TextTag({ d, onVolume }: { d: Design; onVolume: (v: number) => void }) {
  const font = useFont(d.fontId);
  const line = useLine(font, d.text, CAP, 100);

  const baseGeo = useMemo(() => {
    if (!line) return null;
    const { pad, w, h } = baseSize(d, line);
    const geos: THREE.BufferGeometry[] = [];
    if (d.shape === "outline") {
      for (const p of line.parts) {
        const g = extrudeFlat(outerOnly(p.shapes), d.baseThick, { bevel: BT, bevelSize: BT, offset: pad });
        g.translate(p.x, 0, 0);
        geos.push(g);
      }
      geos.push(
        extrudeFlat([roundedRectShape(Math.max(1, line.w), Math.max(1, h - 2 * pad), 1.2)], d.baseThick, {
          bevel: BT,
          bevelSize: BT,
          offset: pad,
        }),
      );
    } else {
      const r = d.shape === "kapsul" ? Math.min(w, h) / 2 : 3;
      geos.push(extrudeFlat([roundedRectShape(w, h, r)], d.baseThick, { bevel: BT, bevelSize: BT }));
    }
    const rp = ringPos(d, line);
    if (rp) {
      const g = extrudeFlat([annulusShape(RING_OUT, RING_IN)], d.baseThick, { bevel: BT, bevelSize: BT });
      g.translate(rp[0], 0, rp[1]);
      geos.push(g);
    }
    return mergeGeos(geos);
  }, [d, line]);

  useEffect(() => () => baseGeo?.dispose(), [baseGeo]);

  useEffect(() => {
    if (!line) return;
    const { pad, w, h } = baseSize(d, line);
    const baseArea = d.shape === "outline" ? (line.w + 2 * pad) * (line.h * 0.5 + 2 * pad) + line.area * 0.6 : w * h;
    const ring = d.ring === "tanpa" ? 0 : Math.PI * (RING_OUT ** 2 - RING_IN ** 2);
    onVolume(baseArea * (d.baseThick + 2 * BT) + line.area * d.reliefH + ring * d.baseThick);
  }, [line, d, onVolume]);

  if (!baseGeo || !line) return null;
  return (
    <group>
      <mesh geometry={baseGeo} castShadow receiveShadow>
        <meshStandardMaterial color={d.baseColor} roughness={0.5} />
      </mesh>
      <group position={[0, d.baseThick + 2 * BT, 0]}>
        <LegendMesh line={line} depth={d.reliefH} color={d.textColor} />
      </group>
    </group>
  );
}

function ImageTag({ d, onVolume }: { d: Design; onVolume: (v: number) => void }) {
  const { source } = useReliefSource(d.imageUrl, 240);

  const vectorRelief = useMemo(() => {
    if (!source) return null;
    return buildVectorRelief(source, {
      width: d.imgWidth,
      k: d.imgColors,
      baseThick: d.baseThick,
      step: Math.max(0.3, d.reliefH * 0.5),
      outline: d.outline,
      baseColor: d.baseColor,
      overrides: d.imgOverrides,
    });
  }, [source, d.imgWidth, d.imgColors, d.baseThick, d.reliefH, d.outline, d.baseColor, d.imgOverrides]);

  const ringGeo = useMemo(
    () => (d.ring === "tanpa" ? null : extrudeFlat([annulusShape(RING_OUT, RING_IN)], d.baseThick, { bevel: BT, bevelSize: BT })),
    [d.ring, d.baseThick],
  );
  useEffect(() => () => ringGeo?.dispose(), [ringGeo]);

  useEffect(() => {
    if (!vectorRelief) return;
    onVolume(vectorRelief.volume);
  }, [vectorRelief, onVolume]);

  if (!vectorRelief) return null;

  return (
    <group>
      <VectorReliefMesh relief={vectorRelief} />
      {ringGeo && (
        <mesh
          geometry={ringGeo}
          position={[vectorRelief.top.x, 0, vectorRelief.top.z - RING_OUT + 1.8]}
          castShadow
        >
          <meshStandardMaterial color={d.baseColor} roughness={0.38} metalness={0.06} />
        </mesh>
      )}
    </group>
  );
}

export default function NameTagGen() {
  const D = useDesigns<Design>(INITIAL, 8, "gantungan-nama");
  const d = D.current;
  const [openSec, setOpenSec] = useState<Record<string, boolean>>({
    desain: true,
    bentuk: false,
    warna: false,
    timbul: false,
  });
  const toggleSec = (sec: string) => setOpenSec((prev) => ({ ...prev, [sec]: !prev[sec] }));
  const [volume, setVolume] = useState(0);
  const [priced, setPriced] = useState<{ key: string; price: number; grams: number } | null>(null);
  const toast = useToast();
  const { source } = useReliefSource(d.mode === "image" ? d.imageUrl : undefined, 240);
  const palette = useMemo(
    () => (source ? buildRelief(source, { k: d.imgColors, baseH: 1, step: 0 }).colors : []),
    [source, d.imgColors],
  );

  const key = JSON.stringify({ ...d, imageUrl: d.imageUrl ? d.imageUrl.length : 0 });
  const shownPrice = priced && priced.key === key ? priced : null;
  const ringChoices = d.mode === "text"
    ? [
        { id: "kiri", label: "Kiri" },
        { id: "atas", label: "Atas" },
        { id: "kanan", label: "Kanan" },
        { id: "tanpa", label: "Tanpa" },
      ]
    : [
        { id: "atas", label: "Atas" },
        { id: "tanpa", label: "Tanpa" },
      ];
  const ringValue = d.mode === "image" && d.ring !== "tanpa" ? "atas" : d.ring;

  return (
    <>
      <FontPreviewLoader />
      <GeneratorShell
        title="Gantungan Nama & Logo"
        subtitle="Buat dari nama atau gambar sendiri, lalu lihat hasil 3D sebelum pesan."
        toast={toast.msg}
        top={
          <>
            <BulkNames
              title="Gantungan nama untuk semua nama"
              max={D.max}
              count={D.items.length}
              maxLen={16}
              onAdd={(names) => D.addNames(names, (base, name) => ({ ...base, mode: "text", text: name }))}
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
            onChange={(mode) => D.update({ mode, ring: mode === "image" && d.ring !== "tanpa" ? "atas" : d.ring })}
            options={[
              { id: "text", label: "Tulis Nama", icon: IconText },
              { id: "image", label: "Upload Gambar", icon: IconImage },
            ]}
          />
        }
        stage={
          <Viewport hint="Klik bagian untuk warna / relief · geser untuk putar" fitKey={`${d.mode}`}>
            {d.mode === "text" ? <TextTag d={d} onVolume={setVolume} /> : <ImageTag d={d} onVolume={setVolume} />}
          </Viewport>
        }
        panel={
          <div className="acc-list">
            <AccordionItem
              id="acc-desain"
              title="1. Desain & Konten"
              subtitle={d.mode === "text" ? `Teks: "${d.text}"` : "Upload Gambar & Warna"}
              badge="Konten"
              isOpen={openSec.desain}
              onToggle={() => toggleSec("desain")}
            >
              {d.mode === "text" ? (
                <>
                  <Field label="Nama yang dicetak" hint="Maksimal 16 karakter.">
                    <TextInput value={d.text} max={16} id="input-nametag-text" onChange={(text) => D.update({ text })} />
                  </Field>
                  <Field label="Pilih gaya huruf">
                    <FontPicker value={d.fontId} sample={d.text || "NAMA"} onChange={(fontId) => D.update({ fontId })} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Logo / gambar" hint="Latar polos dan kontras tinggi memberi hasil terbaik. Maks. 3 warna.">
                    <UploadBox compact title={d.imageUrl ? "Ganti gambar" : "Upload gambar"} onData={(imageUrl) => D.update({ imageUrl, imgOverrides: {} })} />
                  </Field>
                  <Slider label="Lebar gambar" value={d.imgWidth} min={30} max={90} step={1} onChange={(imgWidth) => D.update({ imgWidth })} />
                  <Field label="Jumlah warna">
                    <Segmented
                      value={d.imgColors}
                      onChange={(imgColors) => D.update({ imgColors, imgOverrides: {} })}
                      options={[
                        { id: 1, label: "1" },
                        { id: 2, label: "2" },
                        { id: 3, label: "3" },
                      ]}
                    />
                  </Field>
                </>
              )}
            </AccordionItem>

            <AccordionItem
              id="acc-bentuk"
              title="2. Bentuk & Dimensi Tag"
              subtitle={`Bentuk: ${d.mode === "text" ? d.shape : "Sesuai gambar"} · Ring: ${ringValue}`}
              badge="Bentuk"
              isOpen={openSec.bentuk}
              onToggle={() => toggleSec("bentuk")}
            >
              {d.mode === "text" && (
                <Field label="Bentuk alas">
                  <Segmented
                    value={d.shape}
                    onChange={(shape) => D.update({ shape })}
                    options={[
                      { id: "outline", label: "Ikuti huruf" },
                      { id: "kotak", label: "Kotak" },
                      { id: "kapsul", label: "Kapsul" },
                    ]}
                  />
                </Field>
              )}
              <Slider label="Lebar tepi alas" value={d.outline} min={d.mode === "image" ? 0 : 1} max={5} step={0.2} onChange={(outline) => D.update({ outline })} />
              <Field label="Posisi ring gantungan">
                <Segmented
                  value={ringValue}
                  onChange={(ring) => D.update({ ring: ring as Design["ring"] })}
                  options={ringChoices}
                />
              </Field>
            </AccordionItem>

            <AccordionItem
              id="acc-warna"
              title="3. Pilihan Warna"
              subtitle="Alas & tulisan/gambar"
              badge="Warna"
              isOpen={openSec.warna}
              onToggle={() => toggleSec("warna")}
            >
              <ColorSelect label="Warna alas" value={d.baseColor} onChange={(baseColor) => D.update({ baseColor })} />
              {d.mode === "text" ? (
                <ColorSelect
                  label="Warna tulisan"
                  value={d.textColor}
                  onChange={(textColor) => D.update({ textColor })}
                  warn={lowContrast(d.baseColor, d.textColor) ? "Kontras rendah — pilih warna yang lebih berbeda." : undefined}
                />
              ) : palette.length ? (
                palette.map((c, i) => (
                  <ColorSelect
                    key={i}
                    label={`Warna gambar ${i + 1}`}
                    value={d.imgOverrides[i] ?? c}
                    onChange={(hex) => D.update({ imgOverrides: { ...d.imgOverrides, [i]: hex } })}
                  />
                ))
              ) : (
                <p className="hint">Upload gambar dulu pada bagian 1 (Desain & Konten).</p>
              )}
            </AccordionItem>

            <AccordionItem
              id="acc-timbul"
              title="4. Ketebalan Timbul & Relief"
              subtitle={`Timbul: ${d.reliefH}mm · Alas: ${d.baseThick}mm`}
              badge="Relief"
              isOpen={openSec.timbul}
              onToggle={() => toggleSec("timbul")}
            >
              <Slider label={d.mode === "text" ? "Tinggi tulisan timbul" : "Tinggi lapisan gambar"} value={d.reliefH} min={0.6} max={3} step={0.2} onChange={(reliefH) => D.update({ reliefH })} />
              <Slider label="Tebal alas" value={d.baseThick} min={1.6} max={5} step={0.2} onChange={(baseThick) => D.update({ baseThick })} />
              <p className="hint">Tulisan lebih tinggi lebih mudah diraba, tetapi memakai filamen lebih banyak.</p>
            </AccordionItem>
          </div>
        }
        foot={
          <>
            <PriceBox
              title="Harga cetak produk"
              price={shownPrice ? shownPrice.price : null}
              pending="Harga muncul setelah desain siap."
              showMarketplace={false}
              notes={[
                "Harga yang tertera adalah harga cetak produk, bukan biaya desain.",
                "Belum termasuk ongkir.",
                shownPrice
                  ? `Estimasi ±${shownPrice.grams.toFixed(1)} g filamen. Harga dihitung dari bahan dan waktu cetak desainmu.`
                  : "Harga dihitung dari bahan dan waktu cetak desainmu, termasuk pergantian warna.",
              ]}
            />
            <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <button
                id="btn-save-order"
                type="button"
                className="btn btn-primary btn-block btn-glow"
                onClick={() => {
                  if (d.mode === "image" && !d.imageUrl) {
                    toast.show("Upload gambar dulu sebelum memesan.");
                    return;
                  }
                  const colors = d.mode === "text" ? 2 : d.imgColors + (d.outline > 0 ? 1 : 0);
                  const est = estimateByVolume(volume, colors);
                  setPriced({ key, price: est.price, grams: est.grams });
                  saveDraft("gantungan-nama", D.items);
                  const waMsg =
                    `Halo Aureate Craft, saya ingin memesan Gantungan Nama & Logo:\n` +
                    `• Tipe: ${d.mode === "text" ? `Teks Nama "${d.text}"` : "Logo / Gambar Custom"}\n` +
                    `• Bentuk Dasar: ${d.shape.toUpperCase()}\n` +
                    `• Posisi Lubang Ring: ${d.ring.toUpperCase()}\n` +
                    `• Tebal Alas: ${d.baseThick} mm | Tinggi Timbul: ${d.reliefH} mm\n` +
                    `• Warna Base: ${d.baseColor} | Warna Timbul: ${d.textColor}\n` +
                    `• Estimasi Total: ${formatRp(est.price)}\n` +
                    `Mohon info ketersediaan slot produksi.`;
                  openWhatsAppOrder(waMsg);
                  toast.show("Membuka WhatsApp Admin...");
                }}
              >
                Pesan via WhatsApp →
              </button>
              <button
                id="btn-save-price"
                type="button"
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => {
                  if (d.mode === "image" && !d.imageUrl) {
                    toast.show("Upload gambar dulu sebelum menghitung harga.");
                    return;
                  }
                  const colors = d.mode === "text" ? 2 : d.imgColors + (d.outline > 0 ? 1 : 0);
                  const est = estimateByVolume(volume, colors);
                  setPriced({ key, price: est.price, grams: est.grams });
                  saveDraft("gantungan-nama", D.items);
                  toast.show(`Estimasi harga ${formatRp(est.price)}. Draf tersimpan di browser (berlaku 1 hari).`);
                }}
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
