import { describe, expect, it } from "vitest";
import { OnboardingSchema } from "./onboarding";
import {
  PREVIEW_SCHEDULE,
  cleanSchedule,
  forGroup,
  guessWeekParity,
  professorsBySubject,
  scheduleGroups,
  scheduleToEvents,
  semesterEnd,
  type ScheduleEntry,
} from "./schedule";

const entry = {
  subject: "  Baze   de date ",
  kind: "curs",
  day: 1,
  start: "8:00",
  end: "10.00",
  room: "",
  professor: "Conf. dr. Ana Popescu",
  weeks: "toate",
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

  it("spune ce materii au fost văzute în orar, dar fără ore citite", () => {
    const { note } = cleanSchedule({
      subjects: [
        { name: "Baze de date", short: "BD" },
        { name: "Sisteme cu microprocesoare", short: "SuP" },
      ],
      entries: [entry],
      note: null,
    });
    expect(note).toBe("Nu am citit orele pentru: Sisteme cu microprocesoare. Le poți adăuga manual mai jos.");
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
      "impara",
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

  it("orele IMPAR și PAR din același interval nu cad în aceeași săptămână", () => {
    const slot = { kind: "laborator", day: 2, start: "14:00", end: "16:00", room: null, professor: null, groups: [] } as const;
    const odd: ScheduleEntry = { ...slot, groups: [], subject: "Circuite electrice 1", weeks: "impare" };
    const even: ScheduleEntry = { ...slot, groups: [], subject: "Fizică 2", weeks: "pare" };
    // Săptămâna 12–18 octombrie e impară: CEL1 începe marți 13, Fizica marți 20; amândouă la două săptămâni.
    const [a, b] = scheduleToEvents([odd, even], "2026-10-18", new Map(), "impara");
    expect(a).toMatchObject({ starts_at: "2026-10-13T11:00:00.000Z", recurrence: "biweekly" });
    expect(b).toMatchObject({ starts_at: "2026-10-20T11:00:00.000Z", recurrence: "biweekly" });
    // Dacă săptămâna e pară, se inversează.
    const [c, d] = scheduleToEvents([odd, even], "2026-10-18", new Map(), "para");
    expect(c.starts_at).toBe("2026-10-20T11:00:00.000Z");
    expect(d.starts_at).toBe("2026-10-13T11:00:00.000Z");
  });

  it("ghicește paritatea după începutul semestrului (săptămâna 1 = impară)", () => {
    expect(guessWeekParity("2026-09-30")).toBe("impara"); // săptămâna 1 (28 sept.–4 oct.)
    expect(guessWeekParity("2026-10-07")).toBe("para"); // săptămâna 2
    expect(guessWeekParity("2026-10-18")).toBe("impara"); // săptămâna 3
    expect(guessWeekParity("2027-03-03")).toBe("para"); // semestrul 2, săptămâna 2
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
