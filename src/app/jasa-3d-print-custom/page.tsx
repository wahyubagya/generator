"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Jasa3DPrintCustomPage() {
  const [estimatedWeight, setEstimatedWeight] = useState<number>(50);
  const [material, setMaterial] = useState<string>("pla");
  const [infill, setInfill] = useState<number>(20);

  const materialRates: Record<
    string,
    {
      name: string;
      pricePerGram: number;
      desc: string;
      tag: string;
      badgeColor: string;
      icon: string;
      features: string;
    }
  > = {
    pla: {
      name: "PLA+ Premium",
      pricePerGram: 1200,
      tag: "⭐ Terpopuler",
      badgeColor: "#0284c7",
      icon: "🌱",
      features: "Presisi Tinggi · Bio-Polymer",
      desc: "Paling populer untuk fidget clicker, keycap nama, pajangan, dan prototype. Ramah lingkungan, hasil cetak halus, dan warna pekat.",
    },
    petg: {
      name: "PETG Industrial",
      pricePerGram: 1600,
      tag: "🛡️ Tahan Panas",
      badgeColor: "#d97706",
      icon: "⚡",
      features: "Tahan Panas 75°C · Tahan Air",
      desc: "Tahan panas dan air, lebih lentur dan liat, cocok untuk part mekanikal, wadah cairan, dan bracket fungsional.",
    },
    tpu: {
      name: "TPU Flexible 95A",
      pricePerGram: 2200,
      tag: "🌀 Karet Elastis",
      badgeColor: "#8b5cf6",
      icon: "〰️",
      features: "Shockproof · Anti-Pecah",
      desc: "Karet fleksibel anti-pecah, tahan benturan keras, ideal untuk casing gadget, peredam getaran (damper), dan seal/gasket.",
    },
    abs: {
      name: "ABS / ASA Tough",
      pricePerGram: 1800,
      tag: "☀️ Outdoor Grade",
      badgeColor: "#059669",
      icon: "🔥",
      features: "Tahan 90°C · Anti-UV",
      desc: "Tahan panas tinggi & paparan sinar matahari langsung, permukaan mudah dihaluskan (sanding), cocok untuk part otomotif & outdoor.",
    },
  };

  const selectedRate = materialRates[material];
  const calculatedCost = Math.max(25000, Math.round(estimatedWeight * selectedRate.pricePerGram));
  const estimatedPrintHours = Math.max(0.5, (estimatedWeight / 24)).toFixed(1);

  return (
    <div className="custom-service-page">
      {/* Header */}
      <header className="page-hero">
        <span className="section-eyebrow">✦ LAYANAN FABRIKASI DIGITAL</span>
        <h1 className="section-title">Jasa 3D Print Custom Dari Ide Sampai Jadi</h1>
        <p className="section-desc">
          Punya ide produk baru, komponen pengganti yang patah, prototype tugas akhir, atau merchandise khusus?
          Kami siap merealisasikannya dengan mesin 3D printer berkecepatan tinggi dan bahan berkualitas industri.
        </p>

        <div className="hero-cta-group" style={{ justifyContent: "center", marginTop: "24px" }}>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20punya%20file%203D%20ingin%20minta%20estimasi%20cetak"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-lg btn-glow"
          >
            Konsultasi File ke WhatsApp →
          </a>
          <Link href="/generator" className="btn-secondary btn-lg">
            Atau Gunakan Generator Online
          </Link>
        </div>
      </header>

      {/* Two Paths */}
      <section className="two-paths-section">
        <div className="path-card">
          <span className="path-badge">JALUR 1 · DESAIN ONLINE</span>
          <h3>Gunakan Generator Aureate Craft</h3>
          <p>
            Tidak punya file 3D dan tidak bisa software CAD? Cukup gunakan 9 generator kami. Ketik nama, susun modul,
            atau unggah gambar untuk melihat model 3D otomatis.
          </p>
          <Link href="/generator" className="btn-secondary btn-sm" style={{ marginTop: "auto" }}>
            Buka Katalog Generator →
          </Link>
        </div>

        <div className="path-card highlight">
          <span className="path-badge">JALUR 2 · PUNYA FILE SENDIRI</span>
          <h3>Kirim File STL / CAD Anda</h3>
          <p>
            Sudah punya file siap cetak dari Thingiverse, Printables, MakerWorld, atau hasil desain Blender/Fusion 360?
            Kirimkan kepada kami untuk evaluasi slicing dan penawaran instan.
          </p>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20ingin%20mengirimkan%20file%20STL"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm btn-glow"
            style={{ marginTop: "auto" }}
          >
            Kirim File ke Admin →
          </a>
        </div>
      </section>

      {/* Estimasi Biaya Cepat */}
      <section className="calculator-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ SIMULASI HARGA</span>
          <h2 className="section-title">Kalkulator Estimasi Biaya Cetak</h2>
          <p className="section-desc">
            Hitung perkiraan biaya cetak berdasarkan perkiraan berat filamen dan jenis material yang dipilih.
          </p>
        </div>

        <div className="calc-card">
          {/* Left Column: Interactive Inputs */}
          <div className="calc-inputs">
            {/* 1. Material Selector */}
            <div className="input-group">
              <div className="group-title-row">
                <label className="group-label">Pilihan Material Filamen:</label>
                <span className="group-tip">Pilih karakteristik bahan sesuai kebutuhan</span>
              </div>
              <div className="material-options">
                {Object.entries(materialRates).map(([key, item]) => {
                  const isSelected = material === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`mat-card-btn ${isSelected ? "active" : ""}`}
                      onClick={() => setMaterial(key)}
                    >
                      <div className="mat-card-header">
                        <div className="mat-badge-wrap">
                          <span className="mat-icon">{item.icon}</span>
                          <span
                            className="mat-pill"
                            style={{
                              color: item.badgeColor,
                              backgroundColor: `${item.badgeColor}15`,
                              borderColor: `${item.badgeColor}40`,
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <span className={`mat-check-bubble ${isSelected ? "checked" : ""}`}>
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>

                      <div className="mat-card-body">
                        <div className="mat-name-row">
                          <span className="mat-name">{item.name}</span>
                          <span className="mat-rate">
                            Rp {item.pricePerGram.toLocaleString("id-ID")}
                            <small>/g</small>
                          </span>
                        </div>
                        <span className="mat-feature-line">{item.features}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Material Description Callout */}
              <div className="material-active-desc">
                <span className="desc-icon">ℹ️</span>
                <span>{selectedRate.desc}</span>
              </div>
            </div>

            {/* 2. Weight Slider & Presets */}
            <div className="slider-control-card">
              <div className="slider-label-row">
                <div className="slider-label-group">
                  <span className="slider-title-icon">⚖️</span>
                  <label>Perkiraan Berat Objek:</label>
                </div>
                <div className="slider-val-badge">
                  <span className="val-number">{estimatedWeight}</span>
                  <span className="val-unit">Gram</span>
                </div>
              </div>

              <div className="range-track-container">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(Number(e.target.value))}
                  className="modern-range-slider"
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0ea5e9 ${((estimatedWeight - 10) / (500 - 10)) * 100}%, #e2e8f0 ${((estimatedWeight - 10) / (500 - 10)) * 100}%, #e2e8f0 100%)`,
                  }}
                />
              </div>

              {/* Quick Weight Presets */}
              <div className="slider-quick-presets">
                <span className="presets-caption">Preset Cepat:</span>
                {[
                  { label: "15g (Keycap/Clicker)", val: 15 },
                  { label: "50g (Pajangan Kecil)", val: 50 },
                  { label: "120g (Desk Organizer)", val: 120 },
                  { label: "250g (Komponen Besar)", val: 250 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    className={`preset-chip ${estimatedWeight === p.val ? "active" : ""}`}
                    onClick={() => setEstimatedWeight(p.val)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Infill Density Slider & Presets */}
            <div className="slider-control-card">
              <div className="slider-label-row">
                <div className="slider-label-group">
                  <span className="slider-title-icon">🕸️</span>
                  <label>Infill Density (Kepadatan Dalam):</label>
                </div>
                <div className="slider-val-badge">
                  <span className="val-number">{infill}%</span>
                  <span className="val-unit">
                    {infill <= 20 ? "Gyroid" : infill <= 40 ? "Grid" : "Dense"}
                  </span>
                </div>
              </div>

              <div className="range-track-container">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={infill}
                  onChange={(e) => setInfill(Number(e.target.value))}
                  className="modern-range-slider"
                  style={{
                    background: `linear-gradient(to right, #0284c7 0%, #0ea5e9 ${((infill - 10) / (100 - 10)) * 100}%, #e2e8f0 ${((infill - 10) / (100 - 10)) * 100}%, #e2e8f0 100%)`,
                  }}
                />
              </div>

              {/* Quick Infill Presets */}
              <div className="slider-quick-presets">
                <span className="presets-caption">Rekomendasi:</span>
                {[
                  { label: "15% (Display Ringan)", val: 15 },
                  { label: "20% (Clicker Standar)", val: 20 },
                  { label: "40% (Kuat/Beban)", val: 40 },
                  { label: "100% (Solid Padat)", val: 100 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    className={`preset-chip ${infill === p.val ? "active" : ""}`}
                    onClick={() => setInfill(p.val)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Slicing Specification & Live Breakdown */}
          <div className="calc-result-panel">
            {/* Live Indicator Bar */}
            <div className="result-header-bar">
              <div className="result-live-indicator">
                <span className="live-ping-dot" />
                <span>Simulasi Realtime</span>
              </div>
              <span className="result-engine-pill">Orca / Bambu Slicer</span>
            </div>

            {/* Big Glowing Price Display */}
            <div className="result-price-box">
              <span className="result-sub-title">Perkiraan Biaya Cetak</span>
              <div className="price-main-row">
                <span className="currency-prefix">Rp</span>
                <span className="price-digits">{calculatedCost.toLocaleString("id-ID")}</span>
              </div>
              {calculatedCost === 25000 && estimatedWeight * selectedRate.pricePerGram < 25000 && (
                <span className="min-order-pill">Minimum order Rp 25.000 berlaku</span>
              )}
            </div>

            {/* Slicing Specifications Table */}
            <div className="slicing-breakdown-card">
              <div className="breakdown-item">
                <span className="b-label">Material Terpilih</span>
                <span className="b-val">{selectedRate.name}</span>
              </div>
              <div className="breakdown-item">
                <span className="b-label">Kalkulasi Berat</span>
                <span className="b-val">{estimatedWeight}g × Rp {selectedRate.pricePerGram.toLocaleString("id-ID")}/g</span>
              </div>
              <div className="breakdown-item">
                <span className="b-label">Struktur Infill</span>
                <span className="b-val">{infill}% Anti-Retak (Gyroid)</span>
              </div>
              <div className="breakdown-item">
                <span className="b-label">Estimasi Cetak</span>
                <span className="b-val highlight">~{estimatedPrintHours} Jam (CoreXY)</span>
              </div>
              <div className="breakdown-item">
                <span className="b-label">Quality Check & QC</span>
                <span className="b-val green-free">GRATIS (Termasuk)</span>
              </div>
            </div>

            {/* Note Callout */}
            <div className="result-disclaimer-pill">
              <span className="disc-icon">💡</span>
              <span>
                Harga final dihitung akurat dari berat gram software slicing (Bambu Studio / OrcaSlicer) setelah memperhitungkan support.
              </span>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                `Halo Aureate Craft, saya ingin estimasi cetak 3D dengan detail:\n` +
                `• Material: ${selectedRate.name}\n` +
                `• Estimasi Berat: ${estimatedWeight} Gram\n` +
                `• Infill Density: ${infill}%\n` +
                `• Estimasi Biaya: Rp ${calculatedCost.toLocaleString("id-ID")}\n` +
                `Mohon informasi slot pengerjaan dan review file STL saya.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-lg btn-wa-order"
            >
              <svg className="wa-svg-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.179.182-.077.357.101.174.451.744.969 1.205.666.593 1.229.777 1.403.864.173.087.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.144.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.043.072.043.419-.101.824z" />
              </svg>
              <span>Order Estimasi Ini via WA →</span>
            </a>
          </div>
        </div>
      </section>

      {/* Alur Pengerjaan 4 Tahap */}
      <section className="workflow-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ STANDAR KUALITAS KAMI</span>
          <h2 className="section-title">4 Tahap Proses Dari File ke Tangan Anda</h2>
          <p className="section-desc">
            Standar fabrikasi presisi tanpa kompromi untuk memastikan setiap cetakan rapi, kuat, dan pas saat dirakit.
          </p>
        </div>

        <div className="workflow-cards-grid">
          {[
            {
              num: "01",
              badge: "TAHAP 01",
              title: "Pengecekan File & Slicing",
              desc: "Pemeriksaan integritas mesh 3D, orientasi cetak terkuat, kalkulasi support minimal, dan toleransi drat baut.",
              image: "/images/step-03-customization.jpg",
              imageAlt: "Pengecekan file STL dan slicing 3D",
              tags: ["Mesh Repair STL", "Minim Support", "Toleransi 0.15mm"],
              icon: "🔍",
              status: "Slicer Ready",
            },
            {
              num: "02",
              badge: "TAHAP 02",
              title: "Pilihan Warna & Setup Bed",
              desc: "Filamen dikeringkan dalam dehumidifier dryer sebelum cetak untuk mencegah stringing dan memastikan lapisan rekat.",
              image: "/images/step-01-filament.jpg",
              imageAlt: "Persiapan filamen dan setup bed cetak",
              tags: ["Dryer Dehumidifier", "Textured PEI Plate", "Anti-Stringing"],
              icon: "🎨",
              status: "Bed Calibrated",
            },
            {
              num: "03",
              badge: "TAHAP 03",
              title: "Pencetakan Presisi Tinggi",
              desc: "Dicetak dengan mesin CoreXY berkecepatan tinggi dengan auto-bed 36 mesh points dan nozzle hardened steel.",
              image: "/images/step-02-precision.jpg",
              imageAlt: "Proses cetak 3D CoreXY presisi tinggi",
              tags: ["CoreXY s.d 500mm/s", "Hardened Nozzle", "36 Mesh Points"],
              icon: "⚡",
              status: "High-Speed Print",
            },
            {
              num: "04",
              badge: "TAHAP 04",
              title: "QC & Packaging Aman",
              desc: "Pembersihan sisa support, uji klik dan dimensi dengan mikrometer, serta pengemasan ziplock pouch dan bubble wrap.",
              image: "/images/step-04-finished.jpg",
              imageAlt: "QC mikrometer dan packaging aman",
              tags: ["Mikrometer Test", "Pouch Ziplock Rapi", "Garansi 100% Tukar"],
              icon: "🛡️",
              status: "100% QC Passed",
            },
          ].map((step, idx) => (
            <div key={step.num} className="workflow-step-card">
              {/* Card Image Banner */}
              <div className="wf-image-banner">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="wf-banner-img"
                />
                <div className="wf-banner-overlay" />
                <div className="wf-badge-floating">
                  <span className="wf-step-num">{step.num}</span>
                  <span className="wf-step-badge">{step.badge}</span>
                </div>
                <div className="wf-status-floating">
                  <span className="wf-dot" />
                  <span>{step.status}</span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="wf-card-body">
                <div className="wf-title-row">
                  <span className="wf-icon">{step.icon}</span>
                  <h3 className="wf-title">{step.title}</h3>
                </div>

                <p className="wf-desc">{step.desc}</p>

                {/* Feature Tags */}
                <div className="wf-tag-list">
                  {step.tags.map((t, i) => (
                    <span key={i} className="wf-tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Progress Accent */}
              <div className="wf-bottom-progress">
                <div
                  className="wf-progress-fill"
                  style={{ width: `${(idx + 1) * 25}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
