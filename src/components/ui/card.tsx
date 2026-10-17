import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-lg border border-line bg-surface shadow-xs", className)} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
  className?: string;
};

/** Antet de secțiune: titlu mic, sobru; acțiunea secundară în dreapta. */
export function CardHeader({ title, description, action, id, className }: CardHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 pt-4 pb-5 sm:px-6", className)} {...props} />;
}
