import { afterEach, describe, expect, it, vi } from "vitest";

// Citirea orarului din poză cu OpenAI (Responses API): cererea trimisă și validarea răspunsului.

const create = vi.fn();
vi.mock("@/lib/ai/client", () => ({
  getOpenAI: () => ({ responses: { create } }),
}));

const { readScheduleImage, scheduleVisionAvailable, ScheduleVisionUnavailableError } = await import("./schedule-ai");

const context = { university: "TUIASI", faculty: "AC", specialization: "", studyYear: "2", group: "1221A", subjects: ["Baze de date"] };
const image = "data:image/png;base64,iVBORw0KGgo=";
const entry = { subject: "Baze de date", kind: "curs", day: 1, start: "08:00", end: "10:00", room: "AC0-1", professor: null, weeks: "toate", groups: [] };

afterEach(() => {
  vi.unstubAllEnvs();
  create.mockReset();
});

describe("citirea orarului din poză", () => {
  it("trimite poza și schema, apoi păstrează doar orele valide", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-0123456789abcdefghij");
    vi.stubEnv("OPENAI_MODEL", "gpt-6-luna");
    create.mockResolvedValue({
      output_text: JSON.stringify({ subjects: [], entries: [entry, { ...entry, start: "25:99" }], note: null }),
      usage: { input_tokens: 900, output_tokens: 120 },
    });

    expect(scheduleVisionAvailable()).toBe(true);
    const result = await readScheduleImage({ image, context, userId: "u1" });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ subject: "Baze de date", day: 1, start: "08:00", end: "10:00" });
    expect(result.model).toBe("gpt-6-luna");
    expect(result.usage).toEqual({ inputTokens: 900, outputTokens: 120 });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe("gpt-6-luna");
    expect(body.text.format).toMatchObject({ type: "json_schema", name: "orar", strict: true });
    expect(body.input[0].content[1]).toEqual({ type: "input_image", image_url: image, detail: "high" });
    expect(body.store).toBe(false);
  });

  it("nu e disponibilă fără cheie OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(scheduleVisionAvailable()).toBe(false);
    await expect(readScheduleImage({ image, context, userId: "u1" })).rejects.toBeInstanceOf(ScheduleVisionUnavailableError);
    expect(create).not.toHaveBeenCalled();
  });
});
