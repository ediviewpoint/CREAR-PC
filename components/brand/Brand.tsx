import type { SVGProps } from "react";
import Image from "next/image";
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m7 9 12-4 7 5v17l-12 4-7-5Z" />
      <path d="m7 9 7 5 12-4M14 14v17M19 5v9M19 23l7 4M7 21l7 5" />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand brand--elite">
      <span className="brand-logo">
        <Image
          src="/brand/elitepc-original.jpg"
          alt="ELITEPC Business Solutions"
          width={640}
          height={640}
          priority
        />
      </span>
      <span className="brand-product">
        CREAR PC<span>Configurador de ELITEPC</span>
      </span>
    </span>
  );
}
