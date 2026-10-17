import { cn } from "@/lib/utils";

type KindPickerProps<T extends string> = {
  name: string;
  legend: string;
  kinds: readonly T[];
  labels: Record<T, string>;
  defaultValue: T;
  error?: string;
  className?: string;
  onChange?: (kind: T) => void;
};

/** Alegerea tipului (activitate sau termen): butoane-radio native, navigabile cu săgețile. */
export function KindPicker<T extends string>({ name, legend, kinds, labels, defaultValue, error, className, onChange }: KindPickerProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      <div className={cn("grid gap-1.5", className)}>
        {kinds.map((kind) => (
          <label
            key={kind}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface px-1 text-[13px] font-medium text-ink-soft transition-colors",
              "hover:border-ink-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-ink",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
            )}
          >
            <input
              type="radio"
              name={name}
              value={kind}
              defaultChecked={defaultValue === kind}
              onChange={() => onChange?.(kind)}
              className="sr-only"
            />
            {labels[kind]}
          </label>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p> : null}
    </fieldset>
  );
}
