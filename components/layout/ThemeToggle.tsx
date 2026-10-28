"use client";
import { useState } from "react";
export function ThemeToggle() {
  const [choice, setChoice] = useState<"system" | "light" | "dark">("system");
  function change() {
    const next = choice === "system" ? "light" : choice === "light" ? "dark" : "system";
    setChoice(next);
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={change}
      aria-label={`Tema actual: ${choice === "system" ? "sistema" : choice === "light" ? "claro" : "oscuro"}. Cambiar tema`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        {choice === "dark" ? (
          <path d="M20 14.3A8.2 8.2 0 0 1 9.7 4 8.3 8.3 0 1 0 20 14.3Z" />
        ) : choice === "light" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <>
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </>
        )}
      </svg>
      Tema: {choice === "system" ? "sistema" : choice === "light" ? "claro" : "oscuro"}
    </button>
  );
}
