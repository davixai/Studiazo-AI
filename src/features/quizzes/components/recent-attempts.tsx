import { ListChecks } from "lucide-react";
import Link from "next/link";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { EmptyState } from "@/components/ui/empty-state";
import type { Subject } from "@/lib/contracts/domain";
import { weakTopics, type QuizAttemptSummary } from "@/lib/contracts/quiz";
import { formatRelativeDay } from "@/lib/time/format";
import { cn } from "@/lib/utils";

type RecentAttemptsProps = { attempts: QuizAttemptSummary[]; subjects: Subject[]; now: Date };

/** „Progres recent” pe Azi: ultimele teste, cu scorul și tema de recapitulat. */
export function RecentAttempts({ attempts, subjects, now }: RecentAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <EmptyState
        compact
        icon={<ListChecks />}
        title="Niciun test rezolvat încă"
        description="Deschide chatul unei materii și apasă „Test grilă”. Vezi aici cum progresezi."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {attempts.map((a, i) => {
        const subject = subjects.find((s) => s.id === a.subjectId);
        const ratio = a.total > 0 ? a.score / a.total : 0;
        const weak = weakTopics(a.topicBreakdown)[0]?.topic;
        return (
          <li key={a.id}>
            <Link
              href={`/asistent/test/${a.quizId}`}
              className="flex flex-col gap-2 rounded-md border border-line/70 p-3 transition-[background-color,transform] duration-150 hover:bg-surface-muted/60 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                {subject ? <span className={cn("size-2 shrink-0 rounded-full", SUBJECT_COLOR_CLASSES[subject.color].dot)} aria-hidden="true" /> : null}
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{a.quizTitle}</p>
                <span className="shrink-0 text-sm font-bold text-ink tabular">
                  {a.score}/{a.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                <div
                  className={cn("h-full origin-left animate-fill-x rounded-full", ratio >= 0.6 ? "bg-success" : "bg-warning")}
                  style={{ width: `${Math.max(ratio * 100, 4)}%`, animationDelay: `${i * 90}ms` }}
                />
              </div>
              <p className="truncate text-xs text-ink-muted first-letter:uppercase">
                {formatRelativeDay(new Date(a.completedAt), now)}
                {subject ? ` · ${subject.name}` : ""}
                {weak ? ` · de recapitulat: ${weak}` : ""}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
