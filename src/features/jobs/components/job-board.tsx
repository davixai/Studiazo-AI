"use client";

import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { countLabel } from "@/features/subjects/format";
import { cn } from "@/lib/utils";
import { JOB_DOMAINS, JOB_DOMAIN_LABELS, JOB_TYPES, JOB_TYPE_LABELS, JOBS, WORK_MODE_LABELS, type WorkMode } from "../data";
import { DEFAULT_FILTERS, fitsStudy, matchesFilters, sortJobs, type JobFilters, type StudentContext } from "../recommend";
import { JobCard } from "./job-card";

// Doar modurile care apar în anunțuri, ca un filtru să nu ducă la o listă goală.
const MODES = (Object.keys(WORK_MODE_LABELS) as WorkMode[]).filter((m) => JOBS.some((j) => j.mode === m));

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Anunțurile reale cu filtre: tip, domeniu, mod de lucru, pentru studenți, experiență. */
export function JobBoard({ context }: { context: StudentContext }) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const set = (patch: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const jobs = useMemo(() => sortJobs(JOBS.filter((j) => matchesFilters(j, filters)), filters, context), [filters, context]);
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <aside aria-label="Filtre" className="flex flex-col gap-5 rounded-lg border border-line/70 bg-surface p-4 shadow-sm lg:sticky lg:top-6 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <Input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Caută (ex. germană, IT)"
            aria-label="Caută joburi"
            className="pl-9"
          />
        </div>

        <ChipGroup legend="Tip de job">
          {JOB_TYPES.map((t) => (
            <Chip key={t} active={filters.types.includes(t)} onClick={() => set({ types: toggle(filters.types, t) })}>
              {JOB_TYPE_LABELS[t]}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup legend="Mod de lucru">
          {MODES.map((m) => (
            <Chip key={m} active={filters.modes.includes(m)} onClick={() => set({ modes: toggle(filters.modes, m) })}>
              {WORK_MODE_LABELS[m]}
            </Chip>
          ))}
        </ChipGroup>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Domeniu
          <Select value={filters.domains[0] ?? ""} onChange={(e) => set({ domains: e.target.value ? [e.target.value as JobFilters["domains"][number]] : [] })}>
            <option value="">Toate domeniile</option>
            {JOB_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {JOB_DOMAIN_LABELS[d]}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex flex-col gap-2.5">
          <Check label="Doar anunțuri pentru studenți" checked={filters.studentsOnly} onChange={(v) => set({ studentsOnly: v })} />
          <Check label="Fără experiență cerută" checked={filters.noExperience} onChange={(v) => set({ noExperience: v })} />
        </div>

        {dirty ? (
          <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)} className="self-start">
            <RotateCcw aria-hidden="true" /> Resetează filtrele
          </Button>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm font-medium text-ink-soft">
            {countLabel(jobs.length, "anunț găsit", "anunțuri găsite")}
          </p>
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            Ordonează
            <Select value={filters.sort} onChange={(e) => set({ sort: e.target.value as JobFilters["sort"] })} className="h-9 w-auto text-[13px] sm:h-9">
              <option value="potrivire">Potrivite pentru mine</option>
              <option value="recente">Cele mai noi</option>
            </Select>
          </label>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong p-8 text-center text-sm text-ink-muted">
            Niciun job nu se potrivește cu toate filtrele. Încearcă să scoți câteva.
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {jobs.map((job, i) => (
              <li key={job.id} className="stagger" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                <JobCard job={job} fitsStudy={fitsStudy(job, context.study)} className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChipGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-[12px] font-semibold transition-colors",
        active ? "border-accent bg-accent-soft text-accent-ink" : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-accent" />
      {label}
    </label>
  );
}
