"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
}

export default function MasukPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.ok && data.user) {
          setCurrentUser(data.user);
        }
      } catch {
        // Not logged in or network error
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setSuccessMsg("Berhasil keluar dari akun.");
    } catch {
      setErrorMsg("Gagal keluar dari akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Gagal memproses permintaan.");
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message || (isRegister ? "Pendaftaran berhasil!" : "Berhasil masuk!"));
      setCurrentUser(data.user);

      // Auto redirect to generator or orders after 1.5 seconds
      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch {
      setErrorMsg("Terjadi gangguan koneksi. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Memuat status akun...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-brand">
            <span className="brand-badge" aria-hidden="true">
              <span className="brand-logo-text">AC</span>
              <span className="brand-logo-sub">CRAFT</span>
            </span>
          </Link>

          {currentUser ? (
            <>
              <h2>Akun Anda</h2>
              <p>Selamat datang kembali, <strong>{currentUser.name}</strong> ({currentUser.email})</p>
            </>
          ) : (
            <>
              <h2>{isRegister ? "Buat Akun Aureate Craft" : "Masuk ke Akun Anda"}</h2>
              <p>
                {isRegister
                  ? "Daftar gratis untuk menyimpan riwayat pesanan dan draft generator 3D Anda"
                  : "Akses riwayat desain 3D dan status pesanan cetak Anda"}
              </p>
            </>
          )}
        </div>

        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#86efac",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {currentUser ? (
          <div className="auth-success-state" style={{ marginTop: "12px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: currentUser.role === "ADMIN" ? "rgba(245, 158, 11, 0.2)" : "rgba(99, 102, 241, 0.2)",
                color: currentUser.role === "ADMIN" ? "#fbbf24" : "#a5b4fc",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Role: {currentUser.role}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <Link href="/pesanan" className="btn-primary btn-lg btn-glow" style={{ textAlign: "center" }}>
                📦 Lihat Riwayat Pesanan Saya
              </Link>

              {currentUser.role === "ADMIN" && (
                <Link
                  href="/admin/pesanan"
                  className="btn-secondary btn-lg"
                  style={{ textAlign: "center", borderColor: "rgba(245, 158, 11, 0.4)", color: "#fbbf24" }}
                >
                  ⚙️ Buka Panel Admin Cetak 3D
                </Link>
              )}

              <Link href="/generator" className="btn-secondary btn-lg" style={{ textAlign: "center" }}>
                ✦ Buka Studio Generator 3D
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="btn-secondary"
                style={{
                  marginTop: "8px",
                  color: "#ef4444",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  background: "transparent",
                }}
              >
                {loading ? "Memproses..." : "Keluar dari Akun (Logout)"}
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="auth-name">Nama Lengkap</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="auth-input"
                  disabled={loading}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Alamat Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Kata Sandi</label>
              <input
                id="auth-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-lg btn-glow"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading
                ? "Memproses..."
                : isRegister
                ? "Daftar Akun Baru (Gratis)"
                : "Masuk Sekarang"}
            </button>

            <div className="auth-switch">
              <span>
                {isRegister ? "Sudah memiliki akun?" : "Belum punya akun Aureate Craft?"}
              </span>
              <button
                type="button"
                className="auth-switch-btn"
                disabled={loading}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                {isRegister ? "Masuk di sini" : "Daftar gratis di sini"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
