"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TimeInputProps = {
  /** Id-ul selectorului de oră (pentru `<label htmlFor>`). */
  id?: string;
  /** Numele câmpului din formular; valoarea trimisă e „HH:MM”. */
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Pasul minutelor (implicit 5). */
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));

function split(value: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  return m ? { hour: m[1], minute: m[2] } : { hour: "08", minute: "00" };
}

/**
 * Oră pe 24 de ore (ora + minutul), la fel pe orice telefon sau calculator.
 * `<input type="time">` urmează limba sistemului și poate arăta AM/PM: „12:00 AM” e miezul nopții, nu prânzul.
 */
export function TimeInput({
  id,
  name,
  defaultValue = "08:00",
  value,
  onChange,
  step = 5,
  disabled,
  invalid,
  className,
  ...aria
}: TimeInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const { hour, minute } = split(current);
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => pad(i * step));
  // O oră salvată în afara pasului (ex. 10:07, de la asistent) rămâne aleasă, nu se pierde.
  if (!minutes.includes(minute)) {
    minutes.push(minute);
    minutes.sort();
  }

  const set = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const selectClass =
    "h-full cursor-pointer appearance-none bg-transparent text-center text-ink focus:outline-none disabled:cursor-not-allowed tabular";

  return (
    <div
      role="group"
      aria-label={aria["aria-label"]}
      className={cn(
        "flex h-11 w-full items-center gap-0.5 rounded-md border border-line-strong bg-surface-sunken px-2 text-base shadow-xs sm:h-10 sm:text-sm",
        "transition-[border-color,box-shadow] duration-150 hover:border-ink-faint",
        "focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15",
        invalid && "border-danger focus-within:border-danger focus-within:ring-danger/15",
        disabled && "cursor-not-allowed bg-surface-muted text-ink-muted hover:border-line-strong",
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
      <select
        id={id}
        value={hour}
        onChange={(ev) => set(`${ev.target.value}:${minute}`)}
        disabled={disabled}
        // Fără aria-label propriu, selectorul de oră primește numele din eticheta câmpului (<label htmlFor>).
        aria-label={aria["aria-label"] ? `${aria["aria-label"]}, ora` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        className={cn(selectClass, "min-w-0 flex-1 pr-1 text-right [text-align-last:right]")}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="font-medium text-ink-muted">
        :
      </span>
      <select
        value={minute}
        onChange={(ev) => set(`${hour}:${ev.target.value}`)}
        disabled={disabled}
        aria-label={aria["aria-label"] ? `${aria["aria-label"]}, minutul` : "Minutul"}
        aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        className={cn(selectClass, "min-w-0 flex-1 pl-1 text-left [text-align-last:left]")}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
