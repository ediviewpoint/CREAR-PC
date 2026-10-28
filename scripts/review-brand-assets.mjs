import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
const names = [
  "toshiba",
  "seagate",
  "western-digital",
  "hitachi",
  "kingston",
  "crucial",
  "msi",
  "hikvision",
  "teamgroup",
  "apacer",
];
const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROMIUM || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  const images = await Promise.all(
    names.map(
      async (name) =>
        `<article><div><img alt="${name}" src="data:image/svg+xml;base64,${Buffer.from(await fs.readFile(`public/brands/${name}.svg`)).toString("base64")}"></div><p>${name}</p></article>`,
    ),
  );
  await page.setContent(
    `<style>body{margin:0;padding:24px;font:14px Arial;background:#f7f8fa;color:#13284a}main{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}article{padding:16px;background:white;border:1px solid #dce0e6}article div{height:110px;display:grid;place-items:center}img{width:180px;height:85px;object-fit:contain}p{text-align:center}</style><main>${images.join("")}</main>`,
  );
  await page
    .locator("img")
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.screenshot({ path: "output/review/brand-assets-contact-sheet.png", fullPage: true });
} finally {
  await browser.close();
}
