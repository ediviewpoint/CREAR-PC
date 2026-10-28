import { describe, expect, it } from "vitest";
import { clientKey, rateLimit } from "./rate-limit";

const unique = (() => {
  let n = 0;
  return () => `test-${Date.now()}-${++n}`;
})();

describe("rateLimit", () => {
  it("permite dentro del límite", () => {
    const key = unique();
    const first = rateLimit(key, { limit: 3, windowMs: 1000 });
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);
  });

  it("rechaza al superar el límite", () => {
    const key = unique();
    rateLimit(key, { limit: 2, windowMs: 60_000 });
    rateLimit(key, { limit: 2, windowMs: 60_000 });
    const third = rateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.reset).toBeGreaterThan(Date.now());
  });

  it("recupera tokens con el tiempo", async () => {
    const key = unique();
    rateLimit(key, { limit: 1, windowMs: 100 });
    const blocked = rateLimit(key, { limit: 1, windowMs: 100 });
    expect(blocked.success).toBe(false);
    await new Promise((r) => setTimeout(r, 150));
    const recovered = rateLimit(key, { limit: 1, windowMs: 100 });
    expect(recovered.success).toBe(true);
  });

  it("buckets independientes por key", () => {
    const a = unique();
    const b = unique();
    rateLimit(a, { limit: 1, windowMs: 10_000 });
    const blockedA = rateLimit(a, { limit: 1, windowMs: 10_000 });
    const freshB = rateLimit(b, { limit: 1, windowMs: 10_000 });
    expect(blockedA.success).toBe(false);
    expect(freshB.success).toBe(true);
  });
});

describe("clientKey", () => {
  it("combina IP con sufijo", () => {
    expect(clientKey("1.2.3.4", "pdf")).toBe("1.2.3.4:pdf");
  });

  it("usa 'unknown' si no hay IP", () => {
    expect(clientKey(null, "pdf")).toBe("unknown:pdf");
    expect(clientKey(undefined, "pdf")).toBe("unknown:pdf");
  });
});
