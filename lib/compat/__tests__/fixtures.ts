import type {
  CaseItem,
  CoolerAioItem,
  CoolerAirItem,
  CpuItem,
  GpuItem,
  MoboItem,
  PsuItem,
  RamItem,
  StorageItem,
  BuildView,
} from "../types";

/**
 * Fixtures mínimos. Cada factory devuelve defaults compatibles entre sí
 * (AM5 + DDR5 + ATX + case grande + PSU 850W Gold). Tests pueden overridear.
 */

export function makeCpu(overrides?: Partial<CpuItem["spec"]> & { id?: string }): CpuItem {
  const spec: CpuItem["spec"] = {
    socket: "AM5",
    cores: 8,
    threads: 16,
    baseClockGhz: 4.2,
    boostClockGhz: 5.0,
    l2CacheMb: 8,
    l3CacheMb: 96,
    iGpu: true,
    iGpuModel: "AMD Radeon Graphics",
    pcieGen: 5,
    pcieLanes: 24,
    memorySupport: ["DDR5"],
    memoryMaxMhz: 5200,
    memoryMaxGb: 192,
    tdpWBase: 120,
    tdpWBoost: 162,
    unlocked: true,
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "cpu-1",
    nameDisplay: "AMD Ryzen 7 7800X3D",
    tdpW: spec.tdpWBoost,
    priceBob: 3800,
    quantity: 1,
    spec,
  };
}

export function makeGpu(overrides?: Partial<GpuItem["spec"]> & { id?: string }): GpuItem {
  const spec: GpuItem["spec"] = {
    chipset: "RTX 4070",
    vramGb: 12,
    vramType: "GDDR6X",
    busWidthBits: 192,
    baseClockMhz: 1920,
    boostClockMhz: 2475,
    tdpW: 200,
    pcieGen: 4,
    pcieLanes: 16,
    lengthMm: 280,
    widthSlots: 2.5,
    heightMm: 120,
    powerConnectors: ["12VHPWR"],
    outputs: { hdmi: 1, dp: 3, usbC: 0 },
    rayTracing: true,
    dlssFsr: ["DLSS 3.5", "FSR 3"],
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "gpu-1",
    nameDisplay: "NVIDIA RTX 4070",
    tdpW: spec.tdpW,
    priceBob: 4500,
    quantity: 1,
    spec,
  };
}

export function makeMobo(overrides?: Partial<MoboItem["spec"]> & { id?: string }): MoboItem {
  const spec: MoboItem["spec"] = {
    socket: "AM5",
    chipset: "B650E",
    formFactor: "ATX",
    memoryType: "DDR5",
    memorySlots: 4,
    memoryMaxGb: 192,
    memoryMaxMhz: 6400,
    memoryChannels: 2,
    pcie5Slots: 1,
    pcie4Slots: 1,
    pcie3Slots: 2,
    m2Slots: 3,
    m2MaxGen: 5,
    sataPorts: 4,
    usbA: 6,
    usbC: 2,
    wifi: "WiFi 6E",
    bluetooth: "5.3",
    lan: "2.5GbE",
    vrmPhases: 14,
    audioCodec: "ALC1220",
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "mobo-1",
    nameDisplay: "ASUS ROG Strix B650E-F",
    tdpW: null,
    priceBob: 2450,
    quantity: 1,
    spec,
  };
}

export function makeRam(overrides?: Partial<RamItem["spec"]> & { id?: string }): RamItem {
  const spec: RamItem["spec"] = {
    type: "DDR5",
    capacityGb: 16,
    kitQty: 2,
    frequencyMhz: 6000,
    casLatency: 30,
    voltageV: 1.35,
    heightMm: 34,
    xmp: true,
    expo: true,
    colorFinish: "Black",
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "ram-1",
    nameDisplay: "G.Skill Trident Z5 32GB (2x16)",
    tdpW: 5,
    priceBob: 950,
    quantity: 1,
    spec,
  };
}

export function makeStorage(
  overrides?: Partial<StorageItem["spec"]> & { id?: string },
): StorageItem {
  const spec: StorageItem["spec"] = {
    storageType: "nvme_m2",
    interface: "M.2 PCIe 4.0 x4",
    formFactor: "M.2 2280",
    capacityGb: 1000,
    seqReadMbps: 7000,
    seqWriteMbps: 5000,
    dram: true,
    tbw: 700,
    nvmeGen: 4,
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "storage-1",
    nameDisplay: "Samsung 980 Pro 1TB",
    tdpW: 7,
    priceBob: 850,
    quantity: 1,
    spec,
  };
}

export function makePsu(overrides?: Partial<PsuItem["spec"]> & { id?: string }): PsuItem {
  const spec: PsuItem["spec"] = {
    wattage: 850,
    efficiencyRating: "80+ Gold",
    formFactor: "ATX",
    modular: "full",
    lengthMm: 160,
    connectors: {
      cpu8pin: 2,
      cpu4plus4: 2,
      pcie8pin: 4,
      pcie12vhpwr: 1,
      sata: 8,
      molex: 4,
    },
    fanSizeMm: 135,
    fanlessMode: true,
    atx3: true,
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "psu-1",
    nameDisplay: "Corsair RM850x",
    tdpW: null,
    priceBob: 1100,
    quantity: 1,
    spec,
  };
}

export function makeCase(overrides?: Partial<CaseItem["spec"]> & { id?: string }): CaseItem {
  const spec: CaseItem["spec"] = {
    formFactor: ["ATX", "mATX", "ITX"],
    psuFormFactor: ["ATX"],
    maxGpuLengthMm: 400,
    maxCoolerHeightMm: 170,
    maxPsuLengthMm: 220,
    bays25: 2,
    bays35: 2,
    fanMountsFront: ["3x120", "2x140"],
    fanMountsTop: ["3x120", "2x140"],
    fanMountsRear: ["1x120"],
    radiatorSupport: {
      front: [240, 280, 360],
      top: [240, 280, 360],
      rear: [120],
    },
    sidePanel: "glass+mesh",
    dimensionsMm: { h: 480, w: 220, d: 450 },
    weightKg: 7.5,
    colorFinish: "White",
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "case-1",
    nameDisplay: "Lian Li O11 Dynamic White",
    tdpW: null,
    priceBob: 1300,
    quantity: 1,
    spec,
  };
}

export function makeCoolerAir(
  overrides?: Partial<CoolerAirItem["spec"]> & { id?: string },
): CoolerAirItem {
  const spec: CoolerAirItem["spec"] = {
    heightMm: 158,
    tdpW: 250,
    socketSupport: ["AM5", "AM4", "LGA1700"],
    fanSizeMm: 140,
    fanRpmMin: 200,
    fanRpmMax: 1500,
    noiseDbMax: 24.6,
    heatpipes: 7,
    ramClearanceMm: 45,
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "cooler-air-1",
    nameDisplay: "Noctua NH-D15",
    tdpW: 5,
    priceBob: 850,
    quantity: 1,
    spec,
  };
}

export function makeCoolerAio(
  overrides?: Partial<CoolerAioItem["spec"]> & { id?: string },
): CoolerAioItem {
  const spec: CoolerAioItem["spec"] = {
    radiatorSizeMm: 360,
    tdpW: 300,
    socketSupport: ["AM5", "AM4", "LGA1700", "LGA1851"],
    pumpSpeedRpm: 2800,
    tubeLengthMm: 400,
    fanCount: 3,
    rgbSupport: "aRGB",
    ...overrides,
  };
  return {
    componentId: overrides?.id ?? "cooler-aio-1",
    nameDisplay: "ARCTIC Liquid Freezer III 360",
    tdpW: 10,
    priceBob: 950,
    quantity: 1,
    spec,
  };
}

export function makeCompatibleBuild(): BuildView {
  return {
    cpu: makeCpu(),
    gpu: makeGpu(),
    mobo: makeMobo(),
    ram: [makeRam()],
    storage: [makeStorage()],
    psu: makePsu(),
    case: makeCase(),
    coolerAir: makeCoolerAir(),
  };
}
