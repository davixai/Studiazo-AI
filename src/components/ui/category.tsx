import type { EventKind, SubjectColor, TaskKind } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";

// Culorile de categorie apar discret: punct, bară fină, fundal foarte deschis.

export const SUBJECT_COLOR_CLASSES: Record<SubjectColor, { dot: string; bar: string; soft: string; text: string }> = {
  blue: { dot: "bg-cat-blue", bar: "bg-cat-blue", soft: "bg-cat-blue/8", text: "text-cat-blue" },
  teal: { dot: "bg-cat-teal", bar: "bg-cat-teal", soft: "bg-cat-teal/8", text: "text-cat-teal" },
  green: { dot: "bg-cat-green", bar: "bg-cat-green", soft: "bg-cat-green/8", text: "text-cat-green" },
  amber: { dot: "bg-cat-amber", bar: "bg-cat-amber", soft: "bg-cat-amber/10", text: "text-cat-amber" },
  rose: { dot: "bg-cat-rose", bar: "bg-cat-rose", soft: "bg-cat-rose/8", text: "text-cat-rose" },
  violet: { dot: "bg-cat-violet", bar: "bg-cat-violet", soft: "bg-cat-violet/8", text: "text-cat-violet" },
  slate: { dot: "bg-cat-slate", bar: "bg-cat-slate", soft: "bg-cat-slate/8", text: "text-cat-slate" },
};

/** Culoarea implicită când activitatea nu are materie. */
export const EVENT_KIND_COLOR: Record<EventKind, SubjectColor> = {
  curs: "blue",
  seminar: "teal",
  laborator: "violet",
  studiu: "blue",
  job: "slate",
  sport: "green",
  personal: "slate",
  pauza: "slate",
};

export const TASK_KIND_COLOR: Record<TaskKind, SubjectColor> = {
  tema: "amber",
  proiect: "violet",
  examen: "rose",
  colocviu: "rose",
  test: "rose",
  altul: "slate",
};

export function ColorDot({ color, className }: { color: SubjectColor; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", SUBJECT_COLOR_CLASSES[color].dot, className)} />;
}
