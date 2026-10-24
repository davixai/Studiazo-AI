"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, describedBy } from "@/components/ui/field";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState, type FormState } from "@/features/auth/constants";
import { SUBJECT_COLORS, type Subject, type SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import { createSubject, updateSubject } from "../actions";
import { SUBJECT_COLOR_LABELS, SUBJECT_NAME_MAX } from "../constants";

type SubjectDialogProps =
  | { mode: "create"; defaultColor: SubjectColor }
  | { mode: "edit"; subject: Subject };

/** Butonul „Adaugă materie” / „Editează” și dialogul cu formularul materiei. */
export function SubjectDialog(props: SubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const editing = props.mode === "edit";

  return (
    <>
      {editing ? (
        <Button variant="ghost" onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
          Editează
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Adaugă materie
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editează materia" : "Materie nouă"}
        description={editing ? undefined : "Apoi poți adăuga cursuri în PDF, poze și notițe la ea."}
      >
        {/* Dialogul randează conținutul doar cât e deschis, deci formularul pornește curat la fiecare deschidere. */}
        <SubjectForm {...props} onDone={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function SubjectForm(props: SubjectDialogProps & { onDone: () => void }) {
  const subject = props.mode === "edit" ? props.subject : null;
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const next = await (subject ? updateSubject : createSubject)(prev, formData);
    if (next.status === "success") props.onDone();
    return next;
  }, initialFormState);

  const e = state.fieldErrors ?? {};
  const name = state.values?.name ?? subject?.name ?? "";
  const professor = state.values?.professor ?? subject?.professor ?? "";
  const color = state.values?.color ?? subject?.color ?? (props.mode === "create" ? props.defaultColor : "blue");

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      {subject ? <input type="hidden" name="id" value={subject.id} /> : null}

      <Field id="subject-name" label="Numele materiei" error={e.name}>
        <Input
          id="subject-name"
          name="name"
          defaultValue={name}
          placeholder="ex. Analiză matematică"
          maxLength={SUBJECT_NAME_MAX}
          autoComplete="off"
          aria-invalid={Boolean(e.name) || undefined}
          aria-describedby={describedBy("subject-name", { error: e.name })}
          required
        />
      </Field>

      <Field id="subject-professor" label="Profesor" optional error={e.professor}>
        <Input
          id="subject-professor"
          name="professor"
          defaultValue={professor}
          placeholder="ex. Conf. dr. Ionescu"
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(e.professor) || undefined}
          aria-describedby={describedBy("subject-professor", { error: e.professor })}
        />
      </Field>

      <fieldset aria-describedby={e.color ? "subject-color-error" : undefined}>
        <legend className="mb-2 text-sm font-medium">Culoare</legend>
        <div className="grid grid-cols-7 gap-1.5 sm:flex sm:gap-2">
          {SUBJECT_COLORS.map((c) => (
            <label
              key={c}
              title={SUBJECT_COLOR_LABELS[c]}
              className={cn(
                "flex aspect-square w-full max-w-11 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface transition-colors sm:size-10",
                "hover:border-ink-faint has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink/10",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              )}
            >
              <input type="radio" name="color" value={c} defaultChecked={color === c} className="sr-only" />
              <span aria-hidden="true" className={cn("size-5 rounded-full", SUBJECT_COLOR_CLASSES[c].dot)} />
              <span className="sr-only">{SUBJECT_COLOR_LABELS[c]}</span>
            </label>
          ))}
        </div>
        {e.color ? (
          <p id="subject-color-error" className="mt-1.5 text-[13px] leading-5 font-medium text-danger">
            {e.color}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="lg" onClick={props.onDone}>
          Anulează
        </Button>
        <SubmitButton className="w-full sm:w-auto">{subject ? "Salvează" : "Adaugă materia"}</SubmitButton>
      </div>
    </form>
  );
}
