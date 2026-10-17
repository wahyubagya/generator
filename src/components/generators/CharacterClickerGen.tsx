"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { AccordionItem, ColorSelect, Field, PriceBox, Segmented, Slider, UploadBox } from "@/components/ui";
import { Viewport } from "@/components/Viewport";
import { playMechanicalClick } from "@/lib/audio";
import { clickerEyeletShape, extrudeFlat } from "@/lib/geometry";
import { loadDraft, saveDraft, useReliefSource, useToast } from "@/lib/hooks";
import { buildRelief } from "@/lib/imageRelief";
import { buildVectorRelief, type VectorReliefResult } from "@/lib/vectorRelief";
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
  ringPos?: "atas" | "bawah";
  baseColor: string;
  housingColor?: string;
  overrides: Record<number, string>;
};

const DEFAULTS: Omit<Design, "imageUrl"> = {
  width: 46,
  colors: 3,
  baseThick: 3,
  step: 0.8,
  outline: 1.6,
  ring: true,
  ringPos: "atas",
  baseColor: "#f4f4f2",
  housingColor: "#f4f4f2",
  overrides: {},
};

const RING_OUT = 5;
const RING_IN = 2.3;
const BT = 0.35;
const ACCESSORY = 6000;
const HOUSING_HEIGHT = 13.5;
const TRAVEL_GAP = 2.4;

function InteractiveCharacterCap({
  relief,
  restingY,
}: {
  relief: VectorReliefResult;
  restingY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
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
    if (groupRef.current) {
      groupRef.current.position.y = restingY + offset.current;
    }
    if (target.current !== 0) {
      target.current = 0;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    playMechanicalClick(1.0);
    target.current = -2.0;
  };

  return (
    <group
      ref={groupRef}
      position={[0, restingY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Batang Switch Mekanikal (Cherry/Kailh Cross Stem) yang terhubung ke keycap */}
      <group position={[0, -2.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[4.0, 4.8, 1.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.35} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[1.2, 4.8, 4.0]} />
          <meshStandardMaterial color="#0284c7" roughness={0.35} />
        </mesh>
      </group>

      {/* Alas & Skirt Keycap Karakter */}
      {relief.baseGeometry && (
        <mesh geometry={relief.baseGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={relief.baseColor} roughness={0.38} metalness={0.06} />
        </mesh>
      )}

      {/* Layer-layer Relief Warna Gambar */}
      {relief.layers.map((layer, idx) => (
        <mesh key={idx} geometry={layer.geometry} castShadow receiveShadow>
          <meshStandardMaterial color={layer.color} roughness={0.38} metalness={0.06} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ d, onVolume }: { d: Design; onVolume: (v: number) => void }) {
  const { source, error } = useReliefSource(d.imageUrl, 240);
  const ringPos = d.ringPos ?? "atas";

  const vectorRelief = useMemo(() => {
    if (!source) return null;
    return buildVectorRelief(source, {
      width: d.width,
      k: d.colors,
      baseThick: d.baseThick,
      step: d.step,
      outline: d.outline,
      baseColor: d.baseColor,
      housingHeight: HOUSING_HEIGHT,
      housingColor: d.housingColor ?? d.baseColor,
      overrides: d.overrides,
    });
  }, [source, d.width, d.colors, d.baseThick, d.step, d.outline, d.baseColor, d.housingColor, d.overrides]);

  const eyeletGeo = useMemo(() => {
    if (!d.ring) return null;
    const geo = extrudeFlat([clickerEyeletShape(4.8, 2.3, 8.5, 5.8)], 4.2, {
      bevel: 0.4,
      bevelSize: 0.35,
      curveSegments: 20,
    });
    // Jika di atas, putar 180° agar lubang mengarah ke luar (+Z)
    if (ringPos === "atas") {
      geo.rotateY(Math.PI);
    }
    return geo;
  }, [d.ring, ringPos]);

  useEffect(() => () => eyeletGeo?.dispose(), [eyeletGeo]);

  useEffect(() => {
    if (!vectorRelief) return;
    onVolume(vectorRelief.volume);
  }, [vectorRelief, onVolume]);

  if (error) console.error(error);
  if (!vectorRelief) return null;

  const restingY = HOUSING_HEIGHT + TRAVEL_GAP;
  const housingCol = d.housingColor ?? d.baseColor;

  const eyeletZ =
    ringPos === "atas"
      ? vectorRelief.top.z - 0.4
      : (vectorRelief.bottom?.z ?? -vectorRelief.top.z) + 0.4;

  return (
    <group>
      {/* 1. Bodi housing clicker di bawah (mengikuti siluet karakter secara presisi) */}
      {vectorRelief.housingGeometry && (
        <mesh geometry={vectorRelief.housingGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={housingCol} roughness={0.42} metalness={0.04} />
        </mesh>
      )}

      {/* 2. Switch Mekanikal Realistis di dalam Rongga Housing */}
      <group position={[0, HOUSING_HEIGHT - 3.2, 0]}>
        {/* Switch Body Housing (Dark Charcoal) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[14.2, 5.2, 14.2]} />
          <meshStandardMaterial color="#1e2229" roughness={0.65} metalness={0.12} />
        </mesh>
        {/* Switch Collar Rim */}
        <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[11.2, 1.6, 11.2]} />
          <meshStandardMaterial color="#2c313c" roughness={0.5} metalness={0.15} />
        </mesh>
      </group>

      {/* 3. Tombol karakter ber-spring mekanikal yang bisa diklik */}
      <InteractiveCharacterCap relief={vectorRelief} restingY={restingY} />

      {/* 4. Kuping gantungan tali (Eyelet) yang selalu CENTER di x = 0 */}
      {eyeletGeo && (
        <mesh
          geometry={eyeletGeo}
          position={[0, 0, eyeletZ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={housingCol} roughness={0.42} metalness={0.04} side={THREE.DoubleSide} />
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
  const { source } = useReliefSource(d.imageUrl, 240);
  const palette = useMemo(
    () => (source ? buildRelief(source, { k: d.colors, baseH: 1, step: 0 }).colors : []),
    [source, d.colors],
  );
  const key = JSON.stringify({ ...d, imageUrl: d.imageUrl.length });
  const shown = priced && priced.key === key ? priced : null;

  const [openSec, setOpenSec] = useState({
    dimensi: true,
    warna: false,
  });
  const toggleSec = (k: keyof typeof openSec) =>
    setOpenSec((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <GeneratorShell
      title="Clicker Karakter"
      subtitle="Gambarmu menjadi clicker berelief. Atur ukuran, jumlah warna, dan ketebalan."
      teaser="Harga dihitung setelah desain diperiksa · termasuk paracord + carabiner"
      toast={toast.msg}
      stage={
        <Viewport hint="Klik karakter untuk mencoba klik · geser untuk putar" fitKey={d.imageUrl.length + ""}>
          <Scene d={d} onVolume={setVolume} />
        </Viewport>
      }
      panel={
        <div className="acc-list">
          <AccordionItem
            id="acc-dimensi"
            title="1. Gambar & Dimensi Karakter"
            subtitle="Atur ukuran, tinggi relief, dan ring gantungan"
            badge={`Lebar ${d.width}mm`}
            isOpen={openSec.dimensi}
            onToggle={() => toggleSec("dimensi")}
          >
            <Field label="Gambar">
              <div className="row-gap">
                <button type="button" className="btn btn-ghost" id="btn-change-image" onClick={onBack}>
                  ← Ganti gambar
                </button>
              </div>
            </Field>
            <Slider label="Lebar clicker" value={d.width} min={30} max={70} step={1} onChange={(width) => setD({ width })} />
            <Field label="Jumlah warna relief" hint="Maksimal 3 warna agar ramah cetak FDM.">
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
            <Slider label="Tebal alas tombol" value={d.baseThick} min={2} max={5} step={0.2} onChange={(baseThick) => setD({ baseThick })} />
            <Slider label="Tinggi relief" value={d.step} min={0.4} max={1.6} step={0.1} onChange={(step) => setD({ step })} />
            <Slider label="Tepi alas" value={d.outline} min={0} max={4} step={0.2} onChange={(outline) => setD({ outline })} />
            <Field label="Gantungan kuping">
              <Segmented
                value={d.ring ? (d.ringPos ?? "atas") : "tanpa"}
                onChange={(v) => {
                  if (v === "tanpa") setD({ ring: false });
                  else setD({ ring: true, ringPos: v as "atas" | "bawah" });
                }}
                options={[
                  { id: "atas", label: "Atas (Center)" },
                  { id: "bawah", label: "Bawah (Center)" },
                  { id: "tanpa", label: "Tanpa Kuping" },
                ]}
              />
            </Field>
          </AccordionItem>

          <AccordionItem
            id="acc-warna"
            title="2. Pilihan Warna Karakter & Bodi"
            subtitle="Atur warna tepi, bodi housing, dan tiap layer gambar"
            badge={`${d.colors} Warna`}
            isOpen={openSec.warna}
            onToggle={() => toggleSec("warna")}
          >
            <ColorSelect label="Warna tepi karakter" value={d.baseColor} onChange={(baseColor) => setD({ baseColor })} />
            <ColorSelect
              label="Warna bodi clicker"
              value={d.housingColor ?? d.baseColor}
              onChange={(housingColor) => setD({ housingColor })}
            />
            {palette.map((c, i) => (
              <ColorSelect
                key={i}
                label={`Warna gambar layer ${i + 1}`}
                value={d.overrides[i] ?? c}
                onChange={(hex) => setD({ overrides: { ...d.overrides, [i]: hex } })}
              />
            ))}
          </AccordionItem>
        </div>
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
                  `• Warna Bodi Clicker: ${d.housingColor ?? d.baseColor}\n` +
                  `• Warna Tepi Karakter: ${d.baseColor}\n` +
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
                      housingColor: d.housingColor ?? d.baseColor,
                      colors: d.colors,
                      baseThick: d.baseThick,
                      ring: d.ring,
                      outline: d.outline,
                      step: d.step,
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
                toast.show(`Estimasi harga ${formatRp(price)}. Draf tersimpan di browser (berlaku 1 hari).`);
              }}
            >
              <SaveIcon /> Simpan ke Draft Saja
            </button>
            <span className="draft-expiry-hint">⏱️ Draf disimpan di browser & berlaku selama 1 hari</span>
          </div>
        </>
      }
    />
  );
}

export default function CharacterClickerGen() {
  const [d, setDState] = useState<Design | null>(null);
  const [savedDraft, setSavedDraft] = useState<Design | null>(() => {
    if (typeof window !== "undefined") {
      const draft = loadDraft<Design>("bikin-clicker");
      if (draft && draft.imageUrl && draft.imageUrl !== "(gambar upload)") {
        return draft;
      }
    }
    return null;
  });
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
        {savedDraft && (
          <button
            type="button"
            id="btn-resume-draft"
            className="btn btn-secondary"
            onClick={() => {
              setDState(savedDraft);
              toast.show("Melanjutkan draf sebelumnya.");
            }}
          >
            📂 Lanjutkan draf tersimpan
          </button>
        )}
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
