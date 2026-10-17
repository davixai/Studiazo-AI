import { BookOpen, CalendarClock, ListChecks, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getAiStatus } from "@/lib/ai/config";

export const metadata: Metadata = { title: "Asistent" };

const EXAMPLES = [
  { icon: BookOpen, text: "Explică-mi cursul 3 de la Structuri de date, pe înțelesul meu." },
  { icon: ListChecks, text: "Dă-mi cinci întrebări din acest curs ca să văd dacă l-am înțeles." },
  { icon: CalendarClock, text: "Am examen vineri. Găsește-mi trei intervale de studiu." },
];

// Etapa 1: pagina de pornire a asistentului. Chatul, instrumentele și testele vin în etapa 2 (Sergiu).
export default function AssistantPage() {
  const status = getAiStatus();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Asistent"
        description="Explică materia din cursurile tale, te testează și îți propune sesiuni de studiu. Nimic nu se salvează fără confirmarea ta."
      />

      {!status.available ? (
        <Alert tone="warning" title="Asistentul AI nu este disponibil momentan">
          Calendarul și materiile funcționează în continuare normal.
        </Alert>
      ) : null}

      <Card className="p-5 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em]">Cu ce te pot ajuta?</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          Răspunsurile se bazează pe materialele încărcate la materii. Când informația nu apare în ele, asistentul îți spune.
        </p>
        <ul className="mt-6 grid gap-2 md:grid-cols-3">
          {EXAMPLES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 rounded-md border border-line bg-surface-muted/60 p-4 text-sm leading-6 text-ink-soft">
              <Icon className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
