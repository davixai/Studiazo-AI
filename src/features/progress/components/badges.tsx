import { Award, Crown, Flame, Lock, Medal, Star, Trophy, type LucideIcon } from "lucide-react";
import type { BadgeMilestone, LearningStats } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

const BADGE_STYLE: Record<BadgeMilestone, { icon: LucideIcon; bg: string; fg: string; name: string }> = {
  3: { icon: Flame, bg: "from-[#ffb547] to-[#ff8a3d]", fg: "text-white", name: "Scânteie" },
  7: { icon: Star, bg: "from-[#7b6cf5] to-[#5b4be0]", fg: "text-white", name: "O săptămână" },
  14: { icon: Medal, bg: "from-[#34c38f] to-[#1f9a6b]", fg: "text-white", name: "Două săptămâni" },
  30: { icon: Award, bg: "from-[#4f8ff7] to-[#2f6be0]", fg: "text-white", name: "O lună" },
  60: { icon: Trophy, bg: "from-[#f06b9a] to-[#d4456a]", fg: "text-white", name: "Neoprit" },
  100: { icon: Crown, bg: "from-[#f5c84b] to-[#d9a21b]", fg: "text-white", name: "Legendă" },
};

/** Insignele de etapă (3–100 de zile). Deblocate după cel mai lung streak; `detailed` arată și numele și cât mai e. */
export function BadgesGrid({ stats, detailed = false }: { stats: LearningStats; detailed?: boolean }) {
  const unlocked = stats.badges.filter((b) => b.unlocked).length;
  return (
    <div>
      <p className="text-[13px] text-ink-muted">
        <span className="text-[22px] font-bold tracking-[-0.03em] text-ink tabular">{unlocked}</span>
        <span className="font-semibold text-ink"> / {stats.badges.length}</span> deblocate
      </p>
      <ul className={cn("mt-4 grid grid-cols-3 sm:grid-cols-6", detailed ? "gap-x-3 gap-y-5" : "gap-3")}>
        {stats.badges.map((badge, i) => {
          const style = BADGE_STYLE[badge.days];
          const Icon = badge.unlocked ? style.icon : Lock;
          const isNext = badge.days === stats.nextBadge;
          const left = badge.days - stats.currentStreak;
          return (
            <li key={badge.days} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex animate-pop-in items-center justify-center rounded-full",
                  detailed ? "size-14" : "size-12",
                  badge.unlocked ? `bg-linear-to-br ${style.bg} ${style.fg} shadow-md` : "bg-surface-sunken text-ink-faint",
                  detailed && isNext && "ring-2 ring-accent-line ring-offset-2 ring-offset-surface",
                )}
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className={cn("text-[11px] leading-tight font-bold", badge.unlocked ? "text-ink" : "text-ink-muted")}>
                {badge.days} zile
              </span>
              {detailed ? (
                <span className={cn("text-[11px] leading-tight", isNext ? "font-semibold text-accent-ink" : "text-ink-muted")}>
                  {badge.unlocked ? style.name : isNext ? (left === 1 ? "încă o zi" : `încă ${left} zile`) : style.name}
                </span>
              ) : null}
              <span className="sr-only">
                {style.name}: {badge.unlocked ? "deblocată" : "blocată"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
