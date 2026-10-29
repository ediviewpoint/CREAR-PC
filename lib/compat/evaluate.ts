import { sumTdp, sumTotalBob } from "./helpers";
import { ALL_RULES } from "./rules";
import type { BuildView, CompatReport, RuleCoverage } from "./types";

// Fase 0 · H-06b: contamos reglas por severidad una sola vez por rule ID
// (los IDs empiezan con R/W/I y vienen de los nombres de las funciones).
const COVERAGE: RuleCoverage = (() => {
  const names = ALL_RULES.map((r) => r.name);
  return {
    total: names.length,
    blocking: names.filter((n) => n.startsWith("R")).length,
    warnings: names.filter((n) => n.startsWith("W")).length,
    info: names.filter((n) => n.startsWith("I")).length,
  };
})();

export function evaluateBuild(build: BuildView): CompatReport {
  const issues = ALL_RULES.flatMap((rule) => rule(build));
  const totalTdpW = sumTdp(build);
  const recommendedPsuW = Math.ceil(totalTdpW * 1.3);
  const totalBob = sumTotalBob(build);

  return {
    ok: !issues.some((i) => i.severity === "error"),
    totalTdpW,
    recommendedPsuW,
    totalBob,
    issues,
    coverage: COVERAGE,
  };
}
