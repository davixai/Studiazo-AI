"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, describedBy } from "@/components/ui/field";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState, type FormState } from "@/features/auth/schemas";
import { PREFERRED_TIMES, PREFERRED_TIME_LABELS, type Profile } from "@/lib/contracts/domain";
import { IASI_UNIVERSITIES } from "@/lib/iasi";
import { formatDuration } from "@/lib/time/format";
import { cn } from "@/lib/utils";
import { completeOnboarding, saveProfile } from "../actions";
import { DAILY_LIMIT_OPTIONS, SESSION_LENGTH_OPTIONS } from "../schemas";

type ProfileFormProps = {
  profile: Profile;
  mode: "onboarding" | "profile";
  /** Acțiuni suplimentare lângă butonul principal (ex. „Completez mai târziu”). */
  secondaryAction?: React.ReactNode;
};

export function ProfileForm({ profile, mode, secondaryAction }: ProfileFormProps) {
  const [state, action] = useActionState<FormState, FormData>(
    mode === "onboarding" ? completeOnboarding : saveProfile,
    initialFormState,
  );
  const e = state.fieldErrors ?? {};
  const v = (key: string, fallback: string | number | null) => state.values?.[key] ?? (fallback == null ? "" : String(fallback));

  return (
    <form action={action} noValidate className="flex flex-col gap-10">
      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      {state.status === "success" && state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-[15px] font-semibold">Despre tine</legend>
        <Field id="fullName" label="Nume și prenume" error={e.fullName} className="sm:col-span-2">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={v("fullName", profile.fullName)}
            aria-invalid={Boolean(e.fullName) || undefined}
            aria-describedby={describedBy("fullName", { error: e.fullName })}
            required
          />
        </Field>
        <Field id="university" label="Universitate" optional className="sm:col-span-2">
          <Input
            id="university"
            name="university"
            list="universities"
            placeholder="Alege din listă sau scrie"
            defaultValue={v("university", profile.university)}
          />
          <datalist id="universities">
            {IASI_UNIVERSITIES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
        <Field id="faculty" label="Facultate" optional>
          <Input id="faculty" name="faculty" defaultValue={v("faculty", profile.faculty)} />
        </Field>
        <Field id="specialization" label="Specializare" optional>
          <Input id="specialization" name="specialization" defaultValue={v("specialization", profile.specialization)} />
        </Field>
        <Field id="studyYear" label="Anul de studiu" optional>
          <Select id="studyYear" name="studyYear" defaultValue={v("studyYear", profile.studyYear)}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                Anul {y}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-[15px] font-semibold">Cum înveți</legend>
        <p className="-mt-1 mb-4 text-sm leading-6 text-ink-muted sm:col-span-2">
          Folosim aceste preferințe ca să propunem sesiuni de studiu potrivite pentru tine. Nu există un moment „corect” pentru
          toată lumea.
        </p>

        <div className="sm:col-span-2">
          <p id="preferredTime-label" className="mb-2 text-sm font-medium">
            Când te concentrezi cel mai bine?
          </p>
          <div role="radiogroup" aria-labelledby="preferredTime-label" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PREFERRED_TIMES.map((t) => (
              <label
                key={t}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink-soft transition-colors",
                  "hover:border-ink-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-ink",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                  t === "fara_preferinta" && "col-span-2 sm:col-span-1",
                )}
              >
                <input
                  type="radio"
                  name="preferredTime"
                  value={t}
                  defaultChecked={v("preferredTime", profile.preferredTime) === t}
                  className="sr-only"
                />
                {PREFERRED_TIME_LABELS[t]}
              </label>
            ))}
          </div>
        </div>

        <Field id="sessionMinutes" label="Durata unei sesiuni" error={e.sessionMinutes}>
          <Select id="sessionMinutes" name="sessionMinutes" defaultValue={v("sessionMinutes", profile.sessionMinutes)}>
            {withCurrent(SESSION_LENGTH_OPTIONS, profile.sessionMinutes).map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="dailyStudyLimitMinutes" label="Maximum de studiu pe zi" error={e.dailyStudyLimitMinutes}>
          <Select
            id="dailyStudyLimitMinutes"
            name="dailyStudyLimitMinutes"
            defaultValue={v("dailyStudyLimitMinutes", profile.dailyStudyLimitMinutes)}
          >
            {withCurrent(DAILY_LIMIT_OPTIONS, profile.dailyStudyLimitMinutes).map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-end">
        {secondaryAction}
        <SubmitButton className="w-full sm:w-auto">{mode === "onboarding" ? "Gata, mergi mai departe" : "Salvează modificările"}</SubmitButton>
      </div>
    </form>
  );
}

function withCurrent(options: readonly number[], current: number) {
  return options.includes(current) ? [...options] : [...options, current].sort((a, b) => a - b);
}
