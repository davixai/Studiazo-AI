import { ArrowUpRight, BadgeCheck, CalendarDays, Check, Clock3, Sparkles, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { formatDayShort } from "@/lib/time/format";
import { fromLocal } from "@/lib/time/zone";
import { cn } from "@/lib/utils";
import { JOB_DOMAIN_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, jobUrl, type Job } from "../data";

const TYPE_TONE = {
  "part-time": "accent",
  "full-time": "neutral",
  internship: "success",
} as const;

/** Cardul unui anunț real: esențialul la vedere, detaliile la deschidere, linkul direct către anunț. */
export function JobCard({ job, fitsStudy = false, className }: { job: Job; fitsStudy?: boolean; className?: string }) {
  const url = jobUrl(job);
  return (
    <article className={cn("lift flex flex-col rounded-lg border border-line/70 bg-surface p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-sunken font-display text-lg font-bold text-accent-ink"
        >
          {job.company.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-5 font-bold text-ink">
            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-ink hover:underline">
              {job.title}
              <span className="sr-only"> (anunțul se deschide într-o filă nouă)</span>
            </a>
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {job.company}
            {job.place ? <span className="text-ink-muted"> · {job.place}</span> : null}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={TYPE_TONE[job.type]}>{JOB_TYPE_LABELS[job.type]}</Badge>
        {job.mode ? <Badge>{WORK_MODE_LABELS[job.mode]}</Badge> : null}
        <Badge>{JOB_DOMAIN_LABELS[job.domain]}</Badge>
        {job.forStudents ? <Badge tone="success">Pentru studenți</Badge> : null}
      </div>

      <dl className="mt-4 grid gap-2 text-[13px]">
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Salariu</dt>
          <dd className={job.salary ? "font-semibold text-ink" : "text-ink-muted"}>{job.salary ?? "Salariul nu e publicat în anunț"}</dd>
        </div>
        {job.schedule ? (
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
            <dt className="sr-only">Program</dt>
            <dd className="text-ink-soft">{job.schedule}</dd>
          </div>
        ) : null}
        <div className="flex items-start gap-2">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Experiență</dt>
          <dd className="text-ink-soft">{job.experienceNote}</dd>
        </div>
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Publicat</dt>
          <dd className="text-ink-muted">Publicat pe {formatDayShort(fromLocal(job.postedAt, "12:00"))}</dd>
        </div>
      </dl>

      {fitsStudy ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-accent-soft px-2.5 py-2 text-[12px] leading-5 font-medium text-accent-ink">
          <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
          Legat de facultatea ta
        </p>
      ) : null}

      <details className="group/details mt-3 border-t border-line/60 pt-3">
        <summary className="cursor-pointer list-none text-[13px] font-semibold text-accent hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open/details:hidden">Ce vei face și ce se cere</span>
          <span className="hidden group-open/details:inline">Ascunde detaliile</span>
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-[13px] leading-5 text-ink-soft">
          <p>{job.description}</p>
          <div>
            <p className="mb-1 font-semibold text-ink">Ce se cere</p>
            <ul className="flex flex-col gap-1">
              {job.requirements.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink">Ce oferă</p>
            <ul className="flex flex-col gap-1">
              {job.benefits.map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <div className="mt-auto pt-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "secondary", className: "w-full sm:w-auto" })}>
          Vezi anunțul și aplică <ArrowUpRight aria-hidden="true" />
          <span className="sr-only">(LinkedIn, se deschide într-o filă nouă)</span>
        </a>
      </div>
    </article>
  );
}
