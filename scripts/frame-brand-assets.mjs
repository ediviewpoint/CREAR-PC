// Adjust only SVG canvas whitespace. Paths, colors and proportions stay intact.
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
  const page = await browser.newPage();
  for (const name of names) {
    const file = `public/brands/${name}.svg`;
    let svg = await fs.readFile(file, "utf8");
    await page.setContent(svg);
    const box = await page.locator("svg").evaluate((root) => {
      const points = [];
      const inverse = root.getScreenCTM().inverse();
      for (const element of root.querySelectorAll("path,polygon,rect,circle,ellipse,polyline")) {
        if (element.closest("defs,clipPath,mask,pattern,symbol")) continue;
        const style = getComputedStyle(element);
        if (style.fill === "rgb(255, 255, 255)" || style.display === "none") continue;
        const b = element.getBBox();
        if (!b.width || !b.height) continue;
        const matrix = inverse.multiply(element.getScreenCTM());
        for (const [x, y] of [
          [b.x, b.y],
          [b.x + b.width, b.y],
          [b.x, b.y + b.height],
          [b.x + b.width, b.y + b.height],
        ])
          points.push(new DOMPoint(x, y).matrixTransform(matrix));
      }
      const minX = Math.min(...points.map((point) => point.x)),
        minY = Math.min(...points.map((point) => point.y));
      const width = Math.max(...points.map((point) => point.x)) - minX,
        height = Math.max(...points.map((point) => point.y)) - minY;
      const margin = Math.max(width, height) * 0.04;
      return [minX - margin, minY - margin, width + margin * 2, height + margin * 2].map((value) =>
        Number(value.toFixed(3)),
      );
    });
    if (!box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0)
      throw new Error(`Invalid frame: ${name}`);
    svg = svg.replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(?:viewBox|width|height)="[^"]*"/g, "")
        .replace(/>$/, ` viewBox="${box.join(" ")}" width="${box[2]}" height="${box[3]}">`),
    );
    await fs.writeFile(file, svg);
    console.log(`${name}: SVG canvas ${box[2]} × ${box[3]}`);
  }
} finally {
  await browser.close();
}
