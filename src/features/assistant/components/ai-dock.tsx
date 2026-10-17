"use client";

import { ArrowUp, Maximize2, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProposalCard } from "@/features/proposals/components/proposal-card";
import { AI_LIMITS } from "@/lib/contracts/ai-tools";
import type { Subject } from "@/lib/contracts/domain";
import type { Proposal } from "@/lib/contracts/proposals";
import { cn } from "@/lib/utils";
import { sendMessage } from "../actions";
import type { ChatMessage } from "../queries";
import { MessageContent } from "./message-content";

// Asistentul mereu la îndemână: o iconiță în colțul din dreapta-jos, pe fiecare pagină din aplicație.
// Folosește același `sendMessage` ca pagina /asistent; pe pagina unei materii răspunde din materialele ei.

const NETWORK_ERROR = "Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.";
const SUBJECT_PATH = /^\/materii\/([0-9a-f-]{36})/i;

const GENERAL_PROMPTS = ["Ce am de făcut azi?", "Cum încarc un curs în PDF?", "Ajută-mă să-mi fac un plan de studiu."];
const subjectPrompts = (name: string) => [
  `Explică-mi pe scurt ideile principale de la ${name}.`,
  `Dă-mi un exercițiu de ${name} și ajută-mă pas cu pas.`,
  `Ce ar trebui să recapitulez la ${name}?`,
];

type Thread = { conversationId: string | null; messages: ChatMessage[] };

export function AiDock({ subjects, aiAvailable }: { subjects: Subject[]; aiAvailable: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Câte o conversație pentru chatul general și pentru fiecare materie deschisă din dock; rămân la schimbarea paginii.
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [sending, startSending] = useTransition();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const subjectId = pathname.match(SUBJECT_PATH)?.[1] ?? null;
  const subject = subjectId ? (subjects.find((s) => s.id === subjectId) ?? null) : null;
  const key = subject?.id ?? "general";
  const thread = threads[key] ?? { conversationId: null, messages: [] };
  const hidden = pathname.startsWith("/asistent");

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, thread.messages.length, pending, error]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => launcherRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  function close() {
    setOpen(false);
    // Pe telefon lansatorul reapare abia după închidere; mutăm focusul pe el în cadrul următor.
    requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function send(text: string) {
    const question = text.trim();
    if (!question || sending || !aiAvailable) return;
    setError(null);
    setPending(question);
    setDraft("");
    const current = thread;
    startSending(async () => {
      let result: Awaited<ReturnType<typeof sendMessage>>;
      try {
        result = await sendMessage({
          subjectId: subject?.id ?? null,
          conversationId: current.conversationId,
          // Prima întrebare din dock pornește o conversație nouă, ca să nu amestecăm subiectele.
          newConversation: current.conversationId === null,
          text: question,
          image: null,
        });
      } catch {
        result = { ok: false, message: NETWORK_ERROR, retryable: true };
      }
      setPending(null);
      if (result.ok) {
        const ok = result;
        setThreads((all) => ({
          ...all,
          [key]: { conversationId: ok.conversationId, messages: [...(all[key]?.messages ?? []), ...ok.messages] },
        }));
        if (ok.proposals.length) setProposals((all) => ({ ...all, ...Object.fromEntries(ok.proposals.map((p) => [p.id, p])) }));
      } else {
        setDraft(question);
        setError({ message: result.message, retryable: result.retryable });
      }
      inputRef.current?.focus();
    });
  }

  const prompts = subject ? subjectPrompts(subject.name) : GENERAL_PROMPTS;
  const fullChatHref = `/asistent?materie=${subject?.id ?? "general"}${thread.conversationId ? `&conversatie=${thread.conversationId}` : ""}`;

  return (
    <>
      {/* Lansatorul: deasupra barei de jos pe telefon, în colț pe desktop */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="ai-dock"
        aria-label={open ? "Închide asistentul" : "Deschide asistentul Studiazo AI"}
        className={cn(
          "group fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-accent transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-110 active:scale-95 lg:right-8 lg:bottom-8",
          open && "max-lg:hidden",
        )}
      >
        {!open ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-accent/40 [animation-duration:2.6s]" /> : null}
        <span className="relative">
          {open ? (
            <X className="size-6 animate-pop-in" aria-hidden="true" />
          ) : (
            <Sparkles className="size-6 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2} aria-hidden="true" />
          )}
        </span>
        {!open ? (
          <span aria-hidden="true" className={`absolute top-0.5 right-0.5 size-3.5 rounded-full border-2 border-canvas ${aiAvailable ? "bg-success" : "bg-ink-faint"}`} />
        ) : null}
        {!open ? (
          <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-ink opacity-0 shadow-md transition-opacity group-hover:opacity-100 lg:block">
            Întreabă Studiazo AI
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          id="ai-dock"
          role="dialog"
          aria-label="Asistentul Studiazo AI"
          className="fixed inset-0 z-50 bg-surface/95 backdrop-blur-xl flex animate-sheet-in flex-col overflow-hidden border-line shadow-lg lg:inset-auto lg:right-8 lg:bottom-28 lg:h-[min(640px,calc(100dvh-9rem))] lg:w-[400px] lg:rounded-xl lg:border"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:pt-3">
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-accent" aria-hidden="true">
              <Sparkles className="size-5" />
              <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface", aiAvailable ? "bg-success" : "bg-ink-faint")} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-[-0.01em] text-ink">Studiazo AI</p>
              <p className="truncate text-[12px] text-ink-muted">
                {aiAvailable ? "Online · te ajută oricând, non-stop" : "Indisponibil momentan"}
              </p>
            </div>
            <Link
              href={fullChatHref}
              onClick={() => setOpen(false)}
              aria-label="Deschide chatul complet"
              className="flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Închide asistentul"
              className="flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          {subject ? (
            <p className="flex items-center gap-2 border-b border-line bg-accent-soft/50 px-4 py-2 text-[12px] text-accent-ink">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Răspund din materialele de la <strong className="truncate font-semibold">{subject.name}</strong>
            </p>
          ) : null}

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite" aria-busy={sending}>
            {thread.messages.length === 0 && !pending ? (
              <div className="my-auto flex flex-col items-center text-center animate-rise-in">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-white shadow-accent" aria-hidden="true">
                  <Sparkles className="size-6" />
                </span>
                <p className="mt-4 text-[17px] font-bold tracking-[-0.02em] text-ink">Salut! Cu ce te ajut?</p>
                <p className="mt-1.5 max-w-xs text-[13px] leading-5 text-ink-muted">
                  Întreabă-mă despre cursuri, teme, termene sau cum să folosești aplicația. Nimic nu se salvează fără confirmarea ta.
                </p>
                {!aiAvailable ? (
                  <Alert tone="warning" className="mt-5 text-left">
                    Asistentul nu este disponibil acum (mod previzualizare sau AI neconfigurat).
                  </Alert>
                ) : null}
                <div className="mt-5 flex w-full flex-col gap-2">
                  {prompts.map((p, i) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      disabled={!aiAvailable || sending}
                      style={{ "--i": i + 1 } as React.CSSProperties}
                      className="stagger rounded-md border border-line bg-surface-muted/60 px-3.5 py-2.5 text-left text-[13px] text-ink-soft transition-[border-color,color,transform] hover:border-accent-line hover:text-ink active:scale-[0.99] disabled:opacity-60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {thread.messages.map((m) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={m.content} />
              ) : (
                <div key={m.id} className="flex flex-col gap-3">
                  <AssistantBubble text={m.content} />
                  {m.proposalIds.map((id) => (proposals[id] ? <ProposalCard key={id} proposal={proposals[id]} subjects={subjects} /> : null))}
                </div>
              ),
            )}

            {pending ? (
              <>
                <UserBubble text={pending} />
                <div className="flex items-center gap-2.5 animate-fade-in" role="status">
                  <Avatar />
                  <span className="flex gap-1 rounded-full bg-surface-muted px-4 py-3" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                  <span className="sr-only">Asistentul scrie…</span>
                </div>
              </>
            ) : null}

            {error ? (
              <Alert
                tone="danger"
                className="animate-rise-in"
                action={
                  error.retryable ? (
                    <Button variant="secondary" size="sm" onClick={() => send(draft)}>
                      <RotateCcw aria-hidden="true" />
                      Reîncearcă
                    </Button>
                  ) : undefined
                }
              >
                {error.message}
              </Alert>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface-sunken p-1.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20">
              <label htmlFor="ai-dock-input" className="sr-only">
                Mesaj pentru asistent
              </label>
              <textarea
                id="ai-dock-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={AI_LIMITS.maxUserMessageChars}
                placeholder={aiAvailable ? "Scrie o întrebare…" : "Asistentul nu este disponibil"}
                disabled={!aiAvailable}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-6 text-ink placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || !aiAvailable}
                aria-label="Trimite"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-accent transition-[transform,opacity] hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:shadow-none"
              >
                <ArrowUp className="size-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}

function Avatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden="true">
      <Sparkles className="size-3.5" />
    </span>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 animate-rise-in">
      <Avatar />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-surface-muted px-3.5 py-2.5 text-[14px]">
        <MessageContent text={text} />
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <p className="ml-auto max-w-[85%] animate-rise-in rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[14px] leading-6 whitespace-pre-wrap text-white shadow-sm">
      {text}
    </p>
  );
}
