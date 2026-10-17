import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import type { Note } from "./types";

// Doar pentru modul previzualizare (STUDIA_PREVIEW=1): două notițe demonstrative la prima materie.

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export function previewNotes(): Note[] {
  const subjectId = PREVIEW_SUBJECTS[0].id;
  return [
    {
      id: "00000000-0000-4000-8000-0000000000b1",
      subjectId,
      title: "Arbori binari de căutare (demo)",
      content:
        "Inserare, căutare și ștergere în O(h), unde h este înălțimea arborelui.\n\nLa ștergerea unui nod cu doi copii: înlocuiesc cu succesorul în inordine (minimul din subarborele drept).\n\nDe recitit: rotațiile din arborii AVL.",
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(2),
    },
    {
      id: "00000000-0000-4000-8000-0000000000b2",
      subjectId,
      title: "Întrebări pentru seminar (demo)",
      content: "1. De ce heap-ul binar se ține într-un vector?\n2. Complexitatea pentru build-heap: O(n), nu O(n log n).",
      createdAt: hoursAgo(80),
      updatedAt: hoursAgo(76),
    },
  ];
}
