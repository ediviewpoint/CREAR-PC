"use client";
import { useRef, useState } from "react";
import type { TouchEvent } from "react";
export function useBuildWizard(total: number, initialStep = 0, onNavigate?: () => void) {
  const [step, setStep] = useState(initialStep);
  const origin = useRef<{ x: number; y: number } | null>(null);
  function goTo(index: number) {
    setStep(Math.min(total - 1, Math.max(0, index)));
    onNavigate?.();
  }
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    origin.current = t ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0],
      start = origin.current;
    origin.current = null;
    if (!t || !start) return;
    const dx = t.clientX - start.x,
      dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(step + (dx < 0 ? 1 : -1));
  }
  return {
    step,
    goTo,
    next: () => goTo(step + 1),
    previous: () => goTo(step - 1),
    progress: ((step + 1) / total) * 100,
    onTouchStart,
    onTouchEnd,
  };
}
