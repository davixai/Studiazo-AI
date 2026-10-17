import { describe, expect, it } from "vitest";
import { JOBS, searchLinks } from "./data";
import { DEFAULT_FILTERS, fitsStudy, matchesFilters, reasonsFor, recommendJobs, sortJobs } from "./recommend";

const byId = (id: string) => JOBS.find((j) => j.id === id)!;

describe("catalogul de joburi", () => {
  it("are id-uri unice și intervale de câștig valide", () => {
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(JOBS.length);
    for (const j of JOBS) {
      expect(j.monthly[0]).toBeLessThanOrEqual(j.monthly[1]);
      expect(j.hoursPerWeek[0]).toBeLessThanOrEqual(j.hoursPerWeek[1]);
    }
  });

  it("linkurile de căutare sunt pentru Iași", () => {
    const [linkedin, indeed] = searchLinks(byId("barista"));
    expect(linkedin.url).toContain("location=Ia%C8%99i");
    expect(indeed.url).toContain("ro.indeed.com");
  });
});

describe("filtre", () => {
  it("combină tipul, câștigul minim, programul flexibil și căutarea fără diacritice", () => {
    const f = { ...DEFAULT_FILTERS, types: ["part-time" as const], flexibleOnly: true };
    const results = JOBS.filter((j) => matchesFilters(j, f));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((j) => j.type === "part-time" && j.flexible)).toBe(true);

    expect(JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, minMonthly: 6000 })).every((j) => j.monthly[1] >= 6000)).toBe(true);
    expect(JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, query: "cafenea" })).map((j) => j.id)).toContain("barista");
  });

  it("ordonarea după salariu pune primul câștigul maxim", () => {
    const sorted = sortJobs(JOBS, { ...DEFAULT_FILTERS, sort: "salariu" }, {});
    expect(sorted[0].monthly[1]).toBe(Math.max(...JOBS.map((j) => j.monthly[1])));
  });
});

describe("recomandări", () => {
  it("un student la Informatică primește joburi IT flexibile, nu full-time", () => {
    const top = recommendJobs(JOBS, { study: "Facultatea de Informatică", monthlyGap: 500 });
    expect(top.map((j) => j.id)).toContain("internship-it");
    expect(top.every((j) => j.type !== "full-time")).toBe(true);
  });

  it("explică de ce recomandă", () => {
    expect(fitsStudy(byId("traduceri"), "Litere – engleză")).toBe(true);
    expect(reasonsFor(byId("meditatii"), { study: "Matematică", monthlyGap: 800 })).toEqual([
      "legat de facultatea ta",
      "acoperă cei 800 lei lipsă",
      "program compatibil cu cursurile",
    ]);
  });
});
