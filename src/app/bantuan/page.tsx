"use client";

import { useState } from "react";
import Link from "next/link";

export default function BantuanPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "panduan" | "garansi" | "privasi">("faq");

  return (
    <div className="help-page">
      <header className="page-hero">
        <span className="section-eyebrow">✦ PUSAT DUKUNGAN & INFORMASI</span>
        <h1 className="section-title">Pusat Bantuan & Kebijakan Aureate Craft</h1>
        <p className="section-desc">
          Temukan jawaban atas pertanyaan teknis, panduan langkah demi langkah cara memesan, serta komitmen garansi kualitas kami.
        </p>

        {/* Tab Switcher */}
        <div className="filter-chips" style={{ marginTop: "24px" }}>
          <button
            type="button"
            className={`filter-chip ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            Pertanyaan Umum (FAQ)
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === "panduan" ? "active" : ""}`}
            onClick={() => setActiveTab("panduan")}
          >
            Panduan Pemesanan
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === "garansi" ? "active" : ""}`}
            onClick={() => setActiveTab("garansi")}
          >
            Garansi & Retur
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === "privasi" ? "active" : ""}`}
            onClick={() => setActiveTab("privasi")}
          >
            Kebijakan & Privasi
          </button>
        </div>
      </header>

      {/* Content based on Active Tab */}
      <div className="help-tab-content" style={{ marginTop: "40px" }}>
        {activeTab === "faq" && (
          <div className="faq-list">
            <div className="faq-card open">
              <div className="faq-question">
                <h3>Bagaimana cara memesan produk dari generator 3D?</h3>
              </div>
              <div className="faq-answer">
                <p>
                  1. Pilih generator di menu <strong>Katalog Generator</strong>.<br />
                  2. Atur teks nama, pilih variasi warna tombol, dan lihat pratinjau 3D-nya.<br />
                  3. Klik tombol <strong>&quot;Pesan Desain Ini&quot;</strong>. Ringkasan konfigurasi otomatis akan disiapkan untuk dikirim ke WhatsApp admin atau diproses ke tahap pembayaran.<br />
                  4. Tim kami mengonfirmasi detail akhir dan memulai proses cetak.
                </p>
              </div>
            </div>

            <div className="faq-card open">
              <div className="faq-question">
                <h3>Berapa lama proses pembuatan pesanan saya?</h3>
              </div>
              <div className="faq-answer">
                <p>
                  Pesanan satuan normalnya selesai dalam 1-2 hari kerja. Pesanan dalam jumlah banyak (di atas 50 pcs) membutuhkan waktu 3-5 hari kerja. Kami akan memberikan nomor resi begitu paket diserahkan ke kurir ekspedisi.
                </p>
              </div>
            </div>

            <div className="faq-card open">
              <div className="faq-question">
                <h3>Apakah tombol clicker bisa dicopot atau diganti?</h3>
              </div>
              <div className="faq-answer">
                <p>
                  Bisa! Produk clicker kami menggunakan mechanical keyboard switch standar (Outemu / Gateron / Cherry MX style stem). Keycap huruf dapat dilepas pasang jika Anda ingin menukar posisi huruf atau mengganti warnanya kelak.
                </p>
              </div>
            </div>

            <div className="faq-card open">
              <div className="faq-question">
                <h3>Metode pembayaran apa saja yang diterima?</h3>
              </div>
              <div className="faq-answer">
                <p>
                  Kami menerima pembayaran instan via QRIS (GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, dll.) serta Transfer Bank Virtual Account (BCA, Mandiri, BRI, BNI).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "panduan" && (
          <div className="story-grid">
            <div className="story-card">
              <div className="story-step-number">01</div>
              <h3>Pilih Produk di Generator</h3>
              <p>Masuk ke menu generator produk yang Anda minati (Gantungan Nama, Fidget Clicker Karakter, dll.).</p>
            </div>
            <div className="story-card">
              <div className="story-step-number">02</div>
              <h3>Kustomisasi Bebas</h3>
              <p>Tentukan nama, warna casing luar, warna tombol, dan jenis ring gantungan sesuai selera Anda.</p>
            </div>
            <div className="story-card">
              <div className="story-step-number">03</div>
              <h3>Periksa Preview 3D</h3>
              <p>Putar objek 3D 360 derajat untuk memastikan tidak ada salah ketik huruf atau kombinasi warna yang keliru.</p>
            </div>
            <div className="story-card">
              <div className="story-step-number">04</div>
              <h3>Selesaikan Pemesanan</h3>
              <p>Kirim ringkasan pesanan ke admin atau checkout secara online untuk langsung masuk antrean cetak.</p>
            </div>
          </div>
        )}

        {activeTab === "garansi" && (
          <div className="about-text-col" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2>Kebijakan Garansi Kepuasan & Retur</h2>
            <p>
              Kami mengutamakan presisi dan kepuasan Anda. Jika produk yang Anda terima mengalami kondisi berikut:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0", color: "var(--muted)" }}>
              <li><strong>Patah / Rusak saat Pengiriman:</strong> Paket tiba dalam kondisi remuk atau cacat fisik akibat handling kurir.</li>
              <li><strong>Salah Huruf / Nama:</strong> Ada perbedaan teks cetak dari data konfigurasi yang telah Anda konfirmasi.</li>
              <li><strong>Switch Rusak:</strong> Switch mekanikal macet dan tidak dapat berbunyi klik saat baru diterima.</li>
            </ul>
            <p>
              Cukup kirimkan video unboxing paket ke WhatsApp Customer Service kami dalam waktu maksimal 2x24 jam sejak barang diterima. Kami akan <strong>mencetak ulang unit baru dan mengirimkannya secara GRATIS</strong> tanpa perlu mengembalikan produk yang rusak.
            </p>
          </div>
        )}

        {activeTab === "privasi" && (
          <div className="about-text-col" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2>Kebijakan Privasi & Hak Cipta Desain</h2>
            <p>
              Aureate Craft sangat menghargai privasi dan kerahasiaan data pengguna:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0", color: "var(--muted)" }}>
              <li><strong>Kerahasiaan File Kustom:</strong> File 3D (STL/STEP) atau gambar logo yang Anda unggah ke generator hanya digunakan semata-mata untuk keperluan memproduksi pesanan Anda dan tidak akan pernah dijual atau dibagikan ke pihak ketiga tanpa izin.</li>
              <li><strong>Data Kontak:</strong> Nomor telepon dan alamat pengiriman Anda hanya digunakan untuk keperluan konfirmasi pesanan dan ekspedisi.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Still have questions? */}
      <div className="final-cta-section" style={{ marginTop: "60px" }}>
        <div className="final-cta-card">
          <h2>Masih Memiliki Pertanyaan Lain?</h2>
          <p>Customer service kami siap membantu Anda setiap hari Senin – Sabtu (09:00 – 21:00 WIB).</p>
          <div className="final-cta-buttons">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Aureate%20Craft,%20saya%20butuh%20bantuan%20seputar%20pemesanan"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-lg btn-glow"
            >
              Hubungi CS via WhatsApp →
            </a>
            <Link href="/" className="btn-secondary btn-lg">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
