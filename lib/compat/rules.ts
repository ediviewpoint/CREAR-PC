import type { BuildView, Issue } from "./types";
import {
  makeIssue,
  maxPcieGen,
  normalizeScore,
  sumTdp,
  totalRamGb,
  totalRamModules,
} from "./helpers";

type RuleFn = (build: BuildView) => Issue[];

// ============================================================
// Reglas BLOQUEANTES — todas devuelven `error`
// ============================================================

/** R-01 · Socket CPU ↔ Mobo */
export const R01_socket: RuleFn = (b) => {
  if (!b.cpu || !b.mobo) return [];
  if (b.cpu.spec.socket !== b.mobo.spec.socket) {
    return [
      makeIssue(
        "R-01",
        "error",
        `El CPU usa socket ${b.cpu.spec.socket}, la placa madre usa ${b.mobo.spec.socket}. No encajan.`,
        [
          { category: "cpu", componentId: b.cpu.componentId },
          { category: "mobo", componentId: b.mobo.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-02 · Tipo de RAM ↔ Mobo */
export const R02_ramType: RuleFn = (b) => {
  if (!b.mobo || b.ram.length === 0) return [];
  const issues: Issue[] = [];
  for (const r of b.ram) {
    if (r.spec.type !== b.mobo.spec.memoryType) {
      issues.push(
        makeIssue(
          "R-02",
          "error",
          `La placa requiere ${b.mobo.spec.memoryType}, pero elegiste RAM ${r.spec.type}.`,
          [
            { category: "mobo", componentId: b.mobo.componentId },
            { category: "ram", componentId: r.componentId },
          ],
        ),
      );
    }
  }
  return issues;
};

/** R-03 · Slots de RAM */
export const R03_ramSlots: RuleFn = (b) => {
  if (!b.mobo || b.ram.length === 0) return [];
  const total = totalRamModules(b);
  if (total > b.mobo.spec.memorySlots) {
    return [
      makeIssue(
        "R-03",
        "error",
        `La placa solo tiene ${b.mobo.spec.memorySlots} slots DIMM y estás usando ${total} módulos.`,
        [{ category: "mobo", componentId: b.mobo.componentId }],
      ),
    ];
  }
  return [];
};

/** R-04 · Capacidad RAM máxima */
export const R04_ramCapacity: RuleFn = (b) => {
  if (!b.mobo || b.ram.length === 0) return [];
  const totalGb = totalRamGb(b);
  if (totalGb > b.mobo.spec.memoryMaxGb) {
    return [
      makeIssue(
        "R-04",
        "error",
        `Supera la capacidad máxima soportada (${b.mobo.spec.memoryMaxGb} GB). Estás montando ${totalGb} GB.`,
        [{ category: "mobo", componentId: b.mobo.componentId }],
      ),
    ];
  }
  return [];
};

/** R-05 · Formato placa ↔ Case */
export const R05_moboCaseFormat: RuleFn = (b) => {
  if (!b.mobo || !b.case) return [];
  if (!b.case.spec.formFactor.includes(b.mobo.spec.formFactor)) {
    return [
      makeIssue(
        "R-05",
        "error",
        `El case no soporta placas ${b.mobo.spec.formFactor}. Soporta: ${b.case.spec.formFactor.join(", ")}.`,
        [
          { category: "case", componentId: b.case.componentId },
          { category: "mobo", componentId: b.mobo.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-06 · Formato PSU ↔ Case */
export const R06_psuCaseFormat: RuleFn = (b) => {
  if (!b.psu || !b.case) return [];
  const psuFormat = b.psu.spec.formFactor;
  if (psuFormat === "ATX12V" || psuFormat === "ATX12VO") return [];
  if (!b.case.spec.psuFormFactor.includes(psuFormat)) {
    return [
      makeIssue(
        "R-06",
        "error",
        `El case no acepta fuentes ${psuFormat}. Soporta: ${b.case.spec.psuFormFactor.join(", ")}.`,
        [
          { category: "case", componentId: b.case.componentId },
          { category: "psu", componentId: b.psu.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-07 · Longitud GPU ↔ Case */
export const R07_gpuLength: RuleFn = (b) => {
  if (!b.gpu || !b.case) return [];
  if (b.gpu.spec.lengthMm > b.case.spec.maxGpuLengthMm) {
    return [
      makeIssue(
        "R-07",
        "error",
        `La GPU mide ${b.gpu.spec.lengthMm} mm, el case solo soporta ${b.case.spec.maxGpuLengthMm} mm.`,
        [
          { category: "gpu", componentId: b.gpu.componentId },
          { category: "case", componentId: b.case.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-08 · Altura cooler aire ↔ Case */
export const R08_coolerHeight: RuleFn = (b) => {
  if (!b.coolerAir || !b.case) return [];
  if (b.coolerAir.spec.heightMm > b.case.spec.maxCoolerHeightMm) {
    return [
      makeIssue(
        "R-08",
        "error",
        `El cooler mide ${b.coolerAir.spec.heightMm} mm, el case acepta hasta ${b.case.spec.maxCoolerHeightMm} mm.`,
        [
          { category: "cooler_air", componentId: b.coolerAir.componentId },
          { category: "case", componentId: b.case.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-09 · Cooler soporta socket del CPU */
export const R09_coolerSocket: RuleFn = (b) => {
  if (!b.cpu) return [];
  const cooler = b.coolerAir ?? b.coolerAio;
  if (!cooler) return [];
  if (!cooler.spec.socketSupport.includes(b.cpu.spec.socket)) {
    return [
      makeIssue(
        "R-09",
        "error",
        `El cooler no incluye montaje para socket ${b.cpu.spec.socket}.`,
        [
          { category: b.coolerAir ? "cooler_air" : "cooler_aio", componentId: cooler.componentId },
          { category: "cpu", componentId: b.cpu.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-10 · AIO radiador cabe en el case */
export const R10_aioRadiator: RuleFn = (b) => {
  if (!b.coolerAio || !b.case) return [];
  const supported = [
    ...b.case.spec.radiatorSupport.front,
    ...b.case.spec.radiatorSupport.top,
    ...b.case.spec.radiatorSupport.rear,
  ];
  if (!supported.includes(b.coolerAio.spec.radiatorSizeMm)) {
    return [
      makeIssue(
        "R-10",
        "error",
        `El case no soporta radiadores de ${b.coolerAio.spec.radiatorSizeMm} mm.`,
        [
          { category: "cooler_aio", componentId: b.coolerAio.componentId },
          { category: "case", componentId: b.case.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-11 · Potencia PSU suficiente */
export const R11_psuWattage: RuleFn = (b) => {
  if (!b.psu) return [];
  const totalTdp = sumTdp(b);
  const required = Math.ceil(totalTdp * 1.3);
  if (b.psu.spec.wattage < required) {
    return [
      makeIssue(
        "R-11",
        "error",
        `La fuente ${b.psu.spec.wattage}W es insuficiente. El build consume ${totalTdp}W; se recomienda al menos ${required}W.`,
        [{ category: "psu", componentId: b.psu.componentId }],
      ),
    ];
  }
  return [];
};

/** R-12 · Conector 12VHPWR para GPU que lo requiere */
export const R12_pcie12vhpwr: RuleFn = (b) => {
  if (!b.gpu || !b.psu) return [];
  const requires12vhpwr =
    b.gpu.spec.powerConnectors.includes("12VHPWR") || b.gpu.spec.powerConnectors.includes("16pin");
  if (requires12vhpwr && b.psu.spec.connectors.pcie12vhpwr === 0) {
    return [
      makeIssue(
        "R-12",
        "error",
        `Esta GPU requiere conector 12VHPWR y la fuente no lo tiene nativo. Verificá si incluye adaptador.`,
        [
          { category: "gpu", componentId: b.gpu.componentId },
          { category: "psu", componentId: b.psu.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-13 · M.2 count */
export const R13_m2Count: RuleFn = (b) => {
  if (!b.mobo) return [];
  const nvmeCount = b.storage.filter((s) => s.spec.storageType === "nvme_m2").length;
  if (nvmeCount > b.mobo.spec.m2Slots) {
    return [
      makeIssue(
        "R-13",
        "error",
        `La placa tiene ${b.mobo.spec.m2Slots} slots M.2 y estás usando ${nvmeCount}.`,
        [{ category: "mobo", componentId: b.mobo.componentId }],
      ),
    ];
  }
  return [];
};

/** R-14 · Bahías 2.5" / 3.5" */
export const R14_bays: RuleFn = (b) => {
  if (!b.case) return [];
  const sata25 = b.storage.filter((s) => s.spec.formFactor === '2.5"').length;
  const hdd35 = b.storage.filter((s) => s.spec.formFactor === '3.5"').length;
  const issues: Issue[] = [];
  if (hdd35 > b.case.spec.bays35) {
    issues.push(
      makeIssue(
        "R-14",
        "error",
        `No hay suficientes bahías 3.5" en el case (necesitás ${hdd35}, hay ${b.case.spec.bays35}).`,
        [{ category: "case", componentId: b.case.componentId }],
      ),
    );
  }
  if (sata25 > b.case.spec.bays25 + Math.max(0, b.case.spec.bays35 - hdd35)) {
    issues.push(
      makeIssue(
        "R-14",
        "error",
        `No hay suficientes bahías 2.5" en el case.`,
        [{ category: "case", componentId: b.case.componentId }],
      ),
    );
  }
  return issues;
};

/** R-15 · Longitud PSU ↔ Case */
export const R15_psuLength: RuleFn = (b) => {
  if (!b.psu || !b.case) return [];
  if (b.psu.spec.lengthMm > b.case.spec.maxPsuLengthMm) {
    return [
      makeIssue(
        "R-15",
        "error",
        `La fuente mide ${b.psu.spec.lengthMm} mm; el case acepta hasta ${b.case.spec.maxPsuLengthMm} mm.`,
        [
          { category: "psu", componentId: b.psu.componentId },
          { category: "case", componentId: b.case.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** R-16 · Cooler TDP cubre CPU */
export const R16_coolerTdp: RuleFn = (b) => {
  if (!b.cpu) return [];
  const cooler = b.coolerAir ?? b.coolerAio;
  if (!cooler) return [];
  if (b.cpu.spec.tdpWBoost > cooler.spec.tdpW) {
    return [
      makeIssue(
        "R-16",
        "error",
        `El cooler soporta ${cooler.spec.tdpW}W; el CPU en boost puede llegar a ${b.cpu.spec.tdpWBoost}W.`,
        [
          { category: b.coolerAir ? "cooler_air" : "cooler_aio", componentId: cooler.componentId },
          { category: "cpu", componentId: b.cpu.componentId },
        ],
      ),
    ];
  }
  return [];
};

// ============================================================
// Advertencias — `warning`
// ============================================================

/** W-01 · Memoria XMP/EXPO necesaria */
export const W01_xmp: RuleFn = (b) => {
  if (!b.mobo || b.ram.length === 0) return [];
  const issues: Issue[] = [];
  for (const r of b.ram) {
    if (r.spec.frequencyMhz > b.mobo.spec.memoryMaxMhz) {
      issues.push(
        makeIssue(
          "W-01",
          "warning",
          `Para alcanzar ${r.spec.frequencyMhz} MHz se requiere XMP/EXPO. Spec JEDEC de la placa: ${b.mobo.spec.memoryMaxMhz} MHz.`,
          [
            { category: "ram", componentId: r.componentId },
            { category: "mobo", componentId: b.mobo.componentId },
          ],
        ),
      );
    }
  }
  return issues;
};

/** W-02 · Cuello de botella CPU ↔ GPU */
export const W02_bottleneck: RuleFn = (b) => {
  if (!b.cpu || !b.gpu || !b.benchmarks) return [];
  const cpuBench = b.benchmarks[b.cpu.componentId]?.["Geekbench 6 Single"];
  const gpuBench = b.benchmarks[b.gpu.componentId]?.["3DMark Time Spy"];
  if (!cpuBench || !gpuBench) return [];
  const cpuScore = normalizeScore(cpuBench, 3500); // ref top single-core ~3500
  const gpuScore = normalizeScore(gpuBench, 35000); // ref RTX 4090 ~35000
  if (cpuScore === 0 || gpuScore === 0) return [];
  const ratio = gpuScore / cpuScore;
  const res = b.targetResolution ?? "1080p";
  if (res === "1080p" && ratio > 1.5) {
    return [
      makeIssue(
        "W-02",
        "warning",
        "Posible cuello de botella: la GPU es muy superior al CPU para 1080p.",
        [
          { category: "cpu", componentId: b.cpu.componentId },
          { category: "gpu", componentId: b.gpu.componentId },
        ],
      ),
    ];
  }
  if (res === "4K" && ratio < 0.6) {
    return [
      makeIssue(
        "W-02",
        "warning",
        "Posible cuello de botella: el CPU es muy superior a la GPU para 4K.",
        [
          { category: "cpu", componentId: b.cpu.componentId },
          { category: "gpu", componentId: b.gpu.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** W-03 · Eficiencia PSU */
export const W03_psuEfficiency: RuleFn = (b) => {
  if (!b.psu) return [];
  const totalTdp = sumTdp(b);
  if (totalTdp > 500 && b.psu.spec.efficiencyRating === "80+ White") {
    return [
      makeIssue(
        "W-03",
        "warning",
        "Se recomienda una fuente 80+ Gold o superior para builds de más de 500W.",
        [{ category: "psu", componentId: b.psu.componentId }],
      ),
    ];
  }
  return [];
};

/** W-04 · Case sin mesh frontal + GPU alta TDP */
export const W04_airflow: RuleFn = (b) => {
  if (!b.gpu || !b.case) return [];
  const isGlass = b.case.spec.sidePanel === "glass" || b.case.spec.sidePanel === "solid";
  if (b.gpu.spec.tdpW > 300 && isGlass) {
    return [
      makeIssue(
        "W-04",
        "warning",
        "Flujo de aire limitado para una GPU de más de 300W. Considerá un case con malla frontal.",
        [
          { category: "gpu", componentId: b.gpu.componentId },
          { category: "case", componentId: b.case.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** W-05 · Altura RAM ↔ Cooler aire */
export const W05_ramClearance: RuleFn = (b) => {
  if (!b.coolerAir || b.ram.length === 0) return [];
  const clearance = b.coolerAir.spec.ramClearanceMm;
  if (clearance === undefined) return [];
  const issues: Issue[] = [];
  for (const r of b.ram) {
    if (r.spec.heightMm > clearance) {
      issues.push(
        makeIssue(
          "W-05",
          "warning",
          `La RAM mide ${r.spec.heightMm} mm; el cooler puede interferir con módulos sobre ${clearance} mm.`,
          [
            { category: "cooler_air", componentId: b.coolerAir.componentId },
            { category: "ram", componentId: r.componentId },
          ],
        ),
      );
    }
  }
  return issues;
};

/** W-06 · PCIe gen GPU vs Mobo */
export const W06_pcieGenGpu: RuleFn = (b) => {
  if (!b.gpu || !b.mobo) return [];
  const moboMaxGen = maxPcieGen(b.mobo.spec);
  if (b.gpu.spec.pcieGen > moboMaxGen) {
    return [
      makeIssue(
        "W-06",
        "warning",
        `La GPU es PCIe ${b.gpu.spec.pcieGen} y la placa soporta hasta PCIe ${moboMaxGen}. Funciona, pero no aprovecha el ancho de banda extra.`,
        [
          { category: "gpu", componentId: b.gpu.componentId },
          { category: "mobo", componentId: b.mobo.componentId },
        ],
      ),
    ];
  }
  return [];
};

/** W-07 · NVMe Gen vs Mobo */
export const W07_nvmeGen: RuleFn = (b) => {
  if (!b.mobo) return [];
  const issues: Issue[] = [];
  for (const s of b.storage) {
    if (s.spec.storageType !== "nvme_m2" || s.spec.nvmeGen === undefined) continue;
    if (s.spec.nvmeGen > b.mobo.spec.m2MaxGen) {
      issues.push(
        makeIssue(
          "W-07",
          "warning",
          `El SSD es Gen ${s.spec.nvmeGen}; la placa máxima Gen ${b.mobo.spec.m2MaxGen}. Funcionará a la velocidad del slot.`,
          [
            { category: "storage", componentId: s.componentId },
            { category: "mobo", componentId: b.mobo.componentId },
          ],
        ),
      );
    }
  }
  return issues;
};

/** W-08 · Dual channel RAM */
export const W08_dualChannel: RuleFn = (b) => {
  if (b.ram.length !== 1) return [];
  const only = b.ram[0];
  if (!only) return [];
  if (only.spec.kitQty === 1 && only.quantity === 1) {
    return [
      makeIssue(
        "W-08",
        "warning",
        "Instalar un solo módulo de RAM impide dual channel y reduce el rendimiento.",
        [{ category: "ram", componentId: only.componentId }],
      ),
    ];
  }
  return [];
};

// ============================================================
// Informativas — `info`
// ============================================================

/** I-01 · WiFi integrado */
export const I01_wifi: RuleFn = (b) => {
  if (!b.mobo) return [];
  if (!b.mobo.spec.wifi) {
    return [
      makeIssue(
        "I-01",
        "info",
        "Esta placa no tiene WiFi integrado. Considerá un adaptador USB o un cable de red.",
        [{ category: "mobo", componentId: b.mobo.componentId }],
      ),
    ];
  }
  return [];
};

/** I-02 · iGPU disponible */
export const I02_igpu: RuleFn = (b) => {
  if (!b.cpu || b.gpu) return [];
  if (b.cpu.spec.iGpu) {
    return [
      makeIssue(
        "I-02",
        "info",
        `El CPU incluye gráficos integrados${
          b.cpu.spec.iGpuModel ? ` (${b.cpu.spec.iGpuModel})` : ""
        } — podés arrancar sin GPU discreta.`,
        [{ category: "cpu", componentId: b.cpu.componentId }],
      ),
    ];
  }
  return [];
};

/** I-03 · Fuente modular */
export const I03_modular: RuleFn = (b) => {
  if (!b.psu) return [];
  if (b.psu.spec.modular === "none") {
    return [
      makeIssue(
        "I-03",
        "info",
        "Fuente no modular — todos los cables van fijos. Afecta estética y cable management.",
        [{ category: "psu", componentId: b.psu.componentId }],
      ),
    ];
  }
  return [];
};

// ============================================================
// Registro de todas las reglas
// ============================================================

export const ALL_RULES: readonly RuleFn[] = [
  R01_socket,
  R02_ramType,
  R03_ramSlots,
  R04_ramCapacity,
  R05_moboCaseFormat,
  R06_psuCaseFormat,
  R07_gpuLength,
  R08_coolerHeight,
  R09_coolerSocket,
  R10_aioRadiator,
  R11_psuWattage,
  R12_pcie12vhpwr,
  R13_m2Count,
  R14_bays,
  R15_psuLength,
  R16_coolerTdp,
  W01_xmp,
  W02_bottleneck,
  W03_psuEfficiency,
  W04_airflow,
  W05_ramClearance,
  W06_pcieGenGpu,
  W07_nvmeGen,
  W08_dualChannel,
  I01_wifi,
  I02_igpu,
  I03_modular,
];
