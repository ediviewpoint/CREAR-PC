import { describe, it, expect } from "vitest";
import { toBuildView, isCompleteBuild } from "../build";
import type { CatalogComponent, Selection } from "../types";
import { makeCpu, makeCompatibleBuild } from "@/lib/compat/__tests__/fixtures";
import { evaluateBuild } from "@/lib/compat/evaluate";
function component(selection: Selection, price: number | null): CatalogComponent {
  return {
    id: selection.item.componentId,
    slug: "cpu",
    name: selection.item.nameDisplay,
    category: "cpu",
    brand: "Fixture",
    specs: [],
    sources: [],
    priceBob: price,
    selection,
  };
}
describe("UI build boundary", () => {
  it("does not count owned hardware as a purchase but retains its power draw", () => {
    const cpu = makeCpu();
    const build = toBuildView([
      { component: component({ category: "cpu", item: cpu }, 3800), owned: true },
    ]);
    expect(evaluateBuild(build).totalBob).toBe(0);
    expect(evaluateBuild(build).totalTdpW).toBeGreaterThan(0);
  });
  it("an empty or partial build cannot be considered complete even when report.ok", () => {
    const empty = toBuildView([]);
    expect(evaluateBuild(empty).ok).toBe(true);
    expect(isCompleteBuild(empty)).toBe(false);
    expect(
      isCompleteBuild(
        toBuildView([
          { component: component({ category: "cpu", item: makeCpu() }, null), owned: false },
        ]),
      ),
    ).toBe(false);
  });
  it("a discrete GPU is required when CPU has no integrated graphics", () => {
    const b = makeCompatibleBuild();
    delete b.gpu;
    b.cpu!.spec.iGpu = false;
    expect(isCompleteBuild(b)).toBe(false);
    b.cpu!.spec.iGpu = true;
    expect(isCompleteBuild(b)).toBe(true);
  });
  it("passes real purchase prices into compatibility total", () => {
    const build = toBuildView([
      { component: component({ category: "cpu", item: makeCpu() }, 2750), owned: false },
    ]);
    expect(evaluateBuild(build).totalBob).toBe(2750);
  });
});
