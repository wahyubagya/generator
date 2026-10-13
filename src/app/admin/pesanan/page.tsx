"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  customerEmail?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  user?: { name: string; email: string } | null;
}

interface AdminUser {
  id?: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminPesananPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login form state for unauthenticated admin
  const [loginEmail, setLoginEmail] = useState("admin@aureatecraft.com");
  const [loginPassword, setLoginPassword] = useState("adminpassword123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?admin=true");
      const data = await res.json();
      if (data.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    let ignore = false;
    async function checkAdminAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!ignore && data.ok && data.user && data.user.role === "ADMIN") {
          setCurrentUser(data.user);
          fetch("/api/orders?admin=true")
            .then((r) => r.json())
            .then((orderData) => {
              if (!ignore && orderData.ok && Array.isArray(orderData.orders)) {
                setOrders(orderData.orders);
              }
            })
            .catch(console.error)
            .finally(() => {
              if (!ignore) setLoading(false);
            });
        } else {
          if (!ignore) setLoading(false);
        }
      } catch {
        if (!ignore) setLoading(false);
      } finally {
        if (!ignore) setCheckingAuth(false);
      }
    }

    checkAdminAuth();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setLoginError(data.error || "Email atau kata sandi tidak sesuai.");
        setLoginLoading(false);
        return;
      }

      if (data.user.role !== "ADMIN") {
        setLoginError("Akun ini bukan Administrator. Silakan gunakan akun admin.");
        setLoginLoading(false);
        return;
      }

      setCurrentUser(data.user);
      await refreshOrders();
    } catch {
      setLoginError("Terjadi gangguan koneksi.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setOrders([]);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        setNotification(`Order ${orderId} diubah statusnya menjadi ${newStatus}`);
        setTimeout(() => setNotification(""), 3500);
      }
    } catch {
      alert("Gagal memperbarui status order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Seed sample order helper for testing
  const handleSeedSampleOrder = async () => {
    setLoading(true);
    try {
      const sampleNames = ["Reza Rahadian", "Siti Nurhaliza", "Dewi Lestari", "Rian Wijaya", "Bagas Saputra"];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const samplePayload = {
        customerName: randomName,
        customerPhone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerEmail: `${randomName.toLowerCase().replace(" ", ".")}@example.com`,
        shippingAddress: "Jl. Sudirman No. 42, Kebayoran Baru, Jakarta Selatan",
        notes: "Mohon finishing warna doff dan infokan saat mulai proses print.",
        totalPrice: 65000,
        items: [
          {
            generatorSlug: "character-clicker",
            generatorTitle: "3D Character Clicker (Custom Relief)",
            configJson: JSON.stringify({
              charName: "Deadpool Face Plate",
              baseColor: "#DC2626",
              accentColor: "#111827",
              clickerType: "Tactile Blue Switch",
              widthMm: 50,
              reliefDepthMm: 3.8,
              multiColorLayers: 3,
            }),
            quantity: 1,
            unitPrice: 65000,
            subtotal: 65000,
          },
        ],
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload),
      });

      await refreshOrders();
      setNotification("Sample pesanan 3D berhasil ditambahkan ke antrean!");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      alert("Gagal menambah contoh pesanan");
    } finally {
      setLoading(false);
    }
  };

  // Filtered orders by status & search query
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        o.items.some((it) => it.generatorTitle.toLowerCase().includes(q))
      );
    });
  }, [orders, statusFilter, searchQuery]);

  // Statistics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const countPending = orders.filter((o) => o.status === "PENDING").length;
  const countConfirmed = orders.filter((o) => o.status === "CONFIRMED").length;
  const countPrinting = orders.filter((o) => o.status === "PRINTING").length;
  const countShipped = orders.filter((o) => o.status === "SHIPPED").length;
  const countCompleted = orders.filter((o) => o.status === "COMPLETED").length;

  // Loading state
  if (checkingAuth) {
    return (
      <div className="admin-dark-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div className="spinner" style={{ margin: "0 auto 16px", borderColor: "#f59e0b", borderTopColor: "transparent" }} />
          <p style={{ letterSpacing: "0.5px" }}>Memeriksa otentikasi administrator...</p>
        </div>
      </div>
    );
  }

  // NOT AUTHENTICATED -> ULTRA-PREMIUM DARK CYBERPUNK SECURITY GATE
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="admin-dark-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "rgba(13, 18, 30, 0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.1)",
            textAlign: "center",
          }}
        >
          {/* Glowing Shield Icon */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "1.8rem",
              boxShadow: "0 0 25px rgba(245, 158, 11, 0.2)",
            }}
          >
            🛡️
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "1.2px",
              marginBottom: "14px",
              border: "1px solid rgba(245, 158, 11, 0.4)",
            }}
          >
            CONTROL CENTER PRO
          </div>

          <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Admin Security Gate
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "26px" }}>
            Area khusus manajemen mesin cetak 3D, parameter slicing produksi, dan pencatatan omzet finansial.
          </p>

          {loginError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                marginBottom: "20px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="admin-search-input"
                style={{ width: "100%", padding: "12px 14px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="admin-search-input"
                style={{ width: "100%", padding: "12px 14px" }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="admin-btn admin-btn-primary"
              style={{ width: "100%", padding: "14px", justifyContent: "center", fontSize: "0.95rem", marginTop: "8px" }}
            >
              {loginLoading ? "Memverifikasi Kredensial..." : "Masuk ke Panel Produksi ➔"}
            </button>
          </form>

          {/* Demo Autofill Helper */}
          <div
            style={{
              marginTop: "26px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "0.8rem",
              color: "#64748b",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              Akun Default: <code style={{ color: "#fbbf24", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>admin@aureatecraft.com</code>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoginEmail("admin@aureatecraft.com");
                setLoginPassword("adminpassword123");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#38bdf8",
                fontSize: "0.78rem",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Isi Otomatis Kredensial Demo
            </button>
            <div style={{ marginTop: "14px" }}>
              <Link href="/" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED -> ULTRA-PREMIUM PRO DARK MISSION CONTROL
  // =========================================================================
  return (
    <div className="admin-dark-root">
      {/* 1. TOP COMMAND BAR */}
      <header className="admin-top-bar">
        <div className="admin-brand-group">
          <div className="admin-brand-icon">AC</div>
          <div>
            <div className="admin-title-text">
              Aureate Craft <span className="admin-pill-tag">Production HQ</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
              <div className="admin-live-badge">
                <span className="admin-live-dot" />
                FARM 3D: ONLINE
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Database: SQLite/LibSQL • Model: Prisma 7
              </span>
            </div>
          </div>
        </div>

        <div className="admin-actions-bar">
          <div className="admin-user-pill">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24" }} />
            <span>{currentUser.name}</span>
            <span style={{ color: "#64748b", fontSize: "0.72rem" }}>({currentUser.email})</span>
          </div>

          <button
            type="button"
            onClick={handleSeedSampleOrder}
            className="admin-btn admin-btn-secondary"
            title="Tambah order simulasi untuk uji coba sistem"
          >
            <span>+</span> Simulasi Order
          </button>

          <button
            type="button"
            onClick={refreshOrders}
            className="admin-btn admin-btn-secondary"
            title="Refresh antrean pesanan"
          >
            <span>🔄</span> Refresh
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-btn admin-btn-danger"
            title="Keluar dari mode admin"
          >
            Keluar (Lock)
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 0" }}>
        {/* NOTIFICATION BANNER */}
        {notification && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#6ee7b7",
              padding: "12px 20px",
              borderRadius: "12px",
              marginBottom: "24px",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.15)",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>✓</span>
            <span>{notification}</span>
          </div>
        )}

        {/* 2. EXECUTIVE KPI GRID */}
        <section className="admin-kpi-grid">
          {/* Revenue */}
          <div
            className="admin-kpi-card"
            style={{
              borderLeft: "4px solid #f59e0b",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 19, 31, 0.8) 100%)",
            }}
          >
            <div className="admin-kpi-label">
              <span>💰</span> Total Omzet Pesanan
            </div>
            <div className="admin-kpi-val" style={{ color: "#fbbf24" }}>
              {formatRupiah(totalRevenue)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "6px" }}>
              Akumulasi nilai seluruh pesanan masuk
            </div>
          </div>

          {/* Total Orders */}
          <div className="admin-kpi-card" style={{ borderLeft: "4px solid #06b6d4" }}>
            <div className="admin-kpi-label">
              <span>📥</span> Total Pesanan
            </div>
            <div className="admin-kpi-val">{orders.length}</div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "6px" }}>
              Volume pesanan tercatat di database
            </div>
          </div>

          {/* Pending */}
          <div
            className="admin-kpi-card"
            style={{
              borderLeft: "4px solid #eab308",
              background: countPending > 0 ? "rgba(234, 179, 8, 0.06)" : undefined,
            }}
          >
            <div className="admin-kpi-label" style={{ color: "#facc15" }}>
              <span>⏳</span> Antrean Menunggu
            </div>
            <div className="admin-kpi-val" style={{ color: "#facc15" }}>
              {countPending}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "6px" }}>
              Perlu konfirmasi spesifikasi & pembayaran
            </div>
          </div>

          {/* Printing */}
          <div
            className="admin-kpi-card"
            style={{
              borderLeft: "4px solid #a855f7",
              background: countPrinting > 0 ? "rgba(168, 85, 247, 0.08)" : undefined,
            }}
          >
            <div className="admin-kpi-label" style={{ color: "#c084fc" }}>
              <span>🖨️</span> Sedang Dicetak
            </div>
            <div className="admin-kpi-val" style={{ color: "#c084fc" }}>
              {countPrinting}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "6px" }}>
              Mesin cetak 3D sedang aktif berjalan
            </div>
          </div>

          {/* Completed */}
          <div className="admin-kpi-card" style={{ borderLeft: "4px solid #10b981" }}>
            <div className="admin-kpi-label" style={{ color: "#34d399" }}>
              <span>✓</span> Selesai Diproduksi
            </div>
            <div className="admin-kpi-val" style={{ color: "#34d399" }}>
              {countCompleted}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "6px" }}>
              Produk terkirim & diterima pelanggan
            </div>
          </div>
        </section>

        {/* 3. FILTER TABS & SEARCH BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
            background: "rgba(13, 18, 30, 0.6)",
            padding: "16px 20px",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Semua", count: orders.length },
              { id: "PENDING", label: "Menunggu", count: countPending },
              { id: "CONFIRMED", label: "Antrean Siap", count: countConfirmed },
              { id: "PRINTING", label: "🖨️ Dicetak", count: countPrinting },
              { id: "SHIPPED", label: "📦 Dikirim", count: countShipped },
              { id: "COMPLETED", label: "✓ Selesai", count: countCompleted },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: active ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.03)",
                    borderColor: active ? "rgba(245, 158, 11, 0.5)" : "transparent",
                    color: active ? "#fbbf24" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: active ? "#f59e0b" : "rgba(255, 255, 255, 0.08)",
                      color: active ? "#07090e" : "#cbd5e1",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div style={{ minWidth: "260px", flex: "1 1 240px", maxWidth: "380px" }}>
            <input
              type="text"
              placeholder="Cari ID Pesanan, nama, nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
              style={{ width: "100%", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        {/* 4. ORDERS STREAM */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div className="spinner" style={{ margin: "0 auto 16px", borderColor: "#f59e0b", borderTopColor: "transparent" }} />
            <p>Memuat antrean produksi mesin cetak 3D...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 24px",
              background: "rgba(13, 18, 30, 0.5)",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "2.8rem", marginBottom: "14px" }}>📦</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
              Tidak Ada Pesanan
            </h3>
            <p style={{ fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto 20px" }}>
              {searchQuery
                ? `Tidak ditemukan pesanan dengan kata kunci "${searchQuery}".`
                : "Belum ada pesanan pada kategori status ini."}
            </p>
            {orders.length === 0 && (
              <button type="button" onClick={handleSeedSampleOrder} className="admin-btn admin-btn-primary">
                + Tambah Order Simulasi Sekarang
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isUpdating = updatingId === order.id;

              return (
                <div key={order.id} className="admin-order-card">
                  {/* Card Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "14px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {/* Order ID Badge */}
                        <div
                          style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>{order.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(order.id)}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "none",
                              color: copiedId === order.id ? "#34d399" : "#94a3b8",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.7rem",
                              cursor: "pointer",
                            }}
                            title="Salin ID Pesanan"
                          >
                            {copiedId === order.id ? "✓ Tersalin" : "Salin"}
                          </button>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 12px",
                            borderRadius: "999px",
                            background:
                              order.status === "PENDING"
                                ? "rgba(234, 179, 8, 0.15)"
                                : order.status === "CONFIRMED"
                                ? "rgba(59, 130, 246, 0.15)"
                                : order.status === "PRINTING"
                                ? "rgba(168, 85, 247, 0.2)"
                                : order.status === "SHIPPED"
                                ? "rgba(6, 182, 212, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                            color:
                              order.status === "PENDING"
                                ? "#facc15"
                                : order.status === "CONFIRMED"
                                ? "#60a5fa"
                                : order.status === "PRINTING"
                                ? "#c084fc"
                                : order.status === "SHIPPED"
                                ? "#22d3ee"
                                : "#34d399",
                            border: "1px solid",
                            borderColor:
                              order.status === "PENDING"
                                ? "rgba(234, 179, 8, 0.3)"
                                : order.status === "CONFIRMED"
                                ? "rgba(59, 130, 246, 0.3)"
                                : order.status === "PRINTING"
                                ? "rgba(168, 85, 247, 0.4)"
                                : order.status === "SHIPPED"
                                ? "rgba(6, 182, 212, 0.3)"
                                : "rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          {order.status === "PRINTING" ? "🖨️ SEDANG DICETAK" : order.status}
                        </span>
                      </div>

                      {/* Customer Details */}
                      <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "6px" }}>
                        Pemesan: <strong style={{ color: "#f8fafc" }}>{order.customerName}</strong> •{" "}
                        <span>{order.customerPhone}</span>
                        {order.customerEmail && <span> • {order.customerEmail}</span>}
                      </div>
                    </div>

                    {/* Price & Timestamp */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fbbf24", letterSpacing: "-0.01em" }}>
                        {formatRupiah(order.totalPrice)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          fontSize: "0.85rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.2rem" }}>🖨️</span>
                          <div>
                            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{item.generatorTitle}</span>
                            <span style={{ color: "#64748b", fontSize: "0.75rem", marginLeft: "8px" }}>
                              (Model: {item.generatorSlug}) × {item.quantity} unit
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: "#e2e8f0" }}>
                          {formatRupiah(item.subtotal || item.unitPrice)}
                        </div>
                      </div>
                    ))}

                    {order.notes && (
                      <div
                        style={{
                          fontSize: "0.82rem",
                          background: "rgba(245, 158, 11, 0.08)",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                          color: "#fde68a",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          marginTop: "4px",
                        }}
                      >
                        <strong>Catatan Pelanggan:</strong> &ldquo;{order.notes}&rdquo;
                      </div>
                    )}

                    {order.shippingAddress && (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                        📍 Alamat: {order.shippingAddress}
                      </div>
                    )}
                  </div>

                  {/* Production Control Stepper & Quick Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.07)",
                    }}
                  >
                    {/* Stepper Pipeline Buttons */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginRight: "4px" }}>
                        Progres Produksi:
                      </span>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: order.status === "CONFIRMED" ? "#2563eb" : "rgba(255, 255, 255, 0.05)",
                          border: "1px solid",
                          borderColor: order.status === "CONFIRMED" ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                        }}
                      >
                        1. Konfirmasi
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "PRINTING")}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: order.status === "PRINTING" ? "#9333ea" : "rgba(255, 255, 255, 0.05)",
                          border: "1px solid",
                          borderColor: order.status === "PRINTING" ? "#a855f7" : "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                          boxShadow: order.status === "PRINTING" ? "0 0 12px rgba(168, 85, 247, 0.5)" : undefined,
                        }}
                      >
                        2. 🖨️ Cetak 3D
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: order.status === "SHIPPED" ? "#0891b2" : "rgba(255, 255, 255, 0.05)",
                          border: "1px solid",
                          borderColor: order.status === "SHIPPED" ? "#06b6d4" : "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                        }}
                      >
                        3. 📦 Kirim Kurir
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: order.status === "COMPLETED" ? "#16a34a" : "rgba(255, 255, 255, 0.05)",
                          border: "1px solid",
                          borderColor: order.status === "COMPLETED" ? "#22c55e" : "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                        }}
                      >
                        4. ✓ Selesai
                      </button>
                    </div>

                    {/* Slicer Spec Drawer & Customer Contact */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                      >
                        {isExpanded ? "▲ Tutup Spek 3D" : "▼ Detail Spek Slicer 3D"}
                      </button>

                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/^0/, "62")}?text=${encodeURIComponent(
                          `Halo kak ${order.customerName}, kami dari Aureate Craft ingin mengonfirmasi pesanan 3D Anda [${order.id}]. Status saat ini: ${order.status}. Terima kasih!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "6px 12px", color: "#34d399", borderColor: "rgba(52, 211, 153, 0.3)" }}
                      >
                        💬 Chat WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* 5. EXPANDED SLICER SPECIFICATION DRAWER */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "18px",
                        background: "rgba(0, 0, 0, 0.55)",
                        borderRadius: "12px",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>⚙️</span> Parameter Slicer Produksi (Bambu Studio / Cura / PrusaSlicer):
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(order.items.map((it) => ({ title: it.generatorTitle, config: JSON.parse(it.configJson || "{}") })), null, 2)
                            );
                            alert("Parameter 3D disalin ke clipboard!");
                          }}
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "none",
                            color: "#cbd5e1",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                          }}
                        >
                          Salin Seluruh Spek (JSON)
                        </button>
                      </div>

                      {order.items.map((item, idx) => {
                        let parsedConfig: Record<string, unknown> = {};
                        try {
                          parsedConfig = JSON.parse(item.configJson || "{}");
                        } catch {
                          // raw string
                        }

                        return (
                          <div
                            key={idx}
                            style={{
                              marginBottom: "12px",
                              padding: "12px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: "8px",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8", marginBottom: "8px" }}>
                              Item #{idx + 1}: {item.generatorTitle}
                            </div>

                            {/* Key parameters pills */}
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                              {Object.entries(parsedConfig).map(([k, v]) => {
                                const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
                                const isColor = typeof v === "string" && v.startsWith("#");

                                return (
                                  <div
                                    key={k}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.05)",
                                      border: "1px solid rgba(255, 255, 255, 0.08)",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    <span style={{ color: "#94a3b8" }}>{k}:</span>
                                    {isColor && (
                                      <span
                                        style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          background: String(v),
                                          border: "1px solid rgba(255, 255, 255, 0.3)",
                                          display: "inline-block",
                                        }}
                                      />
                                    )}
                                    <span style={{ color: "#ffffff", fontWeight: 600 }}>{valStr}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Raw JSON fallback */}
                            <pre
                              style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                overflowX: "auto",
                                color: "#94a3b8",
                                margin: 0,
                                fontFamily: "var(--font-geist-mono), monospace",
                              }}
                            >
                              {JSON.stringify(parsedConfig, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
