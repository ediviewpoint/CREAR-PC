import { createRequire } from "node:module";
import { inspectProductionConfig } from "./lib/production-config.mjs";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
const report = inspectProductionConfig(process.env);
console.log(JSON.stringify(report, null, 2));
if (!report.configurationReady) process.exitCode = 1;
