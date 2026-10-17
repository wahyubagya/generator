"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, Product } from "@/lib/products";
import Hero3DShowcase from "@/components/Hero3DShowcase";
import GsapProcessStack from "@/components/GsapProcessStack";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    { id: "all", label: "Semua Generator" },
    { id: "clicker", label: "Fidget Clicker" },
    { id: "keychain", label: "Gantungan & Klip" },
    { id: "accessories", label: "Aksesori" },
  ];

  const filteredProducts =
    activeCategory === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const faqs = [
    {
      q: "Apakah saya harus bisa 3D modeling atau software CAD?",
      a: "Sama sekali tidak! Semua generator kami dirancang agar siapapun bisa mendesain produk 3D custom cukup dari browser. Anda tinggal mengetik teks nama, memilih warna, atau mengunggah gambar/logo. Sistem akan otomatis membuat model 3D-nya untuk Anda.",
    },
    {
      q: "Apakah ada batas minimum pemesanan (MOQ)?",
      a: "Tidak ada minimum order. Anda bisa memesan mulai dari 1 pcs satuan untuk hadiah pribadi atau diri sendiri, maupun dalam jumlah ratusan untuk merchandise event dan reseller.",
    },
    {
      q: "Switch jenis apa yang digunakan pada gantungan clicker?",
      a: "Kami menggunakan switch mekanikal keyboard standar (Outemu / Gateron Blue clicky, Red linear, atau Brown tactile). Switch dapat ditekan dengan sensasi tactile yang sangat memuaskan untuk meredakan stres (fidget toy).",
    },
    {
      q: "Berapa lama estimasi proses pembuatan dan pengiriman?",
      a: "Proses cetak 3D untuk pesanan satuan biasanya selesai dalam 1-2 hari kerja setelah desain disetujui. Untuk pesanan dalam jumlah besar (paket usaha / souvenir), waktu pengerjaan disesuaikan dengan kuantiti (estimasi 3-5 hari kerja).",
    },
    {
      q: "Bahan filamen apa yang digunakan?",
      a: "Kami menggunakan filamen premium PLA+ dan PETG ramah lingkungan berkualitas tinggi yang kokoh, memiliki akurasi dimensi tinggi, serta warna cerah matte dan silk yang tahan lama.",
    },
  ];

  return (
    <div className="home-container">
      {/* ------------------------------------------------ HERO SECTION ------------------------------------------------ */}
      <section className="els-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-tag">01 · BAHAN</span>
            <span className="badge-sep">/</span>
            <span className="badge-text">Additive Objects · Indonesia</span>
          </div>

          <h1 className="hero-heading">
            Semuanya dimulai <br />
            dari <span className="highlight-text">Sebuah garis.</span>
          </h1>

          <p className="hero-subtext">
            Satu garis filamen. Berjuta kemungkinan.
            <br />
            Bikin clicker dan hadiah custom dari gambarmu dengan preview 3D langsung di browser.
          </p>

          <div className="hero-cta-group">
            <Link
              href="/character-clicker"
              className="btn-primary btn-lg btn-glow"
              id="cta-bikin-clicker"
            >
              Bikin Clicker Sekarang →
            </Link>
            <Link
              href="/generator"
              className="btn-secondary btn-lg"
              id="cta-jelajah-generator"
            >
              Jelajahi Semua Generator
            </Link>
          </div>

          {/* Features checkmark pills */}
          <div className="hero-perks">
            <div className="perk-item">
              <span className="perk-icon">✓</span>
              <span>Preview 3D Interaktif</span>
            </div>
            <div className="perk-item">
              <span className="perk-icon">✓</span>
              <span>Bisa Pesan Satuan (No MOQ)</span>
            </div>
            <div className="perk-item">
              <span className="perk-icon">✓</span>
              <span>Switch Mekanikal Asli</span>
            </div>
          </div>
        </div>

        {/* Visual Hero Showcase Card: Real 3D Interactive WebGL */}
        <div className="hero-visual">
          <Hero3DShowcase />
        </div>

        <div className="hero-scroll-hint">
          <span>SCROLL UNTUK MEMBENTUK</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ------------------------------------------- GSAP PINNED STACKING PROCESS SECTION ------------------------------------------- */}
      <GsapProcessStack />

      {/* ----------------------------------------- ETALASE 9 GENERATOR 3D ----------------------------------------- */}
      <section className="catalog-showcase-section" id="katalog-generator">
        <div className="section-header">
          <span className="section-eyebrow">✦ KATALOG ALAT DESAIN</span>
          <h2 className="section-title">Pilih Generator 3D Pilihanmu</h2>
          <p className="section-desc">
            Atur desain langsung dari layar HP atau laptop Anda. Putar, zoom, dan uji kombinasi warna sebelum memesan.
          </p>

          {/* Filter Category Chips */}
          <div className="filter-chips">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`filter-chip ${activeCategory === c.id ? "active" : ""}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`generator-cards-grid count-${filteredProducts.length}`}>
          {filteredProducts.map((p: Product, idx: number) => {
            const isFeatured = Boolean(p.badge);
            return (
              <div
                key={p.slug}
                className={`generator-card ${isFeatured ? "is-featured" : ""} card-pos-${idx}`}
                id={`gen-card-${p.slug}`}
              >
                {/* Large 3D Showcase Image Stage */}
                <div className="card-image-stage">
                  <Image
                    src={p.image3d}
                    alt={p.title}
                    fill
                    sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw"
                    className="card-3d-showcase-img"
                    priority={idx < 2}
                  />
                  <div className="card-stage-reflection" />
                  
                  {p.badge && (
                    <span className="card-floating-badge">
                      <span className="badge-sparkle">✦</span>
                      <span>{p.badge}</span>
                    </span>
                  )}
                  
                  <span className="card-type-tag">
                    {p.category === "clicker"
                      ? "Fidget Clicker"
                      : p.category === "keychain"
                      ? "Gantungan"
                      : "Aksesori"}
                  </span>
                </div>

                <div className="card-content-wrap">
                  <div className="card-body">
                    <h3 className="card-title">{p.title}</h3>
                    <p className="card-desc">{p.desc}</p>

                    <ul className="card-features">
                      {p.features.slice(0, 3).map((f, i) => (
                        <li key={i}>
                          <span className="feature-check">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-footer">
                    <div className="card-pricing">
                      <span className="price-label">Mulai dari</span>
                      <span className="price-val">{p.startingPrice}</span>
                    </div>
                    <Link
                      href={`/${p.slug}`}
                      className="btn-open-gen"
                      id={`btn-open-${p.slug}`}
                    >
                      <span>Buka Generator 3D</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------- PROMO PAKET USAHA ------------------------------------------- */}
      <section className="business-banner-section">
        <div className="business-banner-inner">
          <div className="business-text">
            <span className="business-eyebrow">UNTUK RESELLER & EVENT MERCHANDISE</span>
            <h2>Ingin Jual Fidget Clicker dengan Brand Sendiri?</h2>
            <p>
              Dapatkan <strong>Paket Usaha Clicker Modular</strong> lengkap dengan base modul, switch mekanikal,
              alfabet A-Z siap rangkai, ring carabiner, dan pouch kemasan eksklusif dengan harga grosir.
            </p>
            <div className="business-actions">
              <Link href="/paket-usaha" className="btn-primary btn-lg">
                Pelajari Paket Usaha →
              </Link>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20tertarik%20dengan%20informasi%20Paket%20Usaha%20Clicker"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-lg"
              >
                Konsultasi WhatsApp
              </a>
            </div>
          </div>
          <div className="business-badge-card">
            <div className="business-stat">
              <div className="stat-icon-wrapper">
                <Image
                  src="/images/3d-clicker-colors.jpg"
                  alt="3D Fidget Clicker Modular"
                  className="stat-3d-img"
                  width={68}
                  height={68}
                />
              </div>
              <div className="stat-info">
                <span className="stat-number">100+</span>
                <span className="stat-text">Kombinasi Warna & Huruf</span>
              </div>
            </div>
            <div className="business-stat">
              <div className="stat-icon-wrapper">
                <Image
                  src="/images/3d-growth-rocket.jpg"
                  alt="3D Margin Tinggi & Viral"
                  className="stat-3d-img"
                  width={68}
                  height={68}
                />
              </div>
              <div className="stat-info">
                <span className="stat-number">Margin Tinggi</span>
                <span className="stat-text">Produk Unik & Viral di Sosmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------ KEUNGGULAN STUDIO ------------------------------------------ */}
      <section className="why-us-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ KENAPA AUREATE CRAFT</span>
          <h2 className="section-title">Bikin Produk 3D Semudah Belanja Online</h2>
          <p className="section-desc">
            Dari pemilihan bahan hingga pengiriman, nikmati pengalaman memesan produk 3D custom yang mudah, transparan, dan bergaransi.
          </p>
        </div>

        <div className="why-grid">
          {/* Card 1: 3D Realtime */}
          <div className="why-item">
            <div className="why-item-top">
              <div className="why-icon-box blue">🚀</div>
              <span className="why-badge">360° Realtime</span>
            </div>
            <h4>Pratinjau 3D Interaktif</h4>
            <p>
              Tidak perlu menebak wujud aslinya. Putar objek 360°, ubah warna tiap bagian, dan uji kecocokan switch mekanikal langsung dari browser.
            </p>
            <div className="why-card-footer">
              <span className="why-pill-tag">✨ WebGL 60 FPS</span>
              <span className="why-pill-tag">📱 PC & HP Ready</span>
            </div>
          </div>

          {/* Card 2: No MOQ */}
          <div className="why-item">
            <div className="why-item-top">
              <div className="why-icon-box orange">🎯</div>
              <span className="why-badge badge-orange">Mulai 1 Pcs</span>
            </div>
            <h4>Tanpa Minimum Order (No MOQ)</h4>
            <p>
              Bebas pesan mulai dari 1 buah gantungan kunci untuk hadiah pribadi, hingga ratusan pcs untuk souvenir event & merchandise komunitas.
            </p>
            <div className="why-card-footer">
              <span className="why-pill-tag">🎁 Hadiah Satuan</span>
              <span className="why-pill-tag">📦 Grosir & Reseller</span>
            </div>
          </div>

          {/* Card 3: Color Palette */}
          <div className="why-item">
            <div className="why-item-top">
              <div className="why-icon-box purple">🎨</div>
              <span className="why-badge badge-purple">12+ Warna Filamen</span>
            </div>
            <h4>Palet Warna & Finishing Beragam</h4>
            <p>
              Tersedia warna pastel matte, silk kilau emas, warna cerah vibrant, hingga filamen glow-in-the-dark yang menyala di kegelapan.
            </p>
            <div className="why-color-swatches">
              <span className="color-swatch-dot" style={{ background: "#0284c7" }} title="Cyan Blue" />
              <span className="color-swatch-dot" style={{ background: "#f59e0b" }} title="Silk Gold" />
              <span className="color-swatch-dot" style={{ background: "#ef4444" }} title="Coral Red" />
              <span className="color-swatch-dot" style={{ background: "#10b981" }} title="Mint Green" />
              <span className="color-swatch-dot" style={{ background: "#8b5cf6" }} title="Lavender" />
              <span className="color-swatch-dot" style={{ background: "#0f172a" }} title="Matte Black" />
              <span className="swatch-label-more">+ Glow in Dark</span>
            </div>
          </div>

          {/* Card 4: WhatsApp Consultation */}
          <div className="why-item">
            <div className="why-item-top">
              <div className="why-icon-box green">💬</div>
              <span className="why-badge badge-green">🟢 Respon Cepat</span>
            </div>
            <h4>Bantuan & Konsultasi Ramah</h4>
            <p>
              Punya file custom sendiri (.STL, .OBJ, atau logo) atau bingung memilih ukuran? Tim kami siap berdiskusi langsung lewat WhatsApp.
            </p>
            <div className="why-card-footer">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20ingin%20konsultasi%20desain%203D"
                target="_blank"
                rel="noopener noreferrer"
                className="why-wa-link"
              >
                Chat WhatsApp Sekarang →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------- FAQ SECTION --------------------------------------------- */}
      <section className="faq-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ PUSAT BANTUAN</span>
          <h2 className="section-title">Pertanyaan yang Sering Diajukan</h2>
          <p className="section-desc">
            Segala hal yang perlu kamu ketahui tentang proses pemesanan produk di Aureate Craft.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={`faq-card ${isOpen ? "open" : ""}`}
                onClick={() => setOpenFaq(isOpen ? null : index)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                </div>
                {isOpen && <div className="faq-answer"><p>{faq.a}</p></div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------ BOTTOM CALL TO ACTION ------------------------------------------ */}
      <section className="final-cta-section">
        <div className="final-cta-card">
          <span className="final-tag">✦ MULAI SEKARANG</span>
          <h2>Wujudkan Desain 3D Impianmu Hari Ini</h2>
          <p>
            Pilih produk yang kamu sukai, personalisasikan namanya, dan lihat simulasi 3D-nya langsung.
          </p>
          <div className="final-cta-buttons">
            <Link href="/generator" className="btn-primary btn-lg btn-glow">
              Buka Katalog Generator 3D →
            </Link>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20ingin%20konsultasi%20desain%203D"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-lg"
            >
              Tanya-tanya via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
