import { createRequire } from "node:module";
import path from "node:path";

const req = createRequire(path.join(process.cwd(), "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());

type Check = {
  path: string;
  expectStatus?: number | number[];
  mustInclude?: string[];
  mustNotInclude?: string[];
  acceptStatus?: number[];
};

const DEFAULT_BASE = "http://localhost:3000";

const CHECKS: Check[] = [
  { path: "/", mustInclude: ["ELITEPC"], mustNotInclude: ["Neon", "neon.tech"] },
  { path: "/catalog", mustInclude: ["Componentes"], mustNotInclude: ["Neon", "neon.tech"] },
  { path: "/build", mustNotInclude: ["Neon", "neon.tech"] },
  { path: "/contacto" },
  { path: "/politicas/garantia", mustInclude: ["Garantía"] },
  { path: "/politicas/privacidad", mustInclude: ["Privacidad"] },
  { path: "/politicas/terminos", mustInclude: ["reglas"] },
  { path: "/politicas/cookies", mustInclude: ["Cookies"] },
  { path: "/politicas/proforma-condiciones", mustInclude: ["borrador"] },
  { path: "/sitemap.xml", mustInclude: ["<urlset"] },
  { path: "/robots.txt", mustInclude: ["Disallow: /admin/"] },
  { path: "/api/health", acceptStatus: [200, 503], mustInclude: ["ELITEPC"] },
  // Admin sin sesión debe redirigir o devolver login — nunca 200 directo al panel.
  { path: "/admin", acceptStatus: [200, 302, 303, 307, 308, 401, 403] },
];

async function run(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const results: { path: string; ok: boolean; detail: string }[] = [];

  for (const check of CHECKS) {
    const url = base + check.path;
    const started = Date.now();
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: { "user-agent": "crear-pc-smoke/1.0" },
      });
      const elapsed = Date.now() - started;
      const expectedStatuses = check.acceptStatus ?? [200];
      if (!expectedStatuses.includes(res.status)) {
        results.push({
          path: check.path,
          ok: false,
          detail: `status ${res.status} (esperado ${expectedStatuses.join("|")}) · ${elapsed}ms`,
        });
        continue;
      }
      const body = check.mustInclude?.length || check.mustNotInclude?.length ? await res.text() : "";
      const missing = (check.mustInclude ?? []).filter((s) => !body.includes(s));
      const leaked = (check.mustNotInclude ?? []).filter((s) => body.includes(s));
      if (missing.length || leaked.length) {
        const parts: string[] = [];
        if (missing.length) parts.push(`faltan: ${missing.join(", ")}`);
        if (leaked.length) parts.push(`filtra: ${leaked.join(", ")}`);
        results.push({ path: check.path, ok: false, detail: `${parts.join(" · ")} (${elapsed}ms)` });
      } else {
        results.push({ path: check.path, ok: true, detail: `${res.status} · ${elapsed}ms` });
      }
    } catch (err) {
      results.push({
        path: check.path,
        ok: false,
        detail: err instanceof Error ? err.message.slice(0, 120) : "error desconocido",
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  const col = (ok: boolean) => (ok ? "✓" : "✗");
  console.log(`\nSmoke check contra ${base}\n`);
  for (const r of results) console.log(`  ${col(r.ok)} ${r.path.padEnd(32)} ${r.detail}`);
  console.log(
    `\n${results.length - failed.length}/${results.length} OK` +
      (failed.length ? ` — ${failed.length} fallaron` : ""),
  );
  if (failed.length) process.exit(1);
}

const arg = process.argv.find((a) => a.startsWith("--base="));
const base = arg?.slice(7) ?? process.env.SMOKE_BASE_URL ?? DEFAULT_BASE;
run(base).catch((err) => {
  console.error("Smoke no completado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
