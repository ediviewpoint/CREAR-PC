// Lee .env.local y pushea a Vercel las variables sensibles con valor real.
// NO escribe BOM. NO pushea placeholders ni valores vacíos.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const TARGETS = ["production", "preview", "development"];

// Variables que ESTE script puede escribir si están en .env.local
// con un valor real (no vacío, no placeholder __...__).
const WHITELIST = new Set([
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SB_SECRET_KEY",
  "LEGAL_RESPONSIBLE",
  "LEGAL_NIT",
  "LEGAL_ADDRESS",
  "LEGAL_CITY",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_SUPPORT_WHATSAPP",
]);

if (!existsSync(".env.local")) {
  console.error(".env.local no encontrado — correr `vercel env pull` primero.");
  process.exit(1);
}

const parse = (raw) => {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    // Quitar comillas envolventes si las hay (vercel env pull las añade).
    const v = rawVal.replace(/^"(.*)"$/s, "$1").trim();
    out[key] = v;
  }
  return out;
};

const envs = parse(readFileSync(".env.local", "utf8"));

for (const key of WHITELIST) {
  const value = envs[key];
  if (!value || value === "" || /^__.+__$/.test(value)) {
    console.log(`[skip] ${key} vacío o placeholder`);
    continue;
  }
  // Vercel safeguard: NEXT_PUBLIC_* que parecen credenciales requieren --type config explícito.
  const isPublic = key.startsWith("NEXT_PUBLIC_");
  for (const target of TARGETS) {
    spawnSync(VERCEL, ["env", "rm", key, target, "--yes"], {
      stdio: "ignore",
      shell: true,
    });
    const args = isPublic
      ? [
          "env",
          "add",
          key,
          "--environment",
          target,
          "--type",
          "config",
          "--value",
          value,
          "--yes",
        ]
      : ["env", "add", key, target];
    const options = isPublic
      ? { stdio: ["ignore", "ignore", "inherit"], shell: true }
      : { input: value, stdio: ["pipe", "ignore", "inherit"], shell: true };
    const r = spawnSync(VERCEL, args, options);
    console.log(`${key}/${target} → exit ${r.status}`);
  }
}
