import Link from "next/link";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import type { SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import type { Positioned } from "../layout";

export type GridEvent = { id: string; title: string; time: string; color: SubjectColor; href: string; done: boolean; start: Date; end: Date };
export type GridDeadline = { id: string; title: string; label: string; color: SubjectColor; href: string };
export type GridDay = {
  dateKey: string;
  weekday: string;
  day: string;
  fullLabel: string;
  isToday: boolean;
  events: Positioned<GridEvent>[];
  deadlines: GridDeadline[];
};

type TimeGridProps = {
  days: GridDay[];
  hours: { start: number; end: number };
  /** Minutul curent în ziua de azi (linia „acum”), dacă azi e în grilă. */
  nowMinute: number | null;
};

const HOUR_PX = 52;

/** Vederea pe săptămână sau pe o zi: coloane pe zile, ore pe verticală, termenele deasupra. */
export function TimeGrid({ days, hours, nowMinute }: TimeGridProps) {
  const columns = { gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` };
  const hourList = Array.from({ length: hours.end - hours.start }, (_, i) => hours.start + i);
  const top = (minute: number) => ((minute - hours.start * 60) / 60) * HOUR_PX;
  const hasDeadlines = days.some((d) => d.deadlines.length > 0);

  return (
    <div className="overflow-hidden rounded-lg border border-line/70 bg-surface shadow-sm animate-rise-in">
      <div className="grid border-b border-line" style={columns}>
        <div />
        {days.map((d) => (
          <div key={d.dateKey} className="flex flex-col items-center gap-0.5 py-2.5" aria-label={d.fullLabel}>
            <span className={cn("text-[11px] font-semibold uppercase", d.isToday ? "text-accent" : "text-ink-muted")}>{d.weekday}</span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-[15px] font-bold tabular",
                d.isToday ? "bg-accent text-white shadow-sm" : "text-ink",
              )}
            >
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {hasDeadlines ? (
        <div className="grid border-b border-line bg-surface-muted/50" style={columns}>
          <div className="flex items-start justify-end py-2 pr-2 text-[10px] font-semibold text-ink-faint uppercase">Termen</div>
          {days.map((d) => (
            <ul key={d.dateKey} className="flex min-w-0 flex-col gap-1 border-l border-line px-1 py-1.5">
              {d.deadlines.map((t) => (
                <li key={t.id}>
                  <Link
                    href={t.href}
                    scroll={false}
                    className={cn(
                      "block truncate rounded-[6px] px-1.5 py-1 text-[11px] font-semibold transition-[filter] hover:brightness-95",
                      SUBJECT_COLOR_CLASSES[t.color].soft,
                      SUBJECT_COLOR_CLASSES[t.color].text,
                    )}
                    title={`${t.label}: ${t.title}`}
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : null}

      <div className="grid" style={columns}>
        <div className="relative" style={{ height: hourList.length * HOUR_PX }} aria-hidden="true">
          {hourList.map((h, i) =>
            i === 0 ? null : (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-faint tabular" style={{ top: i * HOUR_PX }}>
                {String(h).padStart(2, "0")}:00
              </span>
            ),
          )}
        </div>
        {days.map((d) => (
          <div key={d.dateKey} className={cn("relative border-l border-line", d.isToday && "bg-accent-soft/30")} style={{ height: hourList.length * HOUR_PX }}>
            {hourList.map((h, i) => (i === 0 ? null : <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }} />))}

            <ul aria-label={d.fullLabel}>
              {d.events.map(({ item, startMin, endMin, lane, lanes }) => {
                const height = Math.max(((endMin - startMin) / 60) * HOUR_PX - 2, 22);
                const color = SUBJECT_COLOR_CLASSES[item.color];
                return (
                  <li
                    key={`${item.id}-${startMin}`}
                    className="absolute px-0.5"
                    style={{ top: top(startMin) + 1, height, left: `${(lane / lanes) * 100}%`, width: `${100 / lanes}%` }}
                  >
                    <Link
                      href={item.href}
                      scroll={false}
                      className={cn(
                        "relative flex h-full flex-col overflow-hidden rounded-md py-1 pr-1.5 pl-2.5 transition-[filter,transform] hover:brightness-95 active:scale-[0.98]",
                        color.soft,
                        item.done && "opacity-55",
                      )}
                    >
                      <span className={cn("absolute inset-y-1 left-1 w-[3px] rounded-full", color.bar)} aria-hidden="true" />
                      <span className={cn("truncate text-[12px] leading-4 font-semibold text-ink", item.done && "line-through")}>{item.title}</span>
                      {height > 34 ? <span className="truncate text-[11px] leading-4 text-ink-muted tabular">{item.time}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {d.isToday && nowMinute !== null && nowMinute >= hours.start * 60 && nowMinute <= hours.end * 60 ? (
              <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: top(nowMinute) }} aria-hidden="true">
                <span className="-ml-1 size-2 rounded-full bg-danger" />
                <span className="h-0.5 flex-1 bg-danger" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
