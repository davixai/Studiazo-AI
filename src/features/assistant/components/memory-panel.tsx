"use client";

import { Activity, Brain, MessageSquareText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { IconBadge } from "@/components/ui/icon-badge";
import { deleteMemory } from "../actions";

type Props = {
  memories: Array<{ id: string; content: string }>;
  /** Propozițiile despre activitatea reală, la persoana a doua (gol = prea puține date). */
  habits: string[];
  days: number;
};

/** Profil: ce știe asistentul despre student. Ce i-a spus se poate șterge; ce observă se calculează din activitate. */
export function MemoryPanel({ memories: initial, habits, days }: Props) {
  const [memories, setMemories] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = (id: string) => {
    setError(null);
    setRemoving(id);
    startTransition(async () => {
      const result = await deleteMemory({ id });
      if (result.ok) setMemories((list) => list.filter((m) => m.id !== id));
      else setError(result.message);
      setRemoving(null);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <IconBadge icon={Brain} color="violet" />
        <div>
          <h2 className="text-[15px] font-semibold">Ce știe asistentul despre tine</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-ink-muted">
            Ce i-ai spus în chat și ce observă din felul în care înveți. Le folosește ca să te ajute; poți șterge orice.
          </p>
        </div>
      </div>

      <section aria-labelledby="memorie-spus" className="flex flex-col gap-3">
        <h3 id="memorie-spus" className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <MessageSquareText className="size-4 text-accent" aria-hidden="true" />
          Ce i-ai spus
        </h3>
        {memories.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-md border border-line/70 bg-surface-muted/50 py-2 pr-1.5 pl-3.5 text-sm text-ink transition-opacity"
                style={{ opacity: removing === m.id ? 0.5 : 1 }}
              >
                <span className="min-w-0 flex-1 leading-6">{m.content}</span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  disabled={removing !== null}
                  aria-label={`Șterge: ${m.content}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-ink-muted">
            Încă nimic. Spune-i în{" "}
            <Link href="/asistent" className="font-medium text-accent hover:underline">
              chat
            </Link>{" "}
            lucruri despre tine, de exemplu „lucrez sâmbăta” sau „înțeleg mai bine cu exemple”, și le ține minte.
          </p>
        )}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>

      <section aria-labelledby="memorie-observa" className="flex flex-col gap-3">
        <h3 id="memorie-observa" className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <Activity className="size-4 text-accent" aria-hidden="true" />
          Ce observă din activitatea ta, în ultimele {days} de zile
        </h3>
        {habits.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm leading-6 text-ink">
            {habits.map((h) => (
              <li key={h} className="flex gap-2.5">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{h.charAt(0).toLocaleUpperCase("ro") + h.slice(1)}.</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-ink-muted">
            După câteva sesiuni de studiu bifate sau teste rezolvate, vede singur când și cât înveți și îți propune ore pe măsură.
          </p>
        )}
      </section>
    </div>
  );
}
