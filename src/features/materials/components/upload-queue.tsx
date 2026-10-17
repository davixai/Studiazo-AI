"use client";

import { CircleAlert, CircleCheck, FileText, ImageIcon, RotateCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { discardUpload, finishUpload, startUpload } from "../actions";
import { formatBytes } from "../format";
import { checkFile, hasPdfSignature, PDF_MIME, titleFromFileName, type MaterialKind } from "../schemas";
import { readHead, uploadToSignedUrl, UploadError } from "../upload-client";

type Phase = "waiting" | "preparing" | "uploading" | "processing" | "done" | "error";

export type UploadItem = {
  key: string;
  file: File;
  kind: MaterialKind;
  phase: Phase;
  progress: number;
  message: string | null;
  /** Mesajul final, când PDF-ul s-a încărcat, dar fără text sau cu probleme. */
  warning: boolean;
};

/** Ce trimitem efectiv: PDF-ul ca atare; pozele sunt pregătite în browser (S3b). */
export type PreparedUpload = { body: Blob; contentType: string; title: string; thumb: Blob | null };

export type Preparer = (file: File) => Promise<PreparedUpload>;

async function preparePdf(file: File): Promise<PreparedUpload> {
  const problem = checkFile(file, "pdf");
  if (problem) throw new UploadError(problem);
  if (!hasPdfSignature(await readHead(file))) throw new UploadError(`„${file.name}” nu este un PDF valid.`);
  return { body: file, contentType: PDF_MIME, title: titleFromFileName(file.name), thumb: null };
}

/**
 * Coada de încărcări: fișierele se trimit pe rând (unul câte unul), cu progres, anulare și reîncercare.
 * Pozele au propriul pregătitor (micșorare în browser), primit din exterior.
 */
export function useUploadQueue(subjectId: string, prepareImage?: Preparer) {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const pending = useRef<string[]>([]);
  const files = useRef(new Map<string, { file: File; kind: MaterialKind }>());
  const running = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const counter = useRef(0);

  const patch = useCallback((key: string, next: Partial<UploadItem>) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...next } : it)));
  }, []);

  const runJob = useCallback(
    async (key: string) => {
      const job = files.current.get(key);
      if (!job) return;
      const { file, kind } = job;
      let materialId: string | null = null;
      let uploaded = false;
      try {
        patch(key, { phase: "preparing", progress: 0, message: null, warning: false });
        const prepared = kind === "pdf" ? await preparePdf(file) : await (prepareImage ?? preparePdf)(file);

        const start = await startUpload({ subjectId, kind, size: prepared.body.size });
        if (!start.ok) throw new UploadError(start.message);
        materialId = start.materialId;

        patch(key, { phase: "uploading" });
        abort.current = new AbortController();
        await uploadToSignedUrl(start.uploadUrl, prepared.body, prepared.contentType, {
          signal: abort.current.signal,
          onProgress: (fraction) => patch(key, { progress: fraction }),
        });
        uploaded = true;
        if (prepared.thumb && start.thumbUploadUrl) {
          // Miniatura e opțională: dacă nu ajunge, afișăm originalul.
          await uploadToSignedUrl(start.thumbUploadUrl, prepared.thumb, prepared.contentType).catch(() => {});
        }

        patch(key, { phase: "processing" });
        const done = await finishUpload({ subjectId, materialId, kind, title: prepared.title });
        if (!done.ok) throw new UploadError(done.message);

        const warning = done.status === "fara_text" || done.status === "esuat";
        patch(key, {
          phase: "done",
          progress: 1,
          warning,
          message: warning ? done.message : kind === "pdf" ? "Gata pentru asistent" : "Poza a fost salvată",
        });
        if (!warning) setTimeout(() => setItems((list) => list.filter((it) => it.key !== key)), 2200);
      } catch (error) {
        if (uploaded && materialId) await discardUpload({ subjectId, materialId, kind }).catch(() => {});
        const message = error instanceof UploadError ? error.message : "Ceva nu a mers. Încearcă din nou.";
        patch(key, { phase: "error", message });
      } finally {
        abort.current = null;
      }
    },
    [patch, prepareImage, subjectId],
  );

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    while (pending.current.length > 0) await runJob(pending.current.shift()!);
    running.current = false;
    router.refresh();
  }, [router, runJob]);

  const add = useCallback(
    (list: Array<{ file: File; kind: MaterialKind }>) => {
      const fresh = list.map(({ file, kind }) => {
        // Contor, nu crypto.randomUUID(): acela lipsește pe HTTP (ex. telefonul în rețeaua locală).
        const key = `u${++counter.current}`;
        files.current.set(key, { file, kind });
        pending.current.push(key);
        return { key, file, kind, phase: "waiting" as Phase, progress: 0, message: null, warning: false };
      });
      setItems((current) => [...current, ...fresh]);
      void pump();
    },
    [pump],
  );

  const retry = useCallback(
    (key: string) => {
      patch(key, { phase: "waiting", progress: 0, message: null });
      pending.current.push(key);
      void pump();
    },
    [patch, pump],
  );

  const dismiss = useCallback((key: string) => {
    pending.current = pending.current.filter((k) => k !== key);
    files.current.delete(key);
    setItems((list) => list.filter((it) => it.key !== key));
  }, []);

  const cancelCurrent = useCallback(() => abort.current?.abort(), []);

  const busy = items.some((it) => it.phase !== "done" && it.phase !== "error");

  // Avertizare la închiderea paginii în timpul unei încărcări.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return { items, add, retry, dismiss, cancelCurrent };
}

const PHASE_LABEL: Record<Phase, string> = {
  waiting: "În așteptare",
  preparing: "Se pregătește…",
  uploading: "Se încarcă",
  processing: "Se procesează…",
  done: "Gata",
  error: "Nu a mers",
};

export function UploadQueue({
  items,
  onRetry,
  onDismiss,
  onCancel,
}: {
  items: UploadItem[];
  onRetry: (key: string) => void;
  onDismiss: (key: string) => void;
  onCancel: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <ul aria-label="Încărcări" aria-live="polite" className="flex flex-col gap-2">
      {items.map((it) => {
        const Icon = it.kind === "pdf" ? FileText : ImageIcon;
        const percent = Math.round(it.progress * 100);
        const failed = it.phase === "error";
        const finished = it.phase === "done";
        return (
          <li
            key={it.key}
            className={cn(
              "animate-rise-in rounded-lg border bg-surface p-3.5 shadow-xs sm:p-4",
              failed ? "border-danger/25" : finished && it.warning ? "border-warning/30" : "border-line/70",
            )}
          >
            {/* Pe telefon butoanele trec sub text; de la sm stau pe același rând. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md [&_svg]:size-4.5",
                  failed ? "bg-danger-soft text-danger" : finished ? (it.warning ? "bg-warning-soft text-warning" : "bg-success-soft text-success") : "bg-accent-soft text-accent",
                )}
              >
                {failed ? <CircleAlert aria-hidden="true" /> : finished ? <CircleCheck className="animate-pop-in" aria-hidden="true" /> : <Icon aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
                <p className="truncate text-sm font-medium text-ink">{it.file.name}</p>
                <p className={cn("text-[12px] leading-5", failed ? "font-medium text-danger" : finished && it.warning ? "text-warning" : "text-ink-muted")}>
                  {it.message ??
                    (it.phase === "uploading"
                      ? `${PHASE_LABEL.uploading} · ${percent}% din ${formatBytes(it.file.size)}`
                      : `${PHASE_LABEL[it.phase]} · ${formatBytes(it.file.size)}`)}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 empty:hidden">
                {it.phase === "processing" || it.phase === "preparing" ? <Spinner className="text-accent" /> : null}
                {it.phase === "uploading" ? (
                  <Button variant="ghost" size="sm" onClick={onCancel}>
                    Anulează
                  </Button>
                ) : null}
                {failed ? (
                  <Button variant="secondary" size="sm" onClick={() => onRetry(it.key)}>
                    <RotateCw aria-hidden="true" />
                    Încearcă din nou
                  </Button>
                ) : null}
                {failed || (finished && it.warning) || it.phase === "waiting" ? (
                  <button
                    type="button"
                    onClick={() => onDismiss(it.key)}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                    aria-label={`Închide „${it.file.name}”`}
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
            {it.phase === "uploading" || it.phase === "processing" ? (
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                role="progressbar"
                aria-label={`Progres pentru „${it.file.name}”`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={it.phase === "processing" ? 100 : percent}
              >
                <div
                  className={cn(
                    "h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out",
                    it.phase === "processing" && "animate-pulse",
                  )}
                  style={{ transform: `scaleX(${it.phase === "processing" ? 1 : Math.max(0.02, it.progress)})` }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
