import { ArrowRight, Clock3, FileText, ImageIcon, NotebookPen, ScrollText, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import type { Subject } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import { percent, studiedShare } from "../overview";
import { DateTile, Donut, SubjectAvatar } from "./visuals";

export type SubjectNumbers = { pdfs: number; photos: number; notes: number; readyPages: number; studied: number };

/**
 * Antetul paginii unei materii, ca un panou bento: „profilul” materiei cu numerele ei,
 * progresul parcurgerii și scurtătura către chatul materiei.
 */
export function SubjectHeader({
  subject,
  numbers,
  actions,
  lastActivity,
}: {
  subject: Subject;
  numbers: SubjectNumbers;
  actions: ReactNode;
  /** Cel mai recent material sau notiță, cu momentul relativ („acum o oră”). */
  lastActivity: { title: string; label: string; day: string; weekday: string } | null;
}) {
  const color = SUBJECT_COLOR_CLASSES[subject.color];
  const share = studiedShare(numbers.studied, numbers.pdfs);
  const stats = [
    { label: "PDF-uri", value: numbers.pdfs, icon: FileText },
    { label: "Poze", value: numbers.photos, icon: ImageIcon },
    { label: "Notițe", value: numbers.notes, icon: NotebookPen },
    { label: "Pagini gata", value: numbers.readyPages, icon: ScrollText },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      <section
        aria-labelledby="materie-titlu"
        className="stagger relative flex flex-col gap-5 overflow-hidden rounded-lg border border-line/70 bg-surface p-5 shadow-sm sm:p-6 lg:col-span-8"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        {/* Fâșie fină în culoarea materiei, ca pe cardurile din listă. */}
        <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1", color.bar)} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="animate-pop-in">
              <SubjectAvatar name={subject.name} color={subject.color} size="lg" />
            </span>
            <div className="min-w-0">
              <h1 id="materie-titlu" className="font-display text-[24px] leading-[1.15] font-bold tracking-[-0.03em] break-words text-ink sm:text-[30px]">
                {subject.name}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{subject.professor ?? "Profesorul nu e adăugat"}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1 sm:-mt-1 sm:-mr-2">{actions}</div>
        </div>

        <p className="flex min-w-0 items-center gap-3 rounded-md bg-surface-muted px-3 py-2 text-[13px] text-ink-muted">
          {lastActivity ? <DateTile day={lastActivity.day} weekday={lastActivity.weekday} className="size-10" /> : <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />}
          {lastActivity ? (
            <span className="min-w-0">
              <span className="block text-[11px] font-medium tracking-wide text-ink-faint uppercase">Ultima adăugare · {lastActivity.label}</span>
              <span className="block truncate font-semibold text-ink-soft">{lastActivity.title}</span>
            </span>
          ) : (
            <span>Nimic adăugat încă. Începe cu un curs în PDF, o poză sau o notiță.</span>
          )}
        </p>

        <ul className="mt-auto grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <li
              key={label}
              className="animate-pop-in rounded-md border border-line/70 bg-surface-muted/60 px-3.5 py-3"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <span className={cn("flex size-7 items-center justify-center rounded-md", color.soft, color.text)}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-[22px] leading-none font-bold tracking-[-0.03em] text-ink tabular">{value}</span>
              <span className="mt-1 block text-[12px] font-medium text-ink-muted">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Progresul și scurtătura către chat, într-un singur card violet (înălțimea se potrivește cu profilul). */}
      <section
        aria-labelledby="materie-progres"
        className="stagger relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-accent via-accent-deep to-accent-ink p-5 text-white shadow-accent sm:p-6 lg:col-span-4"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-14 size-44 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-white/[0.06]" />

        <h2 id="materie-progres" className="relative text-sm font-semibold text-white/85">
          Parcurs
        </h2>
        <div className="relative mt-3 flex items-center gap-4">
          <Donut
            share={share}
            size={88}
            thickness={9}
            onAccent
            label={share === null ? "Niciun PDF încă" : `${percent(share)}% parcurs`}
          >
            <span className="text-[19px] leading-none font-extrabold tracking-[-0.03em] tabular">{share === null ? "—" : `${percent(share)}%`}</span>
          </Donut>
          <p className="text-[13px] leading-5 text-white/85">
            {share === null ? (
              "Încarcă un curs în PDF și bifează „Parcurs” după ce îl citești."
            ) : (
              <>
                <span className="font-semibold text-white tabular">
                  {numbers.studied} din {numbers.pdfs}
                </span>{" "}
                {numbers.pdfs === 1 ? "PDF parcurs" : "PDF-uri parcurse"}
                {numbers.studied === numbers.pdfs ? ". Bravo, ai terminat!" : "."}
              </>
            )}
          </p>
        </div>

        <div className="relative mt-5 border-t border-white/15 pt-4 lg:mt-auto">
          <p className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.01em]">
            <Sparkles className="size-4" aria-hidden="true" />
            Întreabă despre materie
          </p>
          <p className="mt-1 text-[13px] leading-5 text-white/80">Asistentul explică din cursurile acestei materii, cu numărul paginii.</p>
          <Link
            href={`/asistent?materie=${subject.id}`}
            className="group mt-3.5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-white px-4 text-sm font-semibold text-accent-ink shadow-sm transition-[background-color,transform] hover:bg-white/90 active:translate-y-px sm:w-auto"
          >
            Deschide chatul
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
