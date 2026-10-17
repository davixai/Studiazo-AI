import { describe, expect, it } from "vitest";
import { planConfirmation, sessionsRange, type ProposalRow } from "./plan";

const NOW = new Date("2026-10-17T09:00:00.000Z");
const ID = "11111111-1111-4111-8111-111111111111";
const SUBJECT = "6f1c2a8e-4b1d-4c3a-9e2f-1a2b3c4d5e6f";
const OTHER_SUBJECT = "7f1c2a8e-4b1d-4c3a-9e2f-1a2b3c4d5e6f";

const sessions = (items: Array<[string, string]>) => ({
  version: 1,
  kind: "study_sessions",
  explanation: "Două sesiuni înainte de examen.",
  warnings: [],
  fitsAvailableTime: true,
  items: items.map(([startsAt, endsAt]) => ({ title: "Recapitulare", subjectId: SUBJECT, focus: "Capitolul 2", startsAt, endsAt })),
});

const row = (payload: unknown, partial: Partial<ProposalRow> = {}): ProposalRow => ({
  id: ID,
  status: "pending",
  payload,
  expires_at: "2026-10-18T09:00:00.000Z",
  ...partial,
});

const plan = (r: ProposalRow, busy = [] as Array<{ start: Date; end: Date; title?: string }>, owned = [SUBJECT]) =>
  planConfirmation({ row: r, now: NOW, busy, ownedSubjectIds: new Set(owned) });

const TWO = sessions([
  ["2026-10-19T18:00:00+03:00", "2026-10-19T19:00:00+03:00"],
  ["2026-10-20T18:00:00+03:00", "2026-10-20T19:00:00+03:00"],
]);

describe("confirmarea propunerilor", () => {
  it("transformă sesiunile în activități de studiu legate de propunere (index unic pe element)", () => {
    const result = plan(row(TWO));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tasks).toEqual([]);
    expect(result.events).toHaveLength(2);
    expect(result.events[1]).toMatchObject({
      kind: "studiu",
      recurrence: "none",
      subject_id: SUBJECT,
      proposal_id: ID,
      proposal_item_index: 1,
      starts_at: "2026-10-20T15:00:00.000Z",
    });
  });

  it("refuză o propunere expirată, chiar dacă statusul e încă pending", () => {
    expect(plan(row(TWO, { expires_at: "2026-10-17T08:59:00.000Z" }))).toMatchObject({ ok: false, code: "expired" });
  });

  it("refuză o propunere deja respinsă", () => {
    expect(plan(row(TWO, { status: "rejected" }))).toMatchObject({ ok: false, code: "not_pending" });
  });

  it("revalidează conținutul din DB: un payload modificat sau stricat nu se salvează", () => {
    expect(plan(row({ ...TWO, kind: "delete_everything" }))).toMatchObject({ ok: false, code: "invalid" });
    expect(plan(row({ ...TWO, items: [] }))).toMatchObject({ ok: false, code: "invalid" });
  });

  it("refuză sesiunile din trecut", () => {
    const past = sessions([["2026-10-16T18:00:00+03:00", "2026-10-16T19:00:00+03:00"]]);
    expect(plan(row(past))).toMatchObject({ ok: false, code: "invalid" });
  });

  it("refuză sesiunile care se suprapun între ele", () => {
    const overlapping = sessions([
      ["2026-10-19T18:00:00+03:00", "2026-10-19T19:00:00+03:00"],
      ["2026-10-19T18:30:00+03:00", "2026-10-19T19:30:00+03:00"],
    ]);
    expect(plan(row(overlapping))).toMatchObject({ ok: false, code: "invalid" });
  });

  it("refuză suprapunerea cu programul actual și spune cu ce", () => {
    const busy = [{ start: new Date("2026-10-20T15:30:00.000Z"), end: new Date("2026-10-20T17:00:00.000Z"), title: "Tură part-time" }];
    const result = plan(row(TWO), busy);
    expect(result).toMatchObject({ ok: false, code: "conflict" });
    if (result.ok) return;
    expect(result.conflicts).toEqual([
      { itemIndex: 1, title: "Tură part-time", start: "2026-10-20T15:30:00.000Z", end: "2026-10-20T17:00:00.000Z" },
    ]);
  });

  it("o materie care nu e a utilizatorului devine „fără materie”", () => {
    const result = plan(row(TWO), [], [OTHER_SUBJECT]);
    expect(result.ok && result.events.every((e) => e.subject_id === null)).toBe(true);
  });

  it("transformă termenele propuse în teme, cu index pe element", () => {
    const tasks = {
      version: 1,
      kind: "task",
      explanation: "Am notat tema.",
      items: [{ kind: "tema", title: "Tema 4", subjectId: SUBJECT, dueAt: "2026-10-26T18:00:00+02:00", notes: null }],
    };
    const result = plan(row(tasks));
    expect(result).toMatchObject({
      ok: true,
      events: [],
      tasks: [{ kind: "tema", due_at: "2026-10-26T16:00:00.000Z", proposal_id: ID, proposal_item_index: 0 }],
    });
  });

  it("calculează intervalul sesiunilor (doar pentru study_sessions)", () => {
    expect(sessionsRange(TWO)).toEqual({ start: new Date("2026-10-19T15:00:00.000Z"), end: new Date("2026-10-20T16:00:00.000Z") });
    expect(sessionsRange({ kind: "task" })).toBeNull();
  });
});
