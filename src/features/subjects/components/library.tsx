import { ChevronRight, FileText, ImageIcon, LibraryBig, NotebookPen, Sparkles } from "lucide-react";
import Link from "next/link";
import { ColorDot, SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { cn } from "@/lib/utils";
import { countLabel } from "../format";
import { contentBars, percent, studiedShare, type LibraryOverview, type RecentItem, type SubjectStats } from "../overview";
import { Donut, FillBar, Panel, PanelHeader, SubjectAvatar } from "./visuals";

// Panoul „Materii”: rezumat, progres, distribuția conținutului, materiile și ce ai adăugat recent.

/** Cardul principal (accent): câte materii, PDF-uri, poze, notițe și câte pagini poate citi asistentul. */
export function LibraryHero({ totals, index }: { totals: LibraryOverview["totals"]; index: number }) {
  const chips = [
    { label: "PDF-uri", value: totals.pdfs, icon: FileText },
    { label: "Poze", value: totals.photos, icon: ImageIcon },
    { label: "Notițe", value: totals.notes, icon: NotebookPen },
  ];
  return (
    <section
      aria-labelledby="biblioteca"
      className="stagger relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-accent via-accent-deep to-accent-ink p-5 text-white shadow-accent sm:p-6"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-12 size-48 rounded-full bg-white/[0.06]" />

      <div className="relative flex items-center justify-between gap-3">
        <h2 id="biblioteca" className="flex items-center gap-2 text-sm font-semibold text-white/85">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <LibraryBig className="size-4" aria-hidden="true" />
          </span>
          Biblioteca ta
        </h2>
      </div>

      <p className="relative mt-5">
        <span className="block text-[44px] leading-none font-extrabold tracking-[-0.04em] tabular">{totals.subjects}</span>
        <span className="mt-1 block text-sm font-medium text-white/80">{totals.subjects === 1 ? "materie" : totals.subjects < 20 ? "materii" : "de materii"} în semestrul acesta</span>
      </p>

      <ul className="relative mt-5 grid grid-cols-3 gap-2">
        {chips.map(({ label, value, icon: Icon }, i) => (
          <li
            key={label}
            className="animate-pop-in rounded-md bg-white/12 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm"
            style={{ animationDelay: `${200 + i * 80}ms` }}
          >
            <Icon className="size-4 text-white/75" aria-hidden="true" />
            <span className="mt-1.5 block text-xl leading-none font-bold tabular">{value}</span>
            <span className="mt-1 block text-[11px] font-medium text-white/75">{label}</span>
          </li>
        ))}
      </ul>

      <p className="relative mt-auto flex items-center gap-2 pt-5 text-[13px] leading-5 text-white/85">
        <Sparkles className="size-4 shrink-0" aria-hidden="true" />
        {totals.readyPages > 0
          ? `${countLabel(totals.readyPages, "pagină", "pagini")} din cursuri, gata pentru asistent`
          : "Încarcă un PDF cu text ca asistentul să-l poată citi."}
      </p>
    </section>
  );
}

export function StudiedPanel({ studied, total, index, className }: { studied: number; total: number; index: number; className?: string }) {
  const share = studiedShare(studied, total);
  return (
    <Panel index={index} aria-labelledby="parcurse" className={className}>
      <PanelHeader id="parcurse" title="Cursuri parcurse" description="PDF-urile marcate „Parcurs”" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Donut share={share} label={share === null ? "Niciun PDF încă" : `${percent(share)}% parcurse`}>
          <span className="text-[24px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular">
            {share === null ? "—" : `${percent(share)}%`}
          </span>
          <span className="mt-1 text-[11px] font-medium text-ink-muted">{share === null ? "fără PDF" : `${studied} din ${total}`}</span>
        </Donut>
        <ul className="grid w-full grid-cols-2 gap-2 text-[12px]">
          <li className="flex items-center justify-center gap-1.5 rounded-md bg-surface-muted px-2 py-1.5">
            <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-ink-muted">Parcurse</span>
            <span className="font-semibold text-ink tabular">{studied}</span>
          </li>
          <li className="flex items-center justify-center gap-1.5 rounded-md bg-surface-muted px-2 py-1.5">
            <span className="size-2 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
            <span className="whitespace-nowrap text-ink-muted">De parcurs</span>
            <span className="font-semibold text-ink tabular">{Math.max(0, total - studied)}</span>
          </li>
        </ul>
      </div>
    </Panel>
  );
}

export function ContentPanel({ subjects, index, className }: { subjects: SubjectStats[]; index: number; className?: string }) {
  const bars = contentBars(subjects);
  return (
    <Panel index={index} aria-labelledby="continut" className={className}>
      <PanelHeader id="continut" title="Conținut pe materii" description="PDF-uri, poze și notițe" />
      {bars.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {bars.map(({ subject, value, share }, i) => (
            <li key={subject.id}>
              <div className="mb-1.5 flex items-center gap-2 text-[13px]">
                <ColorDot color={subject.color} />
                <span className="min-w-0 truncate font-medium text-ink-soft">{subject.name}</span>
                <span className="ml-auto font-semibold text-ink tabular">{value}</span>
              </div>
              <FillBar share={share} color={subject.color} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] leading-5 text-ink-muted">Încă nu ai materiale. Deschide o materie și adaugă un PDF, o poză sau o notiță.</p>
      )}
    </Panel>
  );
}

/** Cardul unei materii: avatar, numere, progresul parcurgerii; tot cardul duce la materie. */
export function SubjectCard({ subject }: { subject: SubjectStats }) {
  const share = studiedShare(subject.studiedCount, subject.pdfCount);
  const counts = [
    { icon: FileText, value: subject.pdfCount, label: countLabel(subject.pdfCount, "PDF", "PDF-uri") },
    { icon: ImageIcon, value: subject.photoCount, label: countLabel(subject.photoCount, "poză", "poze") },
    { icon: NotebookPen, value: subject.noteCount, label: countLabel(subject.noteCount, "notiță", "notițe") },
  ];
  return (
    <Link href={`/materii/${subject.id}`} className="group block h-full rounded-lg transition-transform active:scale-[0.99]">
      <article className="lift flex h-full flex-col gap-4 rounded-lg border border-line/70 bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <SubjectAvatar name={subject.name} color={subject.color} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] leading-snug font-semibold break-words text-ink">{subject.name}</h3>
            <p className="mt-0.5 truncate text-[12px] text-ink-muted">{subject.professor ?? "Fără profesor adăugat"}</p>
          </div>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-faint transition-colors group-hover:border-accent-line group-hover:bg-accent-soft group-hover:text-accent">
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {counts.map(({ icon: Icon, value, label }) => (
            <li
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium tabular",
                value > 0 ? cn(SUBJECT_COLOR_CLASSES[subject.color].soft, "text-ink-soft") : "bg-surface-muted text-ink-faint",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="font-medium text-ink-muted">Parcurs</span>
            <span className="font-semibold text-ink-soft tabular">
              {share === null ? "niciun PDF încă" : `${subject.studiedCount} din ${subject.pdfCount} · ${percent(share)}%`}
            </span>
          </div>
          <FillBar share={share ?? 0} color={subject.color} />
        </div>
      </article>
    </Link>
  );
}

const RECENT_ICON = { pdf: FileText, image: ImageIcon, note: NotebookPen } as const;
const RECENT_KIND = { pdf: "PDF", image: "Poză", note: "Notiță" } as const;

export function RecentPanel({ items, index }: { items: Array<RecentItem & { label: string }>; index: number }) {
  return (
    <Panel index={index} aria-labelledby="recente">
      <PanelHeader id="recente" title="Adăugate recent" description="Ultimele materiale și notițe" />
      {items.length > 0 ? (
        <ul className="-mx-2 flex flex-col">
          {items.map((item) => {
            const Icon = RECENT_ICON[item.kind];
            const color = SUBJECT_COLOR_CLASSES[item.subject.color];
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.kind === "note" ? `/materii/${item.subject.id}?tab=notite` : `/materii/${item.subject.id}`}
                  className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-muted"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", color.soft, color.text)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{item.title}</span>
                    <span className="block truncate text-[12px] text-ink-muted">
                      <span className="sr-only">{RECENT_KIND[item.kind]}, </span>
                      {item.subject.name} · {item.label}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[13px] leading-5 text-ink-muted">Ce adaugi la materii apare aici, cele mai noi primele.</p>
      )}
    </Panel>
  );
}
