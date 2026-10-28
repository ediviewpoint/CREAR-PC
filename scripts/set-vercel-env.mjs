// Set Vercel env vars via stdin without BOM (Node UTF-8 default).
import { spawnSync } from "node:child_process";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const TARGETS = ["production", "preview", "development"];

const envs = [
  ["NEXT_PUBLIC_SUPABASE_URL", "https://ajxidbnxeutyhwzanytk.supabase.co"],
  ["NEXT_PUBLIC_SITE_LOCALE", "es-BO"],
  ["NEXT_PUBLIC_DEFAULT_CURRENCY", "BOB"],
  ["NEXT_PUBLIC_SITE_NAME", "CREAR PC"],
  ["BCB_RATE_SOURCE", "manual"],
  ["BCB_USD_BOB", "6.96"],
  ["CRON_SECRET", "hFmDyAnfAmrRHjreDtXNo4ICJxBSq6aKtIekDpsx0hBGsBjH"],
  ["ADMIN_SECRET", "rhljpbZwVHBWSSOLzh0WfXM5al9sfW0uMqYOTjQpTwGDSSMs"],
];

for (const [name, value] of envs) {
  for (const target of TARGETS) {
    // Remove first (ignore errors)
    spawnSync(VERCEL, ["env", "rm", name, target, "--yes"], {
      stdio: ["ignore", "ignore", "ignore"],
      shell: true,
    });
    // Add with raw string (no newline, no BOM)
    const r = spawnSync(VERCEL, ["env", "add", name, target], {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    });
    console.log(`${name}/${target} → exit ${r.status}`);
  }
}
