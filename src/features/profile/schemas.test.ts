import { describe, expect, it } from "vitest";
import { availabilityFromForm } from "./schemas";

describe("availabilityFromForm", () => {
  it("păstrează doar zilele bifate, în ordine", () => {
    const result = availabilityFromForm({
      d1: "on", d1_start: "16:00", d1_end: "21:00",
      d2_start: "08:00", d2_end: "22:00",
      d6: "on", d6_start: "10:00", d6_end: "14:00",
    });
    expect(result).toEqual({
      ok: true,
      windows: [
        { weekday: 1, start: "16:00", end: "21:00" },
        { weekday: 6, start: "10:00", end: "14:00" },
      ],
    });
  });

  it("semnalează pe zi intervalele inversate sau incomplete", () => {
    const result = availabilityFromForm({ d3: "on", d3_start: "20:00", d3_end: "18:00", d4: "on", d4_start: "", d4_end: "12:00" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors)).toEqual(["d3", "d4"]);
  });

  it("cere cel puțin o zi", () => {
    expect(availabilityFromForm({})).toMatchObject({ ok: false, fieldErrors: { form: expect.any(String) } });
  });
});
