import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[34px] leading-[1.1] font-medium tracking-[-0.02em]">{title}</h1>
      {description ? <p className="mt-3 text-[15px] leading-6 text-ink-soft">{description}</p> : null}
    </div>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return <p className="mt-8 text-center text-sm text-ink-muted">{children}</p>;
}
