import { Check, MapPin } from "lucide-react";
import Link from "next/link";
import { EVENT_KIND_COLOR, SUBJECT_COLOR_CLASSES, TASK_KIND_COLOR } from "@/components/ui/category";
import { EVENT_KIND_LABELS, TASK_KIND_LABELS, type AgendaItem, type SubjectColor } from "@/lib/contracts/domain";
import { formatTime, formatTimeRange } from "@/lib/time/format";
import { cn } from "@/lib/utils";

type AgendaRowProps = {
  item: AgendaItem;
  now: Date;
  /** Când e dat, rândul se deschide la apăsare (ex. editarea activității). */
  href?: string;
};

const PILL: Record<SubjectColor, string> = {
  blue: "bg-cat-blue/10 text-cat-blue",
  teal: "bg-cat-teal/10 text-cat-teal",
  green: "bg-cat-green/10 text-cat-green",
  amber: "bg-cat-amber/12 text-cat-amber",
  rose: "bg-cat-rose/10 text-cat-rose",
  violet: "bg-cat-violet/10 text-cat-violet",
  slate: "bg-cat-slate/10 text-cat-slate",
};

/** Un rând din agendă: oră, punct pe cronologie, titlu și loc, eticheta tipului în dreapta. */
export function AgendaRow({ item, now, href }: AgendaRowProps) {
  const view = describe(item);
  const color = item.subject?.color ?? view.fallbackColor;
  const isNow = view.start <= now && now < view.end;
  const isPast = view.end <= now;
  const done = item.type === "event" && Boolean(item.occurrence.event.completedAt);
  const rowClass = cn("relative flex gap-3 py-3.5 sm:gap-4", (isPast || done) && "opacity-55");

  const content = (
    <>
      <div className="w-[50px] shrink-0 pt-0.5">
        <p className="text-[13px] font-semibold text-ink tabular">{formatTime(view.start)}</p>
        {view.showEnd ? <p className="mt-0.5 text-xs text-ink-faint tabular">{formatTime(view.end)}</p> : null}
      </div>
      <div className="relative flex w-3 shrink-0 justify-center pt-1.5" aria-hidden="true">
        <span
          className={cn(
            "relative z-10 size-2.5 rounded-full ring-4 ring-surface",
            SUBJECT_COLOR_CLASSES[color].dot,
            isNow && "ring-accent-soft",
          )}
        />
        <span className="absolute top-4 -bottom-4 w-px bg-line group-last:hidden" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold text-ink", done && "line-through decoration-ink-faint")}>{view.title}</p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[13px] text-ink-muted">
          {view.location ? (
            <>
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{view.location}</span>
            </>
          ) : (
            <span className="truncate">{item.subject && item.subject.name !== view.title ? item.subject.name : view.kindLabel}</span>
          )}
        </p>
        <span className="sr-only">
          {view.showEnd ? formatTimeRange(view.start, view.end) : `termen la ${formatTime(view.start)}`}
          {done ? ", finalizată" : ""}
        </span>
      </div>
      <div className="shrink-0 pt-0.5">
        {isNow && !done ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            Acum
          </span>
        ) : done ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
            <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            Gata
          </span>
        ) : (
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", PILL[color])}>{view.kindLabel}</span>
        )}
      </div>
    </>
  );

  return (
    <li className="group relative">
      {href ? (
        <Link
          href={href}
          scroll={false}
          className={cn(
            rowClass,
            "-mx-2 rounded-md px-2 transition-[background-color,transform] duration-150 hover:bg-surface-muted active:scale-[0.99] sm:-mx-3 sm:px-3",
          )}
        >
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}

function describe(item: AgendaItem) {
  if (item.type === "event") {
    const { event, start, end } = item.occurrence;
    return {
      title: event.title,
      kindLabel: EVENT_KIND_LABELS[event.kind],
      location: event.location,
      start,
      end,
      showEnd: true,
      fallbackColor: EVENT_KIND_COLOR[event.kind],
    };
  }
  const due = new Date(item.task.dueAt);
  const end = item.task.durationMinutes ? new Date(due.getTime() + item.task.durationMinutes * 60_000) : due;
  return {
    title: item.task.title,
    kindLabel: TASK_KIND_LABELS[item.task.kind],
    location: item.task.location,
    start: due,
    end,
    showEnd: Boolean(item.task.durationMinutes),
    fallbackColor: TASK_KIND_COLOR[item.task.kind],
  };
}
