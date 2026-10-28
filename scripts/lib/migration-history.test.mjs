import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectMigrationHistory } from "./migration-history.mjs";
const migrations = [
  { folderMillis: 1, hash: "a" },
  { folderMillis: 2, hash: "b" },
];
const journal = { entries: [{ tag: "0000_initial" }, { tag: "0001_update" }] };
test("identifies the pending suffix and complete history", () => {
  assert.deepEqual(inspectMigrationHistory(migrations, journal, [{ created_at: "1", hash: "a" }]), {
    applied: ["0000_initial"],
    pending: ["0001_update"],
    issues: [],
  });
  assert.equal(
    inspectMigrationHistory(migrations, journal, [
      { created_at: 1, hash: "a" },
      { created_at: 2, hash: "b" },
    ]).pending.length,
    0,
  );
});
test("rejects drift, unknown migrations, duplicates and gaps", () => {
  for (const applied of [
    [{ created_at: 1, hash: "changed" }],
    [{ created_at: 3, hash: "c" }],
    [
      { created_at: 1, hash: "a" },
      { created_at: 1, hash: "a" },
    ],
    [{ created_at: 2, hash: "b" }],
  ])
    assert.ok(inspectMigrationHistory(migrations, journal, applied).issues.length);
});
