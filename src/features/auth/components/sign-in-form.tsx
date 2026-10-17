"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input, describedBy } from "@/components/ui/field";
import { signIn } from "../actions";
import { initialFormState } from "../schemas";
import { PasswordInput, SubmitButton } from "./form-parts";

export function SignInForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {linkError && state.status === "idle" ? (
        <Alert tone="warning" title="Linkul nu mai este valid">
          Poate a expirat sau a fost deja folosit. Autentifică-te sau cere un link nou.
        </Alert>
      ) : null}
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <input type="hidden" name="next" value={next ?? ""} />

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

      <div className="flex flex-col gap-2">
        <Field id="password" label="Parolă" error={e.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={Boolean(e.password) || undefined}
            aria-describedby={describedBy("password", { error: e.password })}
            required
          />
        </Field>
        <Link href="/recuperare" className="self-end text-[13px] font-medium text-accent hover:underline">
          Ai uitat parola?
        </Link>
      </div>

      <SubmitButton>Intră în cont</SubmitButton>
    </form>
  );
}
