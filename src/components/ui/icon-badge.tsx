import type { LucideIcon } from "lucide-react";
import type { SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";

const TONES: Record<SubjectColor, string> = {
  blue: "bg-cat-blue/12 text-cat-blue",
  teal: "bg-cat-teal/12 text-cat-teal",
  green: "bg-cat-green/12 text-cat-green",
  amber: "bg-cat-amber/14 text-cat-amber",
  rose: "bg-cat-rose/12 text-cat-rose",
  violet: "bg-cat-violet/12 text-cat-violet",
  slate: "bg-cat-slate/12 text-cat-slate",
};

/** Pătrățel pastel cu iconiță (statistici, materii, acțiuni). */
export function IconBadge({
  icon: Icon,
  color = "violet",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  color?: SubjectColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        size === "sm" && "size-8 [&_svg]:size-4",
        size === "md" && "size-10 [&_svg]:size-[18px]",
        size === "lg" && "size-12 [&_svg]:size-5",
        TONES[color],
        className,
      )}
    >
      <Icon strokeWidth={2} />
    </span>
  );
}
