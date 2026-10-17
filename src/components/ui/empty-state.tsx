import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/** Lipsă de date: spune ce înseamnă și oferă pasul următor evident. */
export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      {icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-line bg-surface-muted text-ink-muted [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
