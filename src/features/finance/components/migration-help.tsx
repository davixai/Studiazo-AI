"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Ajutor pentru activarea Bugetului: SQL-ul migrației, de copiat în SQL Editor-ul Supabase. */
export function MigrationHelp({ sql, editorUrl }: { sql: string; editorUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line/70 bg-surface p-5 shadow-sm sm:p-6">
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-6 text-ink-soft marker:font-semibold marker:text-accent">
        <li>Apasă „Copiază SQL”.</li>
        <li>Deschide SQL Editor în Supabase, lipește și apasă „Run”.</li>
        <li>Reîncarcă pagina aceasta.</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void copy()}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copiat" : "Copiază SQL"}
        </Button>
        {editorUrl ? (
          <a href={editorUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-muted">
            Deschide SQL Editor <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <details className="text-[13px] text-ink-muted">
        <summary className="cursor-pointer font-medium">Vezi SQL-ul</summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-surface-sunken p-3 text-[12px] leading-5 text-ink-soft">{sql}</pre>
      </details>
    </div>
  );
}
