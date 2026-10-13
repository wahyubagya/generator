import Link from "next/link";

export default function TentangPage() {
  return (
    <div className="about-page">
      <header className="page-hero">
        <span className="section-eyebrow">✦ TENTANG KAMI</span>
        <h1 className="section-title">Mengubah Imajinasi Digital Menjadi Objek Nyata</h1>
        <p className="section-desc">
          Aureate Craft adalah studio fabrikasi aditif dan desain 3D asal Indonesia yang berfokus pada personalisasi
          produk, aksesoris mekanikal, dan kemudahan berkreasi untuk semua orang.
        </p>
      </header>

      {/* Cerita Studio */}
      <section className="about-story-section">
        <div className="about-grid">
          <div className="about-text-col">
            <span className="section-eyebrow">FILOSOFI KAMI</span>
            <h2>Semua Orang Berhak Memiliki Desain yang Personal</h2>
            <p>
              Dulu, untuk membuat produk 3D custom, Anda harus menguasai software CAD yang rumit, mengerti toleransi
              teknik, dan memiliki printer 3D mahal. Kami ingin mendobrak batasan tersebut.
            </p>
            <p>
              Dengan memadukan web teknologi modern (Three.js dan React) dengan jajaran mesin printer 3D FDM presisi
              tinggi di workshop kami, kami memungkinkan siapa saja—dari pelajar, gamer, kreator konten, hingga profesional—untuk
              merancang sendiri fidget clicker, keycap nama, dan organizer mereka langsung dari browser.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <span className="highlight-val">10.000+</span>
                <span className="highlight-label">Produk Terkirim</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-val">99.4%</span>
                <span className="highlight-label">Tingkat Kepuasan</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-val">100%</span>
                <span className="highlight-label">Lokal Buatan Indonesia</span>
              </div>
            </div>
          </div>

          <div className="about-visual-col">
            <div className="workshop-card">
              <div className="workshop-icon">🖨️</div>
              <h3>Armada Mesin Modern</h3>
              <p>
                Kami menggunakan printer 3D coreXY berkecepatan tinggi dengan auto-bed mesh leveling dan sistem multi-warna AMS,
                memastikan setiap sudut cetakan rapi tanpa layer shift.
              </p>
              <div className="workshop-specs">
                <span>• Nozzle 0.4mm & 0.2mm High Precision</span>
                <span>• Filamen PLA+, PETG, & TPU Certified</span>
                <span>• Quality Control Ketat 3 Tahap</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nilai Utama Studio */}
      <section className="values-section">
        <div className="section-header">
          <span className="section-eyebrow">✦ PRINSIP KAMI</span>
          <h2 className="section-title">Nilai yang Kami Pegang di Setiap Lapisan Cetak</h2>
        </div>

        <div className="why-grid">
          <div className="why-item">
            <div className="why-icon-box">🎯</div>
            <h4>Presisi Dimensi</h4>
            <p>
              Kami tidak mentoleransi hasil yang longgar atau terlalu sempit. Setiap toleransi tombol mekanikal dan modul
              snap-fit telah melewati riset ratusan kali cetak uji coba.
            </p>
          </div>

          <div className="why-item">
            <div className="why-icon-box">🌱</div>
            <h4>Material Ramah Lingkungan</h4>
            <p>
              Filamen PLA+ kami terbuat dari bahan nabati terbarukan (corn starch) yang tidak beracun dan aman dipegang sehari-hari.
            </p>
          </div>

          <div className="why-item">
            <div className="why-icon-box">🤝</div>
            <h4>Dukungan Komunitas & UMKM</h4>
            <p>
              Kami membuka lebar kemitraan paket usaha untuk membantu pemuda dan kreator lokal membuka bisnis mandiri
              dengan modal terjangkau.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="final-cta-section">
        <div className="final-cta-card">
          <h2>Tertarik Mencoba Mendesain Produk Pertama Anda?</h2>
          <p>Buka generator online kami sekarang dan lihat pratinjau bentuk 3D-nya dalam hitungan detik.</p>
          <div className="final-cta-buttons">
            <Link href="/generator" className="btn-primary btn-lg btn-glow">
              Jelajahi Generator 3D →
            </Link>
            <Link href="/jasa-3d-print-custom" className="btn-secondary btn-lg">
              Konsultasi Jasa Cetak
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
