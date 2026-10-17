import type { LucideIcon } from "lucide-react";
import { IconBadge } from "@/components/ui/icon-badge";
import type { SubjectColor } from "@/lib/contracts/domain";

type StatTileProps = {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: SubjectColor;
  index?: number;
};

/** Card de statistică: etichetă, valoare mare, detaliu; iconiță pastel în dreapta. */
export function StatTile({ label, value, sub, icon, color, index = 0 }: StatTileProps) {
  return (
    <div
      className="stagger lift flex items-start justify-between gap-3 rounded-lg border border-line/70 bg-surface p-4 shadow-sm sm:p-5"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="min-w-0">
        <p className="text-[12px] leading-4 font-medium text-ink-muted sm:truncate sm:text-[13px]">{label}</p>
        <p className="mt-2 text-[22px] leading-none font-bold tracking-[-0.03em] whitespace-nowrap text-ink tabular sm:text-[30px]">{value}</p>
        <p className="mt-2 truncate text-xs text-ink-muted">{sub}</p>
      </div>
      <IconBadge icon={icon} color={color} className="hidden sm:inline-flex" />
    </div>
  );
}
