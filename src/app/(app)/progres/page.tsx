import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BadgesGrid } from "@/features/progress/components/badges";
import { LearningChart } from "@/features/progress/components/learning-chart";
import { StreakCard } from "@/features/progress/components/streak";
import { getLearningStats } from "@/features/progress/queries";
import { RecentAttempts } from "@/features/quizzes/components/recent-attempts";
import { getRecentAttempts } from "@/features/quizzes/queries";
import { listSubjects } from "@/features/subjects/queries";
import { formatDuration } from "@/lib/time/format";

export const metadata: Metadata = { title: "Progres" };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Tot ce ține de progres, într-un singur loc: streak-ul, insignele, timpul de învățare și testele rezolvate.
export default async function ProgressPage() {
  const [stats, attempts, subjects] = await Promise.all([getLearningStats(), getRecentAttempts(8), listSubjects()]);
  const now = new Date();

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <PageHeader title="Progres" description="Streak-ul, insignele, cât ai învățat și cum ți-a mers la teste. Totul din activitatea ta reală." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
        <div className="lg:col-span-5">
          <StreakCard stats={stats} index={1} />
        </div>

        <Card aria-labelledby="insigne" className="stagger lg:col-span-7" style={delay(2)}>
          <CardHeader id="insigne" title="Insigne de etapă" description="Învață puțin în fiecare zi ca să-ți crești streak-ul și să deblochezi insigne." />
          <CardBody>
            <BadgesGrid stats={stats} detailed />
          </CardBody>
        </Card>

        <Card aria-labelledby="timp-invatare" className="stagger lg:col-span-7" style={delay(3)}>
          <CardHeader
            id="timp-invatare"
            title="Timp de învățare"
            description="Ultimele 7 zile"
            action={<span className="text-lg font-bold tracking-[-0.02em] text-ink tabular">{formatDuration(stats.weekMinutes)}</span>}
          />
          <CardBody className="pt-6">
            <LearningChart stats={stats} />
          </CardBody>
        </Card>

        <Card aria-labelledby="progres-recent" className="stagger lg:col-span-5" style={delay(4)}>
          <CardHeader id="progres-recent" title="Progres recent" description="Ultimele teste grilă rezolvate" />
          <CardBody>
            <RecentAttempts attempts={attempts} subjects={subjects} now={now} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
