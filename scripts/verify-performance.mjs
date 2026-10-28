import path from "node:path";
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
const base = process.env.QA_BASE_URL ?? "http://localhost:3011";
const browser = await chromium.launch({
  executablePath: path.join(
    process.env.LOCALAPPDATA,
    "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  ),
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__crearpcMetrics = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__crearpcMetrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__crearpcMetrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 1600000 / 8,
    uploadThroughput: 750000 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => window.__crearpcMetrics);
  await fs.writeFile(
    "output/qa/performance.json",
    JSON.stringify(
      {
        base,
        viewport: "390x844",
        network: "1.6 Mbps / 150 ms latency",
        cpu: "4x slowdown",
        ...metrics,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
