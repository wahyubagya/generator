"use client";

import { useState } from "react";
import { GeneratorShell, SaveIcon } from "@/components/GeneratorShell";
import { Viewport } from "@/components/Viewport";
import { ColorSelect, Field, Slider, Segmented, PriceBox } from "@/components/ui";
import { saveDraft, useToast } from "@/lib/hooks";
import { openWhatsAppOrder } from "@/lib/whatsapp";

type Tab = "dimensi" | "sekat" | "warna";
const TABS: { id: Tab; label: string }[] = [
  { id: "dimensi", label: "Dimensi" },
  { id: "sekat", label: "Sekat" },
  { id: "warna", label: "Warna" },
];

function Gridfinity3DScene({
  cols,
  rows,
  heightU,
  dividersX,
  dividersY,
  color,
}: {
  cols: number;
  rows: number;
  heightU: number;
  dividersX: number;
  dividersY: number;
  color: string;
}) {
  const unitSize = 42; // standard 42mm gridfinity
  const totalW = cols * unitSize;
  const totalD = rows * unitSize;
  const totalH = heightU * 7;

  return (
    <group position={[0, -totalH / 2, 0]}>
      {/* Base Grid Plate */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[totalW, 4, totalD]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Bin Walls */}
      <mesh position={[0, totalH / 2, 0]}>
        <boxGeometry args={[totalW, totalH - 4, totalD]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>

      {/* Inner Cavity Cutout (Simulated) */}
      <mesh position={[0, totalH / 2 + 3, 0]}>
        <boxGeometry args={[totalW - 4, totalH - 2, totalD - 4]} />
        <meshStandardMaterial color="#0b111e" roughness={0.8} />
      </mesh>

      {/* Dividers */}
      {dividersX > 0 &&
        Array.from({ length: dividersX }).map((_, i) => {
          const posX = -totalW / 2 + (totalW / (dividersX + 1)) * (i + 1);
          return (
            <mesh key={`div-x-${i}`} position={[posX, totalH / 2 + 2, 0]}>
              <boxGeometry args={[2, totalH - 4, totalD - 4]} />
              <meshStandardMaterial color={color} roughness={0.35} />
            </mesh>
          );
        })}

      {dividersY > 0 &&
        Array.from({ length: dividersY }).map((_, i) => {
          const posZ = -totalD / 2 + (totalD / (dividersY + 1)) * (i + 1);
          return (
            <mesh key={`div-y-${i}`} position={[0, totalH / 2 + 2, posZ]}>
              <boxGeometry args={[totalW - 4, totalH - 4, 2]} />
              <meshStandardMaterial color={color} roughness={0.35} />
            </mesh>
          );
        })}
    </group>
  );
}

export default function GridfinityGen() {
  const [tab, setTab] = useState<Tab>("dimensi");
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [heightU, setHeightU] = useState(3);
  const [dividersX, setDividersX] = useState(1);
  const [dividersY, setDividersY] = useState(0);
  const [color, setColor] = useState("#0284c7");
  const [magnetHoles, setMagnetHoles] = useState("ya");
  const toast = useToast();

  // Price estimation: Base price + volume
  const volumeFactor = cols * rows * heightU;
  const price = 25000 + volumeFactor * 2500 + (dividersX + dividersY) * 3000;

  const handleOrder = () => {
    saveDraft("gridfinity", [{ cols, rows, heightU, dividersX, dividersY, color, magnetHoles, price }]);
    const text =
      `Halo Aureate Craft, saya ingin memesan Gridfinity Bin Custom:\n` +
      `• Ukuran Bin: ${cols}x${rows} Grid (${cols * 42} × ${rows * 42} mm)\n` +
      `• Tinggi Bin: ${heightU}U (${heightU * 7} mm)\n` +
      `• Sekat Kompartemen: ${dividersX} Sekat X, ${dividersY} Sekat Y\n` +
      `• Opsi Magnet Dasar: ${magnetHoles === "ya" ? "Ya (Slot Magnet 6x2mm)" : "Tanpa Magnet (Solid)"}\n` +
      `• Pilihan Warna: ${color}\n` +
      `• Total Estimasi: Rp ${price.toLocaleString("id-ID")}\n` +
      `Mohon info ketersediaan slot produksi.`;
    openWhatsAppOrder(text);
    toast.show("Membuka WhatsApp Admin...");
  };

  return (
    <GeneratorShell
      title="Organizer Gridfinity Custom"
      subtitle="Atur dimensi baris, kolom, dan sekat bin modular standar Gridfinity (42mm grid)."
      teaser="Kompatibel dengan ekosistem Gridfinity Zack Freedman."
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      toast={toast.msg}
      stage={
        <div className="viewport">
          <Viewport>
            <Gridfinity3DScene
              cols={cols}
              rows={rows}
              heightU={heightU}
              dividersX={dividersX}
              dividersY={dividersY}
              color={color}
            />
          </Viewport>
          <div className="vp-hint">Putar 360° untuk melihat kompartemen</div>
          <div className="vp-size">
            <b>{cols * 42} × {rows * 42} × {heightU * 7} mm</b>
            <small>{cols}×{rows}×{heightU}U</small>
          </div>
        </div>
      }
      panel={
        <>
          {tab === "dimensi" && (
            <>
              <Slider
                label="Lebar Kolom (X Grid)"
                value={cols}
                min={1}
                max={5}
                step={1}
                onChange={setCols}
              />
              <Slider
                label="Panjang Baris (Y Grid)"
                value={rows}
                min={1}
                max={5}
                step={1}
                onChange={setRows}
              />
              <Slider
                label="Tinggi Bin (U / 7mm per U)"
                value={heightU}
                min={2}
                max={6}
                step={1}
                onChange={setHeightU}
              />
              <Field label="Lubang Magnet di Dasar (6x2mm)">
                <Segmented
                  options={[
                    { value: "ya", label: "Ya (Opsi Magnet)" },
                    { value: "tidak", label: "Polos (Solid)" },
                  ]}
                  value={magnetHoles}
                  onChange={setMagnetHoles}
                />
              </Field>
            </>
          )}

          {tab === "sekat" && (
            <>
              <Slider
                label="Jumlah Sekat Horisontal (X)"
                value={dividersX}
                min={0}
                max={4}
                step={1}
                onChange={setDividersX}
              />
              <Slider
                label="Jumlah Sekat Vertikal (Y)"
                value={dividersY}
                min={0}
                max={4}
                step={1}
                onChange={setDividersY}
              />
              <p className="input-hint" style={{ marginTop: "10px" }}>
                Sekat membagi ruang kompartemen menjadi beberapa sekat kecil untuk menaruh baut, komponen elektronik, atau alat tulis.
              </p>
            </>
          )}

          {tab === "warna" && (
            <Field label="Pilih Warna Filamen">
              <ColorSelect value={color} onChange={setColor} />
            </Field>
          )}
        </>
      }
      foot={
        <>
          <PriceBox
            price={price}
            note="Harga termasuk material PLA+ kokoh presisi tinggi"
          />
          <div className="gen-order-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <button
              id="btn-save-order"
              type="button"
              className="btn btn-primary btn-block btn-glow"
              onClick={handleOrder}
            >
              Pesan Gridfinity via WhatsApp →
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                const ok = saveDraft("gridfinity", [{ cols, rows, heightU, dividersX, dividersY, color, magnetHoles, price }]);
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
