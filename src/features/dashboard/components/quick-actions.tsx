import { CalendarPlus, FilePlus2, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { IconBadge } from "@/components/ui/icon-badge";
import type { SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";

const ACTIONS: Array<{ href: string; label: string; icon: typeof Sparkles; color: SubjectColor }> = [
  { href: "/calendar?adauga=examen", label: "Adaugă examen", icon: GraduationCap, color: "rose" },
  { href: "/calendar?adauga=tema", label: "Adaugă temă", icon: CalendarPlus, color: "amber" },
  { href: "/materii", label: "Încarcă material", icon: FilePlus2, color: "blue" },
  { href: "/asistent", label: "Întreabă AI", icon: Sparkles, color: "violet" },
];

/** Acțiuni rapide: rând de scurtături pe mobil, grilă 2×2 pe desktop. */
export function QuickActions({ variant }: { variant: "row" | "grid" }) {
  return (
    <ul className={cn(variant === "row" ? "grid grid-cols-4 gap-2" : "grid grid-cols-2 gap-3")}>
      {ACTIONS.map(({ href, label, icon, color }) => (
        <li key={href}>
          <Link
            href={href}
            className={cn(
              "group flex h-full transition-colors",
              variant === "row"
                ? "flex-col items-center gap-2 rounded-md py-1 text-center"
                : "lift items-center gap-3 rounded-md border border-line/70 bg-surface-muted/50 p-3 hover:border-line-strong hover:bg-surface",
            )}
          >
            <IconBadge icon={icon} color={color} size={variant === "row" ? "lg" : "md"} className="transition-transform group-active:scale-95" />
            <span className={cn("font-semibold text-ink", variant === "row" ? "text-[11px] leading-tight" : "text-[13px] leading-tight")}>
              {label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
