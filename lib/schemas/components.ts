import { z } from "zod";

export const componentCategory = z.enum([
  "cpu",
  "gpu",
  "mobo",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler_air",
  "cooler_aio",
  "fan",
  "monitor",
]);

export type ComponentCategory = z.infer<typeof componentCategory>;

// --- CPU ---
export const specCpu = z.object({
  socket: z.string(),
  cores: z.number().int().positive(),
  threads: z.number().int().positive(),
  pCores: z.number().int().nonnegative().optional(),
  eCores: z.number().int().nonnegative().optional(),
  baseClockGhz: z.number().positive(),
  boostClockGhz: z.number().positive(),
  l2CacheMb: z.number().nonnegative(),
  l3CacheMb: z.number().nonnegative(),
  iGpu: z.boolean(),
  iGpuModel: z.string().optional(),
  pcieGen: z.union([z.literal(4), z.literal(5)]),
  pcieLanes: z.number().int().positive(),
  memorySupport: z.array(z.enum(["DDR4", "DDR5"])),
  memoryMaxMhz: z.number().int().positive(),
  memoryMaxGb: z.number().int().positive(),
  tdpWBase: z.number().int().positive(),
  tdpWBoost: z.number().int().positive(),
  unlocked: z.boolean(),
});

// --- GPU ---
export const specGpu = z.object({
  chipset: z.string(),
  vramGb: z.number().int().positive(),
  vramType: z.enum(["GDDR6", "GDDR6X", "GDDR7", "HBM2E", "HBM3"]),
  busWidthBits: z.number().int().positive(),
  baseClockMhz: z.number().int().positive(),
  boostClockMhz: z.number().int().positive(),
  tdpW: z.number().int().positive(),
  pcieGen: z.union([z.literal(4), z.literal(5)]),
  pcieLanes: z.number().int().positive(),
  lengthMm: z.number().int().positive(),
  widthSlots: z.number().positive(),
  heightMm: z.number().int().positive(),
  powerConnectors: z.array(z.enum(["8pin", "6pin", "6+2pin", "12VHPWR", "16pin"])),
  outputs: z.object({
    hdmi: z.number().int().nonnegative(),
    dp: z.number().int().nonnegative(),
    usbC: z.number().int().nonnegative(),
  }),
  rayTracing: z.boolean(),
  dlssFsr: z.array(z.string()),
});

// --- Mobo ---
export const specMobo = z.object({
  socket: z.string(),
  chipset: z.string(),
  formFactor: z.enum(["ATX", "mATX", "ITX", "E-ATX"]),
  memoryType: z.enum(["DDR4", "DDR5"]),
  memorySlots: z.union([z.literal(2), z.literal(4)]),
  memoryMaxGb: z.number().int().positive(),
  memoryMaxMhz: z.number().int().positive(),
  memoryChannels: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  pcie5Slots: z.number().int().nonnegative(),
  pcie4Slots: z.number().int().nonnegative(),
  pcie3Slots: z.number().int().nonnegative(),
  m2Slots: z.number().int().nonnegative(),
  m2MaxGen: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  sataPorts: z.number().int().nonnegative(),
  usbA: z.number().int().nonnegative(),
  usbC: z.number().int().nonnegative(),
  wifi: z.enum(["WiFi 6", "WiFi 6E", "WiFi 7"]).nullable().optional(),
  bluetooth: z.string().nullable().optional(),
  lan: z.enum(["1GbE", "2.5GbE", "5GbE", "10GbE"]),
  vrmPhases: z.number().int().positive(),
  audioCodec: z.string(),
});

// --- RAM ---
export const specRam = z.object({
  type: z.enum(["DDR4", "DDR5"]),
  capacityGb: z.number().int().positive(),
  kitQty: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  frequencyMhz: z.number().int().positive(),
  casLatency: z.number().int().positive(),
  voltageV: z.number().positive(),
  heightMm: z.number().int().positive(),
  xmp: z.boolean(),
  expo: z.boolean(),
  colorFinish: z.string(),
});

// --- Storage ---
export const specStorage = z
  .object({
    storageType: z.enum(["nvme_m2", "ssd_sata", "hdd_3.5", "hdd_2.5"]),
    interface: z.string(),
    formFactor: z.string(),
    capacityGb: z.number().int().positive(),
    seqReadMbps: z.number().int().positive(),
    seqWriteMbps: z.number().int().positive(),
    randomRead4kIops: z.number().int().nonnegative().optional(),
    randomWrite4kIops: z.number().int().nonnegative().optional(),
    dram: z.boolean(),
    tbw: z.number().int().positive().nullable().optional(),
    rpm: z.number().int().positive().optional(),
    cacheMb: z.number().int().nonnegative().optional(),
    nvmeGen: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  })
  .refine((s) => s.storageType.startsWith("hdd_") || (s.tbw ?? 0) > 0, {
    path: ["tbw"],
    message: "SSD requiere TBW positivo.",
  });

// --- PSU ---
export const specPsu = z.object({
  wattage: z.number().int().positive(),
  efficiencyRating: z.enum([
    "80+ White",
    "80+ Bronze",
    "80+ Silver",
    "80+ Gold",
    "80+ Platinum",
    "80+ Titanium",
  ]),
  formFactor: z.enum(["ATX", "SFX", "SFX-L", "ATX12V", "ATX12VO"]),
  modular: z.enum(["none", "semi", "full"]),
  lengthMm: z.number().int().positive(),
  connectors: z.object({
    cpu8pin: z.number().int().nonnegative(),
    cpu4plus4: z.number().int().nonnegative(),
    pcie8pin: z.number().int().nonnegative(),
    pcie12vhpwr: z.number().int().nonnegative(),
    sata: z.number().int().nonnegative(),
    molex: z.number().int().nonnegative(),
  }),
  fanSizeMm: z.number().int().positive(),
  fanlessMode: z.boolean(),
  atx3: z.boolean(),
});

// --- Case ---
export const specCase = z.object({
  formFactor: z.array(z.enum(["ATX", "mATX", "ITX", "E-ATX"])),
  psuFormFactor: z.array(z.enum(["ATX", "SFX", "SFX-L"])),
  maxGpuLengthMm: z.number().int().positive(),
  maxCoolerHeightMm: z.number().int().positive(),
  maxPsuLengthMm: z.number().int().positive(),
  bays25: z.number().int().nonnegative(),
  bays35: z.number().int().nonnegative(),
  fanMountsFront: z.array(z.string()),
  fanMountsTop: z.array(z.string()),
  fanMountsRear: z.array(z.string()),
  radiatorSupport: z.object({
    front: z.array(z.number().int().positive()),
    top: z.array(z.number().int().positive()),
    rear: z.array(z.number().int().positive()),
  }),
  sidePanel: z.enum(["glass", "mesh", "solid", "glass+mesh"]),
  dimensionsMm: z.object({ h: z.number().int(), w: z.number().int(), d: z.number().int() }),
  weightKg: z.number().positive(),
  colorFinish: z.string(),
});

// --- Cooler Aire ---
export const specCoolerAir = z.object({
  heightMm: z.number().int().positive(),
  tdpW: z.number().int().positive(),
  socketSupport: z.array(z.string()),
  fanSizeMm: z.number().int().positive(),
  fanRpmMin: z.number().int().nonnegative(),
  fanRpmMax: z.number().int().positive(),
  noiseDbMax: z.number().positive(),
  heatpipes: z.number().int().positive(),
  ramClearanceMm: z.number().int().positive().optional(),
});

// --- Cooler AIO ---
export const specCoolerAio = z.object({
  radiatorSizeMm: z.union([
    z.literal(120),
    z.literal(240),
    z.literal(280),
    z.literal(360),
    z.literal(420),
  ]),
  tdpW: z.number().int().positive(),
  socketSupport: z.array(z.string()),
  pumpSpeedRpm: z.number().int().positive(),
  tubeLengthMm: z.number().int().positive(),
  fanCount: z.number().int().positive(),
  rgbSupport: z.enum(["none", "aRGB", "RGB"]),
});

// --- Component (envelope) ---
export const componentBase = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  category: componentCategory,
  brand: z.string(),
  model: z.string(),
  nameDisplay: z.string(),
  releaseYear: z.number().int().optional().nullable(),
  tdpW: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ComponentBase = z.infer<typeof componentBase>;
export type SpecCpu = z.infer<typeof specCpu>;
export type SpecGpu = z.infer<typeof specGpu>;
export type SpecMobo = z.infer<typeof specMobo>;
export type SpecRam = z.infer<typeof specRam>;
export type SpecStorage = z.infer<typeof specStorage>;
export type SpecPsu = z.infer<typeof specPsu>;
export type SpecCase = z.infer<typeof specCase>;
export type SpecCoolerAir = z.infer<typeof specCoolerAir>;
export type SpecCoolerAio = z.infer<typeof specCoolerAio>;
