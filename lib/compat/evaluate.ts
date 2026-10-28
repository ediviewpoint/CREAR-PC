import { sumTdp, sumTotalBob } from "./helpers";
import { ALL_RULES } from "./rules";
import type { BuildView, CompatReport } from "./types";

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
  };
}
