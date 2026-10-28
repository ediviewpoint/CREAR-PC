import { createRequire } from "node:module";
import path from "node:path";
const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.CRON_SECRET) throw new Error("Configurá CRON_SECRET.");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const response = await fetch(new URL("/api/cron/refresh-prices", base), {
    headers: { authorization: "Bearer " + process.env.CRON_SECRET },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error("La actualización no se completó.");
  console.log(JSON.stringify(await response.json(), null, 2));
}
main().catch(() => {
  console.error("No se pudo actualizar. Revisá servidor, base, CRON_SECRET y PRICE_FEED_URL.");
  process.exitCode = 1;
});
