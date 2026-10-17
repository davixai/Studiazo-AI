import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { JOBS } from "../data";
import { formatMonthly, reasonsFor, recommendJobs, type StudentContext } from "../recommend";

/** Trei joburi potrivite pentru student (în Buget, după statistici). */
export function JobRecommendations({ context }: { context: StudentContext }) {
  const jobs = recommendJobs(JOBS, context);
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {jobs.map((job) => {
          const reasons = reasonsFor(job, context);
          return (
            <li key={job.id}>
              <Link href="/joburi" className="lift group flex items-start gap-3 rounded-md border border-line/70 bg-surface-muted/50 p-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-lg">
                  {job.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{job.title}</span>
                  <span className="block text-[12px] font-medium text-ink-soft tabular">{formatMonthly(job.monthly)}</span>
                  {reasons.length ? <span className="mt-0.5 block text-[12px] text-ink-muted">{reasons.join(" · ")}</span> : null}
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/joburi" className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-accent hover:underline">
        Vezi toate joburile <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
