import type { Job, JobArea, JobDomain, JobType, WorkMode } from "./data";

// Filtrarea și recomandările de joburi. Funcții pure, testate în jobs.test.ts.

export type JobFilters = {
  query: string;
  /** În Iași, lângă Iași sau remote. */
  areas: JobArea[];
  types: JobType[];
  domains: JobDomain[];
  modes: WorkMode[];
  /** Doar anunțuri adresate studenților. */
  studentsOnly: boolean;
  /** Doar joburi fără experiență cerută. */
  noExperience: boolean;
  sort: "potrivire" | "recente";
};

export const DEFAULT_FILTERS: JobFilters = {
  query: "",
  areas: [],
  types: [],
  domains: [],
  modes: [],
  studentsOnly: false,
  noExperience: false,
  sort: "potrivire",
};

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesFilters(job: Job, f: JobFilters) {
  if (f.areas.length && !f.areas.includes(job.area)) return false;
  if (f.types.length && !f.types.includes(job.type)) return false;
  if (f.domains.length && !f.domains.includes(job.domain)) return false;
  if (f.modes.length && (!job.mode || !f.modes.includes(job.mode))) return false;
  if (f.studentsOnly && !job.forStudents) return false;
  if (f.noExperience && !job.noExperience) return false;
  const q = normalize(f.query.trim());
  if (q && !normalize(`${job.title} ${job.company} ${job.place ?? ""} ${job.description} ${job.requirements.join(" ")}`).includes(q)) return false;
  return true;
}

export type StudentContext = {
  /** Facultatea și specializarea, pentru joburile legate de studii. */
  study?: string | null;
  /** Câți lei în plus pe lună ar avea nevoie (din Buget); 0 sau null = necunoscut. */
  monthlyGap?: number | null;
};

/** Joburile care se potrivesc cu facultatea studentului (după cuvintele din `fits`). */
export function fitsStudy(job: Job, study?: string | null) {
  if (!study) return false;
  const s = normalize(study);
  return job.fits.some((word) => s.includes(normalize(word)));
}

/** Scor de potrivire: legat de facultate, pentru studenți, fără experiență, program care merge cu cursurile. */
export function scoreJob(job: Job, ctx: StudentContext) {
  let score = 0;
  if (fitsStudy(job, ctx.study)) score += 4;
  if (job.forStudents) score += 3;
  if (job.noExperience) score += 2;
  if (job.type === "part-time") score += (ctx.monthlyGap ?? 0) > 0 ? 2 : 1;
  // Full-time-ul se potrivește greu cu semestrul.
  if (job.type === "full-time") score -= 1;
  return score;
}

export function sortJobs(jobs: Job[], f: JobFilters, ctx: StudentContext) {
  const list = [...jobs];
  if (f.sort === "recente") return list.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return list.sort((a, b) => scoreJob(b, ctx) - scoreJob(a, ctx) || b.postedAt.localeCompare(a.postedAt));
}

/** De ce recomandăm jobul (afișat pe card). */
export function reasonsFor(job: Job, ctx: StudentContext) {
  const reasons: string[] = [];
  if (fitsStudy(job, ctx.study)) reasons.push("legat de facultatea ta");
  if (job.forStudents) reasons.push("pentru studenți");
  if (job.noExperience) reasons.push("fără experiență cerută");
  return reasons.slice(0, 3);
}

export function recommendJobs(jobs: Job[], ctx: StudentContext, count = 3) {
  return sortJobs(jobs, DEFAULT_FILTERS, ctx).slice(0, count);
}
