import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { currentMonth, getFinance } from "@/features/finance/queries";
import { extraIncomeNeeded, summarize } from "@/features/finance/stats";
import { JobBoard } from "@/features/jobs/components/job-board";
import { JOBS_CHECKED_AT } from "@/features/jobs/data";
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
        description="Anunțuri reale în Iași, în localitățile de lângă și remote, de acasă: internshipuri, part-time și primele joburi. Apeși pe un anunț și ajungi direct la el, ca să aplici. Le ordonăm după facultatea ta."
      />
      <JobBoard context={{ study, monthlyGap }} />
      <p className="text-[12px] leading-5 text-ink-muted">
        Anunțuri verificate pe {formatDateLong(fromLocal(JOBS_CHECKED_AT, "12:00"))}, cu informațiile din textul fiecărui anunț. Angajatorii pot închide
        un anunț oricând; dacă nu mai primește aplicații, LinkedIn îți arată asta pe pagina lui.
      </p>
    </div>
  );
}
