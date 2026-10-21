// Rasterize the existing Brand Compass (lucide-react), preserving brand colors.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Compass } from "lucide-react";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("public/pwa", { recursive: true });
const compass = renderToStaticMarkup(createElement(Compass, {
  size: 288, color: "#fffdf7", strokeWidth: 2,
}));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#204e4c"/><g transform="translate(112 112)">${compass}</g></svg>`;
for (const [name, size] of [["icon-192", 192], ["icon-512", 512], ["apple-touch-icon", 180]]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/pwa/${name}.png`);
}
