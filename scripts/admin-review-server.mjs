// Creates only an in-memory fixture database. Never reads/writes the business database.
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { createReviewDatabaseServer } from "./lib/pglite-review-wire.mjs";

const pg = new PGlite();
await pg.waitReady;
for (const file of (await fs.readdir("drizzle")).filter((file) => file.endsWith(".sql")).sort())
  await pg.exec(await fs.readFile(`drizzle/${file}`, "utf8"));
const slugs = [
  "amd-ryzen-5-9600x",
  "asus-prime-b650m-a-wifi",
  "kingston-fury-beast-ddr5-2x16gb-5600",
  "nvidia-geforce-rtx-4060",
  "samsung-990-pro-1tb",
  "corsair-cx650-650w",
  "deepcool-ch370",
  "deepcool-ak400",
];
const categories = {
  "cpus.json": "cpu",
  "gpus.json": "gpu",
  "mobos.json": "mobo",
  "motherboards.json": "mobo",
  "ram.json": "ram",
  "storage.json": "storage",
  "psus.json": "psu",
  "cases.json": "case",
  "coolers_air.json": "cooler_air",
};
const store = randomUUID();
await pg.query(
  "insert into stores(id,slug,name,city,is_active) values($1,'fixture-local','Tienda de revisión aislada','Fixture',true)",
  [store],
);
for (const [file, category] of Object.entries(categories)) {
  let rows;
  try {
    rows = JSON.parse(await fs.readFile(`data/seed/${file}`, "utf8"));
  } catch {
    continue;
  }
  for (const row of rows.filter((row) => slugs.includes(row.slug))) {
    const id = randomUUID();
    await pg.query(
      "insert into components(id,slug,category,brand,model,name_display,spec,tdp_w,sources,is_active) values($1,$2,$3,$4,$5,$6,$7,$8,$9,true)",
      [
        id,
        row.slug,
        category,
        row.brand,
        row.name_display.slice(0, 120),
        row.name_display,
        JSON.stringify(row.spec),
        row.tdp_w ?? null,
        JSON.stringify(row.sources ?? []),
      ],
    );
    await pg.query(
      "insert into prices(component_id,store_id,currency,amount,in_stock,stock_qty,source_url) values($1,$2,'BOB',100,true,50,'https://fixture.invalid/oferta')",
      [id, store],
    );
  }
}
const server = await createReviewDatabaseServer(pg);
const args = process.argv.includes("--dev")
  ? ["dev", "--port", "3004", "--hostname", "127.0.0.1"]
  : ["start", "--port", "3004", "--hostname", "127.0.0.1"];
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55432/postgres",
    ADMIN_PASSWORD: "local-admin-review-only-2026",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3004",
    LEGAL_RESPONSIBLE: "Emisor de revisión aislada",
    LEGAL_NIT: "123456789",
    LEGAL_ADDRESS: "Dirección de prueba",
    LEGAL_CITY: "Fixture",
    NEXT_PUBLIC_CONTACT_EMAIL: "review@example.test",
    NEXT_PUBLIC_SUPPORT_WHATSAPP: "",
  },
});
console.log(
  "Revisión aislada: http://127.0.0.1:3004/admin/login · base en memoria, datos ficticios solo para pruebas.",
);
const stop = () => {
  child.kill();
  server.close();
  void pg.close();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", () => {
  server.close();
  void pg.close();
});
