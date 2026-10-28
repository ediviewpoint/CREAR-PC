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

export const PRODUCT_SCHEMAS = {
  cpu: specCpu,
  gpu: specGpu,
  mobo: specMobo,
  ram: specRam,
  storage: specStorage,
  psu: specPsu,
  case: specCase,
  cooler_air: specCoolerAir,
  cooler_aio: specCoolerAio,
};
export type ProductCategory = keyof typeof PRODUCT_SCHEMAS;
export const PRODUCT_CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: "cpu", label: "Procesador" },
  { key: "mobo", label: "Placa madre" },
  { key: "ram", label: "Memoria RAM" },
  { key: "gpu", label: "Tarjeta gráfica" },
  { key: "storage", label: "Almacenamiento" },
  { key: "psu", label: "Fuente de alimentación" },
  { key: "case", label: "Gabinete" },
  { key: "cooler_air", label: "Refrigeración por aire" },
  { key: "cooler_aio", label: "Refrigeración líquida" },
];
export type SpecField = {
  path: string;
  label: string;
  type: "text" | "number" | "boolean" | "array" | "select";
  required: boolean;
  options?: (string | number)[];
  numeric?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
};
type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  anyOf?: JsonSchema[];
  enum?: (string | number)[];
  const?: string | number;
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
};

const labels: Record<string, string> = {
  socket: "Socket",
  cores: "Núcleos",
  threads: "Hilos",
  pCores: "Núcleos de rendimiento",
  eCores: "Núcleos de eficiencia",
  baseClockGhz: "Frecuencia base (GHz)",
  boostClockGhz: "Frecuencia máxima (GHz)",
  l2CacheMb: "Caché L2 (MB)",
  l3CacheMb: "Caché L3 (MB)",
  iGpu: "Gráficos integrados",
  iGpuModel: "Modelo de gráficos integrados",
  pcieGen: "Generación PCIe",
  pcieLanes: "Líneas PCIe",
  memorySupport: "Memorias admitidas",
  memoryMaxMhz: "Frecuencia máxima de RAM (MHz)",
  memoryMaxGb: "RAM máxima (GB)",
  tdpWBase: "Consumo base (W)",
  tdpWBoost: "Consumo máximo (W)",
  unlocked: "Multiplicador desbloqueado",
  chipset: "Chipset",
  vramGb: "Memoria de video (GB)",
  vramType: "Tipo de memoria de video",
  busWidthBits: "Bus de memoria (bits)",
  baseClockMhz: "Frecuencia base (MHz)",
  boostClockMhz: "Frecuencia máxima (MHz)",
  tdpW: "Potencia térmica / consumo (W)",
  lengthMm: "Longitud (mm)",
  widthSlots: "Espacio ocupado (slots)",
  heightMm: "Altura (mm)",
  powerConnectors: "Conectores de alimentación",
  outputs: "Salidas de video",
  hdmi: "HDMI",
  dp: "DisplayPort",
  usbC: "USB-C",
  rayTracing: "Ray tracing",
  dlssFsr: "Tecnologías de escalado (DLSS / FSR)",
  formFactor: "Formato",
  memoryType: "Tipo de RAM",
  memorySlots: "Ranuras de RAM",
  memoryChannels: "Canales de memoria",
  pcie5Slots: "Ranuras PCIe 5",
  pcie4Slots: "Ranuras PCIe 4",
  pcie3Slots: "Ranuras PCIe 3",
  m2Slots: "Ranuras M.2",
  m2MaxGen: "Generación máxima M.2",
  sataPorts: "Puertos SATA",
  usbA: "Puertos USB-A",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  lan: "Red Ethernet",
  vrmPhases: "Fases del VRM",
  audioCodec: "Códec de audio",
  type: "Tipo de memoria",
  capacityGb: "Capacidad total (GB)",
  kitQty: "Módulos por kit",
  frequencyMhz: "Frecuencia (MHz)",
  casLatency: "Latencia CAS (CL)",
  voltageV: "Voltaje (V)",
  xmp: "Perfil XMP",
  expo: "Perfil EXPO",
  colorFinish: "Color / acabado",
  storageType: "Tipo de unidad",
  interface: "Interfaz",
  seqReadMbps: "Lectura secuencial (MB/s)",
  seqWriteMbps: "Escritura secuencial (MB/s)",
  randomRead4kIops: "Lectura aleatoria (IOPS)",
  randomWrite4kIops: "Escritura aleatoria (IOPS)",
  dram: "Caché DRAM",
  tbw: "Resistencia de escritura (TBW; obligatoria en SSD)",
  rpm: "Velocidad del disco (RPM)",
  cacheMb: "Caché (MB)",
  nvmeGen: "Generación NVMe",
  wattage: "Potencia (W)",
  efficiencyRating: "Certificación de eficiencia",
  modular: "Cableado modular",
  connectors: "Conectores",
  cpu8pin: "CPU de 8 pines",
  cpu4plus4: "CPU de 4+4 pines",
  pcie8pin: "PCIe de 8 pines",
  pcie12vhpwr: "PCIe 12VHPWR",
  sata: "SATA",
  molex: "Molex",
  fanSizeMm: "Tamaño del ventilador (mm)",
  fanlessMode: "Modo sin ventilador",
  atx3: "Estándar ATX 3",
  psuFormFactor: "Formatos de fuente admitidos",
  maxGpuLengthMm: "Longitud máxima de gráfica (mm)",
  maxCoolerHeightMm: "Altura máxima del cooler (mm)",
  maxPsuLengthMm: "Longitud máxima de fuente (mm)",
  bays25: "Bahías de 2,5 pulgadas",
  bays35: "Bahías de 3,5 pulgadas",
  fanMountsFront: "Ventiladores frontales admitidos",
  fanMountsTop: "Ventiladores superiores admitidos",
  fanMountsRear: "Ventiladores traseros admitidos",
  radiatorSupport: "Radiadores admitidos (mm)",
  front: "Frontal",
  top: "Superior",
  rear: "Trasero",
  sidePanel: "Panel lateral",
  dimensionsMm: "Dimensiones (mm)",
  h: "Alto",
  w: "Ancho",
  d: "Fondo",
  weightKg: "Peso (kg)",
  socketSupport: "Sockets admitidos",
  fanRpmMin: "RPM mínimas",
  fanRpmMax: "RPM máximas",
  noiseDbMax: "Ruido máximo (dB)",
  heatpipes: "Tubos de calor",
  ramClearanceMm: "Altura libre para RAM (mm)",
  radiatorSizeMm: "Tamaño del radiador (mm)",
  pumpSpeedRpm: "Velocidad de bomba (RPM)",
  tubeLengthMm: "Longitud de tubos (mm)",
  fanCount: "Número de ventiladores",
  rgbSupport: "Iluminación",
};
export function getSpecFields(category: ProductCategory): SpecField[] {
  const fields: SpecField[] = [];
  function visit(schema: JsonSchema, prefix = "", parentRequired = true, group = "") {
    for (const [key, original] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      const required = parentRequired && !!schema.required?.includes(key);
      const node = original.anyOf?.find((item) => item.type !== "null") ?? original;
      const type = Array.isArray(node.type)
        ? node.type.find((value) => value !== "null")
        : node.type;
      const label = group + (labels[key] ?? key);
      if (type === "object") {
        visit(node, path, required, `${label} · `);
        continue;
      }
      const options =
        node.enum ??
        original.anyOf?.filter((item) => item.const !== undefined).map((item) => item.const!);
      fields.push({
        path,
        label,
        required,
        type: options?.length
          ? "select"
          : type === "boolean"
            ? "boolean"
            : type === "array"
              ? "array"
              : type === "integer" || type === "number"
                ? "number"
                : "text",
        ...(options?.length ? { options, numeric: typeof options[0] === "number" } : {}),
        ...(type === "array"
          ? {
              numeric: node.items?.type === "number" || node.items?.type === "integer",
              options: node.items?.enum,
            }
          : {}),
        ...(type === "number" || type === "integer"
          ? {
              integer: type === "integer",
              min:
                node.minimum ??
                (node.exclusiveMinimum === 0 ? (type === "integer" ? 1 : 0.001) : undefined),
              max: node.maximum,
            }
          : {}),
      });
    }
  }
  visit(z.toJSONSchema(PRODUCT_SCHEMAS[category]) as JsonSchema);
  return fields;
}
export function specValue(spec: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      spec,
    );
}
export function parseSpecFields(category: ProductCategory, form: FormData) {
  const spec: Record<string, unknown> = {};
  for (const field of getSpecFields(category)) {
    const raw = String(form.get(`spec.${field.path}`) ?? "").trim();
    if (raw.length > 400) throw new Error(`El valor de ${field.label} es demasiado largo.`);
    let value: unknown;
    if (field.type === "array")
      value = raw
        ? raw
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => (field.numeric ? Number(entry) : entry))
        : [];
    else if (!raw) continue;
    else if (field.type === "boolean") {
      if (!["true", "false"].includes(raw)) throw new Error(`Revisá ${field.label}.`);
      value = raw === "true";
    } else if (field.type === "number" || field.numeric) value = Number(raw);
    else value = raw;
    if (
      field.type === "number" &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        (field.integer && !Number.isInteger(value)) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))
    )
      throw new Error(`Revisá ${field.label}.`);
    if (field.options && !Array.isArray(value) && !field.options.includes(value as string | number))
      throw new Error(`Revisá ${field.label}.`);
    if (
      Array.isArray(value) &&
      (value.some((entry) => field.numeric && (!Number.isFinite(entry) || Number(entry) <= 0)) ||
        (field.options && value.some((entry) => !field.options!.includes(entry))))
    )
      throw new Error(`Revisá los valores de ${field.label}.`);
    const keys = field.path.split(".");
    let target = spec;
    for (const key of keys.slice(0, -1)) {
      target[key] ??= {};
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]!] = value;
  }
  return spec;
}
