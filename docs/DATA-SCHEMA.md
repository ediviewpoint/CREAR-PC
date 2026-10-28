# DATA SCHEMA — CREAR PC

> **Destinatario primario:** Google Gemini (recolección y curaduría de datos).
> **Objetivo:** definir el modelo de datos canónico. Toda semilla (`data/seed/*.json`) debe cumplir este esquema. Toda query/API lo respeta.

---

## 1. Principios

1. **Unidades SI siempre.** Milímetros, Watts, GHz, Megabytes/segundo, Bolivianos.
2. **Precios con dos decimales** y moneda explícita (`BOB` por defecto; `USD` opcional).
3. **Toda spec importante lleva fuente** (`sourceUrl` + `fetchedAt`).
4. **Slugs únicos y estables.** Formato: `<marca>-<modelo>-<diferenciador>` en lowercase-kebab. Ej.: `amd-ryzen-7-7800x3d`.
5. **Ids internos** son UUID v7 o nanoid; nunca autoincrement como clave externa pública.
6. **Zod + Drizzle en sync** — ante cualquier cambio, actualizar los dos.

---

## 2. Entidades (overview)

```
components ──┬── component_specs (1:1 polimórfico por tipo)
             ├── prices (1:N)
             ├── images (1:N)
             └── benchmarks (1:N)

stores ──── prices (1:N)
clients ──── proformas (1:N)
users ──── builds (1:N)
builds ──── build_items (1:N) ──── components
builds ──── proformas (1:N)
```

---

## 3. Tabla `components`

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | no | PK |
| `slug` | `varchar(120)` | no | único |
| `category` | `enum` | no | `cpu`\|`gpu`\|`mobo`\|`ram`\|`storage`\|`psu`\|`case`\|`cooler_air`\|`cooler_aio`\|`fan`\|`monitor` |
| `brand` | `varchar(60)` | no | |
| `model` | `varchar(120)` | no | |
| `name_display` | `varchar(180)` | no | `AMD Ryzen 7 7800X3D` |
| `release_year` | `smallint` | sí | |
| `tdp_w` | `smallint` | sí | peak power consumption (W) |
| `is_active` | `boolean` | no | default `true` |
| `created_at` | `timestamptz` | no | default now() |
| `updated_at` | `timestamptz` | no | |

**Índices:** `(category)`, `(brand, model)`, `(slug)` único.

---

## 4. Especificaciones específicas por categoría

Guardar en tabla única `component_specs` con **JSONB** validado por Zod según categoría, O tablas separadas. Recomendación: **tablas separadas** para claridad y queries directas.

### 4.1 `spec_cpu`
```ts
{
  componentId: uuid,
  socket: "AM5" | "AM4" | "LGA1700" | "LGA1851" | ...,
  cores: int,
  threads: int,
  pCores?: int,          // Intel P-cores
  eCores?: int,          // Intel E-cores
  baseClockGhz: number,
  boostClockGhz: number,
  l2CacheMb: number,
  l3CacheMb: number,
  iGpu: boolean,
  iGpuModel?: string,
  pcieGen: 4 | 5,
  pcieLanes: int,
  memorySupport: ("DDR4" | "DDR5")[],
  memoryMaxMhz: int,
  memoryMaxGb: int,
  tdpWBase: int,
  tdpWBoost: int,        // PBP / MTP
  unlocked: boolean      // overclockable
}
```

### 4.2 `spec_gpu`
```ts
{
  componentId: uuid,
  chipset: string,       // "RTX 4070", "RX 7800 XT"
  vramGb: int,
  vramType: "GDDR6" | "GDDR6X" | "HBM2E" | "HBM3",
  busWidthBits: int,
  baseClockMhz: int,
  boostClockMhz: int,
  tdpW: int,
  pcieGen: 4 | 5,
  pcieLanes: int,
  lengthMm: int,
  widthSlots: number,    // 2, 2.5, 3, 3.5
  heightMm: int,
  powerConnectors: ("8pin" | "6pin" | "6+2pin" | "12VHPWR" | "16pin")[],
  outputs: { hdmi: int; dp: int; usbC: int },
  rayTracing: boolean,
  dlssFsr: string[]      // ["DLSS 3.5", "FSR 3"]
}
```

### 4.3 `spec_mobo`
```ts
{
  componentId: uuid,
  socket: string,
  chipset: string,       // "B650", "X670E", "B760", "Z790"
  formFactor: "ATX" | "mATX" | "ITX" | "E-ATX",
  memoryType: "DDR4" | "DDR5",
  memorySlots: 2 | 4,
  memoryMaxGb: int,
  memoryMaxMhz: int,
  memoryChannels: 1 | 2 | 4,
  pcie5Slots: int,
  pcie4Slots: int,
  pcie3Slots: int,
  m2Slots: int,
  m2MaxGen: 3 | 4 | 5,
  sataPorts: int,
  usbA: int,
  usbC: int,
  wifi?: "WiFi 6" | "WiFi 6E" | "WiFi 7" | null,
  bluetooth?: string | null,
  lan: "1GbE" | "2.5GbE" | "5GbE" | "10GbE",
  vrmPhases: int,
  audioCodec: string
}
```

### 4.4 `spec_ram`
```ts
{
  componentId: uuid,
  type: "DDR4" | "DDR5",
  capacityGb: int,         // por módulo (si kit 2x16, cada módulo 16)
  kitQty: 1 | 2 | 4,
  frequencyMhz: int,
  casLatency: int,         // CL30, CL36...
  voltageV: number,
  heightMm: int,           // crítico para compat con coolers
  xmp: boolean,
  expo: boolean,
  colorFinish: string
}
```

### 4.5 `spec_storage`
```ts
{
  componentId: uuid,
  storageType: "nvme_m2" | "ssd_sata" | "hdd_3.5" | "hdd_2.5",
  interface: "M.2 PCIe 3.0 x4" | "M.2 PCIe 4.0 x4" | "M.2 PCIe 5.0 x4" | "SATA III" | "SATA II",
  formFactor: "M.2 2280" | "M.2 22110" | "2.5\"" | "3.5\"",
  capacityGb: int,
  seqReadMbps: int,
  seqWriteMbps: int,
  randomRead4kIops?: int,
  randomWrite4kIops?: int,
  dram: boolean,
  tbw: int,
  rpm?: int,               // solo HDD
  cacheMb?: int,
  nvmeGen?: 3 | 4 | 5
}
```

### 4.6 `spec_psu`
```ts
{
  componentId: uuid,
  wattage: int,
  efficiencyRating: "80+ White" | "80+ Bronze" | "80+ Silver" | "80+ Gold" | "80+ Platinum" | "80+ Titanium",
  formFactor: "ATX" | "SFX" | "SFX-L" | "ATX12V" | "ATX12VO",
  modular: "none" | "semi" | "full",
  lengthMm: int,
  connectors: {
    cpu8pin: int,
    cpu4plus4: int,
    pcie8pin: int,
    pcie12vhpwr: int,
    sata: int,
    molex: int
  },
  fanSizeMm: int,
  fanlessMode: boolean,
  atx3: boolean
}
```

### 4.7 `spec_case`
```ts
{
  componentId: uuid,
  formFactor: ("ATX" | "mATX" | "ITX" | "E-ATX")[],      // formatos soportados
  psuFormFactor: ("ATX" | "SFX" | "SFX-L")[],
  maxGpuLengthMm: int,
  maxCoolerHeightMm: int,
  maxPsuLengthMm: int,
  bays25: int,       // bahías 2.5"
  bays35: int,
  fanMountsFront: string[],   // ej. ["3x120", "2x140"]
  fanMountsTop: string[],
  fanMountsRear: string[],
  radiatorSupport: {
    front: int[],    // mm, ej. [240, 280, 360]
    top: int[],
    rear: int[]
  },
  sidePanel: "glass" | "mesh" | "solid" | "glass+mesh",
  dimensionsMm: { h: int; w: int; d: int },
  weightKg: number,
  colorFinish: string
}
```

### 4.8 `spec_cooler_air`
```ts
{
  componentId: uuid,
  heightMm: int,
  tdpW: int,
  socketSupport: string[],    // ["AM5", "AM4", "LGA1700"]
  fanSizeMm: int,
  fanRpmMin: int,
  fanRpmMax: int,
  noiseDbMax: number,
  heatpipes: int
}
```

### 4.9 `spec_cooler_aio`
```ts
{
  componentId: uuid,
  radiatorSizeMm: 120 | 240 | 280 | 360 | 420,
  tdpW: int,
  socketSupport: string[],
  pumpSpeedRpm: int,
  tubeLengthMm: int,
  fanCount: int,
  rgbSupport: "none" | "aRGB" | "RGB"
}
```

---

## 5. Precios y tiendas

### 5.1 `stores`
```ts
{
  id: uuid,
  name: "Compumundo" | "PCWorld" | ...,
  city: "Santa Cruz" | "La Paz" | "Cochabamba" | ...,
  address: string,
  phone: string,
  whatsapp?: string,
  website?: string,
  isActive: boolean
}
```

### 5.2 `prices`
```ts
{
  id: uuid,
  componentId: uuid,
  storeId: uuid,
  currency: "BOB" | "USD",
  amount: number,              // decimal(10,2)
  inStock: boolean,
  stockQty?: int,
  observedAt: timestamptz,    // cuándo se consultó
  sourceUrl?: string           // link al listing si existe
}
```

**Índices:** `(componentId, storeId, observedAt desc)` para agarrar el precio más reciente rápidamente.

**Vista materializada `latest_prices`:** último precio por `(componentId, storeId)`.

---

## 6. Benchmarks

### 6.1 `benchmarks`
```ts
{
  id: uuid,
  componentId: uuid,
  benchName: "Cinebench R23 Multi" | "Cinebench R23 Single" | "Geekbench 6 Multi" | "Geekbench 6 Single" | "3DMark Time Spy" | "3DMark Fire Strike" | "Blender BMW" | "PassMark CPU" | "PassMark G3D" | ...,
  score: number,
  unit?: string,              // "pts", "seconds", "fps"
  sourceUrl: string,
  observedAt: timestamptz
}
```

---

## 7. Imágenes

### 7.1 `images`
```ts
{
  id: uuid,
  componentId: uuid,
  url: string,            // Vercel Blob URL
  variant: "hero" | "thumbnail" | "gallery",
  width: int,
  height: int,
  altEs: string,
  altEn?: string,
  isPrimary: boolean,
  sortOrder: int
}
```

---

## 8. Builds y proformas

### 8.1 `builds`
```ts
{
  id: uuid,
  userId?: uuid,            // null si guest
  name: string,              // "Mi build gaming 1440p"
  purpose: "gaming" | "workstation" | "office" | "streaming" | "editing" | "ai_ml",
  budgetBob?: number,
  isPublic: boolean,
  shareSlug: string,         // "a7f3-mi-build-gaming"
  compatReport: jsonb,       // snapshot del último compat check
  totalBob: number,
  createdAt: timestamptz,
  updatedAt: timestamptz
}
```

### 8.2 `build_items`
```ts
{
  id: uuid,
  buildId: uuid,
  componentId: uuid,
  quantity: int,             // ej. 2 para RAM si no es kit
  unitPriceBob: number,      // precio al momento de añadir
  storeId?: uuid,
  notes?: string,
  sortOrder: int
}
```

### 8.3 `proformas`
```ts
{
  id: uuid,
  code: string,              // "PRO-2026-00001" generado por secuencia
  buildId: uuid,
  issuedByUserId?: uuid,     // tiendista si aplica
  issuedByStoreId?: uuid,
  clientName: string,
  clientCiNit?: string,
  clientPhone?: string,
  clientEmail?: string,
  currency: "BOB",
  subtotalBob: number,
  discountBob: number,
  totalBob: number,
  validUntil: date,          // issuedAt + 7 días por defecto
  terms: text,
  issuedAt: timestamptz,
  pdfBlobUrl?: string        // Vercel Blob, generado on-demand
}
```

---

## 9. Reglas de compatibilidad (resumen)

> Detalle completo en `docs/COMPATIBILITY-RULES.md`.

Validación mínima que el motor DEBE implementar (bloqueantes):

1. **Socket CPU ↔ Mobo:** `cpu.socket === mobo.socket`.
2. **RAM type ↔ Mobo:** `ram.type === mobo.memoryType`.
3. **RAM slots:** `Σ(ram.kitQty) ≤ mobo.memorySlots`.
4. **GPU length ↔ Case:** `gpu.lengthMm ≤ case.maxGpuLengthMm`.
5. **Cooler aire height ↔ Case:** `coolerAir.heightMm ≤ case.maxCoolerHeightMm`.
6. **Mobo formFactor ↔ Case:** `mobo.formFactor ∈ case.formFactor[]`.
7. **PSU formFactor ↔ Case:** `psu.formFactor ∈ case.psuFormFactor[]`.
8. **Potencia PSU:** `psu.wattage ≥ Σ(tdp) × 1.3`.
9. **12VHPWR:** si GPU requiere 12VHPWR, PSU debe tenerlo (o adaptador declarado).
10. **M.2 slots:** `nvmes count ≤ mobo.m2Slots`.

Advertencias (no bloqueantes):

- Cuello de botella CPU↔GPU en resolución objetivo.
- PSU 80+ White con build > 500W (recomendar Gold o superior).
- RAM frequency > `mobo.memoryMaxMhz` (necesita XMP/EXPO; podría no estabilizar).
- Case sin mesh frontal + GPU TDP > 300W → riesgo térmico.

---

## 10. Formato de archivos de seed

Carpeta `data/seed/`:

```
data/seed/
├── cpus.json
├── gpus.json
├── mobos.json
├── ram.json
├── storage.json
├── psus.json
├── cases.json
├── coolers_air.json
├── coolers_aio.json
├── stores.json
├── prices.json
└── benchmarks.json
```

Cada JSON es un array de objetos que cumplen el schema Zod correspondiente. Comentarios NO permitidos en JSON — usar `_notes` como campo opcional en modo dev si hace falta.

**Ejemplo mínimo `cpus.json`:**

```json
[
  {
    "slug": "amd-ryzen-7-7800x3d",
    "brand": "AMD",
    "model": "Ryzen 7 7800X3D",
    "name_display": "AMD Ryzen 7 7800X3D",
    "release_year": 2023,
    "tdp_w": 120,
    "spec": {
      "socket": "AM5",
      "cores": 8,
      "threads": 16,
      "baseClockGhz": 4.2,
      "boostClockGhz": 5.0,
      "l2CacheMb": 8,
      "l3CacheMb": 96,
      "iGpu": true,
      "iGpuModel": "AMD Radeon Graphics",
      "pcieGen": 5,
      "pcieLanes": 24,
      "memorySupport": ["DDR5"],
      "memoryMaxMhz": 5200,
      "memoryMaxGb": 192,
      "tdpWBase": 120,
      "tdpWBoost": 162,
      "unlocked": true
    },
    "sources": [
      {
        "url": "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html",
        "fetchedAt": "2026-10-27T00:00:00Z"
      }
    ]
  }
]
```

---

## 11. Checklist Gemini antes de entregar un dataset

- [ ] Cada entry tiene `slug` único y estable.
- [ ] `tdp_w` presente para CPUs, GPUs, PSUs (potencia), coolers (TDP soportado).
- [ ] Todas las unidades son SI (mm, W, GHz, MB/s).
- [ ] Nombres de productos tal como aparecen en el fabricante oficial.
- [ ] Imágenes referenciadas (URL temporal del fabricante aceptable; Claude las sube a Blob).
- [ ] `sources[]` lleno — mínimo 1 URL por entry.
- [ ] `fetchedAt` ISO 8601 UTC.
- [ ] Precios en Bs. como decimal con dos decimales (`3800.00`, no `3800`).
- [ ] Nada de datos inventados — si una spec no se encuentra, dejar `null` y marcar en `_notes`.
