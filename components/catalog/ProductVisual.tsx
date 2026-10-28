"use client";
import { useState } from "react";
import { HardwareStudy } from "./HardwareStudy";
import { CATEGORIES } from "@/lib/catalog/types";
import type { HardwareKind } from "@/components/icons";
export function ProductVisual({
  category,
  name,
  image,
  imageAlt,
}: {
  category: HardwareKind;
  name: string;
  image?: string;
  imageAlt?: string;
}) {
  const [failedImage, setFailedImage] = useState<string>();
  const categoryName = CATEGORIES.find((item) => item.key === category)?.label ?? category;
  return (
    <div className={"product-visual product-visual--" + category}>
      {image && failedImage !== image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={imageAlt || name}
          width="480"
          height="360"
          decoding="async"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <>
          <svg className="product-drafting" viewBox="0 0 480 360" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth=".7">
              <circle cx="240" cy="168" r="100" />
              <circle cx="240" cy="168" r="120" strokeDasharray="2 7" />
              <path d="M86 168h34m240 0h34M240 24v24m0 240v24M100 64h24M112 52v24m244 196h24m-12-12v24M130 306h220m-220-5v10m220-10v10" />
            </g>
            <text
              x="240"
              y="332"
              textAnchor="middle"
              fill="currentColor"
              fontFamily="monospace"
              fontSize="9"
              letterSpacing="2"
            >
              CREAR PC / ESTUDIO DE COMPONENTE
            </text>
          </svg>
          <HardwareStudy category={category} />
          <span>
            {failedImage === image && image ? "Foto no disponible · " : "Esquema de categoría · "}
            {categoryName}
          </span>
        </>
      )}
    </div>
  );
}
