"use client";

import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import {
  EVENT_KINDS,
  EVENT_KIND_LABELS,
  type CalendarEvent,
  type EventKind,
  type RecurrenceKind,
  type Subject,
} from "@/lib/contracts/domain";
import { formatDayLong } from "@/lib/time/format";
import { dayBounds, toDateKey, toTimeOfDay } from "@/lib/time/zone";
import { deleteEvent, saveEvent, setEventCompleted } from "../actions";
import { KindPicker } from "./kind-picker";
import { initialEventFormState, type ActionResult, type EventFormState } from "../schemas";

type EventDialogProps = {
  /** null = activitate nouă. */
  event: CalendarEvent | null;
  subjects: Subject[];
  /** Apariția pe care s-a apăsat (pentru „Șterge doar această zi”). */
  occurrenceDate: string | null;
  defaults: { date: string; startTime: string; endTime: string };
  /** Vederea calendarului în care revine dialogul (ex. /calendar?vedere=saptamana&data=…). */
  returnHref: string;
};

const RECURRENCE_OPTIONS: { value: RecurrenceKind; label: string }[] = [
  { value: "none", label: "O dată" },
  { value: "weekly", label: "Săptămânal" },
  { value: "biweekly", label: "La 2 săpt." },
];

export function EventDialog({ event, subjects, occurrenceDate, defaults, returnHref }: EventDialogProps) {
  const router = useRouter();
  const formId = useId();
  const [state, action, saving] = useActionState<EventFormState, FormData>(saveEvent, initialEventFormState);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Avertismentul de suprapunere e valabil doar pentru valorile pentru care a fost dat.
  const [staleWarning, setStaleWarning] = useState<EventFormState | null>(null);
  const overlapAcknowledged = state.status === "warning" && staleWarning !== state;

  const sv = state.values;
  const initial = {
    kind: sv?.kind ?? event?.kind ?? "curs",
    title: sv?.title ?? event?.title ?? "",
    subjectId: sv?.subjectId ?? event?.subjectId ?? "",
    date: sv?.date ?? (event ? toDateKey(new Date(event.startsAt), event.timezone) : defaults.date),
    startTime: sv?.startTime ?? (event ? toTimeOfDay(new Date(event.startsAt), event.timezone) : defaults.startTime),
    endTime: sv?.endTime ?? (event ? toTimeOfDay(new Date(event.endsAt), event.timezone) : defaults.endTime),
    recurrenceUntil: sv?.recurrenceUntil ?? event?.recurrenceUntil ?? "",
    location: sv?.location ?? event?.location ?? "",
    notes: sv?.notes ?? event?.notes ?? "",
  };
  const [title, setTitle] = useState(initial.title);
  const [recurrence, setRecurrence] = useState<RecurrenceKind>((sv?.recurrence as RecurrenceKind) ?? event?.recurrence ?? "none");

  const e = state.fieldErrors ?? {};
  const isRecurring = event ? event.recurrence !== "none" : false;
  const busy = saving || pending;

  const close = () => router.replace(returnHref, { scroll: false });

  const run = (fn: () => Promise<ActionResult>) => {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setActionError(result.message);
    });
  };

  const onSubjectChange = (subjectId: string) => {
    // Titlul gol se completează cu numele materiei: cel mai des, cursul se numește ca materia.
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject && title.trim() === "") setTitle(subject.name);
  };

  const footer = confirmDelete ? (
    <>
      <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={pending}>
        Renunță
      </Button>
      {isRecurring && occurrenceDate ? (
        <Button variant="secondary" loading={pending} onClick={() => run(() => deleteEvent({ id: event!.id, scope: "occurrence", date: occurrenceDate, returnTo: returnHref }))}>
          Doar pe {formatDayLong(dayBounds(occurrenceDate).start)}
        </Button>
      ) : null}
      <Button variant="danger" loading={pending} onClick={() => run(() => deleteEvent({ id: event!.id, scope: "series", returnTo: returnHref }))}>
        {isRecurring ? "Toată seria" : "Șterge"}
      </Button>
    </>
  ) : (
    <>
      {event ? (
        <Button variant="quiet-danger" onClick={() => setConfirmDelete(true)} disabled={busy} className="sm:mr-auto">
          <Trash2 aria-hidden="true" />
          Șterge
        </Button>
      ) : null}
      {event && !isRecurring ? (
        <Button
          variant="secondary"
          loading={pending}
          disabled={saving}
          onClick={() => run(() => setEventCompleted({ id: event.id, completed: !event.completedAt, returnTo: returnHref }))}
        >
          {event.completedAt ? <RotateCcw aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {event.completedAt ? "Redeschide" : "Marchează ca finalizată"}
        </Button>
      ) : null}
      <Button type="submit" form={formId} loading={saving} disabled={pending}>
        {overlapAcknowledged ? "Salvează oricum" : event ? "Salvează modificările" : "Adaugă activitatea"}
      </Button>
    </>
  );

  return (
    <Dialog
      open
      onClose={close}
      size="lg"
      title={event ? "Editează activitatea" : "Activitate nouă"}
      description={
        isRecurring
          ? "Modificările se aplică tuturor aparițiilor din serie."
          : event
            ? undefined
            : "Curs, seminar, laborator, job, sport sau orice altceva din programul tău."
      }
      footer={footer}
    >
      {confirmDelete ? (
        <div className="flex flex-col gap-3 animate-rise-in">
          {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
          <Alert tone="danger" title={`Ștergi „${event?.title}”?`}>
            {isRecurring
              ? "Poți șterge doar ziua pe care ai apăsat sau toată seria. Nu se poate anula."
              : "Activitatea dispare din calendar. Nu se poate anula."}
          </Alert>
        </div>
      ) : null}
      <form
        id={formId}
        action={action}
        noValidate
        onChange={() => setStaleWarning(state)}
        hidden={confirmDelete}
        className="flex flex-col gap-5"
      >
        {event ? <input type="hidden" name="id" value={event.id} /> : null}
        <input type="hidden" name="returnTo" value={returnHref} />
        <input type="hidden" name="allowOverlap" value={overlapAcknowledged ? "1" : "0"} />

        {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
        {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
        {state.status === "warning" && overlapAcknowledged ? (
          <Alert tone="warning" title={state.message} className="animate-rise-in">
            <ul className="mt-1 flex flex-col gap-0.5">
              {state.conflicts?.map((c) => (
                <li key={c} className="first-letter:uppercase">
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-2">Poți schimba ora sau poți salva oricum.</p>
          </Alert>
        ) : null}

        <KindPicker
          name="kind"
          legend="Tip"
          kinds={EVENT_KINDS}
          labels={EVENT_KIND_LABELS}
          defaultValue={initial.kind as EventKind}
          error={e.kind}
          className="grid-cols-4"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="title" label="Titlu" error={e.title}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="ex. Analiză matematică"
              maxLength={160}
              autoComplete="off"
              aria-invalid={Boolean(e.title) || undefined}
              aria-describedby={describedBy("title", { error: e.title })}
              required
            />
          </Field>
          <Field
            id="subjectId"
            label="Materie"
            optional
            error={e.subjectId}
            hint={subjects.length === 0 ? "Materiile tale apar aici după ce le adaugi în Materii." : undefined}
          >
            <Select
              id="subjectId"
              name="subjectId"
              defaultValue={initial.subjectId}
              onChange={(ev) => onSubjectChange(ev.target.value)}
              disabled={subjects.length === 0}
              aria-describedby={describedBy("subjectId", {
                hint: subjects.length === 0,
                error: e.subjectId,
              })}
            >
              <option value="">Fără materie</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-[1.4fr_1fr_1fr]">
          <Field id="date" label={recurrence === "none" ? "Data" : "Prima dată"} error={e.date} className="col-span-2 sm:col-span-1">
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={initial.date}
              aria-invalid={Boolean(e.date) || undefined}
              aria-describedby={describedBy("date", { error: e.date })}
              required
            />
          </Field>
          <Field id="startTime" label="De la" error={e.startTime}>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              step={300}
              defaultValue={initial.startTime}
              className="tabular"
              aria-invalid={Boolean(e.startTime) || undefined}
              aria-describedby={describedBy("startTime", { error: e.startTime })}
              required
            />
          </Field>
          <Field id="endTime" label="Până la" error={e.endTime}>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              step={300}
              defaultValue={initial.endTime}
              className="tabular"
              aria-invalid={Boolean(e.endTime) || undefined}
              aria-describedby={describedBy("endTime", { error: e.endTime })}
              required
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink" aria-hidden="true">
            Se repetă
          </p>
          <Segmented label="Se repetă" name="recurrence" options={RECURRENCE_OPTIONS} value={recurrence} onChange={setRecurrence} className="w-full" />
        </div>

        {recurrence !== "none" ? (
          <Field
            id="recurrenceUntil"
            label="Până la data"
            optional
            hint="Lasă gol dacă se repetă tot semestrul."
            error={e.recurrenceUntil}
            className="animate-rise-in"
          >
            <Input
              id="recurrenceUntil"
              name="recurrenceUntil"
              type="date"
              defaultValue={initial.recurrenceUntil}
              aria-invalid={Boolean(e.recurrenceUntil) || undefined}
              aria-describedby={describedBy("recurrenceUntil", { hint: true, error: e.recurrenceUntil })}
            />
          </Field>
        ) : null}

        <Field id="location" label="Loc" optional error={e.location}>
          <Input id="location" name="location" defaultValue={initial.location} placeholder="ex. Sala C112" maxLength={160} />
        </Field>
        <Field id="notes" label="Notițe" optional error={e.notes}>
          <Textarea id="notes" name="notes" defaultValue={initial.notes} rows={3} maxLength={4000} />
        </Field>
      </form>
    </Dialog>
  );
}
