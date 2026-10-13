"use client";

import { useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { Viewport } from "@/components/Viewport";
import { ColorSelect, Field, Segmented, PriceBox, TextInput } from "@/components/ui";
import { saveDraft, useToast } from "@/lib/hooks";
import { submitOrderAndOpenWhatsApp } from "@/lib/whatsapp";

type Tab = "data" | "medali" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "data", label: "Data Lari" },
  { id: "medali", label: "Slot Medali" },
  { id: "warna", label: "Warna Frame" },
];

function PiagamLari3DScene({
  hasMedalSlot,
  baseColor,
}: {
  name: string;
  event: string;
  distance: string;
  time: string;
  hasMedalSlot: boolean;
  baseColor: string;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Backboard Frame */}
      <mesh position={[0, 0, -2]}>
        <boxGeometry args={[120, 160, 6]} />
        <meshStandardMaterial color={baseColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Raised Border Rim */}
      <mesh position={[0, 0, 2]}>
        <boxGeometry args={[116, 156, 3]} />
        <meshStandardMaterial color="#0b111e" roughness={0.7} />
      </mesh>

      {/* Simulated Medal Slot Recess */}
      {hasMedalSlot && (
        <group position={[0, 32, 2]}>
          <mesh>
            <cylinderGeometry args={[26, 26, 4, 32]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Ribbon slot */}
          <mesh position={[0, 28, 0]}>
            <boxGeometry args={[28, 4, 4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* Simulated Text Plaque */}
      <mesh position={[0, hasMedalSlot ? -35 : -10, 3]}>
        <boxGeometry args={[95, 45, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Route Line Silhouette Simulation */}
      <mesh position={[0, hasMedalSlot ? -22 : 25, 4.5]}>
        <boxGeometry args={[70, 3, 1]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function PiagamLariGen() {
  const [tab, setTab] = useState<Tab>("data");
  const [name, setName] = useState("ADITYA PRATAMA");
  const [event, setEvent] = useState("JAKARTA MARATHON 2026");
  const [distance, setDistance] = useState("21K");
  const [finishTime, setFinishTime] = useState("01:52:40");
  const [hasMedal, setHasMedal] = useState("ya");
  const [baseColor, setBaseColor] = useState("#0f172a");
  const toast = useToast();

  const price = 85000 + (hasMedal === "ya" ? 20000 : 0);

  const handleOrder = () => {
    saveDraft("piagam-lari", [{ name, event, distance, finishTime, hasMedal, baseColor, price }]);
    const text =
      `Halo Aureate Craft, saya ingin memesan Pajangan Medali Lari (Race Frame):\n` +
      `• Nama Pelari: ${name}\n` +
      `• Event Lari: ${event}\n` +
      `• Kategori Jarak: ${distance}\n` +
      `• Catatan Waktu (Finish Time): ${finishTime}\n` +
      `• Slot Medali: ${hasMedal === "ya" ? "Ya (Dengan Slot Medali 65mm & Celah Pita)" : "Tanpa Slot Medali"}\n` +
      `• Warna Frame: ${baseColor}\n` +
      `• Total Estimasi: Rp ${price.toLocaleString("id-ID")}\n` +
      `Mohon info ketersediaan slot produksi.`;
    submitOrderAndOpenWhatsApp(
      {
        generatorSlug: "piagam-lari",
        generatorTitle: "Pajangan Medali Lari (Race Frame)",
        totalPrice: price,
        configJson: { name, event, distance, finishTime, hasMedal, baseColor },
      },
      text
    );
    toast.show("Menyimpan pesanan & membuka WhatsApp Admin...");
  };

  return (
    <GeneratorShell
      title="Pajangan Medali Lari (Race Memory Frame)"
      subtitle="Abadikan momen maraton, nama pelari, catatan waktu, dan gantung medali kebanggaanmu dalam frame 3D eksklusif."
      teaser="Cocok untuk 5K, 10K, Half Marathon, dan Full Marathon."
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      toast={toast.msg}
      stage={
        <div className="viewport">
          <Viewport>
            <PiagamLari3DScene
              name={name}
              event={event}
              distance={distance}
              time={finishTime}
              hasMedalSlot={hasMedal === "ya"}
              baseColor={baseColor}
            />
          </Viewport>
          <div className="vp-hint">Frame 3D dengan slot medali dan rute lari</div>
          <div className="vp-size">
            <b>120 × 160 mm</b>
            <small>{distance} · {finishTime}</small>
          </div>
        </div>
      }
      panel={
        <>
          {tab === "data" && (
            <>
              <Field label="Nama Pelari">
                <TextInput value={name} upper id="input-runner-name" onChange={setName} />
              </Field>
              <Field label="Nama Event Lari">
                <TextInput value={event} upper id="input-runner-event" onChange={setEvent} />
              </Field>
              <Field label="Kategori Jarak">
                <Segmented
                  options={[
                    { value: "5K", label: "5K Fun Run" },
                    { value: "10K", label: "10K" },
                    { value: "21K", label: "21K Half" },
                    { value: "42K", label: "42K Full" },
                  ]}
                  value={distance}
                  onChange={setDistance}
                />
              </Field>
              <Field label="Catatan Waktu (Finisher Time)">
                <TextInput value={finishTime} id="input-runner-time" onChange={setFinishTime} />
              </Field>
            </>
          )}

          {tab === "medali" && (
            <Field label="Slot Gantungan Medali Fisik">
              <Segmented
                options={[
                  { value: "ya", label: "Dengan Slot Medali (+Rp 20rb)" },
                  { value: "tidak", label: "Tanpa Medali (Hanya Piagam Data)" },
                ]}
                value={hasMedal}
                onChange={setHasMedal}
              />
              <p className="input-hint" style={{ marginTop: "12px" }}>
                Slot berdiameter 65mm dengan celah pita di atasnya, cocok untuk sebagian besar medali lari maraton Indonesia.
              </p>
            </Field>
          )}

          {tab === "warna" && (
            <Field label="Pilihan Warna Frame Luar">
              <ColorSelect value={baseColor} onChange={setBaseColor} />
            </Field>
          )}
        </>
      }
      foot={
        <>
          <PriceBox
            price={price}
            note="Sudah termasuk stand penyangga meja dan lubang paku dinding"
          />
          <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <button
              id="btn-save-order"
              type="button"
              className="btn btn-primary btn-block btn-glow"
              onClick={handleOrder}
            >
              Pesan Frame Piagam Lari via WhatsApp →
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                const ok = saveDraft("piagam-lari", [{ name, event, distance, finishTime, hasMedal, baseColor, price }]);
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
