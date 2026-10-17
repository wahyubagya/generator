"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, Product } from "@/lib/products";

export default function GeneratorCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "Semua Generator" },
    { id: "clicker", label: "Fidget Clicker" },
    { id: "keychain", label: "Gantungan Kunci & Klip" },
    { id: "accessories", label: "Klip & Aksesori" },
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
      <div className={`generator-cards-grid count-${filtered.length}`}>
        {filtered.length > 0 ? (
          filtered.map((p: Product, idx: number) => {
            const isFeatured = Boolean(p.badge);
            return (
              <div
                key={p.slug}
                className={`generator-card ${isFeatured ? "is-featured" : ""} card-pos-${idx}`}
                id={`catalog-item-${p.slug}`}
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
                    <h2 className="card-title">{p.title}</h2>
                    <p className="card-desc">{p.desc}</p>

                    <ul className="card-features">
                      {p.features.map((f, i) => (
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
                      href={p.route || `/${p.slug}`}
                      className="btn-open-gen"
                    >
                      <span>Buka Generator 3D</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
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
