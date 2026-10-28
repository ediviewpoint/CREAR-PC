"use client";
import { motion, useReducedMotion } from "motion/react";
import type { CatalogComponent } from "@/lib/catalog/types";
export function Benchmarks({ data }: { data: CatalogComponent["benchmarks"] }) {
  const reduce = useReducedMotion();
  if (!data?.length)
    return <p className="muted">Todavía no hay benchmarks con fuente para esta pieza.</p>;
  return (
    <div className="benchmarks">
      {data.map((b) => (
        <div key={b.name}>
          <div>
            <span>{b.name}</span>
            <span className="mono">{b.score}</span>
          </div>
          <div className="benchmark-track">
            <motion.div
              initial={{ scaleX: reduce ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 0.4 }}
              style={{
                width: `${Math.min(100, Math.max(0, b.max > 0 ? (b.score / b.max) * 100 : 0))}%`,
              }}
            />
          </div>
          <a href={b.sourceUrl} target="_blank" rel="noreferrer" className="small">
            Fuente del benchmark ↗
          </a>
        </div>
      ))}
    </div>
  );
}
