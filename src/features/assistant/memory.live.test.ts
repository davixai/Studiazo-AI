import { describe, expect, it } from "vitest";
import { PREVIEW_PROFILE } from "@/lib/preview/fixtures";
import { shiftDateKey, toDateKey } from "@/lib/time/zone";
import { runAssistant } from "./engine";
import { buildInstructions, DAILY_PROMPT } from "./prompt";
import type { ToolResult } from "./tools";

// Memoria și mesajul zilei, cu OpenAI real (costă ~0,2 cenți). Rulează doar la cerere:
//   LIVE_AI=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run src/features/assistant/memory.live.test.ts
// Instrumentele sunt simulate: verificăm ce alege modelul, nu baza de date.

const NOW = new Date();
const TODAY = toDateKey(NOW);
const TOMORROW = shiftDateKey(TODAY, 1);
const POO = { id: "6f1c2a8e-4b1d-4c3a-9e2f-1a2b3c4d5e6f", name: "Programare orientată pe obiecte", color: "violet" as const, professor: null };
const MEMORY_ID = "0b6f3a52-2c1e-4f7a-9d3b-5e8c7a1f2d40";

type Call = { name: string; args: Record<string, unknown> };

async function ask(text: string, extra: Partial<Parameters<typeof buildInstructions>[0]> = {}, reply?: (call: Call) => ToolResult | null) {
  const calls: Call[] = [];
  const turn = await runAssistant({
    instructions: buildInstructions({ now: NOW, profile: PREVIEW_PROFILE, subjects: [POO], subject: null, ...extra }),
    userId: "test",
    input: [{ role: "user", content: text }],
    execute: async (name, raw) => {
      const call = { name, args: JSON.parse(raw) as Record<string, unknown> };
      calls.push(call);
      return reply?.(call) ?? { output: JSON.stringify({ status: "ok", activities: [], deadlines: [] }) };
    },
  });
  console.log(calls.map((c) => `${c.name} ${JSON.stringify(c.args)}`), `\n${turn.text}\n`);
  return { calls, turn };
}

describe.skipIf(!process.env.LIVE_AI)("asistentul te cunoaște, cu OpenAI real", () => {
  it("reține singur un lucru durabil și tot răspunde la întrebare", async () => {
    const { calls, turn } = await ask("Lucrez la o cafenea sâmbăta și duminica, deci atunci nu pot învăța. Ce e un arbore binar de căutare, pe scurt?");
    const saved = calls.filter((c) => c.name === "remember").map((c) => String(c.args.fact));
    expect(saved.some((f) => /sâmbăt|weekend/i.test(f))).toBe(true);
    expect(turn.text.toLowerCase()).toMatch(/arbore|stâng|drept/);
  }, 90_000);

  it("nu reține stări de moment", async () => {
    const { calls } = await ask("Azi sunt rupt de oboseală, explică-mi foarte pe scurt ce e polimorfismul.");
    expect(calls.map((c) => c.name)).not.toContain("remember");
  }, 90_000);

  it("uită ce nu mai e valabil, cu id-ul din memorie", async () => {
    const { calls } = await ask("Nu mai lucrez la cafenea, am renunțat la job.", {
      memories: [{ id: MEMORY_ID, content: "Lucrează la o cafenea sâmbăta și duminica", createdAt: NOW.toISOString() }],
    });
    expect(calls).toContainEqual({ name: "forget", args: { memory_id: MEMORY_ID } });
  }, 90_000);

  it("scrie primul, scurt, și propune o sesiune seara, când chiar învață", async () => {
    let session: { start?: string; date?: string } = {};
    const { calls, turn } = await ask(
      DAILY_PROMPT,
      {
        memories: [{ id: MEMORY_ID, content: "Înțelege mai bine cu exemple din viața reală", createdAt: NOW.toISOString() }],
        habits: { planned: 6, completed: 5, quizzes: 1, topMoment: { moment: "seara", count: 5, of: 6 }, averageMinutes: 45, topWeekdays: [] },
      },
      ({ name, args }) => {
        if (name === "get_schedule") {
          return { output: JSON.stringify({ activities: [{ date: TOMORROW, start: "14:00", end: "16:00", kind: "Laborator", title: "Laborator POO", subject: POO.name, location: "C412", done: false }], deadlines: [] }) };
        }
        if (name === "get_upcoming_deadlines") {
          return { output: JSON.stringify({ deadlines: [{ kind: "Test", title: "Test POO", subject: POO.name, date: shiftDateKey(TODAY, 3), time: "10:00", duration_minutes: 60, estimated_minutes: 180 }] }) };
        }
        if (name === "find_free_slots") {
          return {
            output: JSON.stringify({
              slots: [
                { date: TOMORROW, start: "09:00", end: "11:00", minutes: 120 },
                { date: TOMORROW, start: "19:00", end: "21:30", minutes: 150 },
              ],
            }),
          };
        }
        if (name === "propose_study_sessions") {
          session = ((args.items as Array<{ start: string; date: string }>) ?? [])[0] ?? {};
          return { output: JSON.stringify({ status: "pending" }), proposalId: "p1" };
        }
        return null;
      },
    );
    expect(calls.map((c) => c.name)).not.toContain("remember");
    expect(turn.proposalIds).toEqual(["p1"]);
    expect(Number(session.start?.slice(0, 2))).toBeGreaterThanOrEqual(19);
    expect(turn.text.length).toBeLessThan(700);
    expect(turn.text).toMatch(/Andrei/);
  }, 120_000);
});
