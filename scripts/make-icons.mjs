// Generează iconițele PNG pentru PWA din semnul Studiazo AI (rulat o singură dată; rezultatul e versionat).
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const mark = (size, pad) => `<!doctype html><html><body style="margin:0;background:${pad ? "#1b1b18" : "transparent"}">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${pad ? "-6 -6 44 44" : "0 0 32 32"}" width="${size}" height="${size}">
<rect width="32" height="32" rx="${pad ? 0 : 9}" fill="#1b1b18"/>
<path d="M10 9.5h9.5a3 3 0 0 1 3 3V22.5H13a3 3 0 0 1-3-3v-10Z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M13.5 13.5h5.5M13.5 17h3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="22.5" cy="22.5" r="3.25" fill="#3049c4" stroke="#1b1b18" stroke-width="1.5"/></svg></body></html>`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
for (const [file, size, pad] of [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["icon-maskable-512.png", 512, true], ["../../src/app/apple-icon.png", 180, true]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(mark(size, pad));
  await writeFile(new URL(`../public/icons/${file}`, import.meta.url), await page.screenshot({ omitBackground: !pad }));
}
await browser.close();
console.log("Iconițe generate.");
