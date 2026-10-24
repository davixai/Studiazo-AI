"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, describedBy } from "@/components/ui/field";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState } from "@/features/auth/constants";
import { deleteAccount } from "../actions";
import { DELETE_CONFIRMATION } from "../constants";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteAccount, initialFormState);
  const error = state.fieldErrors?.confirmation;

  return (
    <>
      <Button variant="quiet-danger" onClick={() => setOpen(true)}>
        Șterge contul
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Ștergi contul definitiv?"
        description="Se șterg profilul, calendarul, materiile, fișierele încărcate și conversațiile. Acțiunea nu poate fi anulată."
      >
        <form action={action} className="flex flex-col gap-5">
          {state.message ? <Alert tone="danger">{state.message}</Alert> : null}
          <Field id="confirmation" label={`Scrie ${DELETE_CONFIRMATION} pentru a confirma`} error={error}>
            <Input
              id="confirmation"
              name="confirmation"
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={describedBy("confirmation", { error })}
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <DangerSubmit />
          </div>
        </form>
      </Dialog>
    </>
  );
}

function DangerSubmit() {
  return <SubmitButton className="w-full bg-danger hover:bg-danger-hover sm:w-auto">Șterge definitiv</SubmitButton>;
}
