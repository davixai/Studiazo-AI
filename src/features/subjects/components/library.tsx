import { ArrowDownRight, ArrowUpRight, ChevronRight, FileText, ImageIcon, LibraryBig, NotebookPen, Sparkles } from "lucide-react";
import Link from "next/link";
import { ColorDot, SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { cn } from "@/lib/utils";
import { weekTrend, type WeekBucket } from "../chart-math";
import { countLabel } from "../format";
import { contentBars, percent, studiedShare, type LibraryOverview, type RecentItem, type SubjectStats } from "../overview";
import { AreaChart, FillBar, Panel, PanelHeader, RingStack, SubjectAvatar } from "./visuals";

// Panoul „Materii” (bento): privire de ansamblu, statistici cu mini-grafice, activitatea pe săptămâni,
// materiile și ce ai adăugat recent. Cifrele vin din overview.ts și chart-math.ts (testate).

/** Cardul închis la culoare: trei inele (parcurse, gata pentru asistent, materii cu conținut). */
export function OverviewPanel({ totals, index, className }: { totals: LibraryOverview["totals"]; index: number; className?: string }) {
  const metrics = [
    {
      label: "Cursuri parcurse",
      share: studiedShare(totals.studied, totals.pdfs),
      detail: `${totals.studied} din ${totals.pdfs} PDF-uri`,
      color: "teal" as const,
      dot: "bg-cat-teal",
    },
    {
      label: "Gata pentru asistent",
      share: studiedShare(totals.readyPdfs, totals.pdfs),
      detail: countLabel(totals.readyPages, "pagină", "pagini"),
      color: "violet" as const,
      dot: "bg-cat-violet",
    },
    {
      label: "Materii cu conținut",
      share: studiedShare(totals.subjectsWithContent, totals.subjects),
      detail: `${totals.subjectsWithContent} din ${totals.subjects}`,
      color: "blue" as const,
      dot: "bg-cat-blue",
    },
  ];
  return (
    <section
      aria-labelledby="ansamblu"
      className={cn("stagger relative flex flex-col overflow-hidden rounded-lg bg-ink p-5 text-white shadow-lg sm:p-6", className)}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Strălucire discretă în colțuri, ca în panourile întunecate moderne. */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -left-20 size-64 rounded-full bg-accent/35 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-24 size-56 rounded-full bg-cat-teal/20 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <h2 id="ansamblu" className="flex items-center gap-2 text-sm font-semibold text-white/85">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <LibraryBig className="size-4" aria-hidden="true" />
          </span>
          Biblioteca ta
        </h2>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/10 tabular">
          {countLabel(totals.subjects, "materie", "materii")}
        </span>
      </div>

      <div className="relative mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <RingStack
          rings={metrics.map((m) => ({ share: m.share, color: m.color }))}
          label={metrics.map((m) => `${m.label}: ${m.share === null ? "fără date" : `${percent(m.share)}%`}`).join("; ")}
        />
        <ul className="flex w-full min-w-0 flex-col gap-4">
          {metrics.map((m, i) => (
            <li key={m.label} className="animate-rise-in" style={{ animationDelay: `${220 + i * 90}ms` }}>
              <p className="flex items-baseline gap-2">
                <span className={cn("size-2.5 shrink-0 self-center rounded-full", m.dot)} aria-hidden="true" />
                <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] tabular">
                  {m.share === null ? "—" : `${percent(m.share)}%`}
                </span>
                <span className="truncate text-[12px] font-medium text-white/60 tabular">{m.detail}</span>
              </p>
              <p className="mt-1 pl-[1.125rem] text-[13px] text-white/75">{m.label}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-auto flex items-center gap-2 pt-5 text-[12px] leading-5 text-white/70">
        <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
        {totals.readyPages > 0 ? "Asistentul explică din aceste pagini, cu numărul paginii." : "Încarcă un PDF cu text ca asistentul să-l poată citi."}
      </p>
    </section>
  );
}

/** Statistică cu mini-grafic (ultimele 8 săptămâni) și eticheta de trend față de săptămâna trecută. */
export function SparkStat({
  id,
  title,
  total,
  weeks,
  color,
  index,
  className,
}: {
  id: string;
  title: string;
  total: number;
  weeks: WeekBucket[];
  color: "accent" | "teal";
  index: number;
  className?: string;
}) {
  const trend = weekTrend(weeks);
  const thisWeek = weeks[weeks.length - 1]?.count ?? 0;
  return (
    <Panel index={index} className={cn("gap-3 overflow-hidden", className)} aria-labelledby={`${id}-titlu`}>
      <div className="flex items-start justify-between gap-2">
        <h2 id={`${id}-titlu`} className="text-[13px] font-semibold text-ink-muted">
          {title}
        </h2>
        <TrendBadge value={trend} />
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[30px] leading-none font-extrabold tracking-[-0.04em] text-ink tabular sm:text-[34px]">{total}</span>
        <span className="text-[12px] font-medium text-ink-muted tabular">+{thisWeek} săpt. aceasta</span>
      </p>
      <AreaChart
        id={id}
        values={weeks.map((w) => w.count)}
        color={color}
        height={56}
        fill
        className="-mx-5 -mb-5"
        label={`${title}: ${weeks.map((w) => w.count).join(", ")} în ultimele ${weeks.length} săptămâni`}
      />
    </Panel>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">la fel</span>;
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular",
        up ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
      )}
      title="Față de săptămâna trecută"
    >
      <Icon className="size-3" aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(value)}
      <span className="sr-only"> față de săptămâna trecută</span>
    </span>
  );
}

/** Graficul mare: ce ai adăugat (materiale + notițe) în fiecare din ultimele 8 săptămâni. */
export function ActivityPanel({
  weeks,
  labels,
  index,
  className,
}: {
  weeks: WeekBucket[];
  /** Eticheta fiecărei săptămâni („12 oct.”), calculată pe server. */
  labels: string[];
  index: number;
  className?: string;
}) {
  const values = weeks.map((w) => w.count);
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values, 0);
  const thisWeek = values[values.length - 1] ?? 0;
  return (
    <Panel index={index} className={cn("gap-5", className)} aria-labelledby="activitate">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHeader id="activitate" title="Activitate" description="Materiale și notițe adăugate, pe săptămâni" />
        <div className="text-right">
          <p className="text-[26px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular">{total}</p>
          <p className="mt-1 text-[12px] text-ink-muted">în ultimele {weeks.length} săptămâni</p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col">
        {/* Linii de ghidaj discrete: maxim, jumătate, zero. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[max, max / 2, 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-right text-[11px] text-ink-faint tabular">{Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")}</span>
              <span className="h-px flex-1 border-t border-dashed border-line" />
            </div>
          ))}
        </div>
        <div className="relative flex flex-1 flex-col pl-7">
          <AreaChart
            id="activitate-grafic"
            values={values}
            height={150}
            fill
            label={`Activitate: ${values.join(", ")} pe săptămână, de la cea mai veche la cea curentă`}
          />
          {/* Bula cu valoarea săptămânii curente. */}
          <span className="absolute top-0 left-9 animate-pop-in rounded-md border border-line bg-surface px-2.5 py-1.5 shadow-md [animation-delay:700ms]">
            <span className="block text-[11px] font-medium text-ink-muted">Săptămâna aceasta</span>
            <span className="block text-[15px] leading-tight font-bold text-ink tabular">{thisWeek}</span>
          </span>
        </div>
      </div>

      <ol className="flex justify-between pl-7 text-[11px] font-medium text-ink-faint tabular" aria-hidden="true">
        {labels.map((l, i) => (
          <li key={weeks[i]?.weekKey ?? i} className={cn(i % 2 === 1 && "hidden sm:block")}>
            {l}
          </li>
        ))}
      </ol>
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
const RECENT_PILL = {
  pdf: { label: "PDF", className: "bg-accent-soft text-accent-ink" },
  image: { label: "Poză", className: "bg-cat-teal/10 text-cat-teal" },
  note: { label: "Notiță", className: "bg-cat-amber/10 text-cat-amber" },
} as const;

/** „Adăugate recent”, ca o listă de noutăți: fâșie în culoarea materiei, eticheta tipului, titlu și momentul. */
export function RecentPanel({ items, index, className }: { items: Array<RecentItem & { label: string }>; index: number; className?: string }) {
  return (
    <Panel index={index} aria-labelledby="recente" className={className}>
      <PanelHeader id="recente" title="Adăugate recent" description="Ultimele materiale și notițe" />
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, i) => {
            const Icon = RECENT_ICON[item.kind];
            const pill = RECENT_PILL[item.kind];
            return (
              <li key={`${item.kind}-${item.id}`} className="animate-rise-in" style={{ animationDelay: `${150 + i * 70}ms` }}>
                <Link
                  href={item.kind === "note" ? `/materii/${item.subject.id}?tab=notite` : `/materii/${item.subject.id}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-md border border-line/70 bg-surface py-3 pr-3 pl-4 transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-sm"
                >
                  <span aria-hidden="true" className={cn("absolute inset-y-2 left-0 w-1 rounded-r-full", SUBJECT_COLOR_CLASSES[item.subject.color].bar)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase", pill.className)}>
                        <Icon className="size-3" aria-hidden="true" />
                        {pill.label}
                      </span>
                      <span className="truncate text-[11px] text-ink-muted">{item.label}</span>
                    </span>
                    <span className="mt-1 block truncate text-[13px] font-semibold text-ink">{item.title}</span>
                    <span className="block truncate text-[12px] text-ink-muted">{item.subject.name}</span>
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
