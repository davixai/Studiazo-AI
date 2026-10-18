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
import { StreakCard, StreakStrip } from "@/features/progress/components/streak";
import { getLearningStats } from "@/features/progress/queries";
import type { AgendaItem } from "@/lib/contracts/domain";
import { formatDuration, formatRelativeDay, greetingFor } from "@/lib/time/format";
import { daysBetween, toDateKey } from "@/lib/time/zone";
import { MotivationalQuote } from "@/features/dashboard/components/motivational-quote";
import { QUOTES } from "@/features/dashboard/quotes";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = { title: "Acasă" };

const EXAM_KINDS = ["examen", "colocviu", "test"];
const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function TodayPage() {
  const [overview, profile, stats] = await Promise.all([getTodayOverview(), getProfile(), getLearningStats()]);
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
              {stats.currentStreak} {daysLabel(stats.currentStreak)} la rând
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

      {/* Mobil: ce urmează + streak + scurtături */}
      <div className="flex min-w-0 flex-col gap-4 lg:hidden">
        <NextUpCard agenda={agenda} now={now} />
        <StreakStrip stats={stats} />
        <nav aria-label="Acțiuni rapide" className="stagger rounded-lg border border-line/70 bg-surface p-4 shadow-sm" style={delay(2)}>
          <QuickActions variant="row" />
        </nav>
      </div>

      {/* Întâi ce contează azi: programul și termenele; în dreapta streak-ul și scurtăturile. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:gap-7">
          <Card aria-labelledby="program-azi" className="stagger" style={delay(2)}>
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

          <Card aria-labelledby="termene" className="stagger" style={delay(4)}>
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

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5 lg:gap-7">
          <div className="hidden lg:block">
            <StreakCard stats={stats} index={3} href="/progres" />
          </div>

          <Card aria-labelledby="actiuni" className="stagger hidden lg:block" style={delay(4)}>
            <CardHeader id="actiuni" title="Acțiuni rapide" />
            <CardBody>
              <QuickActions variant="grid" />
            </CardBody>
          </Card>

          <Card aria-labelledby="sesiune-recomandata" className="stagger overflow-hidden" style={delay(5)}>
            <RecommendedSession session={toSessionView(overview.nextStudySession)} now={now.toISOString()} />
          </Card>
        </div>
      </div>

      <section aria-label="Pe scurt" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          index={6}
          label="Activități azi"
          value={String(agenda.length)}
          sub={remaining === 0 ? "Gata pe azi" : `${remaining} rămase`}
          icon={CalendarClock}
          color="violet"
        />
        <StatTile index={7} label="Termene în 7 zile" value={String(dueThisWeek)} sub="Teme și examene" icon={BookOpenCheck} color="amber" />
        <StatTile
          index={8}
          label="Următorul examen"
          value={nextExam ? formatRelativeDay(new Date(nextExam.task.dueAt), now) : "—"}
          sub={nextExam ? (nextExam.subject?.name ?? nextExam.task.title) : "Niciun examen apropiat"}
          icon={GraduationCap}
          color="rose"
        />
        <StatTile
          index={9}
          label="Învățat în 7 zile"
          value={formatDuration(stats.weekMinutes)}
          sub={`Record: ${stats.bestStreak} ${daysLabel(stats.bestStreak)} la rând`}
          icon={Clock3}
          color="green"
        />
      </section>

      {/* Gândul zilei: la final, ca un moment de respiro după ce ai văzut ce ai de făcut. */}
      <MotivationalQuote initialIndex={Math.floor(now.getTime() / 1000) % QUOTES.length} />
    </div>
  );
}

/** „1 zi”, „5 zile”, „20 de zile”. */
function daysLabel(n: number) {
  return n === 1 ? "zi" : n !== 0 && (n % 100 === 0 || n % 100 >= 20) ? "de zile" : "zile";
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
