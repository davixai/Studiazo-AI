import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProposalCard } from "@/features/proposals/components/proposal-card";
import type { Proposal } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { fromLocal, shiftDateKey, toDateKey } from "@/lib/time/zone";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Sistem de design" };

// Referință vizuală pentru echipă. Nu apare în navigare și nu este disponibilă în producție.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && !isPreviewMode()) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Pentru echipă" title="Sistem de design" description="Componentele comune și stările lor. Detalii în docs/DESIGN_SYSTEM.md." />
      <Showcase />
      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Propunere AI (ProposalCard)</h2>
        <ProposalCard proposal={sampleProposal()} subjects={PREVIEW_SUBJECTS} />
      </section>
    </div>
  );
}

/** Exemplu demonstrativ: trei sesiuni în zilele următoare (confirmarea nu salvează în previzualizare). */
function sampleProposal(): Proposal {
  const today = toDateKey(new Date());
  const subject = PREVIEW_SUBJECTS[0];
  const at = (days: number, start: string, end: string, focus: string) => ({
    title: `Recapitulare ${subject.name}`,
    subjectId: subject.id,
    startsAt: fromLocal(shiftDateKey(today, days), start).toISOString(),
    endsAt: fromLocal(shiftDateKey(today, days), end).toISOString(),
    focus,
  });
  return {
    id: "00000000-0000-4000-8000-000000000999",
    conversationId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    payload: {
      version: 1,
      kind: "study_sessions",
      explanation: "Ai examen vineri. Am ales trei intervale libere, după cursuri, cu pauze între ele.",
      warnings: ["Capitolul 4 rămâne neacoperit; adaugă o sesiune în weekend dacă poți."],
      fitsAvailableTime: false,
      items: [at(1, "18:00", "18:50", "Capitolul 2 — arbori"), at(2, "17:00", "17:50", "Exerciții din seminar"), at(3, "19:00", "19:50", "Test de verificare")],
    },
  };
}
