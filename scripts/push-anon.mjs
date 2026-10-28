import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const envLocal = readFileSync(".env.local", "utf8");
const line = envLocal.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="));
if (!line) throw new Error("no key");
const value = line.slice("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length).replace(/^"(.*)"$/s, "$1").trim();
console.log("value length:", value.length);

for (const target of ["production", "preview", "development"]) {
  spawnSync(VERCEL, ["env", "rm", "NEXT_PUBLIC_SUPABASE_ANON_KEY", target, "--yes"], {
    stdio: "ignore",
    shell: true,
  });
  const r = spawnSync(
    VERCEL,
    [
      "env",
      "add",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "--environment",
      target,
      "--type",
      "config",
      "--value",
      value,
      "--yes",
    ],
    { stdio: ["ignore", "ignore", "inherit"], shell: true },
  );
  console.log(`${target} → exit ${r.status}`);
}
