"use client";

import { useState } from "react";

export function BulkNames({
  title,
  max,
  count,
  maxLen,
  onAdd,
  placeholder = "ALYA\nBIMA\nCITRA",
}: {
  title: string;
  /** maksimum desain */
  max: number;
  count: number;
  maxLen: number;
  onAdd: (names: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const names = text
    .split("\n")
    .map((s) => s.trim().slice(0, maxLen))
    .filter(Boolean);

  const availableSlots = Math.max(0, max - count);

  return (
    <div className="bulk-card" aria-label="Pesan banyak nama">
      <div
        className="bulk-header"
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="bulk-header-left">
          <div className="bulk-icon-badge" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="bulk-title-row">
              <span className="bulk-title">Pesan Banyak Nama Sekaligus</span>
              <span className="bulk-badge">Batch Order</span>
              {count > 1 && (
                <span className="bulk-count-pill">{count} Varian Tersimpan</span>
              )}
            </div>
            <p className="bulk-desc">
              Buat varian souvenir/grup otomatis tanpa atur ulang desain dari nol.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`bulk-toggle-btn ${isOpen ? "is-open" : ""}`}
          aria-expanded={isOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <span>{isOpen ? "Tutup Form" : "+ Buka Input Nama"}</span>
          <svg
            className="bulk-chevron"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="bulk-body">
          <div className="bulk-info-banner">
            <span className="bulk-info-icon">💡</span>
            <p>
              Tulis nama berbeda satu per baris (maks. <strong>{maxLen} huruf</strong> per nama). Setiap nama akan disalin mengikuti model huruf dan warna yang sedang aktif, lalu bisa kamu cek dan edit masing-masing di preview 3D.
            </p>
          </div>

          <div className="bulk-field-top">
            <label className="field-label" htmlFor="bulk-textarea" style={{ marginBottom: 0 }}>
              <span>Daftar Nama (1 nama per baris)</span>
            </label>
            <span className="bulk-detected-tag">
              {names.length > 0 ? `${names.length} nama terdeteksi` : `Sisa ${availableSlots} slot lagi`}
            </span>
          </div>

          <textarea
            id="bulk-textarea"
            className="input textarea bulk-textarea"
            rows={3}
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="bulk-footer">
            <div className="bulk-actions">
              <button
                id="bulk-add"
                type="button"
                className="btn btn-primary bulk-submit-btn"
                disabled={!names.length || count >= max}
                onClick={() => {
                  onAdd(names.slice(0, availableSlots));
                  setText("");
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tambah ke Daftar ({names.length})
              </button>
              {text && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setText("")}
                >
                  Bersihkan
                </button>
              )}
            </div>

            <div className="bulk-quota">
              <span className="bulk-quota-text">
                Kapasitas: <strong>{count}/{max}</strong> desain
              </span>
              <div className="bulk-quota-bar">
                <div
                  className="bulk-quota-fill"
                  style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DesignChips({
  labels,
  sel,
  onSel,
  onRemove,
}: {
  labels: string[];
  sel: number;
  onSel: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  if (labels.length < 2) return null;
  return (
    <div className="design-chips-bar" role="tablist" aria-label="Daftar varian desain">
      <div className="dchips-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span>Varian Desain ({labels.length}):</span>
      </div>
      <div className="dchips-list">
        {labels.map((l, i) => (
          <div key={i} className={`dchip ${i === sel ? "is-active" : ""}`}>
            <button
              type="button"
              onClick={() => onSel(i)}
              className="dchip-main"
              title={`Lihat 3D untuk ${l || `Desain ${i + 1}`}`}
            >
              <span className="dchip-n">{i + 1}</span>
              <span className="dchip-text">{l || `Desain ${i + 1}`}</span>
              {i === sel && <span className="dchip-dot" />}
            </button>
            <button
              type="button"
              className="dchip-x"
              aria-label={`Hapus desain ${i + 1}`}
              title="Hapus varian ini"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

