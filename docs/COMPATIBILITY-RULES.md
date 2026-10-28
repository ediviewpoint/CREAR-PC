# COMPATIBILITY RULES — CREAR PC

> **Destinatario:** Gemini (define las reglas) + Claude (las implementa en `lib/compat/`).
> **Formato:** reglas declarativas + pseudocódigo TypeScript. Cualquiera que lea esto debe poder implementarlas en 2 horas.

---

## 1. Niveles de severidad

| Nivel | Significado | Efecto en UI |
|---|---|---|
| `error` | La build NO ensamblará. | Bloqueo visual rojo, botón proforma deshabilitado. |
| `warning` | Ensamblará pero puede dar problemas (térmicos, inestabilidad, cuello de botella). | Pill amarilla, modal explicativo. |
| `info` | Nota informativa sin impacto crítico. | Icono tooltip. |

---

## 2. Reglas BLOQUEANTES (`error`)

### R-01 · Socket CPU ↔ Mobo
```
if (cpu && mobo && cpu.socket !== mobo.socket)
  error("El socket del CPU no coincide con la placa madre.", { cpu, mobo });
```

### R-02 · Tipo de RAM ↔ Mobo
```
if (ram.type !== mobo.memoryType)
  error(`La placa requiere ${mobo.memoryType}, no acepta ${ram.type}.`);
```

### R-03 · Slots de RAM
```
const totalModules = ram.reduce((acc, r) => acc + r.kitQty * quantityInBuild(r), 0);
if (totalModules > mobo.memorySlots)
  error(`La placa solo tiene ${mobo.memorySlots} slots DIMM.`);
```

### R-04 · Capacidad RAM máxima soportada
```
const totalRamGb = ram.reduce((a, r) => a + r.capacityGb * r.kitQty, 0);
if (totalRamGb > mobo.memoryMaxGb)
  error(`Supera la capacidad máxima soportada (${mobo.memoryMaxGb} GB).`);
```

### R-05 · Formato placa ↔ Case
```
if (!caseItem.formFactor.includes(mobo.formFactor))
  error(`El case no soporta placas ${mobo.formFactor}. Soporta: ${caseItem.formFactor.join(", ")}.`);
```

### R-06 · Formato PSU ↔ Case
```
if (!caseItem.psuFormFactor.includes(psu.formFactor))
  error(`El case no acepta fuentes ${psu.formFactor}.`);
```

### R-07 · Longitud GPU ↔ Case
```
if (gpu.lengthMm > caseItem.maxGpuLengthMm)
  error(`La GPU mide ${gpu.lengthMm} mm, el case solo soporta ${caseItem.maxGpuLengthMm} mm.`);
```

### R-08 · Altura cooler aire ↔ Case
```
if (coolerAir && coolerAir.heightMm > caseItem.maxCoolerHeightMm)
  error(`El cooler mide ${coolerAir.heightMm} mm de alto, el case acepta ${caseItem.maxCoolerHeightMm} mm.`);
```

### R-09 · Cooler soporta socket del CPU
```
if (cooler && !cooler.socketSupport.includes(cpu.socket))
  error(`El cooler no incluye montaje para ${cpu.socket}.`);
```

### R-10 · AIO radiador cabe en el case
```
if (coolerAio) {
  const supported = [
    ...caseItem.radiatorSupport.front,
    ...caseItem.radiatorSupport.top,
    ...caseItem.radiatorSupport.rear
  ];
  if (!supported.includes(coolerAio.radiatorSizeMm))
    error(`El case no soporta radiadores de ${coolerAio.radiatorSizeMm} mm.`);
}
```

### R-11 · Potencia PSU suficiente
```
const totalTdp = sumTdp(components);
const required = Math.ceil(totalTdp * 1.3);
if (psu.wattage < required)
  error(`La fuente ${psu.wattage}W es insuficiente. Se recomienda al menos ${required}W.`);
```

### R-12 · Conector 12VHPWR para GPU que lo requiere
```
if (gpu.powerConnectors.includes("12VHPWR") && psu.connectors.pcie12vhpwr === 0)
  error("Esta GPU requiere conector 12VHPWR y la fuente no lo tiene nativo.");
```

### R-13 · M.2 count
```
const nvmeCount = storage.filter(s => s.storageType === "nvme_m2").length;
if (nvmeCount > mobo.m2Slots)
  error(`La placa tiene ${mobo.m2Slots} slots M.2 y estás usando ${nvmeCount}.`);
```

### R-14 · Bahías 2.5" / 3.5"
```
const sata25 = storage.filter(s => s.formFactor === '2.5"').length;
const hdd35  = storage.filter(s => s.formFactor === '3.5"').length;
if (sata25 > caseItem.bays25 + caseItem.bays35)   // 3.5" bay suele caber 2.5"
  error("No hay suficientes bahías 2.5\" en el case.");
if (hdd35  > caseItem.bays35)
  error("No hay suficientes bahías 3.5\" en el case.");
```

### R-15 · Longitud PSU ↔ Case
```
if (psu.lengthMm > caseItem.maxPsuLengthMm)
  error(`La fuente mide ${psu.lengthMm} mm; el case acepta hasta ${caseItem.maxPsuLengthMm} mm.`);
```

### R-16 · Cooler TDP cubre CPU
```
if (cooler && cpu.tdpWBoost > cooler.tdpW)
  error(`El cooler soporta ${cooler.tdpW}W, el CPU puede llegar a ${cpu.tdpWBoost}W.`);
```

---

## 3. Reglas de ADVERTENCIA (`warning`)

### W-01 · Memoria XMP/EXPO necesaria
```
if (ram.frequencyMhz > mobo.memoryMaxMhz)
  warning(`Para alcanzar ${ram.frequencyMhz} MHz se requiere XMP/EXPO. Spec JEDEC: ${mobo.memoryMaxMhz}.`);
```

### W-02 · Cuello de botella CPU ↔ GPU
```
// Heurística simple basada en benchmarks normalizados (0-100).
const cpuScore = normalize(cpu.benchmarks["Geekbench 6 Single"]);
const gpuScore = normalize(gpu.benchmarks["3DMark Time Spy"]);
const ratio = gpuScore / cpuScore;
if (ratio > 1.5) warning("Posible cuello de botella: la GPU es muy superior al CPU para 1080p.");
if (ratio < 0.6) warning("Posible cuello de botella: el CPU es muy superior a la GPU para 4K.");
```

### W-03 · Eficiencia PSU
```
if (totalTdp > 500 && psu.efficiencyRating === "80+ White")
  warning("Se recomienda PSU 80+ Gold o superior para builds > 500W.");
```

### W-04 · Case sin mesh frontal + GPU alta TDP
```
if (gpu.tdpW > 300 && caseItem.sidePanel === "glass" && !caseItem.ventilation.includes("mesh_front"))
  warning("Flujo de aire limitado para una GPU de >300W. Considera un case con mesh frontal.");
```

### W-05 · Altura RAM ↔ Cooler aire
```
if (coolerAir && ram.heightMm > 44 && coolerAir.ramClearanceMm !== undefined && ram.heightMm > coolerAir.ramClearanceMm)
  warning(`La RAM mide ${ram.heightMm} mm; el cooler puede interferir con módulos sobre ${coolerAir.ramClearanceMm} mm.`);
```

### W-06 · PCIe gen GPU vs Mobo
```
if (gpu.pcieGen > maxPcieGen(mobo))
  warning(`La GPU es PCIe ${gpu.pcieGen} y la placa máxima es PCIe ${maxPcieGen(mobo)}. Funcionará pero sin aprovechar ancho de banda extra.`);
```

### W-07 · NVMe Gen vs Mobo
```
if (nvme.nvmeGen > mobo.m2MaxGen)
  warning(`El SSD es Gen ${nvme.nvmeGen}, la placa máxima Gen ${mobo.m2MaxGen}. Funcionará a velocidad del slot.`);
```

### W-08 · Dual channel RAM
```
if (ram.length === 1 && ram[0].kitQty === 1)
  warning("Instalar un solo módulo de RAM impide dual channel y reduce el rendimiento.");
```

---

## 4. Reglas INFORMATIVAS (`info`)

### I-01 · WiFi integrado
```
if (!mobo.wifi) info("Esta placa no tiene WiFi integrado. Considera un adaptador o cable de red.");
```

### I-02 · iGPU disponible
```
if (cpu.iGpu && !gpu) info(`El CPU incluye gráficos integrados (${cpu.iGpuModel}) — podés arrancar sin GPU discreta.`);
```

### I-03 · Fuente modular
```
if (psu.modular === "none") info("Fuente no modular — todos los cables van fijos. Afecta estética y cable management.");
```

---

## 5. Estructura del `CompatReport`

```ts
type CompatReport = {
  ok: boolean;              // true si no hay errores
  totalTdpW: number;
  recommendedPsuW: number;
  totalBob: number;
  issues: Issue[];
};

type Issue = {
  code: string;              // "R-07", "W-02", ...
  severity: "error" | "warning" | "info";
  messageEs: string;
  involved: { category: Category; componentId: string }[];
};
```

---

## 6. Función principal

```ts
// lib/compat/evaluate.ts
export function evaluateBuild(build: Build): CompatReport {
  const issues: Issue[] = [];

  check(R01_socket, build, issues);
  check(R02_ramType, build, issues);
  // ... todas las R-xx

  check(W01_xmp, build, issues);
  // ... todas las W-xx

  check(I01_wifi, build, issues);
  // ... todas las I-xx

  const totalTdpW = sumTdp(build.items);
  const recommendedPsuW = Math.ceil(totalTdpW * 1.3);
  const totalBob = build.items.reduce((a, i) => a + i.unitPriceBob * i.quantity, 0);

  return {
    ok: !issues.some(i => i.severity === "error"),
    totalTdpW,
    recommendedPsuW,
    totalBob,
    issues
  };
}
```

---

## 7. Casos borde

- **Build parcial** (sin GPU): si hay iGPU, OK. Si no hay iGPU ni GPU, error leve "Falta GPU".
- **Múltiples unidades de RAM** del mismo modelo (kits iguales): sumar `kitQty` y validar slots.
- **Mezcla de DDR5 y DDR4** en la misma build: `error`.
- **Case sin PSU shroud** + fuente visible: solo `info` estético.
- **Monitor en la build**: no entra en TDP del sistema, pero sí en total Bs.

---

## 8. Tests obligatorios (Vitest)

Para cada regla, al menos:
1. Un test que la viola y espera `error`/`warning`.
2. Un test que la cumple y espera que no aparezca el issue.

Archivo: `lib/compat/__tests__/<rule>.test.ts`.

Fixture builds en `lib/compat/__tests__/fixtures/`.
