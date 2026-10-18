import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveSubject } from "@/features/subjects/components/archive-subject";
import { SubjectDialog } from "@/features/subjects/components/subject-dialog";
import { SubjectHeader, type SubjectNumbers } from "@/features/subjects/components/subject-header";
import { SubjectTabs } from "@/features/subjects/components/subject-tabs";
import { getSubject } from "@/features/subjects/queries";
import { NotesPanel } from "@/features/notes/components/notes-panel";
import { formatRelativeTime } from "@/features/notes/format";
import { formatWeekdayShort } from "@/lib/time/format";
import { toDateKey } from "@/lib/time/zone";
import { listNotes } from "@/features/notes/queries";
import type { Note } from "@/features/notes/types";
import { MaterialsPanel } from "@/features/materials/components/materials-panel";
import { listMaterials } from "@/features/materials/queries";
import type { Material } from "@/features/materials/types";

/** Un PDF rămas „în procesare” mai mult de atât poate fi reluat manual. */
const STALE_PROCESSING_MS = 3 * 60_000;

export async function generateMetadata({ params }: PageProps<"/materii/[id]">): Promise<Metadata> {
  const { id } = await params;
  const subject = await getSubject(id);
  return { title: subject?.name ?? "Materie" };
}

export default async function SubjectPage({ params, searchParams }: PageProps<"/materii/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const subject = await getSubject(id);
  if (!subject) notFound();
  const [notes, materials] = await Promise.all([listNotes(subject.id), listMaterials(subject.id)]);
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/materii"
          className="-my-2.5 inline-flex items-center gap-1.5 self-start rounded-sm py-2.5 pr-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Materii
        </Link>
        <SubjectHeader
          subject={subject}
          numbers={numbersFor(materials, notes.length)}
          lastActivity={lastActivity(materials, notes, now)}
          actions={
            <>
              <SubjectDialog mode="edit" subject={subject} />
              <ArchiveSubject subject={subject} />
            </>
          }
        />
      </div>

      <SubjectTabs
        initial={query.tab === "notite" ? "notite" : "materiale"}
        counts={{ materiale: materials.length, notite: notes.length }}
        materials={
          <MaterialsPanel
            subjectId={subject.id}
            materials={materials.map((m) => ({
              ...m,
              addedLabel: formatRelativeTime(new Date(m.createdAt), now),
              stale: now.getTime() - new Date(m.updatedAt).getTime() > STALE_PROCESSING_MS,
            }))}
          />
        }
        notes={
          <NotesPanel
            subjectId={subject.id}
            notes={notes.map((n) => ({ ...n, updatedLabel: formatRelativeTime(new Date(n.updatedAt), now) }))}
          />
        }
      />
    </div>
  );
}

/** Numerele din antet; „pagini gata” = paginile PDF-urilor procesate (ce poate citi asistentul). */
function numbersFor(materials: Material[], notes: number): SubjectNumbers {
  const pdfs = materials.filter((m) => m.kind !== "image");
  return {
    pdfs: pdfs.length,
    photos: materials.length - pdfs.length,
    notes,
    studied: pdfs.filter((m) => m.studiedAt).length,
    readyPages: pdfs.reduce((sum, m) => sum + (m.status === "procesat" ? (m.pageCount ?? 0) : 0), 0),
  };
}

/** Cel mai recent material (după adăugare) sau notiță (după modificare). */
function lastActivity(materials: Material[], notes: Note[], now: Date) {
  const items = [
    ...materials.map((m) => ({ title: m.title, at: m.createdAt })),
    ...notes.map((n) => ({ title: n.title, at: n.updatedAt })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const latest = items[0];
  if (!latest) return null;
  const at = new Date(latest.at);
  return {
    title: latest.title,
    label: formatRelativeTime(at, now),
    day: String(Number(toDateKey(at).slice(8, 10))),
    weekday: formatWeekdayShort(at).replace(".", ""),
  };
}
