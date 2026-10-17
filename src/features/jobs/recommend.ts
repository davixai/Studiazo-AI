import type { Experience, Job, JobDomain, JobType, WorkMode } from "./data";

// Filtrarea și recomandările de joburi. Funcții pure, testate în jobs.test.ts.

export type JobFilters = {
  query: string;
  types: JobType[];
  domains: JobDomain[];
  modes: WorkMode[];
  /** Câștig lunar minim dorit (lei net); 0 = oricât. */
  minMonthly: number;
  /** Doar joburi cu program care se potrivește cu cursurile. */
  flexibleOnly: boolean;
  /** Doar joburi fără experiență cerută. */
  noExperience: boolean;
  sort: "potrivire" | "salariu";
};

export const DEFAULT_FILTERS: JobFilters = {
  query: "",
  types: [],
  domains: [],
  modes: [],
  minMonthly: 0,
  flexibleOnly: false,
  noExperience: false,
  sort: "potrivire",
};

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesFilters(job: Job, f: JobFilters) {
  if (f.types.length && !f.types.includes(job.type)) return false;
  if (f.domains.length && !f.domains.includes(job.domain)) return false;
  if (f.modes.length && !f.modes.includes(job.mode)) return false;
  if (f.minMonthly > 0 && job.monthly[1] < f.minMonthly) return false;
  if (f.flexibleOnly && !job.flexible) return false;
  if (f.noExperience && job.experience !== "fara") return false;
  const q = normalize(f.query.trim());
  if (q && !normalize(`${job.title} ${job.description} ${job.requirements.join(" ")} ${job.whereToFind}`).includes(q)) return false;
  return true;
}

export type StudentContext = {
  /** Facultatea și specializarea, pentru joburile care contează la CV. */
  study?: string | null;
  /** Câți lei în plus pe lună ar avea nevoie (din Buget); 0 sau null = necunoscut. */
  monthlyGap?: number | null;
};

const EXPERIENCE_SCORE: Record<Experience, number> = { fara: 2, minima: 1, medie: 0 };

/** Joburile care se potrivesc cu facultatea studentului (după cuvintele din `fits`). */
export function fitsStudy(job: Job, study?: string | null) {
  if (!study) return false;
  const s = normalize(study);
  return job.fits.some((word) => s.includes(normalize(word)));
}

/** Scor de potrivire: program compatibil cu cursurile, fără experiență, acoperă necesarul, legat de facultate. */
export function scoreJob(job: Job, ctx: StudentContext) {
  let score = 0;
  if (job.flexible) score += 3;
  score += EXPERIENCE_SCORE[job.experience];
  if (fitsStudy(job, ctx.study)) score += 3;
  const gap = ctx.monthlyGap ?? 0;
  if (gap > 0) {
    if (job.monthly[1] >= gap) score += 2;
    if (job.monthly[0] >= gap) score += 1;
  }
  // Full-time-ul se potrivește greu cu semestrul.
  if (job.type === "full-time") score -= 2;
  return score;
}

export function sortJobs(jobs: Job[], f: JobFilters, ctx: StudentContext) {
  const list = [...jobs];
  if (f.sort === "salariu") return list.sort((a, b) => b.monthly[1] - a.monthly[1] || b.monthly[0] - a.monthly[0]);
  return list.sort((a, b) => scoreJob(b, ctx) - scoreJob(a, ctx) || b.monthly[1] - a.monthly[1]);
}

/** De ce recomandăm jobul (afișat pe card). */
export function reasonsFor(job: Job, ctx: StudentContext) {
  const reasons: string[] = [];
  const gap = ctx.monthlyGap ?? 0;
  if (fitsStudy(job, ctx.study)) reasons.push("legat de facultatea ta");
  // Doar când chiar și câștigul minim acoperă suma, altfel motivul ar apărea pe aproape orice job.
  if (gap > 0 && job.monthly[0] >= gap) reasons.push(`acoperă cei ${Math.round(gap)} lei lipsă`);
  if (job.flexible) reasons.push("program compatibil cu cursurile");
  if (job.experience === "fara") reasons.push("fără experiență");
  return reasons.slice(0, 3);
}

export function recommendJobs(jobs: Job[], ctx: StudentContext, count = 3) {
  return sortJobs(jobs, DEFAULT_FILTERS, ctx).slice(0, count);
}

export function formatMonthly([min, max]: [number, number]) {
  const f = new Intl.NumberFormat("ro-RO");
  return `${f.format(min)}–${f.format(max)} lei/lună`;
}
