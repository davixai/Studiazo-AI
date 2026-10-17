"use client";

import { FileUp, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { countLabel } from "@/features/subjects/format";
import { cn } from "@/lib/utils";
import { PDF_MIME, type MaterialKind } from "../schemas";
import { PdfList, type MaterialItem } from "./pdf-list";
import { UploadQueue, useUploadQueue } from "./upload-queue";

/** Tipul unui fișier ales sau tras în pagină; null = format neacceptat aici. */
function kindOf(file: File): MaterialKind | null {
  if (file.type === PDF_MIME || /\.pdf$/i.test(file.name)) return "pdf";
  return null;
}

export function MaterialsPanel({ subjectId, materials }: { subjectId: string; materials: MaterialItem[] }) {
  const queue = useUploadQueue(subjectId);
  const pdfInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const pdfs = materials.filter((m) => m.kind === "pdf");
  const empty = materials.length === 0 && queue.items.length === 0;

  function accept(list: FileList | null) {
    if (!list?.length) return;
    const files = [...list];
    const accepted = files.flatMap((file) => {
      const kind = kindOf(file);
      return kind ? [{ file, kind }] : [];
    });
    const skipped = files.length - accepted.length;
    setRejected(skipped > 0 ? `${countLabel(skipped, "fișier", "fișiere")} ${skipped === 1 ? "nu este PDF și a fost ignorat" : "nu sunt PDF și au fost ignorate"}.` : null);
    if (accepted.length) queue.add(accepted);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Încarcă materiale"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-surface p-5 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 sm:p-7",
          dragging ? "border-accent bg-accent-soft/60 shadow-md ring-4 ring-accent/10" : "border-line/70 pointer-fine:border-dashed pointer-fine:border-line-strong",
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "mb-4 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-300 ease-out [&_svg]:size-6",
              dragging && "-translate-y-1 scale-110",
            )}
          >
            <UploadCloud aria-hidden="true" strokeWidth={1.8} />
          </div>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink sm:text-[17px]">
            {dragging ? "Lasă fișierele aici" : empty ? "Încarcă primul curs" : "Adaugă materiale"}
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-muted">
            <span className="pointer-coarse:hidden">Trage aici cursurile în PDF sau alege-le din calculator.</span>
            <span className="hidden pointer-coarse:inline">Alege cursurile în PDF din telefon. Pot fi mai multe deodată.</span>
          </p>

          <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="lg" onClick={() => pdfInput.current?.click()} className="w-full sm:w-auto">
              <FileUp aria-hidden="true" />
              Încarcă PDF
            </Button>
          </div>
          <p className="mt-4 text-[12px] leading-5 text-ink-faint">PDF cu text selectabil · maximum 20 MB per fișier</p>
        </div>

        <input
          ref={pdfInput}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = ""; // permite alegerea aceluiași fișier din nou
          }}
        />
      </section>

      {rejected ? (
        <p role="alert" className="-mt-3 text-[13px] font-medium text-warning">
          {rejected}
        </p>
      ) : null}

      <UploadQueue items={queue.items} onRetry={queue.retry} onDismiss={queue.dismiss} onCancel={queue.cancelCurrent} />

      {pdfs.length > 0 ? (
        <section aria-labelledby="pdf-heading" className="flex flex-col gap-3">
          <h3 id="pdf-heading" className="flex items-baseline gap-2 text-[15px] font-bold tracking-[-0.015em] text-ink">
            Cursuri PDF
            <span className="tabular text-[13px] font-medium text-ink-muted">{pdfs.length}</span>
          </h3>
          <PdfList items={pdfs} />
        </section>
      ) : null}
    </div>
  );
}
