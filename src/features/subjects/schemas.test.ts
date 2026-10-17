import { describe, expect, it } from "vitest";
import { SubjectFormSchema, SubjectIdSchema } from "./schemas";

describe("SubjectFormSchema", () => {
  it("acceptă o materie validă și elimină spațiile de la capete", () => {
    const r = SubjectFormSchema.parse({ name: "  Analiză matematică  ", professor: " Popescu ", color: "teal" });
    expect(r).toEqual({ name: "Analiză matematică", professor: "Popescu", color: "teal" });
  });

  it("transformă profesorul gol în null", () => {
    expect(SubjectFormSchema.parse({ name: "Fizică", professor: "   ", color: "blue" }).professor).toBeNull();
  });

  it("respinge numele gol, cu mesaj în română", () => {
    const r = SubjectFormSchema.safeParse({ name: "   ", professor: "", color: "blue" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Scrie numele materiei.");
  });

  it("respinge numele mai lung de 120 de caractere", () => {
    expect(SubjectFormSchema.safeParse({ name: "a".repeat(121), professor: "", color: "blue" }).success).toBe(false);
  });

  it("respinge o culoare din afara paletei", () => {
    expect(SubjectFormSchema.safeParse({ name: "Fizică", professor: "", color: "#ff0000" }).success).toBe(false);
  });

  it("ignoră câmpurile necunoscute (ex. user_id trimis de client)", () => {
    const r = SubjectFormSchema.parse({ name: "Fizică", professor: "", color: "blue", user_id: "altcineva" });
    expect(r).not.toHaveProperty("user_id");
  });
});

describe("SubjectIdSchema", () => {
  it("acceptă un uuid și respinge orice altceva", () => {
    expect(SubjectIdSchema.safeParse("6f1c2a52-3d4e-4b6a-9c1d-2e3f4a5b6c7d").success).toBe(true);
    expect(SubjectIdSchema.safeParse("1 or 1=1").success).toBe(false);
    expect(SubjectIdSchema.safeParse("").success).toBe(false);
  });
});
