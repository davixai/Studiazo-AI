import { ArrowRight, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import type { LearningStats } from "@/lib/progress/streak";
import { formatWeekdayShort } from "@/lib/time/format";
import { dayBounds } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

function streakLabel(n: number) {
  if (n === 1) return "zi la rând";
  return n < 20 ? "zile la rând" : "de zile la rând";
}

function streakMessage(stats: LearningStats) {
  if (stats.currentStreak === 0) return "Începe-ți streak-ul azi: o sesiune scurtă sau un test e de ajuns.";
  if (!stats.activeToday) return "Învață puțin azi ca să-ți păstrezi flacăra aprinsă.";
  return "Ai învățat azi. Ține flacăra aprinsă și mâine!";
}

/**
 * Card mare cu streak-ul — singurul element cu fundal plin de accent.
 * Cu `href` (pe Acasă) tot cardul duce la pagina Progres, cu insignele și restul detaliilor.
 */
export function StreakCard({ stats, index = 0, href }: { stats: LearningStats; index?: number; href?: string }) {
  const toNext = stats.nextBadge ? stats.nextBadge - stats.currentStreak : 0;
  const progress = stats.nextBadge ? Math.min(1, stats.currentStreak / stats.nextBadge) : 1;

  const body = (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-white/[0.06]" />

      <div className="relative flex items-center justify-between">
        <h2 id="streak-title" className="text-sm font-semibold text-white/85">
          Streak curent
        </h2>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">Record: {stats.bestStreak}</span>
      </div>

      <div className="relative mt-6 flex items-center gap-5">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <span aria-hidden="true" className={cn("absolute inset-0 rounded-full bg-[#ffb547]/30 blur-md", stats.currentStreak > 0 && "animate-glow")} />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
            <Flame
              className={cn("size-8 origin-bottom", stats.currentStreak > 0 ? "animate-flame fill-[#ffb547] text-[#ffd27a]" : "text-white/70")}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>
        </div>
        <p>
          <span className="block text-[44px] leading-none font-extrabold tracking-[-0.04em] tabular">{stats.currentStreak}</span>
          <span className="mt-1 block text-sm font-medium text-white/80">{streakLabel(stats.currentStreak)}</span>
        </p>
      </div>

      <p className="relative mt-5 text-[13px] leading-5 text-white/85">{streakMessage(stats)}</p>

      {stats.nextBadge ? (
        <div className="relative mt-4">
          <div className="flex justify-between text-[11px] font-semibold text-white/75">
            <span>Următoarea insignă: {stats.nextBadge} zile</span>
            <span>{toNext === 1 ? "încă o zi" : `încă ${toNext} zile`}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full origin-left animate-fill-x rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : null}

      {href ? (
        <span className="relative mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
          Insigne și progres <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  const className = "stagger relative block overflow-hidden rounded-lg bg-brand p-6 text-white shadow-accent";
  const style = { "--i": index } as React.CSSProperties;
  return href ? (
    <Link href={href} aria-labelledby="streak-title" className={cn(className, "lift active:scale-[0.99]")} style={style}>
      {body}
    </Link>
  ) : (
    <section aria-labelledby="streak-title" className={className} style={style}>
      {body}
    </section>
  );
}

/** Rând compact pentru mobil: flacără + număr + ultimele 7 zile ca puncte; duce la pagina Progres. */
export function StreakStrip({ stats }: { stats: LearningStats }) {
  return (
    <Link
      href="/progres"
      aria-label={`Streak: ${stats.currentStreak} ${streakLabel(stats.currentStreak)}. Vezi progresul și insignele`}
      className="stagger flex items-center gap-3 rounded-lg border border-line/70 bg-surface p-4 shadow-sm active:scale-[0.99] sm:gap-4"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <span className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-[#fff3e0]">
        <Flame
          className={cn("size-6 origin-bottom", stats.currentStreak > 0 ? "animate-flame fill-[#ff9f1c] text-[#f08a00]" : "text-ink-faint")}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">
          {stats.currentStreak} {streakLabel(stats.currentStreak)}
        </p>
        <p className="truncate text-xs text-ink-muted">{stats.activeToday ? "Ai învățat azi" : "Învață azi ca să-l păstrezi"}</p>
      </div>
      <ol className="flex gap-1.5" aria-label="Ultimele 7 zile">
        {stats.last7Days.map((d) => (
          <li key={d.date} className="flex flex-col items-center gap-1">
            <span
              className={cn("size-2.5 rounded-full", d.active ? "bg-accent" : "bg-surface-sunken")}
              aria-label={`${formatWeekdayShort(dayBounds(d.date).start)}: ${d.active ? "activ" : "inactiv"}`}
            />
            <span className="text-[9px] font-semibold text-ink-faint uppercase" aria-hidden="true">
              {formatWeekdayShort(dayBounds(d.date).start).slice(0, 1)}
            </span>
          </li>
        ))}
      </ol>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
    </Link>
  );
}
