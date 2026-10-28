import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import { createReviewDatabaseServer } from "./pglite-review-wire.mjs";

test("isolates extended queries and transactions from concurrent review connections", async () => {
  const pg = new PGlite();
  await pg.waitReady;
  const server = await createReviewDatabaseServer(pg, 0);
  const clients = Array.from({ length: 4 }, () =>
    postgres(`postgresql://postgres:postgres@127.0.0.1:${server.address().port}/postgres`, {
      prepare: false,
      max: 1,
    }),
  );
  try {
    await Promise.all(
      clients.map(async (client, connection) => {
        for (let iteration = 0; iteration < 12; iteration++) {
          const expected = `${connection}-${iteration}`;
          const [row] = await client`select ${expected}::text as marker`;
          assert.equal(row.marker, expected);
          await client.begin(async (tx) => {
            const [inside] =
              await tx`select ${expected}::text as marker, ${iteration}::int as number`;
            assert.equal(inside.marker, expected);
            assert.equal(inside.number, iteration);
          });
        }
      }),
    );
  } finally {
    await Promise.all(clients.map((client) => client.end({ timeout: 2 })));
    await new Promise((resolve) => server.close(resolve));
    await pg.close();
  }
});
