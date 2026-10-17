import { MapPin } from "lucide-react";
import { EVENT_KIND_COLOR, SUBJECT_COLOR_CLASSES, TASK_KIND_COLOR } from "@/components/ui/category";
import { EVENT_KIND_LABELS, TASK_KIND_LABELS, type AgendaItem } from "@/lib/contracts/domain";
import { formatTime, formatTimeRange } from "@/lib/time/format";
import { cn } from "@/lib/utils";

type AgendaRowProps = { item: AgendaItem; now: Date };

/** Un rând din agendă: oră, bară de categorie, titlu, tip și loc. */
export function AgendaRow({ item, now }: AgendaRowProps) {
  const view = describe(item);
  const color = SUBJECT_COLOR_CLASSES[item.subject?.color ?? view.fallbackColor];
  const isNow = view.start <= now && now < view.end;
  const isPast = view.end <= now;

  return (
    <li className={cn("group relative flex gap-4 py-3.5", isPast && "opacity-55")}>
      <div className="w-[52px] shrink-0 pt-0.5 text-right">
        <p className="text-sm font-medium text-ink tabular">{formatTime(view.start)}</p>
        {view.showEnd ? <p className="text-xs text-ink-faint tabular">{formatTime(view.end)}</p> : null}
      </div>
      <span aria-hidden="true" className={cn("w-[3px] shrink-0 rounded-full", color.bar)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-[15px] font-medium text-ink">{view.title}</p>
          {isNow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Acum
            </span>
          ) : null}
        </div>
        {/* Separatorul „·” stă la începutul fiecărui element, ca să nu rămână singur la capăt de rând. */}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink-muted">
          <span>{view.kindLabel}</span>
          {item.subject && item.subject.name !== view.title ? (
            <span className="min-w-0 truncate">
              <span aria-hidden="true">· </span>
              {item.subject.name}
            </span>
          ) : null}
          {view.location ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">·</span>
              <MapPin className="size-3" aria-hidden="true" />
              {view.location}
            </span>
          ) : null}
        </p>
        <span className="sr-only">{view.showEnd ? formatTimeRange(view.start, view.end) : `termen la ${formatTime(view.start)}`}</span>
      </div>
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
    kindLabel: item.task.kind === "examen" ? "Examen" : `${TASK_KIND_LABELS[item.task.kind]} · termen`,
    location: item.task.location,
    start: due,
    end,
    showEnd: Boolean(item.task.durationMinutes),
    fallbackColor: TASK_KIND_COLOR[item.task.kind],
  };
}
