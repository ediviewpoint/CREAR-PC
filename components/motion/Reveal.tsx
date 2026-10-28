"use client";
import { useEffect, useRef } from "react";
import { animate, inView } from "motion";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
/** Server output remains visible with JavaScript disabled. */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced !== false || !ref.current) return;
    return inView(
      ref.current,
      (element) => {
        const animation = animate(
          element,
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] },
        );
        return () => animation.stop();
      },
      { amount: 0.15 },
    );
  }, [reduced, index]);
  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
