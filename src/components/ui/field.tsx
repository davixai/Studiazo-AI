import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border border-line-strong bg-surface text-ink shadow-xs placeholder:text-ink-faint " +
  "transition-[border-color,box-shadow] duration-150 " +
  "hover:border-ink-faint focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

/** Id-urile pentru aria-describedby, în funcție de ce mesaje sunt afișate. */
export function describedBy(id: string, { hint, error }: { hint?: ReactNode; error?: ReactNode }) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        {label}
        {optional ? <span className="text-xs font-normal text-ink-muted">Opțional</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-[13px] leading-5 text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] leading-5 font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11 px-3.5 sm:h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 px-3.5 py-2.5 leading-6", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-11 appearance-none pr-10 pl-3.5 sm:h-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-muted"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
