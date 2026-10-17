import { ChevronLeft, ChevronRight, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { AdvicePanel } from "@/features/finance/components/advice-panel";
import { CategoryBars, RuleMeter, TrendChart } from "@/features/finance/components/charts";
import { CopyPreviousMonth, EntryList } from "@/features/finance/components/entry-list";
import { EntryForm } from "@/features/finance/components/entry-form";
import { currentMonth, getFinance } from "@/features/finance/queries";
import { extraIncomeNeeded, formatLei, formatPercent, isMonthKey, monthLabel, shiftMonth, summarize, trend } from "@/features/finance/stats";
import { JobRecommendations } from "@/features/jobs/components/job-recommendations";
import { getProfile } from "@/features/profile/queries";
import { getAiStatus } from "@/lib/ai/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buget" };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function BudgetPage({ searchParams }: PageProps<"/buget">) {
  const { luna } = await searchParams;
  const thisMonth = currentMonth();
  const month = isMonthKey(luna) && luna <= thisMonth ? luna : thisMonth;
  const [data, profile] = await Promise.all([getFinance(month), getProfile()]);

  const header = (
    <PageHeader
      title="Buget"
      description="Notează ce intră și ce iese în fiecare lună. Vezi unde se duc banii și primești sfaturi de la AI, pe cifrele tale."
      actions={<MonthSwitcher month={month} thisMonth={thisMonth} />}
    />
  );

  if (!data.available) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Alert tone="warning" title={data.reason === "migration" ? "Bugetul nu este încă activat" : "Nu am putut încărca bugetul"}>
          {data.reason === "migration"
            ? "Baza de date nu are încă tabelul pentru buget. Aplică migrația supabase/migrations/20261017205000_finance.sql (SQL Editor → Run) și reîncarcă pagina."
            : "Reîncarcă pagina peste câteva momente."}
        </Alert>
      </div>
    );
  }

  const summary = summarize(data.entries);
  const points = trend(data.history, month);
  const gap = extraIncomeNeeded(summary);
  const hasData = data.entries.length > 0;
  const study = [profile?.faculty, profile?.specialization].filter(Boolean).join(" ") || null;

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {header}

      <section aria-label="Rezumatul lunii" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile index={1} label="Venituri" value={formatLei(summary.income)} sub={`${summary.incomeByCategory.length} surse`} icon={TrendingUp} color="teal" />
        <StatTile
          index={2}
          label="Cheltuieli"
          value={formatLei(summary.expenses)}
          sub={summary.expensesByCategory[0] ? `Cel mai mult: ${summary.expensesByCategory[0].label}` : "Nimic încă"}
          icon={TrendingDown}
          color="violet"
        />
        <StatTile
          index={3}
          label="Rămân"
          value={formatLei(summary.balance)}
          sub={summary.balance < 0 ? "Cheltui mai mult decât câștigi" : "Venituri minus cheltuieli"}
          icon={Wallet}
          color={summary.balance < 0 ? "rose" : "blue"}
        />
        <StatTile
          index={4}
          label="Economisești"
          value={summary.savingsRate === null ? "—" : formatPercent(Math.max(0, summary.savingsRate))}
          sub="Ținta: 20% din venit"
          icon={PiggyBank}
          color="amber"
        />
      </section>

      <AdvicePanel month={month} hasData={hasData} aiAvailable={getAiStatus().available} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5 lg:gap-7">
          <Card aria-labelledby="adauga" className="stagger" style={delay(4)}>
            <CardHeader id="adauga" title="Adaugă" description={`În ${monthLabel(month)}`} />
            <CardBody>
              <EntryForm month={month} />
            </CardBody>
          </Card>

          <Card aria-labelledby="inregistrari" className="stagger" style={delay(5)}>
            <CardHeader id="inregistrari" title="Înregistrările lunii" />
            <CardBody className="pt-2">
              {hasData ? (
                <EntryList entries={data.entries} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="text-sm text-ink-muted">Nicio înregistrare în {monthLabel(month)}.</p>
                  <CopyPreviousMonth month={month} />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:gap-7">
          <Card aria-labelledby="unde-se-duc" className="stagger" style={delay(5)}>
            <CardHeader id="unde-se-duc" title="Unde se duc banii" description="Cheltuielile lunii, pe categorii" />
            <CardBody>
              {summary.expensesByCategory.length ? (
                <CategoryBars items={summary.expensesByCategory} />
              ) : (
                <p className="text-sm text-ink-muted">Adaugă cheltuieli ca să vezi împărțirea pe categorii.</p>
              )}
            </CardBody>
          </Card>

          {summary.rule ? (
            <Card aria-labelledby="regula" className="stagger" style={delay(6)}>
              <CardHeader id="regula" title="Regula 50/30/20" description="Cât din venit merge pe nevoi, pe dorințe și cât economisești" />
              <CardBody>
                <RuleMeter rule={summary.rule} />
              </CardBody>
            </Card>
          ) : null}

          <Card aria-labelledby="evolutie" className="stagger" style={delay(7)}>
            <CardHeader id="evolutie" title="Ultimele 6 luni" description="Venituri și cheltuieli pe lună" />
            <CardBody className="pt-5">
              <TrendChart points={points} month={month} />
            </CardBody>
          </Card>

          <Card aria-labelledby="joburi-potrivite" className="stagger" style={delay(8)}>
            <CardHeader
              id="joburi-potrivite"
              title="Un venit în plus?"
              description={
                gap > 0
                  ? `Ca să ajungi la 20% economii îți mai trebuie aproximativ ${formatLei(gap)} pe lună. Joburi potrivite pentru un student:`
                  : "Bugetul tău arată bine. Dacă vrei să economisești mai mult, iată joburi care merg cu facultatea:"
              }
            />
            <CardBody>
              <JobRecommendations context={{ study, monthlyGap: gap }} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MonthSwitcher({ month, thisMonth }: { month: string; thisMonth: string }) {
  const atLatest = month >= thisMonth;
  const link = "flex size-10 items-center justify-center rounded-md border border-line-strong bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink";
  return (
    <nav aria-label="Alege luna" className="flex items-center gap-2">
      <Link href={`/buget?luna=${shiftMonth(month, -1)}`} className={link} aria-label="Luna anterioară">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>
      <p className="min-w-36 text-center text-[15px] font-semibold text-ink" aria-live="polite">
        {monthLabel(month)}
      </p>
      {atLatest ? (
        <span className={cn(link, "pointer-events-none opacity-40")} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      ) : (
        <Link href={`/buget?luna=${shiftMonth(month, 1)}`} className={link} aria-label="Luna următoare">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
