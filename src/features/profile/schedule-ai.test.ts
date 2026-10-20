import OpenAI from "openai";
import { afterEach, describe, expect, it, vi } from "vitest";

// Citirea orarului cu AI-ul separat pentru poze (AI_VISION_*): cererea trimisă și validarea răspunsului.

const create = vi.fn();
vi.mock("@/lib/ai/client", () => ({
  getOpenAI: () => {
    throw new Error("AI-ul principal nu trebuie folosit când există AI pentru poze");
  },
  getVisionOpenAI: () => (process.env.AI_VISION_MODEL ? { client: { chat: { completions: { create } } }, model: process.env.AI_VISION_MODEL } : null),
  withFreeTierRetry: <T>(fn: () => Promise<T>) => fn(),
}));

const { readScheduleImage, scheduleVisionAvailable, ScheduleVisionUnavailableError } = await import("./schedule-ai");

const context = { university: "TUIASI", faculty: "AC", specialization: "", studyYear: "2", group: "1221A", subjects: ["Baze de date"] };
const image = "data:image/png;base64,iVBORw0KGgo=";
const entry = { subject: "Baze de date", kind: "curs", day: 1, start: "08:00", end: "10:00", room: "AC0-1", professor: null, weeks: "toate", groups: [] };

afterEach(() => {
  vi.unstubAllEnvs();
  create.mockReset();
});

describe("citirea orarului cu AI-ul pentru poze", () => {
  it("trimite poza și schema, apoi păstrează doar orele valide", async () => {
    vi.stubEnv("AI_VISION_MODEL", "llama-vision");
    create.mockResolvedValue({
      choices: [{ message: { content: `Iată:\n${JSON.stringify({ subjects: [], entries: [entry, { ...entry, start: "25:99" }], note: null })}` } }],
      usage: { prompt_tokens: 900, completion_tokens: 120 },
    });

    const result = await readScheduleImage({ image, context, userId: "u1" });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ subject: "Baze de date", day: 1, start: "08:00", end: "10:00" });
    expect(result.model).toBe("llama-vision");
    expect(result.usage).toEqual({ inputTokens: 900, outputTokens: 120 });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe("llama-vision");
    expect(body.messages[0].content).toContain("schemă JSON");
    expect(body.messages[1].content[1]).toEqual({ type: "image_url", image_url: { url: image, detail: "high" } });
  });

  it("spune clar când modelul ales nu primește imagini", async () => {
    vi.stubEnv("AI_VISION_MODEL", "doar-text");
    create.mockRejectedValue(new OpenAI.BadRequestError(400, { message: "This model does not support image input" }, "This model does not support image input", new Headers()));
    await expect(readScheduleImage({ image, context, userId: "u1" })).rejects.toBeInstanceOf(ScheduleVisionUnavailableError);
  });

  it("nu e disponibilă cu un AI principal „chat” fără AI separat pentru poze", async () => {
    vi.stubEnv("AI_VISION_MODEL", "");
    vi.stubEnv("AI_API", "chat");
    vi.stubEnv("AI_KEYLESS", "1");
    vi.stubEnv("AI_BASE_URL", "https://text.pollinations.ai/openai");
    expect(scheduleVisionAvailable()).toBe(false);
    await expect(readScheduleImage({ image, context, userId: "u1" })).rejects.toBeInstanceOf(ScheduleVisionUnavailableError);
  });
});
