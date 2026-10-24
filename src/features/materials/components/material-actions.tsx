"use client";

import { Check, RotateCw, Trash2 } from "lucide-react";
import { useActionState, useOptimistic, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState, type FormState } from "@/features/auth/constants";
import { cn } from "@/lib/utils";
import { deleteMaterial, retryProcessing, setStudied } from "../actions";

type Target = { id: string; subjectId: string; title: string };

function Hidden({ target }: { target: Target }) {
  return (
    <>
      <input type="hidden" name="id" value={target.id} />
      <input type="hidden" name="subjectId" value={target.subjectId} />
    </>
  );
}

/** „Parcurs”: se bifează instant (optimist) și revine dacă salvarea eșuează. */
export function StudiedToggle({ target, studied }: { target: Target; studied: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(studied);
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    setOptimistic(formData.get("studied") === "1");
    return setStudied(prev, formData);
  }, initialFormState);

  return (
    <form action={action} className="contents">
      <Hidden target={target} />
      <button
        type="submit"
        name="studied"
        value={optimistic ? "0" : "1"}
        aria-pressed={optimistic}
        title={state.status === "error" ? state.message : undefined}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-[background-color,border-color,color] duration-200",
          optimistic
            ? "border-success/25 bg-success-soft text-success hover:border-success/40"
            : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
        )}
      >
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full border transition-colors",
            optimistic ? "border-success bg-success text-white" : "border-ink-faint",
          )}
          aria-hidden="true"
        >
          {optimistic ? <Check className="size-3 animate-pop-in" strokeWidth={3} /> : null}
        </span>
        Parcurs
      </button>
      {state.status === "error" && state.message ? (
        <span role="alert" className="sr-only">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function RetryProcessing({ target }: { target: Target }) {
  const [state, action] = useActionState(retryProcessing, initialFormState);
  return (
    <form action={action} className="contents">
      <Hidden target={target} />
      <RetryButton />
      {state.status === "error" && state.message ? (
        <p role="alert" className="basis-full text-[12px] font-medium text-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" loading={pending}>
      <RotateCw aria-hidden="true" />
      Reîncearcă
    </Button>
  );
}

export function DeleteMaterial({ target, kind }: { target: Target; kind: "pdf" | "image" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
        aria-label={`Șterge „${target.title}”`}
      >
        <Trash2 className="size-4" />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={kind === "pdf" ? "Ștergi acest curs?" : "Ștergi această poză?"}
        description={
          kind === "pdf"
            ? `„${target.title}” și textul extras din el se șterg definitiv. Asistentul nu le va mai putea folosi.`
            : `„${target.title}” se șterge definitiv.`
        }
      >
        <DeleteForm target={target} onCancel={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function DeleteForm({ target, onCancel }: { target: Target; onCancel: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const next = await deleteMaterial(prev, formData);
    if (next.status === "success") onCancel();
    return next;
  }, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      <Hidden target={target} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Anulează
        </Button>
        <SubmitButton className="w-full bg-danger hover:bg-danger-hover sm:w-auto">Șterge definitiv</SubmitButton>
      </div>
    </form>
  );
}
