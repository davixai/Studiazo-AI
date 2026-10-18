import { describe, expect, it } from "vitest";
import { PREVIEW_PROFILE } from "@/lib/preview/fixtures";
import { buildInstructions } from "./prompt";

const now = new Date("2026-10-18T09:00:00Z");

describe("buildInstructions", () => {
  it("pune răspunsurile din configurare în context", () => {
    const text = buildInstructions({
      now,
      profile: { ...PREVIEW_PROFILE, preferredTime: "seara" },
      study: { age: 20, needs: ["examene", "teme"], worries: ["volum", "promovare"], goal: "nota_buna", times: [] },
      subjects: [],
      subject: null,
    });
    expect(text).toContain(
      "- Profilul de studiu: are 20 de ani; are nevoie de: „Am examene în curând”, „Ajutor la teme și proiecte”; " +
        "îl îngrijorează: „E prea mult material”, „Mă tem că nu voi trece”; obiectiv: „Să iau o notă bună” (țintesc nota 8); " +
        "se concentrează cel mai bine seara.",
    );
  });

  it("trimite toate momentele zilei alese", () => {
    const text = buildInstructions({
      now,
      profile: { ...PREVIEW_PROFILE, preferredTime: "dimineata" },
      study: { age: null, needs: [], worries: [], goal: null, times: ["dimineata", "seara"] },
      subjects: [],
      subject: null,
    });
    expect(text).toContain("- Profilul de studiu: se concentrează cel mai bine dimineața și seara.");
  });

  it("nu adaugă rândul dacă studentul nu a răspuns", () => {
    const text = buildInstructions({
      now,
      profile: { ...PREVIEW_PROFILE, preferredTime: "fara_preferinta" },
      study: { age: null, needs: [], worries: [], goal: null, times: [] },
      subjects: [],
      subject: null,
    });
    expect(text).not.toContain("- Profilul de studiu:");
  });
});
