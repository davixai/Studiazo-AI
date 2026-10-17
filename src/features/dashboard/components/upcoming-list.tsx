import { BookOpenText, ClipboardList, FolderKanban, GraduationCap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { TASK_KIND_COLOR } from "@/components/ui/category";
import { IconBadge } from "@/components/ui/icon-badge";
import { TASK_KIND_LABELS, type Subject, type Task, type TaskKind } from "@/lib/contracts/domain";
import { formatDayShort, formatRelativeDay, formatTime } from "@/lib/time/format";
import { daysBetween, toDateKey } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<TaskKind, LucideIcon> = {
  tema: ClipboardList,
  proiect: FolderKanban,
  examen: GraduationCap,
  colocviu: GraduationCap,
  test: BookOpenText,
  altul: ClipboardList,
};

type UpcomingListProps = { items: Array<{ task: Task; subject: Subject | null }>; now: Date };

export function UpcomingList({ items, now }: UpcomingListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(({ task, subject }) => {
        const due = new Date(task.dueAt);
        const days = daysBetween(toDateKey(now), toDateKey(due));
        const tone = days <= 1 ? "danger" : days <= 7 ? "warning" : "neutral";
        return (
          <li key={task.id}>
            <Link
              href={`/calendar?termen=${task.id}`}
              className="flex items-center gap-3 rounded-md border border-line/70 p-3 transition-[background-color,transform] duration-150 hover:bg-surface-muted/60 active:scale-[0.99]"
            >
            <IconBadge icon={KIND_ICON[task.kind]} color={subject?.color ?? TASK_KIND_COLOR[task.kind]} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {TASK_KIND_LABELS[task.kind]}
                {subject ? ` · ${subject.name}` : ""} · {formatDayShort(due)}, {formatTime(due)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
                tone === "danger" && "bg-danger-soft text-danger",
                tone === "warning" && "bg-warning-soft text-warning",
                tone === "neutral" && "bg-surface-muted text-ink-soft",
              )}
            >
              {formatRelativeDay(due, now)}
            </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
