import { describe, expect, it } from "vitest";
import { describeHabits, momentOf, summarizeHabits } from "./habits";

// În noiembrie, România e la UTC+2: 17:30Z = 19:30 la Iași.
const at = (iso: string) => new Date(iso);
const session = (start: string, minutes: number, completed = true) => ({
  start: at(start),
  end: new Date(at(start).getTime() + minutes * 60_000),
  completed,
});

describe("momentOf", () => {
  it("împarte ziua după ora din România, nu după UTC", () => {
    expect(momentOf(at("2026-11-03T17:30:00Z"))).toBe("seara"); // 19:30
    expect(momentOf(at("2026-11-03T06:00:00Z"))).toBe("dimineata"); // 08:00
    expect(momentOf(at("2026-11-03T10:30:00Z"))).toBe("pranz"); // 12:30
    expect(momentOf(at("2026-11-03T14:00:00Z"))).toBe("dupa_amiaza"); // 16:00
    expect(momentOf(at("2026-11-03T21:30:00Z"))).toBe("noaptea"); // 23:30
  });
});

describe("summarizeHabits", () => {
  it("nu trage concluzii din mai puțin de trei momente de învățare", () => {
    expect(summarizeHabits([session("2026-11-03T17:30:00Z", 45)], [at("2026-11-04T17:00:00Z")])).toBeNull();
    expect(summarizeHabits([session("2026-11-03T17:30:00Z", 45, false), session("2026-11-04T17:30:00Z", 45, false)], [])).toBeNull();
  });

  it("vede când învață de fapt, cât durează sesiunile terminate și câte duce la capăt", () => {
    const habits = summarizeHabits(
      [
        session("2026-11-03T17:30:00Z", 45), // marți seara
        session("2026-11-05T17:00:00Z", 50), // joi seara
        session("2026-11-10T17:30:00Z", 40), // marți seara
        session("2026-11-12T17:00:00Z", 45), // joi seara
        session("2026-11-06T06:00:00Z", 60, false), // vineri dimineața, neterminată
      ],
      [at("2026-11-07T08:00:00Z")], // sâmbătă dimineața
    )!;
    expect(habits).toEqual({
      planned: 5,
      completed: 4,
      quizzes: 1,
      topMoment: { moment: "seara", count: 4, of: 5 },
      averageMinutes: 45,
      topWeekdays: ["marți", "joi"],
    });
    expect(describeHabits(habits)).toEqual([
      "a terminat 4 din 5 sesiuni de studiu planificate",
      "învață cel mai des seara (4 din 5 dăți)",
      "o sesiune terminată durează în medie 45 de minute",
      "învață mai ales marți și joi",
      "a rezolvat un test grilă",
    ]);
    expect(describeHabits(habits, "tu")[0]).toBe("ai terminat 4 din 5 sesiuni de studiu planificate");
  });

  it("nu inventează zile preferate când învață la fel în fiecare zi", () => {
    const habits = summarizeHabits([], [at("2026-11-02T17:00:00Z"), at("2026-11-03T17:00:00Z"), at("2026-11-04T17:00:00Z")])!;
    expect(habits.topWeekdays).toEqual([]);
    expect(habits.averageMinutes).toBeNull();
    expect(describeHabits(habits)).toEqual(["învață cel mai des seara (3 din 3 dăți)", "a rezolvat 3 teste grilă"]);
  });
});
