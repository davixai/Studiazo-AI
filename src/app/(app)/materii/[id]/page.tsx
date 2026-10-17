import { ArrowLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/category";
import { ArchiveSubject } from "@/features/subjects/components/archive-subject";
import { SubjectDialog } from "@/features/subjects/components/subject-dialog";
import { SubjectTabs } from "@/features/subjects/components/subject-tabs";
import { getSubject } from "@/features/subjects/queries";
import { NotesPanel } from "@/features/notes/components/notes-panel";
import { formatRelativeTime } from "@/features/notes/format";
import { listNotes } from "@/features/notes/queries";
import { MaterialsPanel } from "@/features/materials/components/materials-panel";
import { listMaterials } from "@/features/materials/queries";

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
          className="inline-flex items-center gap-1.5 self-start rounded-sm text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Materii
        </Link>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <ColorDot color={subject.color} className="size-3" />
              <span className="min-w-0 break-words">{subject.name}</span>
            </span>
          }
          description={subject.professor ?? undefined}
          actions={
            <>
              {/* Deschide chatul acestei materii în asistent (partea lui David). */}
              <ButtonLink href={`/asistent?materie=${subject.id}`} variant="secondary" className="w-full sm:w-auto">
                <Sparkles aria-hidden="true" />
                Întreabă despre materie
              </ButtonLink>
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
