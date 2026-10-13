"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ProcessStep = {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  tags: string[];
  image: string;
  imageAlt: string;
  panelHeader: string;
  panelStatus: string;
  metrics: { label: string; val: string }[];
  highlight: string;
};

const PROCESS_STEPS: ProcessStep[] = [
  {
    num: "01",
    title: "Bahan Filamen Berkualitas Tinggi",
    subtitle: "Material Ramah Lingkungan & Presisi Tinggi",
    desc: "Kami menggunakan filamen premium PLA+ dan PETG food-grade bio-polymer dengan toleransi diameter ketat 0.02mm. Setiap gulungan filamen dikeringkan dalam dryer sebelum dicetak untuk memastikan lapisan padat, halus, dan warna pekat.",
    tags: ["🌱 Bio-Polymer PLA+", "🎯 Toleransi ±0.02mm", "🔥 Suhu Nozzle 215°C", "✨ Bebas Stringing"],
    image: "/images/step-01-filament.jpg",
    imageAlt: "Spool filamen premium 3D printer PLA+ warna Azure Blue, Pearl White, dan Coral Sakura",
    panelHeader: "filament-extrusion-specs.sys",
    panelStatus: "🟢 Hotend Ready: 215°C",
    metrics: [
      { label: "Nozzle Temp", val: "215°C Stable" },
      { label: "Diameter", val: "1.75 ± 0.02mm" },
      { label: "Flow Rate", val: "24 mm³/s High-Flow" },
      { label: "Bed Temp", val: "60°C Textured" },
    ],
    highlight: "Kualitas cetak ditentukan dari kemurnian filamen primer.",
  },
  {
    num: "02",
    title: "Presisi Toleransi Sub-Milimeter",
    subtitle: "Kalibrasi Mesin CoreXY Berkecepatan Tinggi",
    desc: "Dikalibrasi khusus dengan toleransi snap-fit 0.15mm untuk housing switch keyboard mekanikal (Outemu, Gateron, Cherry MX). Keycap dan switch terpasang pas, kokoh, dan tidak goyang tanpa perlu menggunakan lem.",
    tags: ["🧩 Snap-Fit 0.15mm", "📏 Layer Height 0.16mm", "⚡ CoreXY 250mm/s", "🔒 Kuat Tanpa Lem"],
    image: "/images/step-02-precision.jpg",
    imageAlt: "Proses cetak presisi hotend CoreXY dengan infill gyroid sub-milimeter anti-retak",
    panelHeader: "slicer-engine-preview.gcode",
    panelStatus: "⚙️ CoreXY 250mm/s Active",
    metrics: [
      { label: "Layer Height", val: "0.16 mm Optimal" },
      { label: "Infill Pattern", val: "Gyroid 25% Anti-Retak" },
      { label: "Snap-Fit", val: "0.15 mm Toleransi" },
      { label: "Auto-Bed", val: "36 Mesh Points" },
    ],
    highlight: "Toleransi diukur hingga 0.01mm untuk feel klik terbaik.",
  },
  {
    num: "03",
    title: "Personalisasi Penuh & Pratinjau 3D",
    subtitle: "Kustomisasi Bebas Langsung dari Layar Browser",
    desc: "Gunakan 9 generator online kami untuk mengetik nama, memilih warna tombol, menyusun modul clicker, atau mengunggah gambar. Pratinjau 3D real-time interaktif memastikan bentuk sudah sempurna sebelum proses cetak.",
    tags: ["🌐 9 Generator 3D", "🎨 Multi-Color AMS", "📱 Preview di HP/PC", "📦 Tanpa Minimum Order"],
    image: "/images/step-03-customization.jpg",
    imageAlt: "Pratinjau interaktif 3D CAD di browser untuk kustomisasi modular fidget clicker",
    panelHeader: "aureate-3d-generator.app",
    panelStatus: "✦ Realtime WebGL Canvas",
    metrics: [
      { label: "Input Kustom", val: "Huruf, Angka & Logo" },
      { label: "Stem Profile", val: "MX Stem Universal" },
      { label: "Sistem Warna", val: "Multi-Material Auto" },
      { label: "Preview", val: "360° Realtime 60FPS" },
    ],
    highlight: "Tanpa software CAD rumit, siapa saja bisa mendesain.",
  },
  {
    num: "04",
    title: "Siap Dipakai, Dipajang & Bergaransi",
    subtitle: "Finishing Rapi dengan Aksesoris Lengkap",
    desc: "Setiap pesanan melewati 3 tahap quality control: tes klik switch mekanikal, uji toleransi, dan pembersihan support. Dilengkapi ring carabiner metal anti-karat, pouch rapi, serta garansi ganti baru 100% jika cacat.",
    tags: ["🛡️ Garansi 100% Ganti Baru", "🔘 Switch Mekanikal Asli", "🔗 Ring Carabiner Metal", "🎁 Pouch Siap Jual"],
    image: "/images/step-04-finished.jpg",
    imageAlt: "Produk jadi clicker mekanikal gantungan kunci dengan carabiner stainless steel dan pouch kemasan",
    panelHeader: "quality-dispatch-inspection.log",
    panelStatus: "✅ 100% QC Passed & Ready",
    metrics: [
      { label: "Switch Click", val: "10/10 Tactile Normal" },
      { label: "Hardware Ring", val: "Stainless Carabiner" },
      { label: "Packaging", val: "Pouch Klip Ziplock" },
      { label: "Garansi", val: "100% Bebas Cacat" },
    ],
    highlight: "Produk tiba di tangan Anda dalam kondisi sempurna dan siap pakai.",
  },
];

export default function GsapProcessStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      const section = sectionRef.current;
      if (!cards.length || !section) return;

      const isMobile = window.innerWidth < 1024;
      const initialOffscreenY = Math.max(1100, window.innerHeight * 1.3);

      // Set initial positions matching section-3.blade.php:
      // Card 0 at y: 0, scale: 1
      // Cards 1..N at y: initialOffscreenY, scale: 1
      cards.forEach((card, i) => {
        if (i !== 0) {
          gsap.set(card, { opacity: 1, y: initialOffscreenY, scale: 1 });
        } else {
          gsap.set(card, { opacity: 1, y: 0, scale: 1 });
        }
      });

      // Pinned scrub timeline matching section-3.blade.php
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "bottom bottom",
          end: "+=1600",
          scrub: 1.5,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const cardAnimDuration = 0.4;

      for (let i = 1; i < cards.length; i++) {
        // Bring current card into front view at y: 0
        tl.to(cards[i], {
          y: 0,
          x: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          ease: "power3.out",
          duration: cardAnimDuration,
        });

        // Concurrently push down & scale down previous cards so their bottom borders peek out
        for (let j = 0; j < i; j++) {
          tl.to(
            cards[j],
            {
              y: isMobile ? -20 * (i - j) : 20 * (i - j),
              scale: 1 - 0.04 * (i - j),
              ease: "power3.out",
              duration: cardAnimDuration,
            },
            "<"
          );
        }
      }

      // Brief linger on the fully stacked 4th card before unpinning
      tl.to({}, { duration: 0.15 });
    }, sectionRef);

    const t1 = setTimeout(() => ScrollTrigger.refresh(), 200);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 800);

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    <section className="gsap-stack-section scroll-section" ref={sectionRef} id="alur-proses">
      <div className="stack-section-inner">
        <div className="section-header stack-header">
          <span className="section-eyebrow">✦ BAGAIMANA INI BEKERJA</span>
          <h2 className="section-title">Dari Garis Filamen ke Produk Fisik</h2>
          <p className="section-desc">
            Scroll ke bawah untuk melihat 4 tahapan bagaimana ide digital Anda kami wujudkan menjadi produk presisi nyata.
          </p>
        </div>

        {/* Absolute Stacking Deck Stage */}
        <div className="cards-deck-stage">
          {PROCESS_STEPS.map((step, idx) => (
            <div
              key={step.num}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="process-card-box"
              style={{
                zIndex: idx + 1,
              }}
            >
              {/* Card Content Grid */}
              <div className="stack-card-inner">
                {/* Left Column: Number, Title, Description, Tags */}
                <div className="stack-card-left">
                  <div className="stack-num-row">
                    <span className="stack-card-num">{step.num}</span>
                    <span className="stack-card-badge">{step.subtitle}</span>
                  </div>

                  <h3 className="stack-card-title">{step.title}</h3>
                  <p className="stack-card-desc">{step.desc}</p>

                  <div className="stack-card-tags">
                    {step.tags.map((t, i) => (
                      <span key={i} className="stack-tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="stack-card-highlight">
                    <span className="highlight-sparkle">✦</span>
                    <span>{step.highlight}</span>
                  </div>
                </div>

                {/* Right Column: 3D Visual Showcase Panel with Telemetry */}
                <div className="stack-card-right">
                  <div className="stack-panel-box">
                    {/* Header */}
                    <div className="panel-box-header">
                      <div className="panel-dots">
                        <span className="panel-dot red" />
                        <span className="panel-dot yellow" />
                        <span className="panel-dot green" />
                        <span className="panel-filename">{step.panelHeader}</span>
                      </div>
                      <span className="panel-status-pill">{step.panelStatus}</span>
                    </div>

                    {/* High-Resolution 3D Render Image */}
                    <div className="panel-3d-image-wrap">
                      <Image
                        src={step.image}
                        alt={step.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 460px"
                        className="panel-3d-img"
                        priority={idx === 0}
                      />
                      <div className="panel-image-shimmer" />
                    </div>

                    {/* Compact Telemetry Chips & Step Progress */}
                    <div className="panel-telemetry-strip">
                      <div className="telemetry-chip-list">
                        {step.metrics.slice(0, 2).map((m, i) => (
                          <div key={i} className="telemetry-chip">
                            <span className="t-label">{m.label}:</span>
                            <span className="t-val">{m.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="panel-progress-mini">
                        <div className="mini-track">
                          <div
                            className="mini-bar"
                            style={{ width: `${(idx + 1) * 25}%` }}
                          />
                        </div>
                        <span className="mini-step-text">0{idx + 1}/04</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
