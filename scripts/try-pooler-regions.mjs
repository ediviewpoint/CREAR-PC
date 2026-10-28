// Prueba conectar al Supabase pooler en varias regiones y pushea la que funcione.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const TARGETS = ["production", "preview", "development"];

const REGIONS = [
  "aws-0-sa-east-1",
  "aws-0-us-east-1",
  "aws-0-us-east-2",
  "aws-0-us-west-1",
  "aws-0-eu-west-1",
  "aws-1-sa-east-1",
];

const envLocal = readFileSync(".env.local", "utf8");
const dbLine = envLocal.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
if (!dbLine) throw new Error("DATABASE_URL no encontrada");
const currentUrl = dbLine.slice("DATABASE_URL=".length).replace(/^"(.*)"$/s, "$1");
const cur = new URL(currentUrl);
const password = cur.password;
const user = cur.username; // ej "postgres.ajxidbnxeutyhwzanytk"

async function test(host) {
  const url = `postgresql://${user}:${password}@${host}:5432/postgres`;
  const client = postgres(url, { prepare: false, max: 1, connect_timeout: 10, idle_timeout: 1 });
  try {
    const r = await client`SELECT 1 as ok`;
    await client.end();
    return r[0]?.ok === 1;
  } catch (err) {
    try {
      await client.end();
    } catch {}
    return err.message.slice(0, 100);
  }
}

let winner = null;
for (const region of REGIONS) {
  const host = `${region}.pooler.supabase.com`;
  process.stdout.write(`${host}: `);
  const result = await test(host);
  if (result === true) {
    console.log("OK");
    winner = host;
    break;
  }
  console.log(result);
}

if (!winner) {
  console.error("Ningún pooler respondió.");
  process.exit(1);
}

const finalUrl = `postgresql://${user}:${password}@${winner}:5432/postgres?pgbouncer=true`;
for (const target of TARGETS) {
  spawnSync(VERCEL, ["env", "rm", "DATABASE_URL", target, "--yes"], {
    stdio: "ignore",
    shell: true,
  });
  const r = spawnSync(VERCEL, ["env", "add", "DATABASE_URL", target], {
    input: finalUrl,
    stdio: ["pipe", "ignore", "inherit"],
    shell: true,
  });
  console.log(`DATABASE_URL/${target} → exit ${r.status}`);
}

const newEnv = envLocal
  .split(/\r?\n/)
  .map((l) => (l.startsWith("DATABASE_URL=") ? `DATABASE_URL=${finalUrl}` : l))
  .join("\n");
writeFileSync(".env.local", newEnv, "utf8");
console.log(`[✓] Pooler ganador: ${winner}`);
