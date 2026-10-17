import { ArrowRight, BookOpenCheck, CalendarCheck2, CalendarPlus, FilePlus2, GraduationCap, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaRow } from "@/features/calendar/components/agenda-row";
import { UpcomingList } from "@/features/dashboard/components/upcoming-list";
import { getTodayOverview } from "@/features/dashboard/queries";
import { getProfile } from "@/features/profile/queries";
import { formatDayLong, formatRelativeDay, greetingFor } from "@/lib/time/format";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = { title: "Azi" };

const QUICK_ACTIONS = [
  { href: "/calendar?adauga=examen", label: "Adaugă examen", icon: GraduationCap },
  { href: "/calendar?adauga=tema", label: "Adaugă temă", icon: CalendarPlus },
  { href: "/materii", label: "Încarcă material", icon: FilePlus2 },
  { href: "/asistent", label: "Întreabă asistentul", icon: Sparkles },
];

export default async function TodayPage() {
  const [overview, profile] = await Promise.all([getTodayOverview(), getProfile()]);
  const { now, agenda, upcoming, subjects } = overview;
  const name = firstName(profile?.fullName ?? "");
  const remaining = agenda.filter((i) => (i.type === "event" ? i.occurrence.end : new Date(i.task.dueAt)) > now).length;
  const nextExam = upcoming.find(({ task }) => ["examen", "colocviu", "test"].includes(task.kind));

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <PageHeader
        eyebrow={formatDayLong(now)}
        title={name ? `${greetingFor(now)}, ${name}.` : `${greetingFor(now)}.`}
        description={summary(remaining, nextExam ? formatRelativeDay(new Date(nextExam.task.dueAt), now) : null)}
      />

      <nav aria-label="Acțiuni rapide">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-12 items-center gap-2.5 rounded-md border border-line bg-surface px-3.5 text-[13px] leading-tight font-medium text-ink shadow-xs transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-sm sm:px-4 sm:text-sm"
              >
                <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.9} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Ordinea din DOM = ordinea pe mobil; pe desktop: două rânduri, două coloane. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8">
        <Card aria-labelledby="program-azi">
          <CardHeader
            id="program-azi"
            title="Programul de azi"
            action={
              <Link href="/calendar" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                Calendar <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="pt-2">
            {agenda.length > 0 ? (
              <ul className="divide-y divide-line">
                {agenda.map((item) => (
                  <AgendaRow key={item.type === "event" ? `${item.occurrence.event.id}-${item.occurrence.occurrenceDate}` : item.task.id} item={item} now={now} />
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={<CalendarCheck2 />}
                title="Nimic programat azi"
                description="Adaugă-ți orarul o singură dată, iar cursurile recurente apar automat în fiecare săptămână."
                action={
                  <ButtonLink href="/calendar" variant="secondary" size="sm">
                    Adaugă orarul
                  </ButtonLink>
                }
              />
            )}
          </CardBody>
        </Card>

        <Card aria-labelledby="termene">
          <CardHeader id="termene" title="Următoarele termene" description="Teme și examene din următoarele 30 de zile" />
          <CardBody>
            {upcoming.length > 0 ? (
              <UpcomingList items={upcoming} now={now} />
            ) : (
              <EmptyState
                compact
                icon={<GraduationCap />}
                title="Niciun termen apropiat"
                description="Când adaugi o temă sau un examen, îl vezi aici, cu cât timp mai ai."
              />
            )}
          </CardBody>
        </Card>

        <Card aria-labelledby="sesiune-recomandata" className="overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="sesiune-recomandata" className="text-[15px] font-semibold">
                Sesiunea de studiu recomandată
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Cere asistentului un plan: găsește golurile din program și îți propune sesiuni pe care le confirmi tu.
              </p>
            </div>
            <ButtonLink href="/asistent" variant="secondary" className="shrink-0">
              Planifică studiul
            </ButtonLink>
          </div>
        </Card>

        <Card aria-labelledby="progres">
          <CardHeader id="progres" title="Progres recent" />
          <CardBody>
            <EmptyState
              compact
              icon={<BookOpenCheck />}
              title="Încă niciun test"
              description="După primul test vezi aici la ce capitole stai bine și ce merită recapitulat."
              action={
                <ButtonLink href="/materii" variant="ghost" size="sm">
                  {subjects.length > 0 ? "Alege o materie" : "Adaugă o materie"}
                </ButtonLink>
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function summary(remaining: number, nextExamIn: string | null) {
  const today =
    remaining === 0
      ? "Nu mai ai nimic programat azi."
      : remaining === 1
        ? "Mai ai o activitate azi."
        : `Mai ai ${remaining} ${remaining < 20 ? "activități" : "de activități"} azi.`;
  return nextExamIn ? `${today} Următorul examen este ${nextExamIn}.` : today;
}
