"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Font } from "opentype.js";
import { loadFont } from "./fonts";
import { loadReliefSource, type ReliefSource } from "./imageRelief";

export function useFont(id: string): Font | null {
  const [font, setFont] = useState<Font | null>(null);
  useEffect(() => {
    let alive = true;
    loadFont(id)
      .then((f) => alive && setFont(f))
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, [id]);
  return font;
}

const sourceCache = new Map<string, Promise<ReliefSource>>();

export function useReliefSource(url: string | undefined, maxSide = 110) {
  const [state, setState] = useState<{
    key: string;
    src: ReliefSource | null;
    error: string | null;
  }>({ key: "", src: null, error: null });
  const key = url ? `${maxSide}|${url}` : "";
  useEffect(() => {
    if (!url) return;
    let alive = true;
    let p = sourceCache.get(key);
    if (!p) {
      p = loadReliefSource(url, maxSide);
      sourceCache.set(key, p);
    }
    p.then((src) => alive && setState({ key, src, error: null })).catch(
      (e: Error) => {
        sourceCache.delete(key);
        if (alive) setState({ key, src: null, error: e.message });
      },
    );
    return () => {
      alive = false;
    };
  }, [url, key, maxSide]);
  const current = state.key === key ? state : null;
  return {
    source: url && current ? current.src : null,
    error: url && current ? current.error : null,
    loading: !!url && !current,
  };
}

/** Waktu kedaluwarsa draf: 1 hari (24 jam) dalam milidetik */
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export interface DraftPayload<T = unknown> {
  data: T;
  savedAt: number;
  expiresAt: number;
}

export function saveDraft(
  slug: string,
  data: unknown,
  ttlMs: number = DRAFT_TTL_MS
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const payload: DraftPayload = {
      data,
      savedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(`forma:${slug}`, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft<T>(slug: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`forma:${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Cek format payload dengan expiresAt
    if (parsed && typeof parsed === "object" && "expiresAt" in parsed && "data" in parsed) {
      if (Date.now() > parsed.expiresAt) {
        // Draf sudah lewat 1 hari -> bersihkan dari penyimpanan
        localStorage.removeItem(`forma:${slug}`);
        return null;
      }
      return parsed.data as T;
    }

    // Format legacy tanpa expiresAt -> hapus agar sesuai aturan 1 hari
    localStorage.removeItem(`forma:${slug}`);
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`forma:${slug}`);
  } catch {
    // ignore
  }
}

/** Daftar desain (mode "untuk semua nama"): item pertama jadi acuan. */
export function useDesigns<T>(initial: T, max = 8, draftSlug?: string) {
  const [items, setItems] = useState<T[]>([initial]);
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, items.length - 1);
  const current = items[idx];

  // Muat draf tersimpan jika masih berlaku (< 1 hari)
  useEffect(() => {
    if (!draftSlug) return;
    const draft = loadDraft<T[]>(draftSlug);
    if (draft && Array.isArray(draft) && draft.length > 0) {
      setItems(draft);
    }
  }, [draftSlug]);

  const update = useCallback(
    (patch: Partial<T>) =>
      setItems((arr) =>
        arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
      ),
    [idx],
  );

  const addNames = useCallback(
    (names: string[], make: (base: T, name: string) => T) => {
      setItems((arr) => {
        const room = Math.max(0, max - arr.length);
        const added = names.slice(0, room).map((n) => make(arr[0], n));
        if (added.length) setSel(arr.length);
        return [...arr, ...added];
      });
    },
    [max],
  );

  const remove = useCallback(
    (i: number) =>
      setItems((arr) => {
        if (arr.length <= 1) return arr;
        setSel((s) => Math.max(0, Math.min(s > i ? s - 1 : s, arr.length - 2)));
        return arr.filter((_, k) => k !== i);
      }),
    [],
  );

  return { items, sel: idx, setSel, current, update, addNames, remove, max };
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { msg, show };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("File tidak bisa dibaca"));
    r.readAsDataURL(file);
  });
}
