import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import type { SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import { subjectInitials } from "../overview";

// Piese vizuale comune pentru paginile de materii (panou bento). Doar tokeni și animațiile din globals.css.

/** Clasele de contur SVG pe culori (scrise complet, ca Tailwind să le găsească). */
const STROKE: Record<SubjectColor | "accent", string> = {
  accent: "stroke-accent",
  blue: "stroke-cat-blue",
  teal: "stroke-cat-teal",
  green: "stroke-cat-green",
  amber: "stroke-cat-amber",
  rose: "stroke-cat-rose",
  violet: "stroke-cat-violet",
  slate: "stroke-cat-slate",
};

/** Inel de progres. `share` între 0 și 1 (null = nimic de măsurat). Apare cu o mică animație „pop”. */
export function Donut({
  share,
  size = 120,
  thickness = 12,
  color = "accent",
  children,
  label,
  onAccent = false,
}: {
  share: number | null;
  size?: number;
  thickness?: number;
  color?: SubjectColor | "accent";
  children?: ReactNode;
  label: string;
  /** Pe un card violet: inel alb pe fundal alb transparent. */
  onAccent?: boolean;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const arc = share === null ? 0 : share * c;
  return (
    <div className="relative shrink-0 animate-pop-in" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className={onAccent ? "stroke-white/20" : "stroke-surface-sunken"} />
        {arc > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
            className={onAccent ? "stroke-white" : STROKE[color]}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Bară orizontală care se umple la apariție (animate-fill-x, decalată după `index`). */
export function FillBar({ share, color, index = 0, className }: { share: number; color: SubjectColor | "accent"; index?: number; className?: string }) {
  const fill = color === "accent" ? "bg-accent" : SUBJECT_COLOR_CLASSES[color].bar;
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface-sunken", className)}>
      {share > 0 ? (
        <div
          className={cn("h-full origin-left animate-fill-x rounded-full", fill)}
          style={{ width: `${Math.max(3, share * 100)}%`, animationDelay: `${120 + index * 90}ms` }}
        />
      ) : null}
    </div>
  );
}

/** „Avatarul” materiei: inițialele pe culoarea ei. */
export function SubjectAvatar({ name, color, size = "md" }: { name: string; color: SubjectColor; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-bold tracking-[-0.02em] text-white shadow-sm",
        SUBJECT_COLOR_CLASSES[color].bar,
        size === "lg" ? "size-16 rounded-xl text-[22px] sm:size-20 sm:text-[26px]" : "size-11 rounded-md text-[15px]",
      )}
    >
      <span className="pointer-events-none absolute -top-1/3 -right-1/3 size-full rounded-full bg-white/15" />
      <span className="relative">{subjectInitials(name)}</span>
    </span>
  );
}

/** Antetul unui card din panou: titlu, subtitlu și, opțional, un buton pătrat „deschide” în dreapta. */
export function PanelHeader({ title, description, href, hrefLabel, id }: { title: string; description?: string; href?: string; hrefLabel?: string; id?: string }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-bold tracking-[-0.015em] text-ink">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-[12px] leading-5 text-ink-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          aria-label={hrefLabel ?? title}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      ) : null}
    </header>
  );
}

/** Card de panou, cu intrare în cascadă. */
export function Panel({ index = 0, className, children, ...rest }: { index?: number; className?: string; children: ReactNode } & React.ComponentProps<"section">) {
  return (
    <section
      {...rest}
      className={cn("stagger flex flex-col gap-4 rounded-lg border border-line/70 bg-surface p-5 shadow-sm", className)}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </section>
  );
}
