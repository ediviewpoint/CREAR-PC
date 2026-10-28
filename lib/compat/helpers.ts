import type { ComponentCategory } from "@/lib/schemas/components";
import type { BuildItemBase, BuildView, Issue, Severity } from "./types";

export function makeIssue(
  code: string,
  severity: Severity,
  messageEs: string,
  involved: { category: ComponentCategory; componentId: string }[],
): Issue {
  return { code, severity, messageEs, involved };
}

export function sumTdp(build: BuildView): number {
  let total = 0;
  const push = (item?: BuildItemBase) => {
    if (!item) return;
    total += (item.tdpW ?? 0) * item.quantity;
  };
  push(build.cpu);
  push(build.gpu);
  push(build.mobo); // suele ser null — no suma
  push(build.case); // suele ser null — no suma
  // RAM, storage, coolers tienen TDP bajo (<10W) — contemplado si viene
  build.ram.forEach(push);
  build.storage.forEach(push);
  push(build.coolerAir);
  push(build.coolerAio);
  return total;
}

export function sumTotalBob(build: BuildView): number {
  let total = 0;
  const push = (item?: BuildItemBase) => {
    if (!item) return;
    total += item.priceBob * item.quantity;
  };
  push(build.cpu);
  push(build.gpu);
  push(build.mobo);
  push(build.psu);
  push(build.case);
  push(build.coolerAir);
  push(build.coolerAio);
  build.ram.forEach(push);
  build.storage.forEach(push);
  return total;
}

export function totalRamModules(build: BuildView): number {
  return build.ram.reduce((acc, r) => acc + r.spec.kitQty * r.quantity, 0);
}

export function totalRamGb(build: BuildView): number {
  return build.ram.reduce((acc, r) => acc + r.spec.capacityGb * r.spec.kitQty * r.quantity, 0);
}

export function maxPcieGen(moboChipsetSlots: {
  pcie5Slots: number;
  pcie4Slots: number;
  pcie3Slots: number;
}): 3 | 4 | 5 {
  if (moboChipsetSlots.pcie5Slots > 0) return 5;
  if (moboChipsetSlots.pcie4Slots > 0) return 4;
  return 3;
}

/**
 * Normaliza un score bruto a 0-100 usando un referente conocido.
 * Se mantiene simple y lineal; afinamiento futuro con calibración real.
 */
export function normalizeScore(score: number, maxReference: number): number {
  if (maxReference <= 0) return 0;
  return Math.min(100, Math.max(0, (score / maxReference) * 100));
}
