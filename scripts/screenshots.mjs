// Capturi de ecran pentru verificarea vizuală (folosește Chrome-ul instalat, nu descarcă browsere).
// Pornire: `STUDIA_PREVIEW=1 npm run start` într-un terminal, apoi `npm run screenshots`.
// Rezultatul: ./screenshots/<lățime>/<pagină>.png (exclus din Git). Raportează derularea orizontală.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const WIDTHS = [360, 390, 768, 1280, 1440];
const PAGES = [
  ["azi", "/azi"],
  ["calendar", "/calendar"],
  ["materii", "/materii"],
  ["materie", "/materii/00000000-0000-4000-8000-0000000000a1"],
  ["materie-notite", "/materii/00000000-0000-4000-8000-0000000000a1?tab=notite"],
  ["asistent", "/asistent"],
  ["progres", "/progres"],
  ["buget", "/buget"],
  ["joburi", "/joburi"],
  ["classroom", "/classroom"],
  ["resurse", "/resurse"],
  ["profil", "/profil"],
  ["bun-venit", "/bun-venit"],
  ["autentificare", "/autentificare"],
  ["inregistrare", "/inregistrare"],
  ["recuperare", "/recuperare"],
  ["sistem-design", "/sistem-design"],
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
const problems = [];

for (const width of WIDTHS) {
  const mobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: mobile ? 800 : 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: "ro-RO",
    timezoneId: "Europe/Bucharest",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`${width}px ${page.url()}: eroare în pagină: ${error.message}`));
  await mkdir(`screenshots/${width}`, { recursive: true });

  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600); // animațiile de intrare
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) problems.push(`${width}px ${path}: derulare orizontală de ${overflow}px`);
    await page.screenshot({ path: `screenshots/${width}/${name}.png`, fullPage: true });
  }

  // Dialogul (foaie de jos pe mobil)
  await page.goto(`${BASE}/sistem-design`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Deschide dialogul" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/${width}/dialog.png` });

  await context.close();
}

await browser.close();
console.log(problems.length ? `Probleme:\n${problems.join("\n")}` : "Nicio derulare orizontală detectată.");
