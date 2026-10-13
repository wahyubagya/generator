"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/pricing";

interface OrderItem {
  id: string;
  generatorSlug: string;
  generatorTitle: string;
  configJson: string;
  previewImage?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return { label: "Menunggu Konfirmasi", bg: "rgba(234, 179, 8, 0.15)", color: "#facc15", border: "rgba(234, 179, 8, 0.3)" };
    case "CONFIRMED":
      return { label: "Dikonfirmasi / Antrean Cetak", bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
    case "PRINTING":
      return { label: "Sedang Dicetak 3D 🖨️", bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "rgba(168, 85, 247, 0.3)" };
    case "SHIPPED":
      return { label: "Dalam Pengiriman 📦", bg: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "rgba(6, 182, 212, 0.3)" };
    case "COMPLETED":
      return { label: "Selesai Diterima ✓", bg: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "rgba(34, 197, 94, 0.3)" };
    default:
      return { label: status, bg: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", border: "rgba(148, 163, 184, 0.3)" };
  }
}

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Dual verification search inputs (Order ID + Customer Phone)
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<Order[] | null>(null);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setHasLoggedIn(true);
        }
      } catch {
        // Not logged in or no session
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    if (!searchOrderId.trim() || !searchPhone.trim()) {
      setSearchError("Harap masukkan Nomor Pesanan DAN Nomor WhatsApp untuk memverifikasi kepemilikan pesanan.");
      return;
    }

    setSearching(true);
    setSearchResult(null);
    try {
      const qId = encodeURIComponent(searchOrderId.trim());
      const qPhone = encodeURIComponent(searchPhone.trim().replace(/\D/g, ""));
      const res = await fetch(`/api/orders?id=${qId}&phone=${qPhone}`);
      const data = await res.json();

      if (data.ok && data.order) {
        setSearchResult([data.order]);
      } else {
        setSearchError(data.error || "Pesanan tidak ditemukan atau Nomor WhatsApp tidak sesuai.");
        setSearchResult([]);
      }
    } catch {
      setSearchError("Terjadi gangguan koneksi saat mencari pesanan.");
      setSearchResult([]);
    } finally {
      setSearching(false);
    }
  };

  const displayedOrders = searchResult !== null ? searchResult : orders;

  return (
    <div style={{ minHeight: "80vh", padding: "40px 20px", maxWidth: "980px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "8px", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Lacak Pesanan Cetak 3D
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
          Pantau status real-time antrean mesin cetak 3D dan pengiriman produk custom Anda
        </p>
      </div>

      {/* Guest Dual-Verification Search Box */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "36px",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "1rem" }}>🔒</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
            Verifikasi Privasi Pembeli (Masukkan No. Pesanan & No. WhatsApp Pemesan)
          </span>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="No. Pesanan (contoh: AC-ZPW7R-9454)"
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            style={{
              flex: "1 1 200px",
              padding: "12px 16px",
              background: "var(--bg-input, rgba(255,255,255,0.04))",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.95rem",
            }}
          />
          <input
            type="tel"
            placeholder="No. WhatsApp Pemesan (contoh: 081298765432)"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            style={{
              flex: "1 1 200px",
              padding: "12px 16px",
              background: "var(--bg-input, rgba(255,255,255,0.04))",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.95rem",
            }}
          />
          <button
            type="submit"
            disabled={searching}
            className="btn-primary btn-md btn-glow"
            style={{ padding: "0 24px", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {searching ? "Memverifikasi..." : "Lacak Pesanan 🔍"}
          </button>
          {searchResult !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchResult(null);
                setSearchOrderId("");
                setSearchPhone("");
                setSearchError("");
              }}
              className="btn-secondary btn-md"
            >
              Reset
            </button>
          )}
        </form>

        {searchError && (
          <div
            style={{
              marginTop: "14px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ {searchError}
          </div>
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p>Memuat data pesanan Anda...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "var(--bg-card)",
            border: "1px dashed var(--border-color)",
            borderRadius: "16px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📦</div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
            {searchResult !== null ? "Pesanan Tidak Ditemukan" : "Belum Ada Pesanan Ditampilkan"}
          </h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 24px" }}>
            {searchResult !== null
              ? "Pastikan kombinasi Nomor Pesanan dan Nomor WhatsApp yang Anda masukkan sesuai dengan saat checkout."
              : hasLoggedIn
              ? "Anda belum memiliki pesanan aktif. Mulai rancang model 3D custom Anda sekarang!"
              : "Masukkan No. Pesanan dan No. WhatsApp di atas, atau masuk ke akun Anda untuk melihat seluruh riwayat pesanan."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/generator" className="btn-primary btn-md btn-glow">
              ✦ Buat Desain 3D Sekarang
            </Link>
            {!hasLoggedIn && (
              <Link href="/masuk" className="btn-secondary btn-md">
                Masuk ke Akun Pelanggan
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {displayedOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "var(--card-shadow)",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid var(--border-color)",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                        {order.id}
                      </span>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Dipesan pada {dateStr} • Pemesan: <strong>{order.customerName}</strong> ({order.customerPhone})
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-color)" }}>
                      {formatRupiah(order.totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        background: "rgba(255,255,255,0.02)",
                        padding: "12px 16px",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          background: "var(--accent-glow)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.4rem",
                          flexShrink: 0,
                        }}
                      >
                        🖨️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.generatorTitle}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          Qty: {item.quantity}x • Model: {item.generatorSlug}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {formatRupiah(item.subtotal || item.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Butuh bantuan atau perubahan alamat pengiriman?
                  </div>
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                      `Halo CS Aureate Craft, saya ingin menanyakan status pesanan saya [${order.id}]. Terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm"
                  >
                    💬 Hubungi CS di WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
