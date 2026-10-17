"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ReactNode, DragEvent } from "react";
import { FONT_OPTIONS } from "@/lib/fonts";
import { PALETTE, colorName } from "@/lib/palette";
import { readFileAsDataUrl } from "@/lib/hooks";
import { formatRp, marketplacePrice } from "@/lib/pricing";

/* ------------------------------------------------------------ Accordion -- */

export function AccordionItem({
  id,
  title,
  subtitle,
  badge,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`acc-item ${isOpen ? "is-open" : ""}`} id={id}>
      <button
        type="button"
        className="acc-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="acc-header-left">
          {icon && <span className="acc-icon">{icon}</span>}
          <div className="acc-title-wrap">
            <span className="acc-title">{title}</span>
            {subtitle && <span className="acc-sub">{subtitle}</span>}
          </div>
        </div>
        <div className="acc-header-right">
          {badge && <span className="acc-badge">{badge}</span>}
          <svg
            className={`acc-chevron ${isOpen ? "is-rotated" : ""}`}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {isOpen && <div className="acc-content">{children}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Tabs -- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          aria-selected={value === t.id}
          className={`tab ${value === t.id ? "is-active" : ""}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type SegmentedOption<T extends string | number> = {
  id?: T;
  value?: T;
  label: string;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  id,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  id?: string;
}) {
  return (
    <div className="seg" id={id}>
      {options.map((o, idx) => {
        const optVal = (o.id !== undefined ? o.id : o.value) as T;
        return (
          <button
            key={String(optVal ?? idx)}
            type="button"
            className={`seg-btn ${value === optVal ? "is-active" : ""}`}
            onClick={() => onChange(optVal)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`chip ${value === o ? "is-active" : ""}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Fields -- */

export function Field({
  label,
  hint,
  right,
  children,
}: {
  label?: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label && (
        <div className="field-label">
          <span>{label}</span>
          {right}
        </div>
      )}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  max,
  placeholder,
  id,
  upper,
}: {
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  id?: string;
  upper?: boolean;
}) {
  return (
    <div className="input-wrap">
      <input
        id={id}
        className="input"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) =>
          onChange(upper ? e.target.value.toUpperCase() : e.target.value)
        }
      />
      <span className="counter">
        {value.length}/{max}
      </span>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "mm",
  onChange,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  id?: string;
}) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="val">
          {Number.isInteger(step) ? value : value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Font -- */

export function FontPicker({
  value,
  sample,
  onChange,
}: {
  value: string;
  sample: string;
  onChange: (id: string) => void;
}) {
  const shown = (sample || "Aa").slice(0, 12);
  return (
    <div className="font-grid">
      {FONT_OPTIONS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`font-card ${value === f.id ? "is-active" : ""}`}
          onClick={() => onChange(f.id)}
          id={`font-${f.id}`}
        >
          <span
            className="font-sample"
            style={{ fontFamily: `"preview-${f.id}", system-ui` }}
          >
            {shown}
          </span>
          <span className="font-name">{f.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Muat font untuk pratinjau kartu (CSS @font-face dinamis). */
export function FontPreviewLoader() {
  useEffect(() => {
    const faces = FONT_OPTIONS.map((f) => {
      const ff = new FontFace(`preview-${f.id}`, `url(${f.file})`);
      ff.load()
        .then((l) => document.fonts.add(l))
        .catch(() => undefined);
      return ff;
    });
    return () => {
      faces.forEach((f) => document.fonts.delete(f));
    };
  }, []);
  return null;
}

/* ---------------------------------------------------------------- Color -- */

export function ColorSelect({
  label,
  value,
  onChange,
  hint,
  warn,
}: {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  hint?: string;
  warn?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popStyle, setPopStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);

  // Popup di-portal ke <body> dengan posisi fixed agar tidak terpotong panel
  // yang bisa di-scroll / tertutup footer harga. Membuka ke atas bila ruang bawah sempit.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const tr = triggerRef.current?.getBoundingClientRect();
      if (!tr) return;
      const popH = popRef.current?.offsetHeight ?? 120;
      const gap = 6;
      const vh = window.innerHeight;
      const below = vh - tr.bottom - gap;
      const above = tr.top - gap;
      const up = below < popH + 8 && above > below;
      setPopStyle({
        position: "fixed",
        left: tr.left,
        width: tr.width,
        top: up ? Math.max(8, tr.top - gap - popH) : tr.bottom + gap,
        right: "auto",
        zIndex: 1000,
      });
    };
    place();
    // ukur ulang setelah popup dirender (tinggi sebenarnya)
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <div className="field" ref={ref}>
      {label && (
        <div className="field-label">
          <span>{label}</span>
        </div>
      )}
      <div className="color-select">
        <button
          ref={triggerRef}
          type="button"
          className="color-trigger"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <i className="swatch" style={{ background: value }} />
          <span>{colorName(value)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {open &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={popRef}
              className="color-pop"
              style={popStyle ?? { position: "fixed", visibility: "hidden", top: 0, left: 0 }}
            >
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  className={`color-dot ${
                    c.hex.toLowerCase() === value.toLowerCase() ? "is-active" : ""
                  }`}
                  style={{ background: c.hex }}
                  onClick={() => {
                    onChange(c.hex);
                    setOpen(false);
                  }}
                />
              ))}
            </div>,
            document.body,
          )}
      </div>
      {hint && <p className="hint">{hint}</p>}
      {warn && <p className="warn">{warn}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- Upload -- */

export function UploadBox({
  onData,
  onImage,
  compact,
  title = "Upload gambar",
}: {
  onData?: (dataUrl: string) => void;
  onImage?: (dataUrl: string) => void;
  compact?: boolean;
  title?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      setErr("Format harus PNG, JPG, WebP, atau SVG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr("Ukuran file maksimal 10MB.");
      return;
    }
    setErr(null);
    const cb = onData ?? onImage;
    if (cb) {
      cb(await readFileAsDataUrl(file));
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handle(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        className={`upload ${drag ? "is-drag" : ""} ${compact ? "is-compact" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        id="upload-dropzone"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 16V5m0 0l-4 4m4-4l4 4M5 19h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <strong>{title}</strong>
        <span>PNG, JPG, WebP, atau SVG · maks. 10MB</span>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          hidden
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {err && <p className="warn">{err}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- Price -- */

export function PriceBox({
  title,
  price,
  pending,
  notes,
  showMarketplace = true,
}: {
  title: string;
  price?: number | null;
  pending?: string;
  notes?: string[];
  showMarketplace?: boolean;
}) {
  return (
    <div className="price-box">
      <div className="price-title">{title}</div>
      {price != null ? (
        <>
          <div className="price" id="price-value">
            {formatRp(price)}
          </div>
          {showMarketplace && (
            <p className="price-sub">
              QRIS sesuai harga di atas · Marketplace{" "}
              <b>{formatRp(marketplacePrice(price))}</b> (termasuk biaya
              marketplace 15%)
            </p>
          )}
        </>
      ) : (
        <div className="price-pending">{pending ?? "Harga muncul setelah desain siap."}</div>
      )}
      {notes?.map((n) => (
        <p className="price-note" key={n}>
          {n}
        </p>
      ))}
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return (
    <div className={`toast ${msg ? "is-on" : ""}`} role="status" aria-live="polite">
      {msg}
    </div>
  );
}
