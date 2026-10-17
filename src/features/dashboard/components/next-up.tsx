import { ArrowRight, CalendarCheck2, MapPin } from "lucide-react";
import Link from "next/link";
import { EVENT_KIND_LABELS, TASK_KIND_LABELS, type AgendaItem } from "@/lib/contracts/domain";
import { formatTimeRange, formatTime } from "@/lib/time/format";

/** Cardul principal pe mobil: ce urmează azi (sau ce se întâmplă acum). */
export function NextUpCard({ agenda, now }: { agenda: AgendaItem[]; now: Date }) {
  const next = agenda.find((item) => endOf(item) > now);

  return (
    <Link
      href="/calendar"
      className="stagger relative block overflow-hidden rounded-lg bg-linear-to-br from-[#6e5ff2] via-[#5b4be0] to-[#4433c4] p-5 text-white shadow-accent transition-transform active:scale-[0.99]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-white/10" />
      {next ? (
        <NextContent item={next} now={now} />
      ) : (
        <div className="relative flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/15">
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-bold">Ziua e liberă</p>
            <p className="text-[13px] text-white/80">Nu mai ai nimic programat azi.</p>
          </div>
        </div>
      )}
    </Link>
  );
}

function NextContent({ item, now }: { item: AgendaItem; now: Date }) {
  const start = startOf(item);
  const end = endOf(item);
  const isNow = start <= now && now < end;
  const progress = isNow ? (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()) : 0;
  const title = item.type === "event" ? item.occurrence.event.title : item.task.title;
  const kind = item.type === "event" ? EVENT_KIND_LABELS[item.occurrence.event.kind] : TASK_KIND_LABELS[item.task.kind];
  const location = item.type === "event" ? item.occurrence.event.location : item.task.location;
  const minutesUntil = Math.round((start.getTime() - now.getTime()) / 60_000);

  return (
    <div className="relative">
      <p className="text-xs font-semibold text-white/75">{isNow ? "Acum" : minutesUntil < 60 ? `Începe în ${minutesUntil} min` : "Urmează azi"}</p>
      <p className="mt-2 text-lg leading-snug font-bold">{title}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-white/80">
        <span>{kind}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular">{start.getTime() === end.getTime() ? formatTime(start) : formatTimeRange(start, end)}</span>
        {location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {location}
          </span>
        ) : null}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full origin-left animate-fill-x rounded-full bg-white" style={{ width: `${Math.max(progress * 100, isNow ? 4 : 0)}%` }} />
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-white text-accent">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function startOf(item: AgendaItem) {
  return item.type === "event" ? item.occurrence.start : new Date(item.task.dueAt);
}

function endOf(item: AgendaItem) {
  if (item.type === "event") return item.occurrence.end;
  const due = new Date(item.task.dueAt);
  return item.task.durationMinutes ? new Date(due.getTime() + item.task.durationMinutes * 60_000) : due;
}
