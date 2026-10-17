import { TASK_KIND_COLOR, ColorDot } from "@/components/ui/category";
import { TASK_KIND_LABELS, type Subject, type Task } from "@/lib/contracts/domain";
import { formatDayShort, formatRelativeDay, formatTime } from "@/lib/time/format";
import { daysBetween, toDateKey } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

type UpcomingListProps = { items: Array<{ task: Task; subject: Subject | null }>; now: Date };

export function UpcomingList({ items, now }: UpcomingListProps) {
  return (
    <ul className="divide-y divide-line">
      {items.map(({ task, subject }) => {
        const due = new Date(task.dueAt);
        const days = daysBetween(toDateKey(now), toDateKey(due));
        const urgent = days <= 2;
        const isExam = ["examen", "colocviu", "test"].includes(task.kind);
        return (
          <li key={task.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
            <ColorDot color={subject?.color ?? TASK_KIND_COLOR[task.kind]} className="mt-[7px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{task.title}</p>
              <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                {TASK_KIND_LABELS[task.kind]}
                {subject ? ` · ${subject.name}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  urgent ? "text-danger" : isExam && days <= 7 ? "text-warning" : "text-ink",
                )}
              >
                {formatRelativeDay(due, now)}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted tabular">
                {formatDayShort(due)}, {formatTime(due)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
