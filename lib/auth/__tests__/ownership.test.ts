import { it, expect } from "vitest";
import { ownsResource } from "../ownership";
it("un registro legado sin dueño no pertenece a un visitante anónimo", () => {
  expect(ownsResource(null, null)).toBe(false);
  expect(ownsResource("", "")).toBe(false);
  expect(ownsResource("a", "b")).toBe(false);
  expect(ownsResource("a", "a")).toBe(true);
});
