import { ArrowRight, BookOpenCheck, CalendarCheck2, CalendarClock, Clock3, Flame, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaRow } from "@/features/calendar/components/agenda-row";
import { NextUpCard } from "@/features/dashboard/components/next-up";
import { RecommendedSession, type RecommendedSessionView } from "@/features/dashboard/components/recommended-session";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { UpcomingList } from "@/features/dashboard/components/upcoming-list";
import { getTodayOverview, type TodayOverview } from "@/features/dashboard/queries";
import { getProfile } from "@/features/profile/queries";
import { BadgesGrid } from "@/features/progress/components/badges";
import { LearningChart } from "@/features/progress/components/learning-chart";
import { StreakCard, StreakStrip } from "@/features/progress/components/streak";
import { getLearningStats } from "@/features/progress/queries";
import { RecentAttempts } from "@/features/quizzes/components/recent-attempts";
import { getRecentAttempts } from "@/features/quizzes/queries";
import type { AgendaItem } from "@/lib/contracts/domain";
import { formatDuration, formatRelativeDay, greetingFor } from "@/lib/time/format";
import { daysBetween, toDateKey } from "@/lib/time/zone";
import { MotivationalQuote } from "@/features/dashboard/components/motivational-quote";
import { QUOTES } from "@/features/dashboard/quotes";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = { title: "Azi" };

const EXAM_KINDS = ["examen", "colocviu", "test"];
const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function TodayPage() {
  const [overview, profile, stats, attempts] = await Promise.all([getTodayOverview(), getProfile(), getLearningStats(), getRecentAttempts(3)]);
  const { now, agenda, upcoming } = overview;
  const name = firstName(profile?.fullName ?? "");
  const remaining = agenda.filter((i) => endOf(i) > now).length;
  const nextExam = upcoming.find(({ task }) => EXAM_KINDS.includes(task.kind));
  const dueThisWeek = upcoming.filter(({ task }) => daysBetween(toDateKey(now), toDateKey(new Date(task.dueAt))) <= 7).length;

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <header className="stagger flex flex-col gap-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-surface/60 px-3 py-1 text-[12px] font-semibold text-ink-soft backdrop-blur-sm">
            <span aria-hidden="true" className="relative flex size-2">
              <span className={`absolute inset-0 rounded-full ${remaining > 0 ? "animate-ping bg-success/70" : ""}`} />
              <span className={`relative size-2 rounded-full ${remaining > 0 ? "bg-success" : "bg-accent"}`} />
            </span>
            {dayStatus(agenda.length, remaining)}
          </p>
          {stats.currentStreak > 0 && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-[12px] font-semibold text-warning">
              <Flame className="size-3.5 fill-warning" aria-hidden="true" />
              {stats.currentStreak} {stats.currentStreak === 1 ? "zi" : "zile"} la rând
            </p>
          )}
        </div>
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[30px]">
          {greetingFor(now)}
          {name ? `, ${name}` : ""}
          <span aria-hidden="true"> 👋</span>
        </h1>
        <p className="text-sm text-ink-muted">Hai să facem ziua de azi una productivă.</p>
      </header>

      <MotivationalQuote initialIndex={Math.floor(now.getTime() / 1000) % QUOTES.length} />

      {/* Mobil: ce urmează + streak + scurtături */}
      <div className="flex min-w-0 flex-col gap-4 lg:hidden">
        <NextUpCard agenda={agenda} now={now} />
        <StreakStrip stats={stats} />
        <nav aria-label="Acțiuni rapide" className="stagger rounded-lg border border-line/70 bg-surface p-4 shadow-sm" style={delay(2)}>
          <QuickActions variant="row" />
        </nav>
      </div>

      <section aria-label="Pe scurt" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          index={1}
          label="Activități azi"
          value={String(agenda.length)}
          sub={remaining === 0 ? "Gata pe azi" : `${remaining} rămase`}
          icon={CalendarClock}
          color="violet"
        />
        <StatTile index={2} label="Termene în 7 zile" value={String(dueThisWeek)} sub="Teme și examene" icon={BookOpenCheck} color="amber" />
        <StatTile
          index={3}
          label="Următorul examen"
          value={nextExam ? formatRelativeDay(new Date(nextExam.task.dueAt), now) : "—"}
          sub={nextExam ? (nextExam.subject?.name ?? nextExam.task.title) : "Niciun examen apropiat"}
          icon={GraduationCap}
          color="rose"
        />
        <StatTile
          index={4}
          label="Învățat în 7 zile"
          value={formatDuration(stats.weekMinutes)}
          sub={`Record: ${stats.bestStreak} zile la rând`}
          icon={Clock3}
          color="green"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:gap-7">
          <Card aria-labelledby="program-azi" className="stagger" style={delay(5)}>
            <CardHeader
              id="program-azi"
              title="Programul de azi"
              action={
                <Link href="/calendar" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">
                  Vezi tot <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            />
            <CardBody className="pt-1">
              {agenda.length > 0 ? (
                <ul>
                  {agenda.map((item) => (
                    <AgendaRow
                      key={item.type === "event" ? `${item.occurrence.event.id}-${item.occurrence.occurrenceDate}` : item.task.id}
                      item={item}
                      now={now}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={<CalendarCheck2 />}
                  title="Nimic programat azi"
                  description="Adaugă-ți orarul o singură dată, iar cursurile recurente apar automat în fiecare săptămână."
                  action={
                    <ButtonLink href="/calendar?adauga=activitate" variant="secondary" size="sm">
                      Adaugă orarul
                    </ButtonLink>
                  }
                />
              )}
            </CardBody>
          </Card>

          <Card aria-labelledby="timp-invatare" className="stagger" style={delay(6)}>
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

          <Card aria-labelledby="progres-recent" className="stagger" style={delay(7)}>
            <CardHeader id="progres-recent" title="Progres recent" description="Ultimele teste grilă rezolvate" />
            <CardBody>
              <RecentAttempts attempts={attempts} subjects={overview.subjects} now={now} />
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5 lg:gap-7">
          <div className="hidden lg:block">
            <StreakCard stats={stats} index={5} />
          </div>

          <Card aria-labelledby="actiuni" className="stagger hidden lg:block" style={delay(6)}>
            <CardHeader id="actiuni" title="Acțiuni rapide" />
            <CardBody>
              <QuickActions variant="grid" />
            </CardBody>
          </Card>

          <Card aria-labelledby="termene" className="stagger" style={delay(7)}>
            <CardHeader id="termene" title="Următoarele termene" description="Teme și examene din următoarele 30 de zile" />
            <CardBody>
              {upcoming.length > 0 ? (
                <UpcomingList items={upcoming} now={now} />
              ) : (
                <EmptyState compact icon={<GraduationCap />} title="Niciun termen apropiat" description="Când adaugi o temă sau un examen, îl vezi aici." />
              )}
            </CardBody>
          </Card>
        </div>

        <Card aria-labelledby="insigne" className="stagger lg:col-span-7" style={delay(8)}>
          <CardHeader
            id="insigne"
            title="Insigne de etapă"
            description="Învață puțin în fiecare zi ca să-ți crești streak-ul și să deblochezi insigne."
          />
          <CardBody>
            <BadgesGrid stats={stats} />
          </CardBody>
        </Card>

        <Card aria-labelledby="sesiune-recomandata" className="stagger overflow-hidden lg:col-span-5" style={delay(9)}>
          <RecommendedSession session={toSessionView(overview.nextStudySession)} now={now.toISOString()} />
        </Card>
      </div>
    </div>
  );
}

function dayStatus(total: number, remaining: number) {
  if (total === 0) return "Zi liberă: perfectă pentru recapitulare";
  if (remaining === 0) return "Ai terminat programul de azi 🎉";
  return remaining === 1 ? "Mai ai o activitate azi" : `Mai ai ${remaining} activități azi`;
}

function endOf(item: AgendaItem) {
  if (item.type === "event") return item.occurrence.end;
  const due = new Date(item.task.dueAt);
  return item.task.durationMinutes ? new Date(due.getTime() + item.task.durationMinutes * 60_000) : due;
}

function toSessionView(next: TodayOverview["nextStudySession"]): RecommendedSessionView | null {
  if (!next) return null;
  const { event, start, end, occurrenceDate } = next.occurrence;
  return {
    eventId: event.id,
    occurrenceDate,
    title: event.title,
    focus: event.notes,
    start: start.toISOString(),
    end: end.toISOString(),
    recurring: event.recurrence !== "none",
    subject: next.subject ? { name: next.subject.name, color: next.subject.color } : null,
  };
}
