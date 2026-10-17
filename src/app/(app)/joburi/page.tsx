import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { currentMonth, getFinance } from "@/features/finance/queries";
import { extraIncomeNeeded, summarize } from "@/features/finance/stats";
import { JobBoard } from "@/features/jobs/components/job-board";
import { SALARY_CHECKED_AT } from "@/features/jobs/data";
import { getProfile } from "@/features/profile/queries";
import { formatDateLong } from "@/lib/time/format";
import { fromLocal } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Joburi" };

export default async function JobsPage() {
  const [profile, finance] = await Promise.all([getProfile(), getFinance(currentMonth())]);
  const study = [profile?.faculty, profile?.specialization].filter(Boolean).join(" ") || null;
  const monthlyGap = finance.available && finance.entries.length ? extraIncomeNeeded(summarize(finance.entries)) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Joburi pentru studenți"
        description="Joburi full-time, part-time, internshipuri și freelance potrivite pentru studenții din Iași, cu câștigul estimat, programul și ce se cere. Le ordonăm după ce se potrivește cu facultatea și bugetul tău."
      />
      <JobBoard context={{ study, monthlyGap }} />
      <p className="text-[12px] leading-5 text-ink-faint">
        Câștigurile sunt estimări orientative (net, lei), actualizate la {formatDateLong(fromLocal(SALARY_CHECKED_AT, "12:00"))}. Anunțurile reale și
        salariile exacte le găsești prin butoanele „Caută pe…” din fiecare card.
      </p>
    </div>
  );
}
