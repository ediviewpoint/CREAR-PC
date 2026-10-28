"use client";
import { useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { CaseDrawing } from "@/components/visuals/CaseDrawing";
export function CaseExperience() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse" || !ref.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    ref.current.style.setProperty(
      "--rotate-y",
      `${((event.clientX - box.left) / box.width - 0.5) * 10}deg`,
    );
    ref.current.style.setProperty(
      "--rotate-x",
      `${-((event.clientY - box.top) / box.height - 0.5) * 6}deg`,
    );
  }
  function reset() {
    ref.current?.style.setProperty("--rotate-y", "0deg");
    ref.current?.style.setProperty("--rotate-x", "0deg");
  }
  return (
    <div className="case-stage" onPointerMove={move} onPointerLeave={reset}>
      <div
        ref={ref}
        className="case-stage__object"
        style={{ "--rotate-y": "0deg", "--rotate-x": "0deg" } as CSSProperties}
      >
        <CaseDrawing populated />
      </div>
      <div className="case-stage__annotation">
        <span>01 / El punto de partida</span>
        <span>Chasis · vista conceptual</span>
      </div>
    </div>
  );
}
