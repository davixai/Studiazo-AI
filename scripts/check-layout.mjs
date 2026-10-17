// Caută derularea orizontală pe toate lățimile 320–1100 px (mobil + desktop). Server: STUDIA_PREVIEW=1 npm start.
import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" });
const pages = ["/azi", "/calendar", "/materii", "/asistent", "/resurse", "/profil", "/bun-venit", "/autentificare", "/inregistrare", "/sistem-design"];
const found = [];
for (const mobile of [true, false]) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 800 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  for (const path of pages) {
    for (let w = 320; w <= 1100; w += 10) {
      await p.setViewportSize({ width: w, height: 800 });
      if (w === 320) { await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle" }); await p.waitForTimeout(1200); }
      const r = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = document.documentElement.scrollWidth - vw;
        if (over <= 0) return null;
        const els = [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > vw + 1 && getComputedStyle(e).position !== "fixed");
        const leaf = els.filter((e) => ![...e.children].some((c) => els.includes(c))).slice(0, 3);
        return { over, els: leaf.map((e) => `${e.tagName.toLowerCase()}.${(e.className?.baseVal ?? e.className ?? "").toString().slice(0, 70)} "${(e.textContent || "").trim().slice(0, 30)}" r=${Math.round(e.getBoundingClientRect().right)}`) };
      });
      if (r) { found.push(`${mobile ? "mobil" : "desktop"} ${path} @${w}px +${r.over}px :: ${r.els.join(" | ")}`); }
    }
  }
  await ctx.close();
}
await b.close();
console.log(found.length ? found.slice(0, 40).join("\n") + `\n(total ${found.length})` : "Nicio derulare orizontală la nicio lățime 320–1100.");
