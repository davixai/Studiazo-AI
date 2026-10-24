// Fără zod: componentele de client importă de aici, ca biblioteca să nu ajungă în browser.
import type { TaskKind } from "@/lib/contracts/domain";

/** Starea formularului de activitate. `warning` = se suprapune; studentul poate salva totuși. */
export type EventFormState = {
  status: "idle" | "error" | "warning";
  message?: string;
  fieldErrors?: Record<string, string>;
  conflicts?: string[];
  values?: Record<string, string>;
};

export const initialEventFormState: EventFormState = { status: "idle" };

export type ActionResult = { ok: true } | { ok: false; message: string };

/** Probele (examen, colocviu, test) au durată și loc; temele și proiectele au doar termen. */
export const TIMED_TASK_KINDS: readonly TaskKind[] = ["examen", "colocviu", "test"];

export type TaskFormState = Omit<EventFormState, "conflicts" | "status"> & { status: "idle" | "error" };
export const initialTaskFormState: TaskFormState = { status: "idle" };
