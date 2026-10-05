"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { LegendMesh, useLine } from "@/components/models";
import { ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, Segmented, Slider, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { DEFAULT_FONT } from "@/lib/fonts";
import { clipTubeGeometry, extrudeUpright, ICON_OPTIONS, roundedRectShape, type IconKind } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { estimateByVolume, formatRp } from "@/lib/pricing";

type Pen = "pensil" | "pulpen" | "spidol";

type Design = {
  text: string;
  fontId: string;
  icon: IconKind | null;
  capHeight: number;
  pen: Pen;
  plateThick: number;
  reliefH: number;
  baseColor: string;
  textColor: string;
};

const INITIAL: Design = {
  text: "ARTHUR",
  fontId: DEFAULT_FONT,
  icon: null,
  capHeight: 10,
  pen: "pulpen",
  plateThick: 2,
  reliefH: 1.2,
  baseColor: "#5db7e8",
  textColor: "#d9363e",
};

const PEN_R: Record<Pen, number> = { pensil: 3.9, pulpen: 5.1, spidol: 7.2 };
const PEN_LABEL: Record<Pen, string> = { pensil: "Pensil", pulpen: "Pulpen", spidol: "Spidol" };
const WALL = 1.6;
const BT = 0.35;
const PAD = 2.4;

function Scene({ d, onVolume }: { d: Design; onVolume: (v: number) => void }) {
  const font = useFont(d.fontId);
  const line = useLine(font, d.text, d.capHeight, 95, d.icon);
  const inner = PEN_R[d.pen];
  const outer = inner + WALL;

  const dims = useMemo(() => {
    if (!line) return null;
    const W = line.w + 2 * PAD;
    const H = Math.max(line.h + 2 * PAD, outer * 2);
    return { W, H, len: Math.max(8, W * 0.92) };
  }, [line, outer]);

  const plate = useMemo(
    () =>
      dims
        ? extrudeUpright([roundedRectShape(dims.W, dims.H, Math.min(3, dims.H / 2))], d.plateThick, {
            bevel: BT,
            bevelSize: BT,
          })
        : null,
    [dims, d.plateThick],
  );
  const tube = useMemo(() => (dims ? clipTubeGeometry(inner, WALL, dims.len) : null), [dims, inner]);

  useEffect(
    () => () => {
      plate?.dispose();
      tube?.dispose();
    },
    [plate, tube],
  );

  useEffect(() => {
    if (!line || !dims) return;
    const tubeVol = Math.PI * (outer ** 2 - inner ** 2) * 0.75 * dims.len;
    onVolume(dims.W * dims.H * (d.plateThick + 2 * BT) + line.area * d.reliefH + tubeVol);
  }, [line, dims, d.plateThick, d.reliefH, inner, outer, onVolume]);

  if (!dims || !plate || !tube) return null;
  const front = d.plateThick + 2 * BT;
  return (
    <group>
      <group position={[0, dims.H / 2, 0]}>
        <mesh geometry={plate} castShadow receiveShadow>
          <meshStandardMaterial color={d.baseColor} roughness={0.5} />
        </mesh>
        <mesh geometry={tube} position={[0, 0, 0.9 - outer]} castShadow receiveShadow>
          <meshStandardMaterial color={d.baseColor} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <group position={[0, 0, front]} rotation={[Math.PI / 2, 0, 0]}>
          <LegendMesh line={line} depth={d.reliefH} color={d.textColor} />
        </group>
      </group>
    </group>
  );
}

type Tab = "nama" | "ukuran" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "nama", label: "Nama & ikon" },
  { id: "ukuran", label: "Ukuran" },
  { id: "warna", label: "Warna" },
];

const ICON_GLYPH: Record<string, string> = { heart: "♥", star: "★", bolt: "⚡", flower: "✿", paw: "🐾", smile: "☺" };

export default function PenClipGen() {
  const D = useDesigns<Design>(INITIAL, 8);
  const d = D.current;
  const [tab, setTab] = useState<Tab>("nama");
  const [volume, setVolume] = useState(0);
  const [priced, setPriced] = useState<{ key: string; price: number; grams: number } | null>(null);
  const toast = useToast();
  const key = JSON.stringify(d);
  const shown = priced && priced.key === key ? priced : null;
  const lowC = lowContrast(d.baseColor, d.textColor);

  return (
    <>
      <FontPreviewLoader />
      <GeneratorShell
        title="Nama untuk Pensil & Pulpen"
        subtitle="Pilih nama, ukuran, dan warna. Lihat hasilnya langsung."
        tabs={TABS}
        tab={tab}
        onTab={setTab}
        toast={toast.msg}
        top={
          <>
            <BulkNames
              title="Clip nama alat tulis untuk semua nama"
              max={D.max}
              count={D.items.length}
              maxLen={14}
              onAdd={(names) => D.addNames(names, (base, name) => ({ ...base, text: name }))}
            />
            <DesignChips labels={D.items.map((i) => i.text)} sel={D.sel} onSel={D.setSel} onRemove={D.remove} />
          </>
        }
        stage={
          <Viewport hint="Geser untuk putar · scroll untuk zoom" fitKey="clip">
            <Scene d={d} onVolume={setVolume} />
          </Viewport>
        }
        panel={
          <>
            {tab === "nama" && (
              <>
                <Field label="Nama" hint="Maksimal 14 karakter.">
                  <TextInput value={d.text} max={14} id="input-clip-text" onChange={(text) => D.update({ text })} />
                </Field>
                <Field label="Pilih gaya huruf">
                  <FontPicker value={d.fontId} sample={d.text || "NAMA"} onChange={(fontId) => D.update({ fontId })} />
                </Field>
                <Field label="Ikon (opsional)">
                  <div className="icon-grid">
                    <button type="button" className={`icon-btn ${d.icon === null ? "is-active" : ""}`} onClick={() => D.update({ icon: null })}>
                      Aa
                    </button>
                    {ICON_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        title={o.label}
                        className={`icon-btn ${d.icon === o.id ? "is-active" : ""}`}
                        onClick={() => D.update({ icon: o.id })}
                      >
                        {ICON_GLYPH[o.id]}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
            {tab === "ukuran" && (
              <>
                <Field label="Dipasang di" hint="Menentukan diameter lubang clip.">
                  <Segmented
                    value={d.pen}
                    onChange={(pen) => D.update({ pen })}
                    options={(Object.keys(PEN_LABEL) as Pen[]).map((p) => ({ id: p, label: PEN_LABEL[p] }))}
                  />
                </Field>
                <Slider label="Tinggi huruf" value={d.capHeight} min={7} max={16} step={0.5} onChange={(capHeight) => D.update({ capHeight })} />
                <Slider label="Tebal plat" value={d.plateThick} min={1.6} max={3.5} step={0.2} onChange={(plateThick) => D.update({ plateThick })} />
                <Slider label="Tinggi tulisan timbul" value={d.reliefH} min={0.6} max={2.4} step={0.2} onChange={(reliefH) => D.update({ reliefH })} />
              </>
            )}
            {tab === "warna" && (
              <>
                <div className="color-head">
                  <b>Warna desain</b>
                  {lowC && <span className="badge-warn">Kontras rendah</span>}
                </div>
                <ColorSelect label="Bagian dasar" value={d.baseColor} onChange={(baseColor) => D.update({ baseColor })} hint="Pilih dari stok warna." />
                <ColorSelect
                  label="Nama & ikon"
                  value={d.textColor}
                  onChange={(textColor) => D.update({ textColor })}
                  warn={lowC ? "Pilih warna yang lebih berbeda agar nama terlihat jelas setelah dicetak." : undefined}
                />
              </>
            )}
          </>
        }
        foot={
          <>
            <PriceBox
              title="Harga clip nama"
              price={shown ? shown.price : null}
              pending="Harga muncul setelah desain siap."
              showMarketplace={false}
              notes={[
                "Harga yang tertera adalah harga cetak produk, bukan biaya desain.",
                "Belum termasuk ongkir.",
                "Clip saja, tidak termasuk pensil. Harga dihitung dari bahan dan waktu cetak seluruh desain, termasuk pergantian warna.",
              ]}
            />
            <button
              id="btn-save-price"
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                const est = estimateByVolume(volume, 2);
                setPriced({ key, price: est.price, grams: est.grams });
                saveDraft("clip-nama-alat-tulis", D.items);
                toast.show(`Estimasi harga ${formatRp(est.price)}. Desain tersimpan di browser ini.`);
              }}
            >
              <SaveIcon /> Simpan &amp; hitung harga
            </button>
          </>
        }
      />
    </>
  );
}
