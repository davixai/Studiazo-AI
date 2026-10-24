"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Butoanele de jos (ex. Anulează / Salvează). Rămân vizibile deasupra tastaturii virtuale. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

/**
 * Fereastră de dialog bazată pe <dialog> nativ: focus prins, Escape, fundal inert.
 * Pe mobil apare ca foaie de jos, cu zona sigură respectată; pe desktop, centrată.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        // max-h-none / max-w-none: anulează limitele implicite ale browserului (100% − 6px − 2em), altfel foaia
        // de jos de pe telefon iese cu 6px sub ecran; înălțimea maximă o dă conținutul de mai jos.
        "m-0 mt-auto max-h-none w-full max-w-none overflow-visible bg-transparent p-0 text-ink backdrop:backdrop-blur-[1px]",
        "sm:m-auto sm:px-4",
        size === "sm" && "sm:max-w-md",
        size === "md" && "sm:max-w-lg",
        size === "lg" && "sm:max-w-2xl",
      )}
    >
      {open ? (
        <div
          className={cn(
            "flex max-h-[calc(100dvh-2rem)] flex-col rounded-t-xl border border-line bg-surface shadow-lg",
            "animate-sheet-in sm:max-h-[calc(100dvh-4rem)] sm:animate-rise-in sm:rounded-xl",
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
          <header className="flex items-start gap-4 px-5 pt-4 pb-1 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold tracking-[-0.015em]">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm leading-6 text-ink-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-2 inline-flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Închide"
            >
              <X className="size-4.5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">{children}</div>
          {footer ? (
            <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-5">
              {footer}
            </footer>
          ) : (
            <div className="pb-[env(safe-area-inset-bottom)]" />
          )}
        </div>
      ) : null}
    </dialog>
  );
}
