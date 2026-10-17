import { cn } from "@/lib/utils";

/** Bloc de încărcare. Pulsul este oprit automat de preferința pentru animații reduse. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-sunken", className)} />;
}
