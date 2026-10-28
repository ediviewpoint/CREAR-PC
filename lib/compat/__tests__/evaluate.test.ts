import { describe, it, expect } from "vitest";
import { evaluateBuild } from "../evaluate";
import {
  makeCase,
  makeCompatibleBuild,
  makeCoolerAio,
  makeCoolerAir,
  makeCpu,
  makeGpu,
  makeMobo,
  makePsu,
  makeRam,
  makeStorage,
} from "./fixtures";

const hasCode = (issues: { code: string }[], code: string) => issues.some((i) => i.code === code);

describe("evaluateBuild — happy path", () => {
  it("un build compatible por defecto no tiene errores", () => {
    const report = evaluateBuild(makeCompatibleBuild());
    const errors = report.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("calcula consumo total y PSU recomendado", () => {
    const report = evaluateBuild(makeCompatibleBuild());
    expect(report.totalTdpW).toBeGreaterThan(0);
    expect(report.recommendedPsuW).toBe(Math.ceil(report.totalTdpW * 1.3));
  });

  it("suma precios en Bs. correctamente", () => {
    const report = evaluateBuild(makeCompatibleBuild());
    // CPU 3800 + GPU 4500 + Mobo 2450 + RAM 950 + Storage 850 + PSU 1100 + Case 1300 + CoolerAir 850 = 15800
    expect(report.totalBob).toBe(15800);
  });
});

describe("R-01 · Socket CPU vs Mobo", () => {
  it("detecta sockets distintos", () => {
    const b = makeCompatibleBuild();
    b.mobo = makeMobo({ socket: "LGA1700" });
    const r = evaluateBuild(b);
    expect(hasCode(r.issues, "R-01")).toBe(true);
    expect(r.ok).toBe(false);
  });
});

describe("R-02 · Tipo de RAM", () => {
  it("DDR4 con mobo DDR5 falla", () => {
    const b = makeCompatibleBuild();
    b.ram = [makeRam({ type: "DDR4" })];
    expect(hasCode(evaluateBuild(b).issues, "R-02")).toBe(true);
  });
});

describe("R-03 · Slots RAM", () => {
  it("5 módulos en una placa con 4 slots falla", () => {
    const b = makeCompatibleBuild();
    b.ram = [makeRam({ kitQty: 2, id: "r1" }), makeRam({ kitQty: 2, id: "r2" })];
    b.ram[0]!.quantity = 1;
    b.ram[1]!.quantity = 1;
    b.mobo = makeMobo({ memorySlots: 2 });
    expect(hasCode(evaluateBuild(b).issues, "R-03")).toBe(true);
  });
});

describe("R-04 · Capacidad RAM máxima", () => {
  it("supera memoryMaxGb", () => {
    const b = makeCompatibleBuild();
    b.mobo = makeMobo({ memoryMaxGb: 32 });
    b.ram = [makeRam({ capacityGb: 32, kitQty: 2 })]; // 64GB total
    expect(hasCode(evaluateBuild(b).issues, "R-04")).toBe(true);
  });
});

describe("R-05 · Formato placa vs Case", () => {
  it("ATX en case ITX falla", () => {
    const b = makeCompatibleBuild();
    b.case = makeCase({ formFactor: ["ITX"] });
    expect(hasCode(evaluateBuild(b).issues, "R-05")).toBe(true);
  });
});

describe("R-06 · Formato PSU vs Case", () => {
  it("PSU SFX en case que solo acepta ATX falla", () => {
    const b = makeCompatibleBuild();
    b.psu = makePsu({ formFactor: "SFX" });
    expect(hasCode(evaluateBuild(b).issues, "R-06")).toBe(true);
  });
});

describe("R-07 · Longitud GPU", () => {
  it("GPU 400mm en case 300mm falla", () => {
    const b = makeCompatibleBuild();
    b.gpu = makeGpu({ lengthMm: 400 });
    b.case = makeCase({ maxGpuLengthMm: 300 });
    expect(hasCode(evaluateBuild(b).issues, "R-07")).toBe(true);
  });
});

describe("R-08 · Altura cooler aire", () => {
  it("Cooler 165mm en case 160mm falla", () => {
    const b = makeCompatibleBuild();
    b.coolerAir = makeCoolerAir({ heightMm: 165 });
    b.case = makeCase({ maxCoolerHeightMm: 160 });
    expect(hasCode(evaluateBuild(b).issues, "R-08")).toBe(true);
  });
});

describe("R-09 · Cooler soporta socket", () => {
  it("Cooler sin AM5 con CPU AM5 falla", () => {
    const b = makeCompatibleBuild();
    b.coolerAir = makeCoolerAir({ socketSupport: ["LGA1700"] });
    expect(hasCode(evaluateBuild(b).issues, "R-09")).toBe(true);
  });
});

describe("R-10 · AIO cabe en case", () => {
  it("AIO 420mm en case que solo soporta hasta 360 falla", () => {
    const b = makeCompatibleBuild();
    delete b.coolerAir;
    b.coolerAio = makeCoolerAio({ radiatorSizeMm: 420 });
    b.case = makeCase(); // soporta 240/280/360
    expect(hasCode(evaluateBuild(b).issues, "R-10")).toBe(true);
  });
});

describe("R-11 · Potencia PSU", () => {
  it("PSU 300W con build de 500W falla", () => {
    const b = makeCompatibleBuild();
    b.psu = makePsu({ wattage: 300 });
    expect(hasCode(evaluateBuild(b).issues, "R-11")).toBe(true);
  });
});

describe("R-12 · 12VHPWR", () => {
  it("GPU 12VHPWR con PSU sin ese conector dispara error", () => {
    const b = makeCompatibleBuild();
    b.psu = makePsu({
      connectors: {
        cpu8pin: 2,
        cpu4plus4: 2,
        pcie8pin: 4,
        pcie12vhpwr: 0,
        sata: 8,
        molex: 4,
      },
    });
    expect(hasCode(evaluateBuild(b).issues, "R-12")).toBe(true);
  });
});

describe("R-13 · M.2 count", () => {
  it("3 NVMe en placa con 2 slots falla", () => {
    const b = makeCompatibleBuild();
    b.mobo = makeMobo({ m2Slots: 2 });
    b.storage = [
      makeStorage({ id: "s1" }),
      makeStorage({ id: "s2" }),
      makeStorage({ id: "s3" }),
    ];
    expect(hasCode(evaluateBuild(b).issues, "R-13")).toBe(true);
  });
});

describe("R-14 · Bahías", () => {
  it("3 HDDs 3.5 en case con 2 bahías falla", () => {
    const b = makeCompatibleBuild();
    b.case = makeCase({ bays35: 2, bays25: 0 });
    b.storage = [
      makeStorage({ id: "h1", storageType: "hdd_3.5", formFactor: '3.5"', nvmeGen: undefined }),
      makeStorage({ id: "h2", storageType: "hdd_3.5", formFactor: '3.5"', nvmeGen: undefined }),
      makeStorage({ id: "h3", storageType: "hdd_3.5", formFactor: '3.5"', nvmeGen: undefined }),
    ];
    expect(hasCode(evaluateBuild(b).issues, "R-14")).toBe(true);
  });
});

describe("R-15 · Longitud PSU", () => {
  it("PSU 200mm en case que acepta hasta 180mm falla", () => {
    const b = makeCompatibleBuild();
    b.psu = makePsu({ lengthMm: 200 });
    b.case = makeCase({ maxPsuLengthMm: 180 });
    expect(hasCode(evaluateBuild(b).issues, "R-15")).toBe(true);
  });
});

describe("R-16 · Cooler TDP cubre CPU", () => {
  it("Cooler 100W con CPU boost 200W falla", () => {
    const b = makeCompatibleBuild();
    b.coolerAir = makeCoolerAir({ tdpW: 100 });
    b.cpu = makeCpu({ tdpWBoost: 200 });
    expect(hasCode(evaluateBuild(b).issues, "R-16")).toBe(true);
  });
});

describe("W-01 · XMP/EXPO necesario", () => {
  it("RAM 7200 en mobo JEDEC 6400 dispara warning", () => {
    const b = makeCompatibleBuild();
    b.ram = [makeRam({ frequencyMhz: 7200 })];
    b.mobo = makeMobo({ memoryMaxMhz: 6400 });
    expect(hasCode(evaluateBuild(b).issues, "W-01")).toBe(true);
  });
});

describe("W-03 · Eficiencia PSU", () => {
  it("Build >500W con PSU 80+ White dispara warning", () => {
    const b = makeCompatibleBuild();
    b.gpu = makeGpu({ tdpW: 400 }); // sube total TDP
    b.psu = makePsu({ efficiencyRating: "80+ White" });
    expect(hasCode(evaluateBuild(b).issues, "W-03")).toBe(true);
  });
});

describe("W-04 · Flujo de aire", () => {
  it("GPU >300W con case glass dispara warning", () => {
    const b = makeCompatibleBuild();
    b.gpu = makeGpu({ tdpW: 450 });
    b.case = makeCase({ sidePanel: "glass" });
    expect(hasCode(evaluateBuild(b).issues, "W-04")).toBe(true);
  });
});

describe("W-05 · RAM clearance", () => {
  it("RAM 50mm con cooler clearance 40mm dispara warning", () => {
    const b = makeCompatibleBuild();
    b.ram = [makeRam({ heightMm: 50 })];
    b.coolerAir = makeCoolerAir({ ramClearanceMm: 40 });
    expect(hasCode(evaluateBuild(b).issues, "W-05")).toBe(true);
  });
});

describe("W-06 · PCIe gen GPU vs Mobo", () => {
  it("GPU PCIe 5 en mobo PCIe 3 dispara warning", () => {
    const b = makeCompatibleBuild();
    b.gpu = makeGpu({ pcieGen: 5 });
    b.mobo = makeMobo({ pcie5Slots: 0, pcie4Slots: 0, pcie3Slots: 2 });
    expect(hasCode(evaluateBuild(b).issues, "W-06")).toBe(true);
  });
});

describe("W-07 · NVMe gen vs mobo", () => {
  it("SSD Gen 5 en mobo Gen 4 dispara warning", () => {
    const b = makeCompatibleBuild();
    b.storage = [makeStorage({ nvmeGen: 5 })];
    b.mobo = makeMobo({ m2MaxGen: 4 });
    expect(hasCode(evaluateBuild(b).issues, "W-07")).toBe(true);
  });
});

describe("W-08 · Dual channel", () => {
  it("Un solo módulo dispara warning", () => {
    const b = makeCompatibleBuild();
    b.ram = [makeRam({ kitQty: 1 })];
    expect(hasCode(evaluateBuild(b).issues, "W-08")).toBe(true);
  });
});

describe("I-01 · WiFi integrado", () => {
  it("Mobo sin WiFi dispara info", () => {
    const b = makeCompatibleBuild();
    b.mobo = makeMobo({ wifi: null });
    expect(hasCode(evaluateBuild(b).issues, "I-01")).toBe(true);
  });
});

describe("I-02 · iGPU disponible", () => {
  it("CPU con iGPU sin GPU discreta dispara info", () => {
    const b = makeCompatibleBuild();
    delete b.gpu;
    expect(hasCode(evaluateBuild(b).issues, "I-02")).toBe(true);
  });
});

describe("I-03 · Fuente modular", () => {
  it("PSU no modular dispara info", () => {
    const b = makeCompatibleBuild();
    b.psu = makePsu({ modular: "none" });
    expect(hasCode(evaluateBuild(b).issues, "I-03")).toBe(true);
  });
});
