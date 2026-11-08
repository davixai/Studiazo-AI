import { Brain } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MemoryNote } from "../tools";

/** Sub răspuns: ce a reținut sau a uitat asistentul, cu drum spre Profil, unde studentul vede și șterge tot. */
export function MemoryNotes({ notes, className = "sm:pl-11" }: { notes: MemoryNote[]; className?: string }) {
  if (notes.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-1.5", className)} aria-label="Memoria asistentului">
      {notes.map((note, i) => (
        <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted animate-fade-in">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 py-1 font-medium text-accent-ink">
            <Brain className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {note.action === "remembered" ? "Am reținut" : "Am uitat"}: {note.text}
            </span>
          </span>
          <Link href="/profil#memorie" className="font-semibold text-accent hover:underline">
            Ce știu despre tine
          </Link>
        </li>
      ))}
    </ul>
  );
}
