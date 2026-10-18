import { describe, expect, it } from "vitest";
import { OnboardingSchema } from "./onboarding";
import { PREVIEW_SCHEDULE, cleanSchedule, forGroup, professorsBySubject, scheduleGroups, scheduleToEvents, semesterEnd } from "./schedule";

const entry = {
  subject: "  Baze   de date ",
  kind: "curs",
  day: 1,
  start: "8:00",
  end: "10.00",
  room: "",
  professor: "Conf. dr. Ana Popescu",
  biweekly: false,
  groups: [],
};

describe("cleanSchedule", () => {
  it("normalizează orele și numele, golurile devin null", () => {
    const { entries } = cleanSchedule({ entries: [entry], note: null });
    expect(entries).toEqual([{ ...entry, subject: "Baze de date", start: "08:00", end: "10:00", room: null }]);
  });

  it("sare peste orele invalide, nu strică tot orarul", () => {
    const bad = [
      { ...entry, day: 9 },
      { ...entry, kind: "sport" },
      { ...entry, start: "12:00", end: "10:00" },
    ];
    const { entries, note } = cleanSchedule({ entries: [...bad, { ...entry, day: 3 }, entry], note: "  Lipsește sala la sport. " });
    expect(entries.map((e) => e.day)).toEqual([1, 3]);
    expect(note).toBe("Lipsește sala la sport.");
  });

  it("acceptă răspunsuri stricate fără să arunce eroare", () => {
    expect(cleanSchedule(null)).toEqual({ entries: [], note: null });
    expect(cleanSchedule({ entries: "nu" })).toEqual({ entries: [], note: null });
  });
});

describe("grupe", () => {
  it("găsește grupele și păstrează orele grupei plus pe cele comune", () => {
    expect(scheduleGroups(PREVIEW_SCHEDULE)).toEqual(["2A", "2B"]);
    const forA = forGroup(PREVIEW_SCHEDULE, "2A");
    expect(forA.some((e) => e.groups.includes("2B"))).toBe(false);
    expect(forA.filter((e) => e.groups.length === 0)).toHaveLength(3);
    expect(forGroup(PREVIEW_SCHEDULE, null)).toHaveLength(PREVIEW_SCHEDULE.length);
  });
});

describe("semesterEnd", () => {
  it("semestrul 1 se termină în ianuarie, semestrul 2 în iunie", () => {
    expect(semesterEnd("2026-10-18")).toBe("2027-01-20");
    expect(semesterEnd("2027-01-05")).toBe("2027-01-20");
    expect(semesterEnd("2027-03-10")).toBe("2027-06-07");
  });
});

describe("scheduleToEvents", () => {
  it("pune prima apariție în săptămâna curentă, la ora României, și repetă până la final de semestru", () => {
    const ids = new Map([["baze de date", "id-bd"]]);
    // Duminică 18 octombrie 2026 (ora de vară): luni = 12 octombrie.
    const [course, lab] = scheduleToEvents(
      [PREVIEW_SCHEDULE[0], { ...PREVIEW_SCHEDULE[4], subject: "Statistică" }],
      "2026-10-18",
      ids,
    );
    expect(course).toMatchObject({
      kind: "curs",
      title: "Baze de date",
      subject_id: "id-bd",
      location: "C2",
      notes: "Profesor: Conf. dr. Ana Popescu",
      starts_at: "2026-10-12T05:00:00.000Z",
      ends_at: "2026-10-12T07:00:00.000Z",
      recurrence: "weekly",
      recurrence_until: "2027-01-20",
    });
    expect(lab).toMatchObject({ subject_id: null, recurrence: "biweekly", starts_at: "2026-10-14T07:00:00.000Z" });
  });

  it("alege profesorul de curs pentru materie", () => {
    expect(professorsBySubject(PREVIEW_SCHEDULE).get("baze de date")).toBe("Conf. dr. Ana Popescu");
  });
});

describe("momentele zilei", () => {
  it("acceptă mai multe, fără dubluri, iar „Nu contează” înseamnă listă goală", () => {
    const base = { fullName: "Ana", age: "", university: "", faculty: "", specialization: "", studyYear: "", needs: [], worries: [], goal: "", subjects: [], next: "azi" };
    expect(OnboardingSchema.parse({ ...base, preferredTimes: ["seara", "dimineata", "seara"] }).preferredTimes).toEqual(["seara", "dimineata"]);
    expect(OnboardingSchema.parse({ ...base, preferredTimes: ["fara_preferinta"] }).preferredTimes).toEqual([]);
    expect(OnboardingSchema.safeParse({ ...base, preferredTimes: ["noaptea"] }).success).toBe(false);
  });
});
