"use client";

import { useEffect, useMemo, useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { VectorReliefMesh } from "@/components/models";
import { ColorSelect, Field, PriceBox, Segmented, Slider, UploadBox } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { annulusShape, extrudeFlat } from "@/lib/geometry";
import { saveDraft, useReliefSource, useToast } from "@/lib/hooks";
import { buildRelief } from "@/lib/imageRelief";
import { buildVectorRelief } from "@/lib/vectorRelief";
import { estimateByVolume, formatRp } from "@/lib/pricing";
import { SAMPLES } from "@/lib/samples";
import { openWhatsAppOrder, submitOrderAndOpenWhatsApp } from "@/lib/whatsapp";

type Design = {
  imageUrl: string;
  width: number;
  colors: number;
  baseThick: number;
  step: number;
  outline: number;
  ring: boolean;
  baseColor: string;
  overrides: Record<number, string>;
};

const DEFAULTS: Omit<Design, "imageUrl"> = {
  width: 46,
  colors: 3,
  baseThick: 3,
  step: 0.8,
  outline: 1.6,
  ring: true,
  baseColor: "#f4f4f2",
  overrides: {},
};

const RING_OUT = 5;
const RING_IN = 2.3;
const BT = 0.35;
const ACCESSORY = 6000;

function Scene({ d, onVolume }: { d: Design; onVolume: (v: number) => void }) {
  const { source, error } = useReliefSource(d.imageUrl, 180);

  const vectorRelief = useMemo(() => {
    if (!source) return null;
    return buildVectorRelief(source, {
      width: d.width,
      k: d.colors,
      baseThick: d.baseThick,
      step: d.step,
      outline: d.outline,
      baseColor: d.baseColor,
      overrides: d.overrides,
    });
  }, [source, d.width, d.colors, d.baseThick, d.step, d.outline, d.baseColor, d.overrides]);

  const ringGeo = useMemo(
    () => (d.ring ? extrudeFlat([annulusShape(RING_OUT, RING_IN)], d.baseThick, { bevel: BT, bevelSize: BT }) : null),
    [d.ring, d.baseThick],
  );
  useEffect(() => () => ringGeo?.dispose(), [ringGeo]);

  useEffect(() => {
    if (!vectorRelief) return;
    onVolume(vectorRelief.volume);
  }, [vectorRelief, onVolume]);

  if (error) console.error(error);
  if (!vectorRelief) return null;

  return (
    <group>
      <VectorReliefMesh relief={vectorRelief} />
      {ringGeo && (
        <mesh geometry={ringGeo} position={[vectorRelief.top.x, 0, vectorRelief.top.z - RING_OUT + 2]} castShadow>
          <meshStandardMaterial color={d.baseColor} roughness={0.38} metalness={0.06} />
        </mesh>
      )}
    </group>
  );
}

type Tab = "gambar" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "gambar", label: "Gambar" },
  { id: "warna", label: "Warna" },
];

const GEMINI_PROMPT =
  "Buat ilustrasi kartun sederhana bergaya sticker: satu karakter di tengah, garis tepi tebal berwarna gelap, maksimal 3 warna solid tanpa gradasi dan tanpa bayangan, latar belakang polos putih.";

function Editor({ d, setD, onBack }: { d: Design; setD: (p: Partial<Design>) => void; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("gambar");
  const [volume, setVolume] = useState(0);
  const [priced, setPriced] = useState<{ key: string; price: number } | null>(null);
  const toast = useToast();
  const { source } = useReliefSource(d.imageUrl, 180);
  const palette = useMemo(
    () => (source ? buildRelief(source, { k: d.colors, baseH: 1, step: 0 }).colors : []),
    [source, d.colors],
  );
  const key = JSON.stringify({ ...d, imageUrl: d.imageUrl.length });
  const shown = priced && priced.key === key ? priced : null;

  return (
    <GeneratorShell
      title="Clicker Karakter"
      subtitle="Gambarmu menjadi clicker berelief. Atur ukuran, jumlah warna, dan ketebalan."
      teaser="Harga dihitung setelah desain diperiksa · termasuk paracord + carabiner"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      toast={toast.msg}
      stage={
        <Viewport hint="Geser untuk putar · scroll untuk zoom" fitKey={d.imageUrl.length + ""}>
          <Scene d={d} onVolume={setVolume} />
        </Viewport>
      }
      panel={
        <>
          {tab === "gambar" && (
            <>
              <Field label="Gambar">
                <div className="row-gap">
                  <button type="button" className="btn btn-ghost" id="btn-change-image" onClick={onBack}>
                    ← Ganti gambar
                  </button>
                </div>
              </Field>
              <Slider label="Lebar clicker" value={d.width} min={30} max={70} step={1} onChange={(width) => setD({ width })} />
              <Field label="Jumlah warna" hint="Maksimal 3 warna agar ramah cetak FDM.">
                <Segmented
                  value={d.colors}
                  onChange={(colors) => setD({ colors, overrides: {} })}
                  options={[
                    { id: 1, label: "1" },
                    { id: 2, label: "2" },
                    { id: 3, label: "3" },
                  ]}
                />
              </Field>
              <Slider label="Tebal alas" value={d.baseThick} min={2} max={5} step={0.2} onChange={(baseThick) => setD({ baseThick })} />
              <Slider label="Tinggi relief" value={d.step} min={0.4} max={1.6} step={0.1} onChange={(step) => setD({ step })} />
              <Slider label="Tepi alas" value={d.outline} min={0} max={4} step={0.2} onChange={(outline) => setD({ outline })} />
              <Field label="Ring paracord">
                <Segmented
                  value={d.ring ? "ya" : "tidak"}
                  onChange={(v) => setD({ ring: v === "ya" })}
                  options={[
                    { id: "ya", label: "Pakai" },
                    { id: "tidak", label: "Tanpa" },
                  ]}
                />
              </Field>
            </>
          )}
          {tab === "warna" && (
            <>
              <ColorSelect label="Warna alas / tepi" value={d.baseColor} onChange={(baseColor) => setD({ baseColor })} />
              {palette.map((c, i) => (
                <ColorSelect
                  key={i}
                  label={`Warna gambar ${i + 1}`}
                  value={d.overrides[i] ?? c}
                  onChange={(hex) => setD({ overrides: { ...d.overrides, [i]: hex } })}
                />
              ))}
            </>
          )}
        </>
      }
      foot={
        <>
          <PriceBox
            title="Harga clicker karakter"
            price={shown ? shown.price : null}
            showMarketplace={false}
            pending="Harga dihitung setelah desain diperiksa."
            notes={[
              "Termasuk paracord + carabiner. Belum termasuk ongkir.",
              "Hasilnya berupa gambar timbul, bukan patung.",
            ]}
          />
          <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <button
              id="btn-save-order"
              type="button"
              className="btn btn-primary btn-block btn-glow"
              onClick={() => {
                const est = estimateByVolume(volume, d.colors + (d.outline > 0 ? 1 : 0));
                const price = est.price + ACCESSORY;
                setPriced({ key, price });
                saveDraft("bikin-clicker", { ...d, imageUrl: d.imageUrl.startsWith("data:image/svg") ? d.imageUrl : "(gambar upload)" });
                const waMsg =
                  `Halo Aureate Craft, saya ingin memesan Clicker Karakter Custom:\n` +
                  `• Lebar Produk: ${d.width} mm\n` +
                  `• Warna Frame/Base: ${d.baseColor}\n` +
                  `• Jumlah Warna Layer: ${d.colors} warna\n` +
                  `• Tebal Base: ${d.baseThick} mm\n` +
                  `• Lubang Gantungan: ${d.ring ? "Ya (Termasuk Paracord & Carabiner)" : "Tanpa Lubang"}\n` +
                  `• Estimasi Total: ${formatRp(price)}\n` +
                  `Saya sudah menyiapkan gambar/desain. Mohon info ketersediaan slot produksi.`;
                submitOrderAndOpenWhatsApp(
                  {
                    generatorSlug: "character-clicker",
                    generatorTitle: "Clicker Karakter Custom",
                    totalPrice: price,
                    configJson: {
                      width: d.width,
                      baseColor: d.baseColor,
                      colors: d.colors,
                      baseThick: d.baseThick,
                      ring: d.ring,
                      outline: d.outline,
                      reliefDepth: d.reliefDepth,
                    },
                  },
                  waMsg
                );
                toast.show("Menyimpan pesanan & membuka WhatsApp Admin...");
              }}
            >
              Pesan via WhatsApp →
            </button>
            <button
              id="btn-save-price"
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                const est = estimateByVolume(volume, d.colors + (d.outline > 0 ? 1 : 0));
                const price = est.price + ACCESSORY;
                setPriced({ key, price });
                saveDraft("bikin-clicker", { ...d, imageUrl: d.imageUrl.startsWith("data:image/svg") ? d.imageUrl : "(gambar upload)" });
                toast.show(`Estimasi harga ${formatRp(price)}. Desain tersimpan di browser ini.`);
              }}
            >
              <SaveIcon /> Simpan ke Draft Saja
            </button>
          </div>
        </>
      }
    />
  );
}

export default function CharacterClickerGen() {
  const [d, setDState] = useState<Design | null>(null);
  const toast = useToast();
  const setD = (p: Partial<Design>) => setDState((cur) => (cur ? { ...cur, ...p } : cur));
  const start = (imageUrl: string) => setDState({ ...DEFAULTS, imageUrl });

  if (d) return <Editor d={d} setD={setD} onBack={() => setDState(null)} />;

  return (
    <div className="char-page">
      <h1>Clicker Karakter</h1>
      <p className="gen-sub">Upload gambar atau logo, kami rapikan, terus lihat versi clicker-nya dalam 3D.</p>
      <p className="gen-teaser">Harga dihitung setelah desain diperiksa · termasuk paracord + carabiner</p>
      <p className="hint">Hasilnya berupa gambar timbul, bukan patung. Kamu bisa mencoba preview sebelum memesan.</p>

      <UploadBox onData={start} />
      <p className="hint">Tips: gambar/logo dengan subjek jelas dan background polos memberi hasil terbaik.</p>

      <div className="char-actions">
        <button type="button" id="btn-try-sample" className="btn btn-primary" onClick={() => start(SAMPLES[0].url)}>
          ✦ Coba contoh
        </button>
        <button
          type="button"
          id="btn-photo-help"
          className="btn btn-ghost"
          onClick={() => {
            const waMsg = `Halo Aureate Craft, saya ingin membuat Clicker Karakter tapi butuh bantuan merapikan foto/desain. Mohon info alur dan biayanya.`;
            openWhatsAppOrder(waMsg);
            toast.show("Membuka WhatsApp Admin untuk konsultasi foto...");
          }}
        >
          Minta bantuan foto via WhatsApp
        </button>
      </div>
      <p className="hint">Belum punya gambar yang siap? Chat admin untuk cek foto serta konfirmasi proses dan biaya bantuannya.</p>

      <section className="inspo">
        <div className="inspo-head">
          <div>
            <span className="eyebrow">✦ Pilihan inspirasi</span>
            <h2>Bukan cuma foto orang</h2>
            <p>Hewan, cake, buah, dan makanan juga bisa jadi clicker. Klik contoh untuk langsung mencobanya.</p>
          </div>
          <span className="pill">Maks. 3 warna · FDM friendly</span>
        </div>
        <div className="inspo-grid">
          {SAMPLES.map((s) => (
            <article className="inspo-card" key={s.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.label} width={200} height={200} />
              <small>{s.tag}</small>
              <h3>{s.label}</h3>
              <button type="button" id={`sample-${s.id}`} className="btn btn-ghost btn-block" onClick={() => start(s.url)}>
                Coba gambar ini
              </button>
            </article>
          ))}
        </div>
      </section>

      <details className="gemini">
        <summary>Opsional: buat kartun sendiri dengan AI</summary>
        <p>Salin prompt ini ke generator gambar favoritmu, lalu upload hasilnya di atas.</p>
        <textarea readOnly className="input textarea" rows={3} value={GEMINI_PROMPT} />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            navigator.clipboard?.writeText(GEMINI_PROMPT);
            toast.show("Prompt disalin.");
          }}
        >
          Salin prompt
        </button>
      </details>
      <div className={`toast ${toast.msg ? "is-on" : ""}`} role="status">{toast.msg}</div>
    </div>
  );
}
