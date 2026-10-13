"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/jasa-3d-print-custom", label: "Layanan Cetak" },
    { href: "/generator", label: "Katalog Generator" },
    { href: "/pesanan", label: "Lacak Pesanan" },
    { href: "/paket-usaha", label: "Paket Usaha" },
    { href: "/tentang", label: "Tentang" },
    { href: "/bantuan", label: "Bantuan & FAQ" },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <Link href="/" className="els-brand" id="link-home">
          <span className="brand-badge" aria-hidden="true">
            <span className="brand-logo-text">AC</span>
            <span className="brand-logo-sub">CRAFT</span>
          </span>
          <span className="brand-text">
            Aureate <span className="brand-light">Craft</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="site-nav desktop-nav" aria-label="Navigasi Utama">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          <Link href="/masuk" className="btn-secondary btn-sm" id="btn-masuk">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Masuk
          </Link>

          <Link href="/generator" className="btn-primary btn-sm btn-glow" id="btn-mulai-desain">
            <span className="sparkle-icon">✦</span>
            Mulai Desain
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-toggle"
            aria-label="Buka menu navigasi"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-item ${pathname === link.href ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mobile-actions">
              <Link
                href="/masuk"
                className="btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/generator"
                className="btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mulai Desain Sekarang
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
