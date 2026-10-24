"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { TimeInput } from "@/components/ui/time-input";
import { SubmitButton } from "@/features/auth/components/form-parts";
import { initialFormState, type FormState } from "@/features/auth/schemas";
import type { AvailabilityWindow } from "@/lib/contracts/domain";
import { DEFAULT_AVAILABILITY } from "@/lib/time/slots";
import { cn } from "@/lib/utils";
import { saveAvailability } from "../actions";
import { WEEKDAY_LABELS } from "../schemas";

type AvailabilityFormProps = { availability: AvailabilityWindow[] };

/** Câte un interval pe zi. Fără nimic salvat, pornește de la intervalul implicit (zilnic 08:00–22:00). */
export function AvailabilityForm({ availability }: AvailabilityFormProps) {
  const [state, action] = useActionState<FormState, FormData>(saveAvailability, initialFormState);
  const source = availability.length > 0 ? availability : DEFAULT_AVAILABILITY;
  const windowOf = (weekday: number) => source.find((w) => w.weekday === weekday);
  const [enabled, setEnabled] = useState(() => WEEKDAY_LABELS.map((_, i) => Boolean(windowOf(i + 1))));
  const e = state.fieldErrors ?? {};
  const v = (key: string, fallback: string) => state.values?.[key] ?? fallback;

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-[15px] font-semibold">Când poți învăța</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          Asistentul propune sesiuni de studiu doar în aceste intervale, ocolind cursurile și restul programului.
          {availability.length === 0 ? " Momentan folosim intervalul implicit: zilnic, 08:00–22:00." : null}
        </p>
      </div>

      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      {e.form ? <Alert tone="danger">{e.form}</Alert> : null}
      {state.status === "success" && state.message ? (
        <Alert tone="success" className="animate-rise-in">
          {state.message}
        </Alert>
      ) : null}

      <ul className="flex flex-col divide-y divide-line">
        {WEEKDAY_LABELS.map((label, i) => {
          const weekday = i + 1;
          const key = `d${weekday}`;
          const window = windowOf(weekday);
          const on = enabled[i];
          return (
            <li key={key} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[150px_1fr_1fr]">
              <label className="col-span-2 flex cursor-pointer items-center gap-3 sm:col-span-1">
                <input
                  type="checkbox"
                  name={key}
                  checked={on}
                  onChange={(ev) => setEnabled((prev) => prev.map((p, j) => (j === i ? ev.target.checked : p)))}
                  className="size-5 shrink-0 cursor-pointer rounded accent-accent"
                />
                <span className={cn("text-sm font-medium", on ? "text-ink" : "text-ink-muted")}>{label}</span>
              </label>
              <TimeInput
                name={`${key}_start`}
                step={15}
                aria-label={`${label}, de la`}
                defaultValue={v(`${key}_start`, window?.start ?? "08:00")}
                disabled={!on}
                invalid={Boolean(e[key])}
                aria-describedby={e[key] ? `${key}-error` : undefined}
              />
              <TimeInput
                name={`${key}_end`}
                step={15}
                aria-label={`${label}, până la`}
                defaultValue={v(`${key}_end`, window?.end ?? "22:00")}
                disabled={!on}
                invalid={Boolean(e[key])}
                aria-describedby={e[key] ? `${key}-error` : undefined}
              />
              {e[key] ? (
                <p id={`${key}-error`} className="col-span-2 text-[13px] font-medium text-danger sm:col-span-3 sm:col-start-2">
                  {e[key]}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end border-t border-line pt-6">
        {/* Sub 300px (telefon pliabil închis) marginile interioare se strâng, ca textul să nu se taie. */}
        <SubmitButton className="w-full max-[299px]:px-3 sm:w-auto">Salvează disponibilitatea</SubmitButton>
      </div>
    </form>
  );
}
