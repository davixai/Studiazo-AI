import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Antetul fiecărei pagini: supratitlu mic, titlu bold, descriere scurtă, acțiuni. */
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-[13px] font-medium text-ink-muted first-letter:uppercase">{eyebrow}</p> : null}
        <h1 className="font-display text-[26px] leading-[1.15] font-bold tracking-[-0.03em] text-ink sm:text-[32px]">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[15px] leading-6 text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
