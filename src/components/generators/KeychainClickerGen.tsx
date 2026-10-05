"use client";

import { useEffect, useMemo, useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { BulkNames, DesignChips } from "@/components/BulkNames";
import { KeycapMesh, LegendMesh, keycapTop, useLine, type KeycapShape } from "@/components/models";
import { Chips, ColorSelect, Field, FontPicker, FontPreviewLoader, PriceBox, TextInput } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { DEFAULT_FONT } from "@/lib/fonts";
import { extrudeFlat, roundedRectShape } from "@/lib/geometry";
import { saveDraft, useDesigns, useFont, useToast } from "@/lib/hooks";
import { lowContrast } from "@/lib/palette";
import { CLICKER_BASE, CLICKER_EXTRA, clickerPrice, formatRp } from "@/lib/pricing";
import { TEXTURE_TAGS, WALL_TEXTURES, getBumpTexture, textureThumb } from "@/lib/textures";

type Design = {
  text: string;
  fontId: string;
  texture: string;
  housing: string;
  key: string;
  legend: string;
};

const INITIAL: Design = {
  text: "ELS",
  fontId: DEFAULT_FONT,
  texture: "polos",
  housing: "#f4f4f2",
  key: "#f2686a",
  legend: "#f4f4f2",
};

const MAX_SLOTS = 10;
const PITCH = 22;
const SHAPE: KeycapShape = { w: 16.5, d: 16.5, h: 8.5, taper: 1.8, radius: 3 };

function Cell({ d, char, tex }: { d: Design; char: string; tex: ReturnType<typeof getBumpTexture> }) {
  const font = useFont(d.fontId);
  const housing = useMemo(
    () => extrudeFlat([roundedRectShape(PITCH, 22, 5.5)], 10, { bevel: 0.6, bevelSize: 0.6 }),
    [],
  );
  const top = keycapTop(SHAPE);
  const line = useLine(font, char, 6, top.w * 0.92);
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
      <group position={[0, 11.2, 0]}>
        <KeycapMesh shape={SHAPE} color={d.key}>
          <LegendMesh line={line} depth={0.8} color={d.legend} />
        </KeycapMesh>
      </group>
    </group>
  );
}

function Scene({ d }: { d: Design }) {
  const n = Math.max(1, Math.min(MAX_SLOTS, d.text.length));
  const tex = useMemo(() => getBumpTexture(d.texture), [d.texture]);
  const total = n * PITCH;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[(i - (n - 1) / 2) * PITCH, 0, 0]}>
          <Cell d={d} char={d.text[i] ?? ""} tex={tex} />
        </group>
      ))}
      <mesh position={[-total / 2 - 2.6, 6.2, 0]} castShadow>
        <torusGeometry args={[5.2, 1.3, 14, 40]} />
        <meshStandardMaterial color="#b7bcc6" metalness={0.75} roughness={0.28} />
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
                  <FontPicker value={d.fontId} sample={d.text || "ELS"} onChange={(fontId) => D.update({ fontId })} />
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
            <button
              id="btn-save-order"
              type="button"
              className="btn btn-primary btn-block"
              onClick={() =>
                toast.show(
                  saveDraft("gantungan-keycap", D.items)
                    ? "Desain tersimpan di browser ini. Fitur pemesanan menyusul."
                    : "Gagal menyimpan desain.",
                )
              }
            >
              <SaveIcon /> Simpan &amp; pesan
            </button>
          </>
        }
      />
    </>
  );
}
