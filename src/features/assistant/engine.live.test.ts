import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runAssistant } from "./engine";
import { buildInstructions } from "./prompt";

// Test cu OpenAI real (costă ~0,1 cenți). Rulează doar la cerere:
//   LIVE_AI=1 [LIVE_AI_IMAGE=cale/poza.jpg] node --env-file=.env.local node_modules/vitest/vitest.mjs run src/features/assistant/engine.live.test.ts
// Instrumentele sunt simulate: verificăm bucla, nu baza de date.

const NOW = new Date();
const instructions = buildInstructions({ now: NOW, profile: null, subjects: [], subject: null });

describe.skipIf(!process.env.LIVE_AI)("asistentul, cu OpenAI real", () => {
  it("cere intervalele libere și pregătește o propunere, fără să spună că a salvat", async () => {
    const calls: string[] = [];
    const turn = await runAssistant({
      instructions,
      userId: "test",
      input: [{ role: "user", content: "Am examen la analiză peste 3 zile. Găsește-mi două sesiuni de studiu de câte 50 de minute." }],
      execute: async (name, args) => {
        calls.push(name);
        const from = JSON.parse(args).from_date ?? "";
        if (name === "find_free_slots") {
          return { output: JSON.stringify({ slots: [{ date: from, start: "18:00", end: "20:00", minutes: 120 }] }) };
        }
        if (name === "propose_study_sessions") return { output: JSON.stringify({ status: "pending" }), proposalId: "p1" };
        return { output: JSON.stringify({ activities: [], deadlines: [] }) };
      },
    });
    console.log(calls, turn.usage, `\n${turn.text}`);
    expect(calls).toContain("find_free_slots");
    expect(turn.proposalIds).toEqual(["p1"]);
    expect(turn.text.toLowerCase()).not.toMatch(/am salvat|am adăugat/);
  }, 90_000);

  it("citește o poză cu un exercițiu și îndrumă, fără să dea direct soluția", async () => {
    const image = process.env.LIVE_AI_IMAGE;
    if (!image) return;
    const turn = await runAssistant({
      instructions,
      userId: "test",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Mă ajuți cu exercițiul din poză?" },
            { type: "input_image", image_url: `data:image/jpeg;base64,${readFileSync(image).toString("base64")}`, detail: "auto" },
          ],
        },
      ],
      execute: async () => ({ output: "{}" }),
    });
    console.log(turn.usage, `\n${turn.text}`);
    // A înțeles exercițiul (2x + 3 = 11) și dă un indiciu, nu rezultatul x = 4.
    expect(turn.text).toMatch(/3|11|2x|ecua/i);
    expect(turn.text).not.toMatch(/x\s*=\s*4/);
  }, 90_000);
});
