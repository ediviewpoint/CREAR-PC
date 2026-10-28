import type { BuildView } from "@/lib/compat/types";
import type { SelectedComponent } from "./types";
export function toBuildView(selected: SelectedComponent[]): BuildView {
  const build: BuildView = { ram: [], storage: [] };
  for (const { component, owned, quantity = 1 } of selected) {
    const s = component.selection;
    const priceBob = owned ? 0 : (component.priceBob ?? 0);
    switch (s.category) {
      case "cpu":
        build.cpu = { ...s.item, priceBob, quantity };
        break;
      case "gpu":
        build.gpu = { ...s.item, priceBob, quantity };
        break;
      case "mobo":
        build.mobo = { ...s.item, priceBob, quantity };
        break;
      case "psu":
        build.psu = { ...s.item, priceBob, quantity };
        break;
      case "case":
        build.case = { ...s.item, priceBob, quantity };
        break;
      case "ram":
        build.ram.push({ ...s.item, priceBob, quantity });
        break;
      case "storage":
        build.storage.push({ ...s.item, priceBob, quantity });
        break;
      case "coolerAir":
        build.coolerAir = { ...s.item, priceBob, quantity };
        break;
      case "coolerAio":
        build.coolerAio = { ...s.item, priceBob, quantity };
        break;
    }
  }
  return build;
}
export function isCompleteBuild(build: BuildView): boolean {
  return Boolean(
    build.cpu &&
    build.mobo &&
    build.ram.length &&
    build.storage.length &&
    build.psu &&
    build.case &&
    (build.coolerAir || build.coolerAio) &&
    (build.gpu || build.cpu.spec.iGpu),
  );
}
