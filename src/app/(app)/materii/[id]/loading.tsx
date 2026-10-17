import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Se încarcă materia…</span>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-72 max-w-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-md sm:w-56" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}
