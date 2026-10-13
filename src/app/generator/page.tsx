"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCTS, Product } from "@/lib/products";

export default function GeneratorCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Semua Generator" },
    { id: "clicker", label: "Fidget Clicker" },
    { id: "keychain", label: "Gantungan Kunci & Klip" },
    { id: "accessories", label: "Keycap Keyboard" },
    { id: "organizer", label: "Sistem Gridfinity" },
    { id: "display", label: "Display & Lithophane" },
  ];

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <span className="section-eyebrow">✦ KATALOG ALAT DESAIN ONLINE</span>
        <h1 className="section-title">Semua Generator 3D Aureate Craft</h1>
        <p className="section-desc">
          Pilih produk yang ingin kamu desain. Setiap generator dilengkapi kontrol kustomisasi lengkap dan preview 3D
          interaktif sebelum proses produksi cetak dimulai.
        </p>

        {/* Search & Filter Bar */}
        <div className="catalog-filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari generator (misal: clicker, keycap, nama, gridfinity)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-chips">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`filter-chip ${selectedCategory === c.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid of Generators */}
      <div className={`generator-cards-grid ${filtered.length % 2 !== 0 ? "is-odd" : ""}`}>
        {filtered.length > 0 ? (
          filtered.map((p: Product) => (
            <div key={p.slug} className="generator-card" id={`catalog-item-${p.slug}`}>
              <div className="card-top">
                <span className="card-product-icon">{p.icon}</span>
                {p.badge && <span className="card-badge">{p.badge}</span>}
              </div>

              <div className="card-body">
                <h2 className="card-title">{p.title}</h2>
                <p className="card-desc">{p.desc}</p>

                <ul className="card-features">
                  {p.features.map((f, i) => (
                    <li key={i}>
                      <span className="feature-dot">·</span> {f}
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
                  href={p.route || `/${p.slug}`}
                  className="btn-primary btn-sm btn-glow"
                >
                  Buka Generator 3D →
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-catalog-state">
            <span className="empty-icon">🔎</span>
            <h3>Tidak ada generator yang cocok</h3>
            <p>Coba gunakan kata kunci pencarian yang lain atau reset filter kategori.</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* Custom Request Banner */}
      <div className="custom-order-banner">
        <div className="custom-order-text">
          <span className="custom-order-tag">PUNYA FILE STL / CAD SENDIRI?</span>
          <h3>Ingin Cetak Desain Kustom yang Tidak Ada di Generator?</h3>
          <p>
            Kami juga melayani jasa 3D printing kustom dari file <code>.STL</code>, <code>.STEP</code>, atau <code>.OBJ</code> Anda dengan berbagai pilihan bahan (PLA+, PETG, TPU, ABS).
          </p>
        </div>
        <Link href="/jasa-3d-print-custom" className="btn-primary btn-lg">
          Kirim File & Konsultasi →
        </Link>
      </div>
    </div>
  );
}
