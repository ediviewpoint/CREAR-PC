import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const out = path.join(process.cwd(), "public/brand");
await fs.mkdir(out, { recursive: true });
const mark =
  '<path d="m7 9 12-4 7 5v17l-12 4-7-5Z M7 9l7 5 12-4M14 14v17M19 5v9M19 23l7 4M7 21l7 5"/>';
const variants = {
  wordmark: {
    w: 300,
    h: 64,
    body: '<text x="4" y="46" font-family="Inter,Arial,sans-serif" font-size="43" font-weight="700" letter-spacing="-1.2">CREAR PC</text>',
  },
  monogram: {
    w: 96,
    h: 96,
    body: '<rect x="6" y="6" width="84" height="84" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="14" y="57" font-family="Inter,Arial,sans-serif" font-size="27" font-weight="600" letter-spacing="-1">C.PC</text>',
  },
  isometric: {
    w: 96,
    h: 96,
    body:
      '<g transform="translate(3 0) scale(2.8)" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">' +
      mark +
      "</g>",
  },
};
for (const [name, v] of Object.entries(variants)) {
  for (const [suffix, ink] of [
    ["", "#13284A"],
    ["-mono", "#050F24"],
    ["-reverse", "#FFFFFF"],
  ]) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      v.w +
      " " +
      v.h +
      '" width="' +
      v.w +
      '" height="' +
      v.h +
      '" style="color:' +
      ink +
      ";fill:" +
      ink +
      '"><title>CREAR PC — ' +
      name +
      "</title>" +
      v.body +
      "</svg>";
    await fs.writeFile(path.join(out, name + suffix + ".svg"), svg);
    for (const scale of [1, 2, 3])
      await sharp(Buffer.from(svg))
        .resize(v.w * scale, v.h * scale)
        .png()
        .toFile(path.join(out, name + suffix + (scale === 1 ? "" : "@" + scale + "x") + ".png"));
  }
}
const favicon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>:root{color:#13284A} @media(prefers-color-scheme:dark){:root{color:#FFFFFF}}</style><g transform="translate(0 -1)" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">' +
  mark +
  "</g></svg>";
await fs.writeFile(path.join(out, "favicon.svg"), favicon);
const fixedIcon = favicon
  .replace(
    "<style>:root{color:#13284A} @media(prefers-color-scheme:dark){:root{color:#FFFFFF}}</style>",
    '<rect width="32" height="32" rx="5" fill="#FFFFFF"/>',
  )
  .replace('stroke="currentColor"', 'stroke="#13284A"');
const pngs = [];
for (const size of [16, 32, 48, 180]) {
  const png = await sharp(Buffer.from(fixedIcon)).resize(size, size).png().toBuffer();
  pngs.push({ size, png });
  await fs.writeFile(path.join(out, "favicon-" + size + ".png"), png);
  if (size === 180) await fs.writeFile(path.join(out, "apple-touch-icon.png"), png);
}
const small = pngs.filter((x) => x.size < 180);
const header = Buffer.alloc(6 + 16 * small.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(small.length, 4);
let offset = header.length;
small.forEach((x, i) => {
  const p = 6 + i * 16;
  header[p] = x.size;
  header[p + 1] = x.size;
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(x.png.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += x.png.length;
});
await fs.writeFile(
  path.join(out, "favicon.ico"),
  Buffer.concat([header, ...small.map((x) => x.png)]),
);
const og =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#FFFFFF"/><g fill="#13284A" font-family="Arial,sans-serif"><text x="72" y="98" font-size="28" font-weight="700">CREAR PC /</text><text x="72" y="254" font-size="72" font-weight="600" letter-spacing="-3">Armá tu PC.</text><text x="72" y="344" font-size="64" font-weight="600" letter-spacing="-2">Con precios</text><text x="72" y="422" font-size="64" font-weight="600" letter-spacing="-2">de Bolivia.</text><text x="72" y="554" font-size="20">Hecho en Santa Cruz · 100% boliviano</text></g><g transform="translate(820 140) scale(8)" fill="none" stroke="#13284A" stroke-width="1.5" stroke-linejoin="round">' +
  mark +
  '</g><path d="M72 500H1128" stroke="#EEF1F5"/></svg>';
await fs.writeFile(path.join(out, "og-default.svg"), og);
await sharp(Buffer.from(og)).png().toFile(path.join(out, "og-default.png"));
await fs.mkdir("public/fonts", { recursive: true });
for (const [name, src] of [
  ["inter-regular.woff", "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff"],
  ["inter-semibold.woff", "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff"],
  [
    "jetbrains-mono-regular.woff",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  ],
])
  await fs.copyFile(src, "public/fonts/" + name);
await fs.copyFile("node_modules/@fontsource/inter/LICENSE", "public/fonts/INTER-LICENSE.txt");
await fs.copyFile(
  "node_modules/@fontsource/jetbrains-mono/LICENSE",
  "public/fonts/JETBRAINS-MONO-LICENSE.txt",
);
console.log(
  "Marca: 3 variantes SVG y PNG 1x/2x/3x; favicons 16/32/48/180, ICO, SVG adaptable y OG 1200x630.",
);
