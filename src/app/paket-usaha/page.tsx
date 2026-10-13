export default function PaketUsahaPage() {
  const tiers = [
    {
      name: "Paket Starter (Pemula)",
      price: "Rp 350.000",
      pcsEstimate: "Bisa buat 15–20 Gantungan Clicker",
      highlight: false,
      desc: "Cocok untuk mencoba jualan di sekolah, kampus, atau teman terdekat.",
      items: [
        "25 pcs Base Modul Clicker (Pilihan 5 Warna)",
        "25 pcs Switch Mekanikal Outemu Blue Clicky",
        "75 pcs Keycap Huruf A-Z & Simbol Emoticon",
        "25 pcs Ring Gantungan Carabiner Premium",
        "25 pcs Pouch Plastik Klip Ziplock Siap Jual",
        "Katalog Foto Produk Bebas Watermark untuk Promosi",
      ],
      ctaText: "Pesan Paket Starter",
    },
    {
      name: "Paket Pro (Reseller Best Seller)",
      price: "Rp 799.000",
      pcsEstimate: "Bisa buat 45–55 Gantungan Clicker",
      highlight: true,
      badge: "Paling Diminati",
      desc: "Pilihan ideal untuk jualan di TikTok Shop, Shopee, car free day, atau bazaar.",
      items: [
        "60 pcs Base Modul Clicker (Pilihan 8 Warna Terlaris)",
        "60 pcs Switch Mekanikal (Campur Blue Clicky & Red Linear)",
        "200 pcs Keycap Huruf A-Z (Distribusi Vokal & Konsonan Pas)",
        "60 pcs Ring Carabiner Warna-Warni",
        "60 pcs Header Card Kemasan Kustom dengan Nama Tokomu",
        "Template Video TikTok & Canva Siap Edit",
        "Prioritas Produksi & Konsultasi Strategi Penjualan",
      ],
      ctaText: "Pesan Paket Pro (Rekomendasi)",
    },
    {
      name: "Paket Distributor (Grosir)",
      price: "Rp 1.850.000",
      pcsEstimate: "Bisa buat 130–150 Gantungan Clicker",
      highlight: false,
      desc: "Kuantitas besar untuk toko aksesoris, souvenir event seminar/wedding, atau distributor daerah.",
      items: [
        "150 pcs Base Modul Clicker (Bebas Request Semua Warna)",
        "150 pcs Switch Mekanikal Original",
        "500 pcs Keycap Lengkap (Huruf, Angka, & Icon Gaming)",
        "150 pcs Ring Carabiner Anti-Karat",
        "150 pcs Box Packaging Eksklusif dengan Logo Brand Sendiri",
        "Gratis 1 Unit Display Akrilik Meja Kasir",
        "Garansi Tukar Komponen Cacat 100%",
      ],
      ctaText: "Hubungi untuk Grosir",
    },
  ];

  return (
    <div className="business-package-page">
      <header className="page-hero">
        <span className="section-eyebrow">✦ PELUANG USAHA MERCHANDISE & RESELLER</span>
        <h1 className="section-title">Paket Usaha Fidget Clicker Modular</h1>
        <p className="section-desc">
          Mulai bisnis produk viral anti-stres tanpa harus membeli mesin 3D printer bernilai jutaan rupiah.
          Kami siapkan komponen modular presisi siap rangkai lengkap dengan switch mekanikal dan kemasan menarik.
        </p>
      </header>

      {/* Keuntungan Paket Usaha */}
      <section className="business-perks-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ KENAPA PRODUK INI LARIS?</span>
          <h2 className="section-title">Produk Viral yang Diminati Gen-Z & Pekerja Kantor</h2>
        </div>

        <div className="why-grid">
          <div className="why-item">
            <div className="why-icon-box">💰</div>
            <h4>Margin Keuntungan 50% - 100%</h4>
            <p>
              Modal per unit hanya berkisar Rp 12.000 – Rp 16.000, sedangkan harga jual pasaran di marketplace dan media sosial berkisar Rp 25.000 – Rp 35.000 per pcs.
            </p>
          </div>

          <div className="why-item">
            <div className="why-icon-box">🧩</div>
            <h4>Mudah Dirangkai Sendiri (Tanpa Lem)</h4>
            <p>
              Semua part menggunakan sistem snap-fit presisi. Anda tinggal memasang switch dan huruf sesuai pesanan nama pembeli dalam hitungan detik.
            </p>
          </div>

          <div className="why-item">
            <div className="why-icon-box">🎁</div>
            <h4>Sangat Cocok untuk Kado & Nama</h4>
            <p>
              Orang suka barang yang ada nama mereka sendiri. Tingkat konversi tinggi karena pembeli bisa memilih warna kesukaan dan susunan inisial.
            </p>
          </div>

          <div className="why-item">
            <div className="why-icon-box">📦</div>
            <h4>Kemasan Rapi Siap Jual</h4>
            <p>
              Sudah termasuk ring gantungan dan pouch kemasan, sehingga produk terlihat profesional dan premium saat diterima pelanggan Anda.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="tiers-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ PILIHAN PAKET</span>
          <h2 className="section-title">Pilih Paket yang Sesuai dengan Target Usahamu</h2>
        </div>

        <div className="tiers-grid">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`tier-card ${t.highlight ? "highlight" : ""}`}
            >
              {t.badge && <span className="tier-badge">{t.badge}</span>}
              <h3 className="tier-name">{t.name}</h3>
              <div className="tier-price-box">
                <span className="tier-price">{t.price}</span>
                <span className="tier-estimate">{t.pcsEstimate}</span>
              </div>
              <p className="tier-desc">{t.desc}</p>

              <div className="tier-items-list">
                <span className="items-header">Komponen yang Didapat:</span>
                <ul>
                  {t.items.map((item, i) => (
                    <li key={i}>
                      <span className="check-icon">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20ingin%20memesan%20${encodeURIComponent(t.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-lg ${t.highlight ? "btn-primary btn-glow" : "btn-secondary"}`}
                style={{ width: "100%", marginTop: "auto", textAlign: "center" }}
              >
                {t.ctaText} →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Paket Usaha */}
      <section className="faq-section" style={{ marginTop: "40px" }}>
        <div className="section-header">
          <span className="section-eyebrow">✦ TANYA JAWAB PAKET USAHA</span>
          <h2 className="section-title">Informasi Tambahan Seputar Kemitraan</h2>
        </div>

        <div className="faq-list">
          <div className="faq-card open">
            <div className="faq-question">
              <h3>Apakah bisa cetak logo toko / brand saya sendiri di kemasan?</h3>
            </div>
            <div className="faq-answer">
              <p>
                Bisa! Untuk Paket Pro dan Distributor, kami bisa mencantumkan nama brand atau logo toko Anda di kartu kemasan tanpa biaya tambahan.
              </p>
            </div>
          </div>

          <div className="faq-card open">
            <div className="faq-question">
              <h3>Bagaimana jika keycap huruf tertentu habis duluan?</h3>
            </div>
            <div className="faq-answer">
              <p>
                Anda bisa memesan paket refill huruf tertentu saja (misal hanya huruf vokal A, I, U, E, O) kapan saja dengan harga grosir mitra reseller.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
