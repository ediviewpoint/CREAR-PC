"use client";
import Image from "next/image";
import { useState } from "react";

export function BrandLogo({
  name,
  logo,
  width = 132,
  height = 42,
  className,
  fallbackClassName = "preview-brand__name",
}: {
  name: string;
  logo?: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState<string>();
  return logo && failed !== logo ? (
    <Image
      src={logo}
      alt={name}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(logo)}
    />
  ) : (
    <span className={fallbackClassName}>{name}</span>
  );
}
