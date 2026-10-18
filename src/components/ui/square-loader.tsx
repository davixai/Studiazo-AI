import { cn } from "@/lib/utils";

/** Patru pătrate care se rotesc; pur decorativ, textul de stare stă lângă el. */
export function SquareLoader({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("square-loader", className)}>
      <span className="square-loader__square" />
      <span className="square-loader__square" />
      <span className="square-loader__square" />
      <span className="square-loader__square" />
    </div>
  );
}
