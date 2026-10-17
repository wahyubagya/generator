"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Tabs, Toast } from "@/components/ui";

export function GeneratorShell<T extends string = string>({
  title,
  subtitle,
  teaser,
  top,
  beforeGrid,
  tabs,
  tab,
  onTab,
  stage,
  panel,
  foot,
  toast,
}: {
  title: string;
  subtitle: string;
  teaser?: string;
  top?: ReactNode;
  beforeGrid?: ReactNode;
  tabs?: { id: T; label: string }[];
  tab?: T;
  onTab?: (t: T) => void;
  stage: ReactNode;
  panel: ReactNode;
  foot: ReactNode;
  toast: string | null;
}) {
  return (
    <div className="gen">
      {top}
      <div className="gen-head">
        <div>
          <h1>{title}</h1>
          <p className="gen-sub">{subtitle}</p>
          {teaser && <p className="gen-teaser">{teaser}</p>}
        </div>
        <Link href="/" className="btn btn-ghost" id="link-other-options">
          Lihat pilihan lain
        </Link>
      </div>
      {beforeGrid}
      <div className="gen-grid">
        <div className="gen-stage-col">
          <section className="stage" aria-label="Pratinjau 3D">
            {stage}
          </section>
        </div>
        <aside className="panel gen-custom-panel" aria-label="Pengaturan desain">
          {tabs && tab && onTab && <Tabs tabs={tabs} value={tab} onChange={onTab} />}
          <div className="panel-body">
            {panel}
            {foot && (
              <section className="gen-price-card" aria-label="Ringkasan Pesanan & Harga">
                {foot}
              </section>
            )}
          </div>
        </aside>
      </div>
      <Toast msg={toast} />
    </div>
  );
}

export function ModeSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mode-switch" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          id={`mode-${o.id}`}
          className={`mode-btn ${value === o.id ? "is-active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const IconText = (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M5 6V4h14v2M12 4v16M9 20h6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const IconImage = (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="10" r="1.6" fill="currentColor" />
    <path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
