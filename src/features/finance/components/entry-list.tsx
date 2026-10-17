"use client";

import { Copy, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import { copyPreviousMonth, deleteEntry } from "../actions";
import { categoryInfo } from "../categories";
import { formatLei, type FinanceEntry } from "../stats";

/** Înregistrările lunii: venituri întâi, apoi cheltuieli, fiecare cu buton de ștergere. */
export function EntryList({ entries }: { entries: FinanceEntry[] }) {
  const sorted = [...entries].sort((a, b) => (a.kind === b.kind ? b.amount - a.amount : a.kind === "venit" ? -1 : 1));
  return (
    <ul className="divide-y divide-line/60">
      {sorted.map((e) => (
        <EntryRow key={e.id} entry={e} />
      ))}
    </ul>
  );
}

function EntryRow({ entry }: { entry: FinanceEntry }) {
  const [state, action, pending] = useActionState(deleteEntry, initialFormState);
  const info = categoryInfo(entry.category);
  const income = entry.kind === "venit";
  return (
    <li className={cn("flex items-center gap-3 py-2.5 transition-opacity", pending && "opacity-50")}>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-base">
        {info.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{info.label}</p>
        {entry.note ? <p className="truncate text-[12px] text-ink-muted">{entry.note}</p> : null}
        {state.status === "error" ? <p className="text-[12px] text-danger">{state.message}</p> : null}
      </div>
      <p className="shrink-0 text-[14px] font-semibold text-ink tabular">
        <span className="sr-only">{income ? "Venit" : "Cheltuială"}: </span>
        <span aria-hidden="true" className={income ? "text-success" : "text-ink-muted"}>
          {income ? "+" : "−"}
        </span>
        {formatLei(entry.amount)}
      </p>
      <form action={action}>
        <input type="hidden" name="id" value={entry.id} />
        <Button type="submit" variant="ghost" size="icon" className="size-8 text-ink-faint hover:text-danger" aria-label={`Șterge ${info.label} ${formatLei(entry.amount)}`} disabled={pending}>
          <Trash2 aria-hidden="true" />
        </Button>
      </form>
    </li>
  );
}

/** Luna goală: copiază înregistrările lunii trecute (chiria, bursa și abonamentele se repetă de obicei). */
export function CopyPreviousMonth({ month }: { month: string }) {
  const [state, action, pending] = useActionState(copyPreviousMonth, initialFormState);
  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input type="hidden" name="month" value={month} />
      <Button type="submit" variant="secondary" size="sm" loading={pending}>
        <Copy aria-hidden="true" /> Copiază din luna trecută
      </Button>
      {state.status === "error" && state.message ? <Alert tone="warning">{state.message}</Alert> : null}
    </form>
  );
}
