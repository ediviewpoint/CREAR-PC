import type { schema } from "@/lib/db";
import type {
  BuildItemBase,
  BuildView,
  CaseItem,
  CoolerAioItem,
  CoolerAirItem,
  CpuItem,
  GpuItem,
  MoboItem,
  PsuItem,
  RamItem,
  StorageItem,
} from "./types";
import type {
  SpecCase,
  SpecCoolerAio,
  SpecCoolerAir,
  SpecCpu,
  SpecGpu,
  SpecMobo,
  SpecPsu,
  SpecRam,
  SpecStorage,
} from "@/lib/schemas/components";

type ComponentRow = typeof schema.components.$inferSelect;
type BuildItemRow = typeof schema.buildItems.$inferSelect;

type Bundle = {
  items: BuildItemRow[];
  components: ComponentRow[];
};

function toBase(item: BuildItemRow, component: ComponentRow): BuildItemBase {
  return {
    componentId: component.id,
    nameDisplay: component.nameDisplay,
    tdpW: component.tdpW ?? null,
    priceBob: Number(item.unitPriceBob),
    quantity: item.quantity,
  };
}

/**
 * Convierte filas de `build_items` + `components` en el BuildView que consume
 * el motor de compatibilidad (`lib/compat/evaluate.ts`).
 */
export function buildViewFromRows({ items, components }: Bundle): BuildView {
  const byId = new Map(components.map((c) => [c.id, c]));
  const view: BuildView = { ram: [], storage: [] };

  for (const item of items) {
    const component = byId.get(item.componentId);
    if (!component) continue;
    const base = toBase(item, component);

    switch (component.category) {
      case "cpu":
        view.cpu = { ...base, spec: component.spec as SpecCpu };
        break;
      case "gpu":
        view.gpu = { ...base, spec: component.spec as SpecGpu };
        break;
      case "mobo":
        view.mobo = { ...base, spec: component.spec as SpecMobo };
        break;
      case "ram":
        view.ram.push({ ...base, spec: component.spec as SpecRam } satisfies RamItem);
        break;
      case "storage":
        view.storage.push({ ...base, spec: component.spec as SpecStorage } satisfies StorageItem);
        break;
      case "psu":
        view.psu = { ...base, spec: component.spec as SpecPsu } satisfies PsuItem;
        break;
      case "case":
        view.case = { ...base, spec: component.spec as SpecCase } satisfies CaseItem;
        break;
      case "cooler_air":
        view.coolerAir = {
          ...base,
          spec: component.spec as SpecCoolerAir,
        } satisfies CoolerAirItem;
        break;
      case "cooler_aio":
        view.coolerAio = {
          ...base,
          spec: component.spec as SpecCoolerAio,
        } satisfies CoolerAioItem;
        break;
      case "fan":
      case "monitor":
        // Fan/monitor no participan en reglas de compat core.
        break;
    }
  }

  // Reafirmar types para los campos opcionales con spec específica.
  if (view.cpu) view.cpu = view.cpu as CpuItem;
  if (view.gpu) view.gpu = view.gpu as GpuItem;
  if (view.mobo) view.mobo = view.mobo as MoboItem;

  return view;
}
