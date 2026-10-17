import { cn } from "@/lib/utils";

/** Semnul StudIA: o filă de caiet cu un punct de accent. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <path d="M10 9.5h9.5a3 3 0 0 1 3 3V22.5H13a3 3 0 0 1-3-3v-10Z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 13.5h5.5M13.5 17h3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="22.5" cy="22.5" r="3.25" fill="var(--color-accent)" stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-7" />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
        Stud<span className="text-accent">IA</span>
      </span>
    </span>
  );
}
