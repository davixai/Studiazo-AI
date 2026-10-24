"use client";

import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { TimeInput } from "@/components/ui/time-input";
import { TASK_KINDS, TASK_KIND_LABELS, type Subject, type Task, type TaskKind } from "@/lib/contracts/domain";
import { formatDuration } from "@/lib/time/format";
import { toDateKey, toTimeOfDay } from "@/lib/time/zone";
import { deleteTask, saveTask, setTaskCompleted } from "../actions";
import { initialTaskFormState, TIMED_TASK_KINDS, type ActionResult, type TaskFormState } from "../constants";
import { KindPicker } from "./kind-picker";

type TaskDialogProps = {
  /** null = termen nou. */
  task: Task | null;
  subjects: Subject[];
  defaults: { kind: TaskKind; date: string; time: string };
  /** Vederea calendarului în care revine dialogul. */
  returnHref: string;
};

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180];
const ESTIMATE_OPTIONS = [30, 60, 120, 180, 300, 480, 600, 900, 1200];

export function TaskDialog({ task, subjects, defaults, returnHref }: TaskDialogProps) {
  const router = useRouter();
  const formId = useId();
  const [state, action, saving] = useActionState<TaskFormState, FormData>(saveTask, initialTaskFormState);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sv = state.values;
  const due = task ? new Date(task.dueAt) : null;
  const initial = {
    kind: (sv?.kind ?? task?.kind ?? defaults.kind) as TaskKind,
    title: sv?.title ?? task?.title ?? "",
    subjectId: sv?.subjectId ?? task?.subjectId ?? "",
    date: sv?.date ?? (due ? toDateKey(due) : defaults.date),
    time: sv?.time ?? (due ? toTimeOfDay(due) : defaults.time),
    durationMinutes: sv?.durationMinutes ?? String(task?.durationMinutes ?? ""),
    estimatedMinutes: sv?.estimatedMinutes ?? String(task?.estimatedMinutes ?? ""),
    location: sv?.location ?? task?.location ?? "",
    notes: sv?.notes ?? task?.notes ?? "",
  };
  const [kind, setKind] = useState<TaskKind>(initial.kind);
  const [title, setTitle] = useState(initial.title);
  const timed = TIMED_TASK_KINDS.includes(kind);

  const e = state.fieldErrors ?? {};
  const busy = saving || pending;
  const close = () => router.replace(returnHref, { scroll: false });

  const run = (fn: () => Promise<ActionResult>) => {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setActionError(result.message);
    });
  };

  const footer = confirmDelete ? (
    <>
      <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={pending}>
        Renunță
      </Button>
      <Button variant="danger" loading={pending} onClick={() => run(() => deleteTask({ id: task!.id, returnTo: returnHref }))}>
        Șterge
      </Button>
    </>
  ) : (
    <>
      {task ? (
        <Button variant="quiet-danger" onClick={() => setConfirmDelete(true)} disabled={busy} className="sm:mr-auto">
          <Trash2 aria-hidden="true" />
          Șterge
        </Button>
      ) : null}
      {task ? (
        <Button
          variant="secondary"
          loading={pending}
          disabled={saving}
          onClick={() => run(() => setTaskCompleted({ id: task.id, completed: !task.completedAt, returnTo: returnHref }))}
        >
          {task.completedAt ? <RotateCcw aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {task.completedAt ? "Redeschide" : "Marchează ca făcut"}
        </Button>
      ) : null}
      <Button type="submit" form={formId} loading={saving} disabled={pending}>
        {task ? "Salvează modificările" : kind === "altul" ? "Adaugă termenul" : `Adaugă ${TASK_KIND_LABELS[kind].toLowerCase()}`}
      </Button>
    </>
  );

  return (
    <Dialog
      open
      onClose={close}
      size="lg"
      title={task ? `Editează: ${TASK_KIND_LABELS[task.kind].toLowerCase()}` : "Termen nou"}
      description={task ? undefined : "Teme, proiecte și examene. Apar pe pagina Azi, cu zilele rămase."}
      footer={footer}
    >
      {confirmDelete ? (
        <div className="flex flex-col gap-3 animate-rise-in">
          {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
          <Alert tone="danger" title={`Ștergi „${task?.title}”?`}>
            Termenul dispare din calendar și de pe pagina Azi. Nu se poate anula.
          </Alert>
        </div>
      ) : null}
      <form id={formId} action={action} noValidate hidden={confirmDelete} className="flex flex-col gap-5">
        {task ? <input type="hidden" name="id" value={task.id} /> : null}
        <input type="hidden" name="returnTo" value={returnHref} />

        {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
        {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

        <KindPicker
          name="kind"
          legend="Tip"
          kinds={TASK_KINDS}
          labels={TASK_KIND_LABELS}
          defaultValue={initial.kind}
          error={e.kind}
          className="grid-cols-3"
          onChange={setKind}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="title" label="Titlu" error={e.title}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder={timed ? "ex. Examen Analiză" : "ex. Tema 3 — liste înlănțuite"}
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
              disabled={subjects.length === 0}
              onChange={(ev) => {
                const subject = subjects.find((s) => s.id === ev.target.value);
                if (subject && title.trim() === "") setTitle(timed ? `${TASK_KIND_LABELS[kind]} ${subject.name}` : subject.name);
              }}
              aria-describedby={describedBy("subjectId", { hint: subjects.length === 0, error: e.subjectId })}
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

        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          <Field id="date" label={timed ? "Data probei" : "Termen"} error={e.date}>
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
          <Field id="time" label={timed ? "Ora" : "Până la ora"} error={e.time}>
            <TimeInput id="time" name="time" defaultValue={initial.time} invalid={Boolean(e.time)} aria-describedby={describedBy("time", { error: e.time })} />
          </Field>
        </div>

        {timed ? (
          <div className="grid animate-rise-in gap-5 sm:grid-cols-2">
            <Field id="durationMinutes" label="Durata probei" optional error={e.durationMinutes}>
              <Select id="durationMinutes" name="durationMinutes" defaultValue={initial.durationMinutes}>
                <option value="">Nu știu încă</option>
                {withCurrent(DURATION_OPTIONS, initial.durationMinutes).map((m) => (
                  <option key={m} value={m}>
                    {formatDuration(m)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="location" label="Sala" optional error={e.location}>
              <Input id="location" name="location" defaultValue={initial.location} placeholder="ex. Amfiteatrul C2" maxLength={160} />
            </Field>
          </div>
        ) : null}

        <Field
          id="estimatedMinutes"
          label={timed ? "Cât timp vrei să înveți?" : "Cât crezi că îți ia?"}
          optional
          hint="Ne ajută să-ți propunem sesiuni de studiu realiste."
          error={e.estimatedMinutes}
        >
          <Select
            id="estimatedMinutes"
            name="estimatedMinutes"
            defaultValue={initial.estimatedMinutes}
            aria-describedby={describedBy("estimatedMinutes", { hint: true, error: e.estimatedMinutes })}
          >
            <option value="">Nu știu încă</option>
            {withCurrent(ESTIMATE_OPTIONS, initial.estimatedMinutes).map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="notes" label="Notițe" optional error={e.notes}>
          <Textarea id="notes" name="notes" defaultValue={initial.notes} rows={3} maxLength={4000} placeholder="Cerințe, capitole, ce să nu uiți" />
        </Field>
      </form>
    </Dialog>
  );
}

/** Păstrează în listă valoarea salvată, chiar dacă nu e una dintre opțiunile standard. */
function withCurrent(options: number[], current: string) {
  const value = Number(current);
  return current === "" || options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
}
