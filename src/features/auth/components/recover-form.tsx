"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input, describedBy } from "@/components/ui/field";
import { requestPasswordReset, updatePassword } from "../actions";
import { PASSWORD_MIN, initialFormState } from "../constants";
import { PasswordInput, SubmitButton } from "./form-parts";

export function RecoverForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "success" ? <Alert tone="success" title="Verifică-ți emailul">{state.message}</Alert> : null}
      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <Field id="email" label="Email" error={e.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(e.email) || undefined}
          aria-describedby={describedBy("email", { error: e.email })}
          required
        />
      </Field>

      <SubmitButton>Trimite linkul de resetare</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  const e = state.fieldErrors ?? {};
  const hint = `Cel puțin ${PASSWORD_MIN} caractere.`;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <Field id="password" label="Parola nouă" hint={hint} error={e.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          aria-invalid={Boolean(e.password) || undefined}
          aria-describedby={describedBy("password", { hint, error: e.password })}
          required
        />
      </Field>

      <Field id="confirm" label="Confirmă parola" error={e.confirm}>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          aria-invalid={Boolean(e.confirm) || undefined}
          aria-describedby={describedBy("confirm", { error: e.confirm })}
          required
        />
      </Field>

      <SubmitButton>Salvează parola</SubmitButton>
    </form>
  );
}
