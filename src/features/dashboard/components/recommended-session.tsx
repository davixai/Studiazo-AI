"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { setEventCompleted } from "@/features/calendar/actions";
import type { SubjectColor } from "@/lib/contracts/domain";
import { formatRelativeDay, formatTimeRange } from "@/lib/time/format";
import { cn } from "@/lib/utils";

export type RecommendedSessionView = {
  eventId: string;
  occurrenceDate: string;
  title: string;
  focus: string | null;
  start: string;
  end: string;
  recurring: boolean;
  subject: { name: string; color: SubjectColor } | null;
};

type RecommendedSessionProps = { session: RecommendedSessionView | null; now: string };

/** „Sesiunea recomandată” de pe Azi: următoarea sesiune de studiu confirmată sau îndemnul spre asistent. */
export function RecommendedSession({ session, now }: RecommendedSessionProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const header = (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
        <Sparkles className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <h2 id="sesiune-recomandata" className="text-[15px] font-bold">
        {session ? "Următoarea sesiune de studiu" : "Sesiunea de studiu recomandată"}
      </h2>
    </div>
  );

  if (!session) {
    return (
      <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
        {header}
        <p className="text-sm leading-6 text-ink-muted">
          Asistentul găsește golurile din program și îți propune sesiuni. Tu confirmi ce intră în calendar.
        </p>
        <ButtonLink href="/asistent" className="mt-auto self-start">
          Planifică studiul
        </ButtonLink>
      </div>
    );
  }

  const start = new Date(session.start);
  const end = new Date(session.end);
  const started = start <= new Date(now);
  const complete = () => {
    setError(null);
    startTransition(async () => {
      const result = await setEventCompleted({ id: session.eventId, completed: true, returnTo: "/azi" });
      if (!result.ok) setError(result.message);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
      {header}
      <div className="rounded-md border border-line/70 bg-surface-muted/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          {session.subject ? (
            <span className={cn("size-2 shrink-0 rounded-full", SUBJECT_COLOR_CLASSES[session.subject.color].dot)} aria-hidden="true" />
          ) : null}
          <span className="min-w-0 truncate">{session.title}</span>
        </p>
        <p className="mt-1 text-[13px] text-ink-muted first-letter:uppercase">
          {started ? "acum" : formatRelativeDay(start, new Date(now))} · <span className="tabular">{formatTimeRange(start, end)}</span>
        </p>
        {session.focus ? <p className="mt-2 text-sm leading-6 text-ink-soft">{session.focus}</p> : null}
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="mt-auto flex flex-wrap gap-2">
        {started && !session.recurring ? (
          <Button onClick={complete} loading={pending}>
            <CheckCircle2 aria-hidden="true" />
            Am terminat sesiunea
          </Button>
        ) : null}
        <ButtonLink
          href={`/calendar?activitate=${session.eventId}&zi=${session.occurrenceDate}`}
          variant={started && !session.recurring ? "ghost" : "secondary"}
        >
          Vezi în calendar
        </ButtonLink>
      </div>
    </div>
  );
}
