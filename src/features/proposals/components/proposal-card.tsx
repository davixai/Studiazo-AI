"use client";

import { CalendarCheck2, Check, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { TASK_KIND_LABELS, type Subject } from "@/lib/contracts/domain";
import type { ConfirmProposalResult, Proposal, ProposalStatus } from "@/lib/contracts/proposals";
import { formatDayLong, formatDayShort, formatTime, formatTimeRange, formatWeekdayShort } from "@/lib/time/format";
import { cn } from "@/lib/utils";
import { confirmProposal, rejectProposal } from "../actions";

type ProposalCardProps = {
  proposal: Proposal;
  /** Materiile studentului, pentru nume și culori. */
  subjects: Subject[];
};

const STATUS: Record<ProposalStatus, { label: string; className: string }> = {
  pending: { label: "Așteaptă confirmarea", className: "bg-accent-soft text-accent-ink" },
  confirmed: { label: "Salvată", className: "bg-success-soft text-success" },
  rejected: { label: "Ai renunțat", className: "bg-surface-muted text-ink-muted" },
  expired: { label: "Expirată", className: "bg-warning-soft text-warning" },
};

/**
 * Arată exact ce se va salva dintr-o propunere a asistentului. Nimic nu ajunge în calendar fără „Salvează”.
 * Butoanele se blochează cât timp cererea rulează; serverul oricum nu dublează nimic.
 */
export function ProposalCard({ proposal, subjects }: ProposalCardProps) {
  const [status, setStatus] = useState<ProposalStatus>(proposal.status);
  const [failure, setFailure] = useState<Extract<ConfirmProposalResult, { ok: false }> | { message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"confirm" | "reject" | null>(null);

  const { payload } = proposal;
  const subjectOf = (id: string | null) => subjects.find((s) => s.id === id) ?? null;
  const count = payload.items.length;
  const heading =
    payload.kind === "study_sessions"
      ? count === 1
        ? "O sesiune de studiu"
        : `${count} sesiuni de studiu`
      : count === 1
        ? `${TASK_KIND_LABELS[payload.items[0].kind]} de adăugat`
        : `${count} termene de adăugat`;
  const warnings = payload.kind === "study_sessions" ? payload.warnings : [];
  const doesNotFit = payload.kind === "study_sessions" && !payload.fitsAvailableTime;

  const confirm = () => {
    setFailure(null);
    setAction("confirm");
    startTransition(async () => {
      const result = await confirmProposal(proposal.id);
      if (result.ok) setStatus("confirmed");
      else {
        setFailure(result);
        if (result.code === "expired") setStatus("expired");
        if (result.code === "not_pending") setStatus("rejected");
      }
    });
  };

  const reject = () => {
    setFailure(null);
    setAction("reject");
    startTransition(async () => {
      const result = await rejectProposal(proposal.id);
      if (result.ok) setStatus("rejected");
      else setFailure(result);
    });
  };

  return (
    <article
      aria-label={`Propunere: ${heading}`}
      className="overflow-hidden rounded-lg border border-line/70 bg-surface shadow-sm animate-rise-in"
    >
      <header className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-muted">Propunere de la asistent</p>
          <h3 className="mt-0.5 text-[15px] leading-snug font-semibold text-ink">{heading}</h3>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap", STATUS[status].className)}>
          {STATUS[status].label}
        </span>
      </header>

      {payload.explanation ? <p className="px-4 pt-3 text-sm leading-6 text-ink-soft sm:px-5">{payload.explanation}</p> : null}

      {doesNotFit || warnings.length > 0 ? (
        <div className="px-4 pt-3 sm:px-5">
          <Alert tone="warning" title={doesNotFit ? "Nu încape tot în timpul tău liber" : undefined}>
            {warnings.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <ol className="mt-3 divide-y divide-line border-y border-line">
        {payload.kind === "study_sessions"
          ? payload.items.map((item, i) => {
              const start = new Date(item.startsAt);
              const subject = subjectOf(item.subjectId);
              return (
                <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <DateTile date={start} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {subject ? <span className={cn("size-2 shrink-0 rounded-full", SUBJECT_COLOR_CLASSES[subject.color].dot)} aria-hidden="true" /> : null}
                      <span className="truncate">{item.title}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                      <span className="tabular">{formatTimeRange(start, new Date(item.endsAt))}</span>
                      {item.focus ? ` · ${item.focus}` : ""}
                    </p>
                    <span className="sr-only">{formatDayLong(start)}</span>
                  </div>
                </li>
              );
            })
          : payload.items.map((item, i) => {
              const due = new Date(item.dueAt);
              const subject = subjectOf(item.subjectId);
              return (
                <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <DateTile date={due} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                      {TASK_KIND_LABELS[item.kind]}
                      {subject ? ` · ${subject.name}` : ""} · până la <span className="tabular">{formatTime(due)}</span>
                    </p>
                    <span className="sr-only">{formatDayLong(due)}</span>
                  </div>
                </li>
              );
            })}
      </ol>

      <div className="px-4 py-4 sm:px-5" aria-live="polite">
        {failure ? (
          <Alert tone={"code" in failure && failure.code === "conflict" ? "warning" : "danger"} className="mb-3 animate-rise-in">
            <p>{failure.message}</p>
            {"conflicts" in failure && failure.conflicts?.length ? (
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {failure.conflicts.map((c, i) => (
                  <li key={i}>
                    {payload.items[c.itemIndex]?.title} se suprapune cu {c.title}, {formatDayShort(new Date(c.start))},{" "}
                    {formatTimeRange(new Date(c.start), new Date(c.end))}
                  </li>
                ))}
              </ul>
            ) : null}
          </Alert>
        ) : null}

        {status === "pending" ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <p className="text-xs text-ink-muted sm:mr-auto">Nimic nu se salvează până nu confirmi.</p>
            <Button variant="ghost" onClick={reject} loading={pending && action === "reject"} disabled={pending}>
              Renunță
            </Button>
            <Button onClick={confirm} loading={pending && action === "confirm"} disabled={pending}>
              <CalendarCheck2 aria-hidden="true" />
              Salvează în calendar
            </Button>
          </div>
        ) : status === "confirmed" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm font-semibold text-success sm:mr-auto">
              <span className="flex size-6 animate-pop-in items-center justify-center rounded-full bg-success text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
              Salvat în calendar
            </p>
            <ButtonLink href="/calendar" variant="secondary">
              Vezi în calendar
            </ButtonLink>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            {status === "expired" ? "Propunerea a expirat. Cere asistentului una nouă." : "Nimic nu a fost salvat."}
          </p>
        )}
      </div>
    </article>
  );
}

function DateTile({ date }: { date: Date }) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center rounded-md bg-surface-muted py-1.5" aria-hidden="true">
      <span className="text-[10px] font-semibold text-ink-muted uppercase">{formatWeekdayShort(date).replace(".", "")}</span>
      <span className="text-[15px] leading-tight font-bold text-ink tabular">{formatDayShort(date).split(" ")[0]}</span>
    </div>
  );
}
