import type { Subject } from "@/lib/contracts/domain";

// Calculele panoului „Materii”: pure, fără bază de date, testate separat.

export type OverviewMaterial = {
  id: string;
  subjectId: string;
  title: string;
  kind: "pdf" | "image";
  status: string;
  studied: boolean;
  pageCount: number | null;
  createdAt: string;
};

export type OverviewNote = { id: string; subjectId: string; title: string; updatedAt: string };

export type SubjectStats = Subject & {
  pdfCount: number;
  photoCount: number;
  noteCount: number;
  /** PDF-uri marcate „parcurs”. */
  studiedCount: number;
  /** Pagini cu text din PDF-urile procesate (ce poate citi asistentul). */
  readyPages: number;
};

export type RecentItem = {
  id: string;
  kind: "pdf" | "image" | "note";
  title: string;
  subject: Subject;
  at: string;
};

export type LibraryOverview = {
  subjects: SubjectStats[];
  totals: { subjects: number; pdfs: number; photos: number; notes: number; studied: number; readyPages: number };
  recent: RecentItem[];
};

export function buildOverview(
  subjects: Subject[],
  materials: OverviewMaterial[],
  notes: OverviewNote[],
  recentLimit = 5,
): LibraryOverview {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const stats = new Map<string, SubjectStats>(
    subjects.map((s) => [s.id, { ...s, pdfCount: 0, photoCount: 0, noteCount: 0, studiedCount: 0, readyPages: 0 }]),
  );

  // Materialele și notițele materiilor arhivate nu intră în calcule.
  const activeMaterials = materials.filter((m) => byId.has(m.subjectId));
  const activeNotes = notes.filter((n) => byId.has(n.subjectId));

  for (const m of activeMaterials) {
    const s = stats.get(m.subjectId)!;
    if (m.kind === "image") {
      s.photoCount++;
      continue;
    }
    s.pdfCount++;
    if (m.studied) s.studiedCount++;
    if (m.status === "procesat") s.readyPages += m.pageCount ?? 0;
  }
  for (const n of activeNotes) stats.get(n.subjectId)!.noteCount++;

  const list = subjects.map((s) => stats.get(s.id)!);
  const sum = (pick: (s: SubjectStats) => number) => list.reduce((total, s) => total + pick(s), 0);

  const recent: RecentItem[] = [
    ...activeMaterials.map((m) => ({ id: m.id, kind: m.kind, title: m.title, subject: byId.get(m.subjectId)!, at: m.createdAt })),
    ...activeNotes.map((n) => ({ id: n.id, kind: "note" as const, title: n.title, subject: byId.get(n.subjectId)!, at: n.updatedAt })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, recentLimit);

  return {
    subjects: list,
    totals: {
      subjects: list.length,
      pdfs: sum((s) => s.pdfCount),
      photos: sum((s) => s.photoCount),
      notes: sum((s) => s.noteCount),
      studied: sum((s) => s.studiedCount),
      readyPages: sum((s) => s.readyPages),
    },
    recent,
  };
}

/** Partea parcursă, între 0 și 1; null când nu există niciun PDF (nu are sens un procent). */
export function studiedShare(studied: number, total: number) {
  if (total <= 0) return null;
  return Math.min(1, Math.max(0, studied / total));
}

/** Procent întreg pentru afișare; 0 < x < 1% devine 1%, ca progresul mic să nu pară zero. */
export function percent(share: number) {
  if (share > 0 && share < 0.01) return 1;
  return Math.round(share * 100);
}

/**
 * Barele „Conținut pe materii”: primele `limit` materii, cele mai pline întâi (apoi alfabetic),
 * lungimea relativă la cea mai plină (prima bară e întreagă). Materiile goale apar la final, cu bara la zero;
 * dacă toate sunt goale, lista e goală (cardul afișează pasul următor).
 */
export function contentBars(subjects: SubjectStats[], limit = 5) {
  const rows = subjects
    .map((s) => ({ subject: s, value: s.pdfCount + s.photoCount + s.noteCount }))
    .sort((a, b) => b.value - a.value || a.subject.name.localeCompare(b.subject.name, "ro"))
    .slice(0, limit);
  const max = rows[0]?.value ?? 0;
  if (max === 0) return [];
  return rows.map((r) => ({ ...r, share: r.value / max }));
}

/** Inițialele pentru „avatarul” materiei: „Structuri de date” → „SD”, „Fizică” → „FI”. */
export function subjectInitials(name: string) {
  const stop = new Set(["de", "si", "și", "în", "in", "la", "pe", "cu", "a", "al", "ale", "din", "pentru"]);
  const words = name.split(/[\s\-–—]+/).filter((w) => w && !stop.has(w.toLowerCase()));
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[1]][0]];
  return letters.join("").toLocaleUpperCase("ro");
}
