// Verifică anunțurile din src/features/jobs/data.ts: încă există și primesc aplicații? Rulează: node scripts/check-jobs.mjs
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/features/jobs/data.ts", import.meta.url), "utf8");
const ids = [...source.matchAll(/^\s{4}id: "(\d+)",$/gm)].map((m) => m[1]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

const problems = [];
for (const id of ids) {
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
    res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, { headers: { "user-agent": UA } });
    if (res.status !== 429) break;
  }
  const html = res.ok ? await res.text() : "";
  const closed = /No longer accepting applications/i.test(html);
  const status = !res.ok ? `HTTP ${res.status}` : closed ? "închis" : "activ";
  console.log(`${status.padEnd(8)} ${id}`);
  if (status !== "activ") problems.push(`${id}: ${status}`);
}
console.log(problems.length ? `\nDe scos sau de verificat:\n${problems.join("\n")}` : `\nToate cele ${ids.length} anunțuri sunt active.`);
