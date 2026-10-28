import type {
  ComponentCategory,
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

export type Severity = "error" | "warning" | "info";

export type Issue = {
  code: string;
  severity: Severity;
  messageEs: string;
  involved: { category: ComponentCategory; componentId: string }[];
};

export type CompatReport = {
  ok: boolean;
  totalTdpW: number;
  recommendedPsuW: number;
  totalBob: number;
  issues: Issue[];
};

export type BuildItemBase = {
  componentId: string;
  nameDisplay: string;
  tdpW: number | null;
  priceBob: number;
  quantity: number;
};

export type CpuItem = BuildItemBase & { spec: SpecCpu };
export type GpuItem = BuildItemBase & { spec: SpecGpu };
export type MoboItem = BuildItemBase & { spec: SpecMobo };
export type RamItem = BuildItemBase & { spec: SpecRam };
export type StorageItem = BuildItemBase & { spec: SpecStorage };
export type PsuItem = BuildItemBase & { spec: SpecPsu };
export type CaseItem = BuildItemBase & { spec: SpecCase };
export type CoolerAirItem = BuildItemBase & { spec: SpecCoolerAir };
export type CoolerAioItem = BuildItemBase & { spec: SpecCoolerAio };

export type BuildView = {
  cpu?: CpuItem;
  gpu?: GpuItem;
  mobo?: MoboItem;
  ram: RamItem[];
  storage: StorageItem[];
  psu?: PsuItem;
  case?: CaseItem;
  coolerAir?: CoolerAirItem;
  coolerAio?: CoolerAioItem;
  // Benchmarks opcionales: { componentId: { benchName: score } }.
  benchmarks?: Record<string, Record<string, number>>;
  // Resolución objetivo para heurística de cuello de botella.
  targetResolution?: "1080p" | "1440p" | "4K";
};
