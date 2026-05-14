"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-save form data to localStorage.
 * - On mount: returns saved data if available
 * - On every change: debounced save to localStorage
 * - clearDraft(): remove saved data after successful submit
 */
export function useAutoSave<T>(key: string, data: T, delayMs = 800) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // localStorage full or unavailable
      }
    }, delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [key, data, delayMs]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  return { clearDraft };
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
