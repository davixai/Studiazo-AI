// Temporar (șters după verificare): întrebarea impară/pară din „Verifică-ți orarul”.
import { chromium } from "@playwright/test";

const OUT = process.argv[2];
const BASE = "http://localhost:3300";
const browser = await chromium.launch({ channel: "chrome" });
const problems = [];

for (const width of [360, 1280]) {
  const mobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: mobile ? 800 : 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: "ro-RO",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => problems.push(`${width}: ${e.message}`));
  await page.goto(`${BASE}/bun-venit`, { waitUntil: "networkidle", timeout: 180000 });
  const go = (name) => page.getByRole("button", { name }).click();
  const image = await page.screenshot();
  await page.locator("#ob-name").fill("Ana Ionescu");
  await go(/^Continuă/);
  await go("Prefer să nu spun");
  await go(/Cuza/);
  await page.waitForTimeout(500);
  await go(/^Continuă/);
  await page.getByRole("button", { name: /anul 2/ }).first().click();
  await page.waitForTimeout(600);
  await go(/^(Continuă|Sari peste)/);
  await go(/^Continuă/);
  await go(/^(Continuă|Sari peste)/);
  await go(/notă bună/);
  await page.waitForTimeout(600);
  await go(/^(Continuă|Sari peste)/);
  await page.locator('input[type="file"]').setInputFiles({ name: "orar.png", mimeType: "image/png", buffer: image });
  await page.getByRole("heading", { name: "Verifică-ți orarul" }).waitFor({ timeout: 60000 });
  await go({ toString: () => "2A" } && "2A");
  await page.waitForTimeout(400);
  await go("Pară");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${width}-parity.png`, fullPage: false, clip: undefined });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) problems.push(`${width}: derulare orizontală ${overflow}px`);
  await go(/Adaug orarul/);
  await page.waitForTimeout(800);
  const sent = await page.evaluate(() => document.querySelector('input[name="weekParity"]')?.value ?? "lipsă");
  if (width === 360) console.log("paritate trimisă:", sent);
  await context.close();
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "fără probleme");
