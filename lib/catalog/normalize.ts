import { z } from "zod";
import {
  specCpu,
  specGpu,
  specMobo,
  specRam,
  specStorage,
  specPsu,
  specCase,
  specCoolerAir,
  specCoolerAio,
} from "@/lib/schemas/components";
import type { CatalogComponent, Selection } from "./types";
const source = z.object({ url: z.url(), fetchedAt: z.string().optional() });
const envelope = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  brand: z.string(),
  name_display: z.string(),
  tdp_w: z.number().nullable().optional(),
  spec: z.record(z.string(), z.unknown()),
  sources: z.array(source).default([]),
});
export function adapt(row: z.infer<typeof envelope>, kind: string): Selection | null {
  // Seed uses null for some optional fields. Domain schemas use undefined.
  const spec = Object.fromEntries(Object.entries(row.spec).filter(([, value]) => value !== null));
  const base = {
    componentId: row.id ?? row.slug,
    nameDisplay: row.name_display,
    tdpW: row.tdp_w ?? null,
    priceBob: 0,
    quantity: 1,
  };
  switch (kind) {
    case "cpu": {
      const r = specCpu.safeParse(spec);
      return r.success ? { category: "cpu", item: { ...base, spec: r.data } } : null;
    }
    case "gpu": {
      const r = specGpu.safeParse(spec);
      return r.success ? { category: "gpu", item: { ...base, spec: r.data } } : null;
    }
    case "mobo": {
      const r = specMobo.safeParse(spec);
      return r.success ? { category: "mobo", item: { ...base, spec: r.data } } : null;
    }
    case "ram": {
      const r = specRam.safeParse(spec);
      return r.success ? { category: "ram", item: { ...base, spec: r.data } } : null;
    }
    case "storage": {
      const r = specStorage.safeParse(spec);
      return r.success ? { category: "storage", item: { ...base, spec: r.data } } : null;
    }
    case "psu": {
      const r = specPsu.safeParse(spec);
      return r.success ? { category: "psu", item: { ...base, spec: r.data } } : null;
    }
    case "case": {
      const r = specCase.safeParse(spec);
      return r.success ? { category: "case", item: { ...base, spec: r.data } } : null;
    }
    case "cooler_air": {
      const r = specCoolerAir.safeParse(spec);
      return r.success ? { category: "coolerAir", item: { ...base, spec: r.data } } : null;
    }
    case "cooler_aio": {
      const r = specCoolerAio.safeParse(spec);
      return r.success ? { category: "coolerAio", item: { ...base, spec: r.data } } : null;
    }
    default:
      return null;
  }
}
export const FILE_CATEGORIES: Record<string, string> = {
  "cpus.json": "cpu",
  "gpus.json": "gpu",
  "mobos.json": "mobo",
  "motherboards.json": "mobo",
  "ram.json": "ram",
  "storage.json": "storage",
  "psus.json": "psu",
  "cases.json": "case",
  "coolers_air.json": "cooler_air",
  "coolers_aio.json": "cooler_aio",
};
const labels: Record<string, string> = {
  socket: "Socket",
  cores: "Núcleos",
  threads: "Hilos",
  boostClockGhz: "Boost (GHz)",
  tdpWBase: "TDP (W)",
  vramGb: "VRAM (GB)",
  lengthMm: "Longitud (mm)",
  memoryType: "Memoria",
  formFactor: "Formato",
  capacityGb: "Capacidad (GB)",
  frequencyMhz: "Frecuencia (MHz)",
  wattage: "Potencia (W)",
  efficiencyRating: "Eficiencia",
  heightMm: "Altura (mm)",
  radiatorSizeMm: "Radiador (mm)",
};

export function normalizeComponent(value: unknown, kind: string): CatalogComponent | null {
  const row = envelope.safeParse(value);
  if (!row.success) return null;
  const selection = adapt(row.data, kind);
  if (!selection) return null;
  const category = kind === "cooler_air" || kind === "cooler_aio" ? "cooler" : selection.category;
  if (category === "coolerAir" || category === "coolerAio") return null;
  return {
    id: row.data.id ?? row.data.slug,
    slug: row.data.slug,
    category,
    brand: row.data.brand,
    name: row.data.name_display,
    priceBob: null,
    selection,
    sources: row.data.sources,
    specs: Object.entries(row.data.spec)
      .filter(([key]) => key in labels)
      .slice(0, 8)
      .map(([key, value]) => ({
        label: labels[key] ?? key,
        value: Array.isArray(value) ? value.join(" / ") : String(value),
      })),
  };
}
