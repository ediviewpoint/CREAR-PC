"use client";
import { useSyncExternalStore } from "react";
const memory = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("elitepc:preference", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("elitepc:preference", callback);
  };
}
export function usePreference(key: string, fallback: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) ?? memory.get(key) ?? fallback;
      } catch {
        return memory.get(key) ?? fallback;
      }
    },
    () => fallback,
  );
  function setValue(next: string) {
    memory.set(key, next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* La preferencia sigue disponible durante la sesión. */
    }
    window.dispatchEvent(new Event("elitepc:preference"));
  }
  return [value, setValue] as const;
}
