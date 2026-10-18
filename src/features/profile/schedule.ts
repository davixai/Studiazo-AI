import { z } from "zod";
import { isTimeOfDay, localSpan, shiftDateKey, startOfWeekKey } from "@/lib/time/zone";

// Importul orarului din poză (/bun-venit): ce citește AI-ul, cum validăm fiecare oră
// și cum devine o activitate care se repetă în calendar până la finalul semestrului.

export const SCHEDULE_KINDS = ["curs", "seminar", "laborator"] as const;
export const SCHEDULE_MAX_ENTRIES = 80;
/** Poza trimisă ca data URL; sub limita de 1 MB a Server Actions. */
export const SCHEDULE_IMAGE_MAX_CHARS = 950_000;
export const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const WEEKDAY_NAMES = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"] as const;

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => v || null);

export const ScheduleEntrySchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .transform((v) => v.replace(/\s+/g, " ")),
    kind: z.enum(SCHEDULE_KINDS),
    day: z.number().int().min(1).max(7),
    start: z.string().refine(isTimeOfDay),
    end: z.string().refine(isTimeOfDay),
    room: nullableText(160),
    professor: nullableText(160),
    biweekly: z.boolean(),
    groups: z.array(z.string().trim().min(1).max(40)).max(20),
  })
  .refine((e) => e.end > e.start, "Ora de sfârșit trebuie să fie după cea de început.");

export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

export const ScheduleListSchema = z.array(ScheduleEntrySchema).max(SCHEDULE_MAX_ENTRIES);

/** Schema pentru structured output (toate câmpurile obligatorii, null unde lipsește). */
export const SCHEDULE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["subjects", "entries", "note"],
  properties: {
    // Întâi lista completă a materiilor (cu prescurtarea din orar), apoi orele: modelul nu mai „uită” materii,
    // iar codul verifică după aceea că fiecare materie are ore.
    subjects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "short"],
        properties: { name: { type: "string" }, short: { type: ["string", "null"] } },
      },
    },
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "kind", "day", "start", "end", "room", "professor", "biweekly", "groups"],
        properties: {
          subject: { type: "string" },
          kind: { type: "string", enum: [...SCHEDULE_KINDS] },
          day: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7] },
          start: { type: "string", description: "HH:MM, 24 de ore" },
          end: { type: "string", description: "HH:MM, 24 de ore" },
          room: { type: ["string", "null"] },
          professor: { type: ["string", "null"] },
          biweekly: { type: "boolean" },
          groups: { type: "array", items: { type: "string" } },
        },
      },
    },
    note: { type: ["string", "null"] },
  },
} as const;

/** Păstrează orele valide din răspunsul AI-ului (o oră greșită nu strică tot orarul), ordonate pe zile și ore. */
export function cleanSchedule(raw: unknown): { entries: ScheduleEntry[]; note: string | null } {
  const data = typeof raw === "object" && raw !== null ? (raw as { subjects?: unknown; entries?: unknown; note?: unknown }) : {};
  const entries = (Array.isArray(data.entries) ? data.entries : [])
    .map((e) => ScheduleEntrySchema.safeParse(normalizeTimes(e)))
    .flatMap((r) => (r.success ? [r.data] : []))
    .slice(0, SCHEDULE_MAX_ENTRIES)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  // Materiile văzute în orar, dar fără nicio oră citită: le spunem studentului, ca să le adauge manual.
  const withHours = new Set(entries.map((e) => e.subject.toLocaleLowerCase("ro")));
  const missing = (Array.isArray(data.subjects) ? data.subjects : [])
    .map((s) => (typeof s === "object" && s !== null && typeof (s as { name?: unknown }).name === "string" ? (s as { name: string }).name.trim().replace(/\s+/g, " ") : ""))
    .filter((name) => name && !withHours.has(name.toLocaleLowerCase("ro")));
  const notes = [
    typeof data.note === "string" && data.note.trim() ? data.note.trim().slice(0, 300) : null,
    missing.length > 0 ? `Nu am citit orele pentru: ${[...new Set(missing)].join(", ")}. Le poți adăuga manual mai jos.` : null,
  ].filter(Boolean);
  return { entries, note: notes.length > 0 ? notes.join(" ") : null };
}

/** „8:00” → „08:00”, „8.00” → „08:00”. */
function normalizeTimes(entry: unknown) {
  if (typeof entry !== "object" || entry === null) return entry;
  const fix = (v: unknown) => {
    const m = typeof v === "string" ? /^(\d{1,2})[:.](\d{2})$/.exec(v.trim()) : null;
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : v;
  };
  const e = entry as Record<string, unknown>;
  return { ...e, start: fix(e.start), end: fix(e.end) };
}

/** Grupele care apar în orar (pentru întrebarea „Ce grupă ești?”). */
export function scheduleGroups(entries: ScheduleEntry[]) {
  return [...new Set(entries.flatMap((e) => e.groups))].sort((a, b) => a.localeCompare(b, "ro", { numeric: true }));
}

/** Orele grupei alese, plus cele comune (fără grupă). */
export function forGroup(entries: ScheduleEntry[], group: string | null) {
  return group ? entries.filter((e) => e.groups.length === 0 || e.groups.includes(group)) : entries;
}

/** Ultima zi de cursuri estimată: semestrul 1 se încheie în ianuarie, semestrul 2 la început de iunie. */
export function semesterEnd(todayKey: string) {
  const year = Number(todayKey.slice(0, 4));
  const month = Number(todayKey.slice(5, 7));
  if (month >= 8) return `${year + 1}-01-20`;
  if (month === 1) return `${year}-01-20`;
  return `${year}-06-07`;
}

/** Rândurile pentru `events`: prima apariție în săptămâna curentă, apoi săptămânal (sau la două săptămâni). */
export function scheduleToEvents(entries: ScheduleEntry[], todayKey: string, subjectIds: Map<string, string>) {
  const monday = startOfWeekKey(todayKey);
  const until = semesterEnd(todayKey);
  return entries.map((e) => {
    const { start, end } = localSpan(shiftDateKey(monday, e.day - 1), e.start, e.end);
    return {
      kind: e.kind,
      title: e.subject,
      subject_id: subjectIds.get(e.subject.toLocaleLowerCase("ro")) ?? null,
      location: e.room,
      notes: e.professor ? `Profesor: ${e.professor}` : null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      recurrence: e.biweekly ? ("biweekly" as const) : ("weekly" as const),
      recurrence_until: until,
    };
  });
}

/** Orar de probă pentru modul previzualizare (STUDIA_PREVIEW=1): două grupe și ore comune. */
export const PREVIEW_SCHEDULE: ScheduleEntry[] = [
  { subject: "Baze de date", kind: "curs", day: 1, start: "08:00", end: "10:00", room: "C2", professor: "Conf. dr. Ana Popescu", biweekly: false, groups: [] },
  { subject: "Baze de date", kind: "laborator", day: 1, start: "12:00", end: "14:00", room: "C412", professor: "Asist. Mihai Ionescu", biweekly: false, groups: ["2A"] },
  { subject: "Baze de date", kind: "laborator", day: 2, start: "10:00", end: "12:00", room: "C412", professor: "Asist. Mihai Ionescu", biweekly: false, groups: ["2B"] },
  { subject: "Programare orientată pe obiecte", kind: "curs", day: 2, start: "14:00", end: "16:00", room: "C1", professor: "Prof. dr. Radu Matei", biweekly: false, groups: [] },
  { subject: "Probabilități și statistică", kind: "seminar", day: 3, start: "10:00", end: "12:00", room: "C903", professor: "Lect. dr. Ioana Rusu", biweekly: true, groups: ["2A"] },
  { subject: "Probabilități și statistică", kind: "curs", day: 4, start: "08:00", end: "10:00", room: "C2", professor: "Lect. dr. Ioana Rusu", biweekly: false, groups: [] },
  { subject: "Rețele de calculatoare", kind: "laborator", day: 5, start: "16:00", end: "18:00", room: null, professor: null, biweekly: false, groups: ["2A"] },
];

/** Profesorul de curs al fiecărei materii (altfel primul profesor găsit), pentru materiile create din orar. */
export function professorsBySubject(entries: ScheduleEntry[]) {
  const result = new Map<string, string>();
  for (const e of [...entries].sort((a, b) => Number(b.kind === "curs") - Number(a.kind === "curs"))) {
    const key = e.subject.toLocaleLowerCase("ro");
    if (e.professor && !result.has(key)) result.set(key, e.professor);
  }
  return result;
}
