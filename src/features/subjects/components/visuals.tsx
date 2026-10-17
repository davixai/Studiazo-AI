import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import type { SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import { chartPoints, smoothArea, smoothLine } from "../chart-math";
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
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br font-bold tracking-[-0.02em] text-white shadow-sm",
        SUBJECT_GRADIENT[color],
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

/** Gradientul „avatarului” fiecărei culori (clase scrise complet, pentru Tailwind). */
export const SUBJECT_GRADIENT: Record<SubjectColor, string> = {
  blue: "from-cat-blue to-cat-violet",
  teal: "from-cat-teal to-cat-blue",
  green: "from-cat-green to-cat-teal",
  amber: "from-cat-amber to-cat-rose",
  rose: "from-cat-rose to-cat-violet",
  violet: "from-cat-violet to-accent-deep",
  slate: "from-cat-slate to-ink-soft",
};

/** Clase de text pe culori, pentru `currentColor` în SVG (gradientul de sub curbă). */
const TEXT: Record<SubjectColor | "accent" | "white", string> = {
  accent: "text-accent",
  white: "text-white",
  blue: "text-cat-blue",
  teal: "text-cat-teal",
  green: "text-cat-green",
  amber: "text-cat-amber",
  rose: "text-cat-rose",
  violet: "text-cat-violet",
  slate: "text-cat-slate",
};

/**
 * Grafic cu zonă și linie netedă (SVG), care „crește” de jos la apariție. Se întinde pe lățimea containerului;
 * ultimul punct e marcat. `id` unic pe pagină (pentru gradient).
 */
export function AreaChart({
  id,
  values,
  color = "accent",
  height = 64,
  className,
  label,
  fill = false,
}: {
  id: string;
  values: number[];
  color?: SubjectColor | "accent" | "white";
  height?: number;
  className?: string;
  label: string;
  /** Umple înălțimea containerului (minimum `height`), în loc de o înălțime fixă. */
  fill?: boolean;
}) {
  const width = 300;
  // Linia de zero stă puțin deasupra marginii de jos, ca să rămână vizibilă.
  const points = chartPoints(values, width, height - 3);
  const last = points[points.length - 1];
  return (
    <div
      className={cn("relative", TEXT[color], fill && "h-full flex-1", className)}
      style={fill ? { minHeight: height } : { height }}
      role="img"
      aria-label={label}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="size-full origin-bottom animate-grow-y overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={smoothArea(points, height)} fill={`url(#${id})`} />
        <path d={smoothLine(points, height)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {last ? (
        <span
          aria-hidden="true"
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 animate-pop-in rounded-full bg-current ring-4 ring-current/20 [animation-delay:600ms]"
          style={{ left: `${(last.x / width) * 100}%`, top: `${(last.y / height) * 100}%` }}
        />
      ) : null}
    </div>
  );
}

/** Inele concentrice (ca un „rezumat trimestrial”): fiecare inel e o proporție între 0 și 1. */
export function RingStack({
  rings,
  size = 168,
  thickness = 11,
  gap = 7,
  label,
}: {
  rings: Array<{ share: number | null; color: SubjectColor | "accent" }>;
  size?: number;
  thickness?: number;
  gap?: number;
  label: string;
}) {
  const center = size / 2;
  return (
    <div className="relative shrink-0 animate-pop-in" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        {rings.map((ring, i) => {
          const r = center - thickness / 2 - i * (thickness + gap);
          const c = 2 * Math.PI * r;
          const arc = (ring.share ?? 0) * c;
          return (
            <g key={i}>
              <circle cx={center} cy={center} r={r} fill="none" strokeWidth={thickness} className="stroke-white/10" />
              {arc > 0 ? (
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  strokeDasharray={`${arc} ${c}`}
                  className={STROKE[ring.color]}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Plăcuță de dată, ca o filă de calendar: ziua mare și ziua săptămânii. */
export function DateTile({ day, weekday, className }: { day: string; weekday: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-cat-violet to-accent-deep text-white shadow-sm",
        className,
      )}
    >
      <span className="pointer-events-none absolute -top-1/2 -right-1/2 size-full rounded-full bg-white/15" />
      <span className="relative text-[15px] leading-none font-extrabold tabular">{day}</span>
      <span className="relative mt-0.5 text-[9px] font-semibold tracking-wide uppercase opacity-85">{weekday}</span>
    </span>
  );
}
