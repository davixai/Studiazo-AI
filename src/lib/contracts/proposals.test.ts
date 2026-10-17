import { describe, expect, it } from "vitest";
import { ProposalPayloadSchema, checkProposalTiming } from "./proposals";

const NOW = new Date("2026-10-17T09:00:00.000Z");
const subjectId = "6f1c2a8e-4b1d-4c3a-9e2f-1a2b3c4d5e6f";

const sessions = (items: Array<{ startsAt: string; endsAt: string }>) => ({
  version: 1,
  kind: "study_sessions",
  explanation: "Trei sesiuni înainte de examen.",
  warnings: [],
  fitsAvailableTime: true,
  items: items.map((i) => ({ title: "Recapitulare", subjectId, focus: "Capitolul 2", ...i })),
});

describe("contractul propunerilor", () => {
  it("acceptă o propunere de sesiuni validă", () => {
    const parsed = ProposalPayloadSchema.safeParse(
      sessions([{ startsAt: "2026-10-19T18:00:00+03:00", endsAt: "2026-10-19T18:50:00+03:00" }]),
    );
    expect(parsed.success).toBe(true);
  });

  it("respinge sesiunile inversate sau prea lungi", () => {
    expect(
      ProposalPayloadSchema.safeParse(sessions([{ startsAt: "2026-10-19T18:00:00+03:00", endsAt: "2026-10-19T17:00:00+03:00" }]))
        .success,
    ).toBe(false);
    expect(
      ProposalPayloadSchema.safeParse(sessions([{ startsAt: "2026-10-19T08:00:00+03:00", endsAt: "2026-10-19T14:00:00+03:00" }]))
        .success,
    ).toBe(false);
  });

  it("respinge datele fără fus orar explicit", () => {
    expect(
      ProposalPayloadSchema.safeParse(sessions([{ startsAt: "2026-10-19T18:00:00", endsAt: "2026-10-19T18:50:00" }])).success,
    ).toBe(false);
  });

  it("respinge câmpuri lipsă sau tipuri necunoscute", () => {
    expect(ProposalPayloadSchema.safeParse({ version: 1, kind: "delete_everything", items: [] }).success).toBe(false);
    expect(
      ProposalPayloadSchema.safeParse({
        version: 1,
        kind: "task",
        explanation: "",
        items: [{ kind: "examen", title: "Examen", subjectId: "nu-e-uuid", dueAt: "2026-10-23T10:00:00+03:00", notes: null }],
      }).success,
    ).toBe(false);
  });

  it("semnalează datele din trecut și pe cele prea îndepărtate", () => {
    const payload = ProposalPayloadSchema.parse(
      sessions([
        { startsAt: "2026-10-16T18:00:00+03:00", endsAt: "2026-10-16T19:00:00+03:00" },
        { startsAt: "2027-03-01T18:00:00+02:00", endsAt: "2027-03-01T19:00:00+02:00" },
        { startsAt: "2026-10-18T18:00:00+03:00", endsAt: "2026-10-18T19:00:00+03:00" },
      ]),
    );
    expect(checkProposalTiming(payload, NOW).map((i) => i.itemIndex)).toEqual([0, 1]);
  });
});
