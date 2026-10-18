"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, describedBy } from "@/components/ui/field";
import { signUp } from "../actions";
import { PASSWORD_MIN, initialFormState } from "../schemas";
import { PasswordInput, SubmitButton } from "./form-parts";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, initialFormState);
  const e = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4 animate-rise-in" role="status">
        <div className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">Verifică-ți emailul</p>
          <p className="mt-1.5 text-[15px] leading-6 text-ink-soft">{state.message}</p>
        </div>
        <p className="text-sm text-ink-muted">Nu l-ai primit în câteva minute? Verifică folderul Spam.</p>
      </div>
    );
  }

  const passwordHint = `Cel puțin ${PASSWORD_MIN} caractere.`;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.accountExists ? (
        <Alert tone="warning" title="Ai deja cont" className="animate-rise-in">
          {state.message}
          <span className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href={`/autentificare?email=${encodeURIComponent(state.values?.email ?? "")}`} size="sm">
              Intră în cont
            </ButtonLink>
            <ButtonLink href="/recuperare" variant="secondary" size="sm">
              Resetează parola
            </ButtonLink>
          </span>
        </Alert>
      ) : state.message ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field id="fullName" label="Nume și prenume" error={e.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName}
          aria-invalid={Boolean(e.fullName) || undefined}
          aria-describedby={describedBy("fullName", { error: e.fullName })}
          required
        />
      </Field>

      <Field id="email" label="Email" hint="Poți folosi și adresa de student." error={e.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(e.email) || undefined}
          aria-describedby={describedBy("email", { hint: true, error: e.email })}
          required
        />
      </Field>

      <Field id="password" label="Parolă" hint={passwordHint} error={e.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          aria-invalid={Boolean(e.password) || undefined}
          aria-describedby={describedBy("password", { hint: passwordHint, error: e.password })}
          required
        />
      </Field>

      <SubmitButton>Creează contul</SubmitButton>
    </form>
  );
}
