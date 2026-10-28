import { spawnSync } from "node:child_process";

const VERCEL = process.platform === "win32" ? "vercel.cmd" : "vercel";
const url = "https://crear-pc.vercel.app";

for (const target of ["production", "preview", "development"]) {
  spawnSync(VERCEL, ["env", "rm", "NEXT_PUBLIC_SITE_URL", target, "--yes"], {
    stdio: "ignore",
    shell: true,
  });
  const r = spawnSync(VERCEL, ["env", "add", "NEXT_PUBLIC_SITE_URL", target], {
    input: url,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });
  console.log(`NEXT_PUBLIC_SITE_URL/${target} → exit ${r.status}`);
}
