import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const styles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: "border-accent-line bg-accent-soft text-accent-ink", icon: <Info /> },
  success: { box: "border-success/20 bg-success-soft text-success", icon: <CircleCheck /> },
  warning: { box: "border-warning/20 bg-warning-soft text-warning", icon: <TriangleAlert /> },
  danger: { box: "border-danger/20 bg-danger-soft text-danger", icon: <CircleAlert /> },
};

type AlertProps = { tone?: Tone; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string };

/** Mesaj inline. Erorile folosesc role="alert" ca să fie anunțate de cititoarele de ecran. */
export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const s = styles[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", s.box, className)}
    >
      {s.icon}
      <div className="min-w-0 flex-1 leading-5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "text-ink-soft")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
