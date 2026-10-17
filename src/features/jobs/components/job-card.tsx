import { ArrowUpRight, Check, Clock3, MapPin, Sparkles, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXPERIENCE_LABELS, JOB_DOMAIN_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, searchLinks, type Job } from "../data";
import { formatMonthly } from "../recommend";

const TYPE_TONE = {
  "part-time": "accent",
  "full-time": "neutral",
  internship: "success",
  freelance: "warning",
  sezonier: "neutral",
} as const;

/** Cardul unui job: esențialul la vedere, detaliile (cerințe, avantaje, unde cauți) la deschidere. */
export function JobCard({ job, reasons = [], className }: { job: Job; reasons?: string[]; className?: string }) {
  return (
    <article className={cn("lift flex flex-col rounded-lg border border-line/70 bg-surface p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-xl">
          {job.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-5 font-bold text-ink">{job.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={TYPE_TONE[job.type]}>{JOB_TYPE_LABELS[job.type]}</Badge>
            <Badge>{JOB_DOMAIN_LABELS[job.domain]}</Badge>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-[13px]">
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Câștig estimat</dt>
          <dd>
            <span className="font-semibold text-ink tabular">{formatMonthly(job.monthly)}</span>
            <span className="block text-[12px] text-ink-muted">{job.rate}</span>
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Program</dt>
          <dd className="text-ink-soft">
            {job.hoursPerWeek[0] === job.hoursPerWeek[1] ? job.hoursPerWeek[0] : `${job.hoursPerWeek[0]}–${job.hoursPerWeek[1]}`} ore/săpt. · {job.schedule}
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <dt className="sr-only">Mod de lucru și experiență</dt>
          <dd className="text-ink-soft">
            {WORK_MODE_LABELS[job.mode]} · {EXPERIENCE_LABELS[job.experience]}
          </dd>
        </div>
      </dl>

      {reasons.length > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-md bg-accent-soft px-2.5 py-2 text-[12px] leading-5 font-medium text-accent-ink">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="sr-only">Recomandat: </span>
            {reasons.join(" · ")}
          </span>
        </p>
      ) : null}

      <details className="group/details mt-3 border-t border-line/60 pt-3">
        <summary className="cursor-pointer list-none text-[13px] font-semibold text-accent hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open/details:hidden">Vezi detaliile</span>
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
            <p className="mb-1 font-semibold text-ink">Avantaje</p>
            <ul className="flex flex-col gap-1">
              {job.benefits.map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <p>
            <span className="font-semibold text-ink">Unde găsești: </span>
            {job.whereToFind}
          </p>
          <div className="flex flex-wrap gap-2">
            {searchLinks(job).map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-ink-faint hover:bg-surface-muted"
              >
                Caută pe {l.label} <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}
