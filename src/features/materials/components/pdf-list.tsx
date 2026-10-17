"use client";

import { ExternalLink, FileText, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MATERIAL_STATUS_LABELS } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";
import { formatBytes, formatPages } from "../format";
import type { Material } from "../types";
import { DeleteMaterial, RetryProcessing, StudiedToggle } from "./material-actions";

/** Materialul, cu eticheta „adăugat …” calculată pe server și starea „blocat în procesare”. */
export type MaterialItem = Material & { addedLabel: string; stale: boolean };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function PdfList({ items }: { items: MaterialItem[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((m, i) => (
        <li key={m.id} className="stagger" style={delay(Math.min(i, 8))}>
          <PdfRow m={m} />
        </li>
      ))}
    </ul>
  );
}

function PdfRow({ m }: { m: MaterialItem }) {
  const target = { id: m.id, subjectId: m.subjectId, title: m.title };
  const href = `/materii/${m.subjectId}/fisier/${m.id}`;
  const processing = m.status === "in_procesare" || m.status === "incarcat";
  const problem = m.status === "fara_text" || m.status === "esuat";
  const meta = [m.pageCount ? formatPages(m.pageCount) : null, formatBytes(m.sizeBytes), `adăugat ${m.addedLabel}`].filter(Boolean);

  return (
    <article className="rounded-lg border border-line/70 bg-surface p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm sm:p-5">
      <div className="flex gap-3.5 sm:gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md sm:size-11 [&_svg]:size-5",
            m.status === "esuat" ? "bg-danger-soft text-danger" : m.status === "fara_text" ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent",
          )}
        >
          {problem ? <FileWarning aria-hidden="true" strokeWidth={1.8} /> : <FileText aria-hidden="true" strokeWidth={1.8} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <h3 className="min-w-0 text-[15px] leading-snug font-semibold break-words text-ink">
              <a href={href} target="_blank" rel="noopener" className="rounded-sm hover:text-accent">
                {m.title}
                <span className="sr-only"> (se deschide într-o filă nouă)</span>
              </a>
            </h3>
            <StatusBadge m={m} />
          </div>
          <p className="tabular mt-1 text-[13px] text-ink-muted">{meta.join(" · ")}</p>
          {m.statusMessage && m.status !== "procesat" ? (
            <p className={cn("mt-2 text-[13px] leading-5", m.status === "esuat" ? "text-danger" : "text-warning")}>{m.statusMessage}</p>
          ) : m.statusMessage ? (
            <p className="mt-2 text-[13px] leading-5 text-ink-muted">{m.statusMessage}</p>
          ) : null}
          {processing ? (
            <p aria-live="polite" className="mt-2 text-[13px] text-ink-muted">
              {m.stale ? "Procesarea durează neobișnuit de mult." : "Extragem textul pe pagini. Poate dura câteva secunde."}
            </p>
          ) : null}
        </div>
      </div>

      {/* Pe telefon acțiunile ocupă toată lățimea cardului; de la sm sunt aliniate cu textul (44px + 16px). */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:pl-15">
        <a href={href} target="_blank" rel="noopener" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          <ExternalLink aria-hidden="true" />
          Deschide
        </a>
        {!problem && !processing ? <StudiedToggle target={target} studied={Boolean(m.studiedAt)} /> : null}
        {m.status === "esuat" || (processing && m.stale) ? <RetryProcessing target={target} /> : null}
        <span className="ml-auto">
          <DeleteMaterial target={target} kind="pdf" />
        </span>
      </div>
    </article>
  );
}

function StatusBadge({ m }: { m: MaterialItem }) {
  const label = MATERIAL_STATUS_LABELS[m.status];
  if (m.status === "in_procesare" || m.status === "incarcat") {
    return (
      <Badge tone="accent" className="self-start">
        <Spinner className="size-3" />
        {label}
      </Badge>
    );
  }
  const tone = m.status === "procesat" ? "success" : m.status === "fara_text" ? "warning" : "danger";
  return (
    <Badge tone={tone} className="self-start">
      {label}
    </Badge>
  );
}
