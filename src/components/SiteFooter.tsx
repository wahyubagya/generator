import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand & Story */}
        <div className="footer-brand-col">
          <Link href="/" className="els-brand footer-brand">
            <span className="brand-badge">
              <span className="brand-logo-text">AC</span>
              <span className="brand-logo-sub">CRAFT</span>
            </span>
            <span className="brand-text">
              Aureate <span className="brand-light">Craft</span>
            </span>
          </Link>
          <p className="footer-desc">
            Studio fabrikasi digital & jasa 3D print custom asal Indonesia. Wujudkan produk personal, fidget clicker,
            keycap nama, merchandise, hingga prototype fungsional dengan presisi tinggi dan bahan ramah lingkungan.
          </p>
          <div className="footer-badges">
            <span className="footer-chip">Additive Objects · Indonesia</span>
            <span className="footer-chip">No Minimum Order</span>
          </div>
        </div>

        {/* Links: Generators */}
        <div className="footer-col">
          <h4 className="footer-title">Generator 3D</h4>
          <ul className="footer-links">
            {PRODUCTS.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/generator" className="footer-link-highlight">
                Lihat Semua Generator →
              </Link>
            </li>
          </ul>
        </div>

        {/* Links: Layanan & Informasi */}
        <div className="footer-col">
          <h4 className="footer-title">Layanan & Bisnis</h4>
          <ul className="footer-links">
            <li>
              <Link href="/jasa-3d-print-custom">Jasa 3D Print Custom</Link>
            </li>
            <li>
              <Link href="/paket-usaha">Paket Usaha Clicker</Link>
            </li>
            <li>
              <Link href="/tentang">Tentang Aureate Craft</Link>
            </li>
            <li>
              <Link href="/bantuan">Pusat Bantuan & FAQ</Link>
            </li>
            <li>
              <Link href="/pesanan">Lacak Pesanan Pelanggan</Link>
            </li>
            <li>
              <Link href="/masuk">Akun Saya</Link>
            </li>
            <li>
              <Link href="/admin/pesanan">Panel Admin (Produksi 3D)</Link>
            </li>
          </ul>
        </div>

        {/* Info & Kontak */}
        <div className="footer-col">
          <h4 className="footer-title">Kontak & Studio</h4>
          <ul className="footer-info-list">
            <li>
              <span className="info-icon">📍</span>
              <span>Workshop & Studio Produksi, Indonesia</span>
            </li>
            <li>
              <span className="info-icon">🕒</span>
              <span>Senin – Sabtu: 09:00 – 21:00 WIB</span>
            </li>
            <li>
              <span className="info-icon">💬</span>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20ingin%20tanya%20jasa%203D%20print"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-contact-link"
              >
                Konsultasi WhatsApp Langsung
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} Aureate Craft. All rights reserved. 3D Print Custom & Generator Desain.</p>
          <div className="footer-legal-links">
            <Link href="/bantuan">Kebijakan Privasi</Link>
            <span className="bullet">·</span>
            <Link href="/bantuan">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
