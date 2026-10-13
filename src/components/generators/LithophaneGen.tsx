"use client";

import { useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { Viewport } from "@/components/Viewport";
import { Field, Slider, Segmented, PriceBox, UploadBox } from "@/components/ui";
import { saveDraft, useToast } from "@/lib/hooks";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Tab = "foto" | "bentuk" | "lampu";
const TABS: { id: Tab; label: string }[] = [
  { id: "foto", label: "Upload Foto" },
  { id: "bentuk", label: "Bentuk & Ukuran" },
  { id: "lampu", label: "Dudukan Lampu" },
];

function Lithophane3DScene({
  shape,
  sizeMm,
  hasLed,
}: {
  shape: string;
  sizeMm: number;
  hasLed: boolean;
}) {
  const width = sizeMm;
  const height = sizeMm * 0.75;

  return (
    <group position={[0, 0, 0]}>
      {/* Lithophane Panel */}
      {shape === "curved" ? (
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[width / 2, width / 2, height, 32, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} side={2} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, 3.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} />
        </mesh>
      )}

      {/* LED Wooden Base */}
      {hasLed && (
        <mesh position={[0, -height / 2 - 8, 0]}>
          <boxGeometry args={[width + 16, 14, 40]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      )}

      {/* Warm Light Glow Simulation */}
      <pointLight position={[0, 0, -15]} intensity={1.5} color="#fed7aa" />
    </group>
  );
}

export default function LithophaneGen() {
  const [tab, setTab] = useState<Tab>("foto");
  const [shape, setShape] = useState("flat");
  const [sizeMm, setSizeMm] = useState(100);
  const [ledOption, setLedOption] = useState("ya");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const toast = useToast();

  const price = (sizeMm === 100 ? 55000 : sizeMm === 120 ? 75000 : 95000) + (ledOption === "ya" ? 35000 : 0);

  const handleOrder = () => {
    saveDraft("lithophane", [{ shape, sizeMm, ledOption, price }]);
    const text =
      `Halo Aureate Craft, saya ingin memesan Foto Timbul Transparan (Lithophane):\n` +
      `• Bentuk Panel: ${shape === "flat" ? "Datar (Flat)" : "Melengkung (Curved)"}\n` +
      `• Dimensi: ${sizeMm} × ${Math.round(sizeMm * 0.75)} mm\n` +
      `• Dudukan Lampu LED: ${ledOption === "ya" ? "Ya (Termasuk Dudukan Kayu Solid & Strip LED USB)" : "Hanya Plat Foto"}\n` +
      `• Total Estimasi: Rp ${price.toLocaleString("id-ID")}\n` +
      `Saya sudah menyiapkan file foto beresolusi jelas. Mohon info ketersediaan slot produksi.`;
    openWhatsAppOrder(text);
    toast.show("Membuka WhatsApp Admin...");
  };

  return (
    <GeneratorShell
      title="Foto Timbul Transparan (Lithophane)"
      subtitle="Ubah foto kenangan menjadi relief 3D yang menampilkan detail gambar ketika disorot cahaya."
      teaser="Kado anniversary, wisuda, atau foto keluarga yang estetik."
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      toast={toast.msg}
      stage={
        <div className="viewport">
          <Viewport>
            <Lithophane3DScene
              shape={shape}
              sizeMm={sizeMm}
              hasLed={ledOption === "ya"}
            />
          </Viewport>
          <div className="vp-hint">Disinari cahaya LED hangat dari belakang</div>
          <div className="vp-size">
            <b>{sizeMm} × {Math.round(sizeMm * 0.75)} mm</b>
            <small>Ketebalan 0.8–3.2 mm</small>
          </div>
        </div>
      }
      panel={
        <>
          {tab === "foto" && (
            <>
              <Field label="Unggah Foto Pilihan Anda" hint="Gunakan foto dengan kontras jelas untuk hasil terbaik.">
                <UploadBox onImage={setImageUrl} />
              </Field>
              {imageUrl && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview Unggahan"
                    style={{ maxHeight: "140px", borderRadius: "8px", objectFit: "contain" }}
                  />
                  <p className="input-hint">Foto berhasil dimuat untuk relief 3D.</p>
                </div>
              )}
            </>
          )}

          {tab === "bentuk" && (
            <>
              <Field label="Pilihan Bentuk Lithophane">
                <Segmented
                  options={[
                    { value: "flat", label: "Datar (Flat)" },
                    { value: "curved", label: "Melengkung (Curved)" },
                  ]}
                  value={shape}
                  onChange={setShape}
                />
              </Field>
              <Slider
                label="Ukuran Panjang Plat (mm)"
                value={sizeMm}
                min={80}
                max={150}
                step={10}
                onChange={setSizeMm}
              />
            </>
          )}

          {tab === "lampu" && (
            <Field label="Dudukan Lampu LED Kayu (USB Powered)">
              <Segmented
                options={[
                  { value: "ya", label: "Lengkap dengan Dudukan LED (+Rp 35rb)" },
                  { value: "tidak", label: "Tanpa Lampu (Plat Saja)" },
                ]}
                value={ledOption}
                onChange={setLedOption}
              />
              <p className="input-hint" style={{ marginTop: "12px" }}>
                Dudukan kayu solid estetik dengan strip LED warm-white bertenaga colokan kabel USB.
              </p>
            </Field>
          )}
        </>
      }
      foot={
        <>
          <PriceBox
            price={price}
            note="Dicetak dengan filamen White Litho high-density khusus transmisi cahaya"
          />
          <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <button
              id="btn-save-order"
              type="button"
              className="btn btn-primary btn-block btn-glow"
              onClick={handleOrder}
            >
              Pesan Lithophane via WhatsApp →
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                const ok = saveDraft("lithophane", [{ shape, sizeMm, ledOption, price }]);
                toast.show(ok ? "Desain tersimpan di browser ini." : "Gagal menyimpan desain.");
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
