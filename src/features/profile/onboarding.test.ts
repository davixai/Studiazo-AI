import { describe, expect, it } from "vitest";
import { OnboardingSchema, facultiesFor, suggestSubjects, uniqueSubjects } from "./onboarding";

const base = {
  fullName: "Ana Ionescu",
  age: "",
  university: "",
  faculty: "",
  specialization: "",
  studyYear: "",
  needs: [] as string[],
  worries: [] as string[],
  goal: "",
  preferredTimes: [] as string[],
  subjects: [],
  next: "materii",
};

describe("OnboardingSchema", () => {
  it("acceptă doar numele; restul devine null sau valoarea implicită", () => {
    const parsed = OnboardingSchema.parse(base);
    expect(parsed).toMatchObject({
      fullName: "Ana Ionescu",
      age: null,
      university: null,
      studyYear: null,
      needs: [],
      worries: [],
      goal: null,
      preferredTimes: [],
      subjects: [],
      next: "materii",
    });
  });

  it("validează vârsta între 15 și 99 de ani", () => {
    expect(OnboardingSchema.parse({ ...base, age: "20" }).age).toBe(20);
    for (const age of ["14", "100", "abc", "20.5"]) {
      expect(OnboardingSchema.safeParse({ ...base, age }).success).toBe(false);
    }
  });

  it("respinge valorile necunoscute pentru obiectiv și grijă", () => {
    expect(OnboardingSchema.safeParse({ ...base, goal: "nota_11" }).success).toBe(false);
    expect(OnboardingSchema.safeParse({ ...base, worries: ["timp", "altceva"] }).success).toBe(false);
    expect(OnboardingSchema.parse({ ...base, goal: "nota_maxima", needs: ["teme"] })).toMatchObject({ goal: "nota_maxima", needs: ["teme"] });
  });

  it("acceptă mai multe nevoi și griji, fără dubluri", () => {
    expect(OnboardingSchema.parse({ ...base, needs: ["examene", "teme", "examene"], worries: ["timp", "volum"] })).toMatchObject({
      needs: ["examene", "teme"],
      worries: ["timp", "volum"],
    });
  });

  it("cere un nume de cel puțin 2 caractere", () => {
    expect(OnboardingSchema.safeParse({ ...base, fullName: " A " }).success).toBe(false);
  });

  it("curăță materiile, elimină dublurile și limitează la 12", () => {
    expect(OnboardingSchema.parse({ ...base, subjects: ["  Baze   de date ", "baze de date", "", "Algebră"] }).subjects).toEqual([
      "Baze de date",
      "Algebră",
    ]);
    const many = Array.from({ length: 13 }, (_, i) => `Materia ${i + 1}`);
    expect(OnboardingSchema.safeParse({ ...base, subjects: many }).success).toBe(false);
  });

  it("trimite la /azi dacă destinația e necunoscută", () => {
    expect(OnboardingSchema.parse({ ...base, next: "/admin" }).next).toBe("azi");
  });
});

describe("sugestii", () => {
  it("dă facultățile universității alese", () => {
    expect(facultiesFor("Universitatea „Alexandru Ioan Cuza” din Iași")).toContain("Facultatea de Informatică");
    expect(facultiesFor("Altă universitate")).toEqual([]);
  });

  it("sugerează materii după facultate, cu o listă generală implicită", () => {
    expect(suggestSubjects("Facultatea de Informatică")).toContain("Structuri de date");
    expect(suggestSubjects("Facultatea de Medicină")).toContain("Anatomie");
    expect(suggestSubjects("")).toContain("Matematică");
    expect(suggestSubjects("Facultatea de Economie și Administrarea Afacerilor", "Informatică economică")).toContain("Contabilitate");
    expect(suggestSubjects("", "Informatică")).toContain("Algoritmi");
  });

  it("uniqueSubjects păstrează prima scriere a materiei", () => {
    expect(uniqueSubjects(["Fizică", "FIZICĂ", "fizică "])).toEqual(["Fizică"]);
  });
});
