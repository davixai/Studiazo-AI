import { describe, expect, it } from "vitest";
import { UNIVERSITY_OPTIONS } from "@/features/profile/onboarding";
import { IASI_UNIVERSITIES } from "@/lib/iasi";
import { UNIVERSITY_RESOURCES, findFaculty, resourcesFor } from "./data";

const uaic = UNIVERSITY_RESOURCES.find((u) => u.short === "UAIC")!;
const tuiasi = UNIVERSITY_RESOURCES.find((u) => u.short === "TUIASI")!;

describe("resursele pe universități", () => {
  it("acoperă exact universitățile din profil, cu linkuri https/http valide", () => {
    expect(UNIVERSITY_RESOURCES.map((u) => u.name).sort()).toEqual([...IASI_UNIVERSITIES].sort());
    for (const u of UNIVERSITY_RESOURCES) {
      for (const url of [u.site, ...u.items.map((i) => i.url), ...u.faculties.map((f) => f.url)]) expect(() => new URL(url)).not.toThrow();
    }
  });

  it("recunoaște fiecare facultate propusă la configurare, la universitatea ei", () => {
    for (const option of UNIVERSITY_OPTIONS) {
      const university = UNIVERSITY_RESOURCES.find((u) => u.name === option.value)!;
      for (const faculty of option.faculties) expect(findFaculty(university, faculty), faculty).not.toBeNull();
    }
  });

  it("potrivește și ce scrie studentul liber, fără diacritice", () => {
    expect(findFaculty(uaic, "informatica")?.name).toBe("Facultatea de Informatică");
    expect(findFaculty(tuiasi, "AC - Calculatoare")?.name).toBe("Facultatea de Automatică și Calculatoare");
    expect(findFaculty(tuiasi, "Inginerie electrică")?.name).toBe("Facultatea de Inginerie Electrică, Energetică și Informatică Aplicată");
    expect(findFaculty(uaic, "")).toBeNull();
  });
});

describe("resourcesFor", () => {
  it("folosește universitatea din profil", () => {
    const r = resourcesFor({ university: uaic.name, faculty: "Facultatea de Informatică" });
    expect(r.university?.short).toBe("UAIC");
    expect(r.faculty?.url).toBe("https://info.uaic.ro/");
  });

  it("fără universitate, o deduce din facultate doar când e fără echivoc", () => {
    expect(resourcesFor({ university: null, faculty: "Facultatea de Medicină Veterinară" }).university?.short).toBe("IULS");
    expect(resourcesFor({ university: null, faculty: "Inginerie" }).university).toBeNull();
    expect(resourcesFor(null).university).toBeNull();
  });
});
