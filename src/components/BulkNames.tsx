"use client";

import { useState } from "react";

export function BulkNames({
  title,
  max,
  count,
  maxLen,
  onAdd,
  placeholder = "ALYA\nBIMA",
}: {
  title: string;
  /** maksimum desain */
  max: number;
  count: number;
  maxLen: number;
  onAdd: (names: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const names = text
    .split("\n")
    .map((s) => s.trim().slice(0, maxLen))
    .filter(Boolean);

  return (
    <section className="bulk" aria-label="Pesan banyak nama">
      <h2>{title}</h2>
      <p className="bulk-sub">
        Tambahkan nama berbeda tanpa mulai dari awal. Item baru mengikuti
        pengaturan item pertama, lalu warna dan bentuknya bisa diubah
        masing-masing dengan preview 3D sendiri.
      </p>
      <label className="field-label" htmlFor="bulk-textarea">
        <span>Tambah nama (satu nama per baris)</span>
      </label>
      <textarea
        id="bulk-textarea"
        className="input textarea"
        rows={3}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="bulk-row">
        <button
          id="bulk-add"
          type="button"
          className="btn btn-primary"
          disabled={!names.length || count >= max}
          onClick={() => {
            onAdd(names);
            setText("");
          }}
        >
          + Tambah ke daftar
        </button>
        <span className="bulk-count">
          {count}/{max} desain · tidak mengubah desain sebelumnya
        </span>
      </div>
      <p className="hint">
        Daftar nama dan pengaturan teks disalin dari tab ini. Upload gambar atau
        font khusus perlu dipilih ulang jika tulisannya dimuat ulang.
      </p>
    </section>
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
    <div className="design-chips" role="tablist" aria-label="Daftar desain">
      {labels.map((l, i) => (
        <div key={i} className={`dchip ${i === sel ? "is-active" : ""}`}>
          <button type="button" onClick={() => onSel(i)} className="dchip-main">
            <span className="dchip-n">{i + 1}</span>
            {l || "(kosong)"}
          </button>
          <button
            type="button"
            className="dchip-x"
            aria-label={`Hapus desain ${i + 1}`}
            onClick={() => onRemove(i)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
