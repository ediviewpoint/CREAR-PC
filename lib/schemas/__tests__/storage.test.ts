import { it, expect } from "vitest";
import { specStorage } from "../components";
import { makeStorage } from "@/lib/compat/__tests__/fixtures";
it("TBW no aplica a HDD pero sigue siendo obligatorio para SSD", () => {
  const base = makeStorage().spec;
  expect(specStorage.safeParse({ ...base, storageType: "hdd_3.5", tbw: null }).success).toBe(true);
  expect(specStorage.safeParse({ ...base, storageType: "nvme_m2", tbw: null }).success).toBe(false);
});
