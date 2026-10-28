// Convierte DATABASE_URL de "direct host" a "Session Pooler" (compatible con Vercel).
// Lee desde .env.local, pushea el nuevo URL a Vercel sin BOM, mantiene el password.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const TARGETS = ["production", "preview", "development"];

// Supabase pooler region — US East por default. Si tu proyecto está en otra región,
// cambialo (ej: aws-1-sa-east-1, aws-0-eu-west-1).
const POOLER_HOST = process.env.SUPABASE_POOLER_HOST ?? "aws-0-us-east-1.pooler.supabase.com";
const POOLER_PORT = process.env.SUPABASE_POOLER_PORT ?? "5432"; // 5432 session · 6543 transaction

const envLocal = readFileSync(".env.local", "utf8");
const dbLine = envLocal.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
if (!dbLine) {
  console.error("DATABASE_URL no encontrada en .env.local");
  process.exit(1);
}
let raw = dbLine.slice("DATABASE_URL=".length).replace(/^"(.*)"$/s, "$1");

const url = new URL(raw);
const originalHost = url.hostname;
const match = originalHost.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
if (!match) {
  console.error(`Hostname "${originalHost}" no parece ser un host directo Supabase`);
  console.error("Esperado: db.<project-ref>.supabase.co");
  process.exit(1);
}
const projectRef = match[1];
const password = url.password; // ya URL-encoded
const originalUser = url.username; // típicamente "postgres"

const pooledUrl = new URL(`postgresql://${originalUser}.${projectRef}:${password}@${POOLER_HOST}:${POOLER_PORT}/postgres`);
pooledUrl.searchParams.set("pgbouncer", "true");

const finalUrl = pooledUrl.toString();
console.log(`[info] host original: ${originalHost}`);
console.log(`[info] host nuevo: ${POOLER_HOST}:${POOLER_PORT}`);
console.log(`[info] user: ${originalUser}.${projectRef}`);
console.log(`[info] password: ${"*".repeat(password.length)} (${password.length} chars)`);

// Push a Vercel sin BOM.
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

// Actualizar .env.local también.
const newEnvLocal = envLocal
  .split(/\r?\n/)
  .map((l) => (l.startsWith("DATABASE_URL=") ? `DATABASE_URL=${finalUrl}` : l))
  .join("\n");
writeFileSync(".env.local", newEnvLocal, "utf8");
console.log("[info] .env.local actualizado.");
