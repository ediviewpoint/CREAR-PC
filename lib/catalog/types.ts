import type { BuildView } from "@/lib/compat/types";
import type { HardwareKind } from "@/components/icons";
export type Selection =
  | { category: "cpu"; item: NonNullable<BuildView["cpu"]> }
  | { category: "gpu"; item: NonNullable<BuildView["gpu"]> }
  | { category: "mobo"; item: NonNullable<BuildView["mobo"]> }
  | { category: "ram"; item: BuildView["ram"][number] }
  | { category: "storage"; item: BuildView["storage"][number] }
  | { category: "psu"; item: NonNullable<BuildView["psu"]> }
  | { category: "case"; item: NonNullable<BuildView["case"]> }
  | { category: "coolerAir"; item: NonNullable<BuildView["coolerAir"]> }
  | { category: "coolerAio"; item: NonNullable<BuildView["coolerAio"]> };
export type CatalogComponent = {
  id: string;
  slug: string;
  category: HardwareKind;
  brand: string;
  name: string;
  priceBob: number | null;
  source?: "database" | "seed";
  offerId?: string;
  priceMaxBob?: number;
  stockQty?: number | null;
  storeCount?: number;
  imageAlt?: string;
  priceSource?: { url: string; observedAt: string; store: string };
  image?: string;
  images?: { id: string; url: string; alt: string }[];
  warrantyMonths?: number | null;
  specs: { label: string; value: string }[];
  sources: { url: string; fetchedAt?: string }[];
  selection: Selection;
  benchmarks?: { name: string; score: number; max: number; sourceUrl: string }[];
};
export type SelectedComponent = { component: CatalogComponent; owned: boolean; quantity?: number };
export const CATEGORIES: { key: HardwareKind; label: string }[] = [
  { key: "cpu", label: "Procesador" },
  { key: "mobo", label: "Placa madre" },
  { key: "ram", label: "Memoria" },
  { key: "gpu", label: "Tarjeta gráfica" },
  { key: "storage", label: "Almacenamiento" },
  { key: "psu", label: "Fuente" },
  { key: "case", label: "Chasis" },
  { key: "cooler", label: "Refrigeración" },
];
