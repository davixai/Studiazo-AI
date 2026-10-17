"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select } from "@/components/ui/field";
import { initialFormState, type FormState } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import { addEntry } from "../actions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type FinanceKind } from "../categories";

/** Formularul de adăugare: tipul (cheltuială/venit), categoria, suma și o notiță opțională. */
export function EntryForm({ month }: { month: string }) {
  const [kind, setKind] = useState<FinanceKind>("cheltuiala");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await addEntry(prev, formData);
    // După o salvare reușită golim suma și notița; tipul și categoria rămân pentru următoarea înregistrare.
    if (result.status === "success") {
      setAmount("");
      setNote("");
    }
    return result;
  }, initialFormState);
  const errors = state.fieldErrors ?? {};
  const categories = kind === "venit" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="month" value={month} />

      <fieldset>
        <legend className="sr-only">Tip</legend>
        <div className="grid grid-cols-2 gap-1.5 rounded-md bg-surface-sunken p-1">
          {(
            [
              ["cheltuiala", "Cheltuială"],
              ["venit", "Venit"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-ink-muted transition-colors",
                "has-[:checked]:bg-surface has-[:checked]:text-ink has-[:checked]:shadow-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
              )}
            >
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              <span aria-hidden="true" className={cn("size-2 rounded-full", value === "venit" ? "bg-viz-income" : "bg-viz-expense")} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4">
        <Field id="fin-category" label="Categorie" error={errors.category}>
          <Select
            id="fin-category"
            name="category"
            key={kind}
            defaultValue={state.values?.kind === kind ? state.values?.category : categories[0].id}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describedBy("fin-category", { error: errors.category })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="fin-amount" label="Sumă (lei)" error={errors.amount}>
          <Input
            id="fin-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("fin-amount", { error: errors.amount })}
            className="tabular"
          />
        </Field>
      </div>

      <Field id="fin-note" label="Notiță" optional error={errors.note}>
        <Input
          id="fin-note"
          name="note"
          maxLength={120}
          placeholder={kind === "venit" ? "ex. bursă de merit" : "ex. chirie împărțită cu un coleg"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={describedBy("fin-note", { error: errors.note })}
        />
      </Field>

      {state.status === "error" && state.message ? <Alert tone="danger">{state.message}</Alert> : null}
      {state.status === "success" && state.message ? (
        <p role="status" className="text-[13px] font-medium text-success">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        <Plus aria-hidden="true" />
        {kind === "venit" ? "Adaugă venitul" : "Adaugă cheltuiala"}
      </Button>
    </form>
  );
}
