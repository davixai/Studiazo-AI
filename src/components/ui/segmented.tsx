"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; disabled?: boolean };

type SegmentedProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
};

/** Grup de opțiuni exclusive (radio nativ, navigabil cu săgețile). */
export function Segmented<T extends string>({ label, options, value, onChange, name, className }: SegmentedProps<T>) {
  const autoName = useId();
  return (
    <fieldset className={cn("inline-flex rounded-md border border-line bg-surface-muted p-0.5", className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "relative flex h-8 flex-1 cursor-pointer items-center justify-center rounded-[7px] px-3 text-[13px] font-medium whitespace-nowrap text-ink-muted transition-colors",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent",
            "has-[:checked]:bg-surface has-[:checked]:text-ink has-[:checked]:shadow-sm",
            "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
            "hover:text-ink",
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={name ?? autoName}
            value={option.value}
            checked={option.value === value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
