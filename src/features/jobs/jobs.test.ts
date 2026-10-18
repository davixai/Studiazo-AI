import { describe, expect, it } from "vitest";
import { JOBS, JOB_TYPES, jobUrl } from "./data";
import { DEFAULT_FILTERS, fitsStudy, matchesFilters, reasonsFor, recommendJobs, sortJobs } from "./recommend";

const byId = (id: string) => JOBS.find((j) => j.id === id)!;

describe("anunțurile", () => {
  it("au id-uri unice, date valide și linkul direct către anunț", () => {
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(JOBS.length);
    for (const j of JOBS) {
      expect(j.id).toMatch(/^\d+$/);
      expect(j.postedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(JOB_TYPES).toContain(j.type);
      expect(j.requirements.length).toBeGreaterThan(0);
    }
    expect(jobUrl(byId("4468148314"))).toBe("https://www.linkedin.com/jobs/view/4468148314/");
  });
});

describe("filtre", () => {
  it("combină tipul, studenții, experiența și căutarea fără diacritice", () => {
    const internships = JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, types: ["internship"], studentsOnly: true }));
    expect(internships.length).toBeGreaterThan(0);
    expect(internships.every((j) => j.type === "internship" && j.forStudents)).toBe(true);

    expect(JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, noExperience: true })).every((j) => j.noExperience)).toBe(true);
    expect(JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, query: "germana" })).map((j) => j.id)).toContain("4445517444");
  });

  it("modul de lucru nu potrivește anunțurile care nu îl spun", () => {
    const hybrid = JOBS.filter((j) => matchesFilters(j, { ...DEFAULT_FILTERS, modes: ["hibrid"] }));
    expect(hybrid.every((j) => j.mode === "hibrid")).toBe(true);
  });

  it("„Cele mai noi” pune primul anunțul publicat cel mai recent", () => {
    const sorted = sortJobs(JOBS, { ...DEFAULT_FILTERS, sort: "recente" }, {});
    expect(sorted[0].postedAt).toBe(JOBS.map((j) => j.postedAt).sort().at(-1));
  });
});

describe("recomandări", () => {
  it("un student la Calculatoare primește întâi internshipuri legate de facultate", () => {
    const top = recommendJobs(JOBS, { study: "Automatică și Calculatoare" });
    expect(top.every((j) => j.type === "internship" && fitsStudy(j, "Automatică și Calculatoare"))).toBe(true);
  });

  it("explică de ce recomandă", () => {
    expect(fitsStudy(byId("4479358628"), "FEAA – Contabilitate")).toBe(true);
    expect(reasonsFor(byId("4479358628"), { study: "Economie" })).toEqual(["legat de facultatea ta", "pentru studenți", "fără experiență cerută"]);
  });
});
