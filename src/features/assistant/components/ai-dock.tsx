"use client";

import { ArrowUp, Camera, ImageIcon, ListChecks, Maximize2, RotateCcw, Sparkles, SquarePen, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProposalCard } from "@/features/proposals/components/proposal-card";
import { createQuiz } from "@/features/quizzes/actions";
import { AI_LIMITS } from "@/lib/contracts/ai-limits";
import type { Subject } from "@/lib/contracts/domain";
import type { Proposal } from "@/lib/contracts/proposals";
import { cn } from "@/lib/utils";
import { sendMessage } from "../actions";
import type { ChatMessage } from "../queries";
import { MessageContent } from "./message-content";

// Asistentul mereu la îndemână: o iconiță în colțul din dreapta-jos, pe fiecare pagină din aplicație.
// Folosește același `sendMessage` ca pagina /asistent (cu instrumentele lui: program, termene, intervale libere,
// materiale, teme slabe, propuneri de teme și sesiuni). Pe pagina unei materii răspunde din materialele ei.

/** Evenimentul cu care alte părți ale paginii (ex. „Suport online” din subsol) deschid asistentul. */
export const OPEN_ASSISTANT_EVENT = "studiazo:deschide-asistent";

const NETWORK_ERROR = "Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.";
const SUBJECT_PATH = /^\/materii\/([0-9a-f-]{36})/i;
const MAX_IMAGE_SIDE = 1280;

const CAPABILITIES = ["Explică din cursuri", "Exerciții pas cu pas", "Citește poze", "Program și termene", "Plan de studiu", "Teste grilă"];

/** Întrebări sugerate, potrivite paginii pe care e studentul. */
function promptsFor(pathname: string, subject: Subject | null): string[] {
  if (subject) {
    return [
      `Explică-mi pe scurt ideile principale de la ${subject.name}.`,
      `Dă-mi un exercițiu de ${subject.name} și ajută-mă pas cu pas.`,
      `Fă-mi un plan de recapitulare pentru ${subject.name} săptămâna asta.`,
    ];
  }
  if (pathname.startsWith("/calendar")) {
    return ["Găsește-mi trei intervale libere de studiu săptămâna asta.", "Ce termene am în următoarele 7 zile?", "Am un examen vineri. Ajută-mă să-l pun în calendar."];
  }
  if (pathname.startsWith("/materii")) {
    return ["La ce materie ar trebui să lucrez azi?", "Cum încarc un curs în PDF sau o poză cu tabla?", "Ce teme slabe am din testele grilă?"];
  }
  if (pathname.startsWith("/profil")) {
    return ["Cum îmi setez zilele și orele în care pot învăța?", "Cât ar trebui să dureze o sesiune de studiu?", "Cum îmi schimb facultatea sau anul?"];
  }
  if (pathname.startsWith("/resurse")) {
    return ["Unde pot învăța liniștit în Iași?", "Cum mă organizez în sesiune?", "Am emoții la examen. Ce pot face?"];
  }
  return ["Ce am de făcut azi?", "Fă-mi un plan de studiu pentru examenele care urmează.", "Care e cel mai urgent termen al meu?"];
}

/** Acțiuni rapide, mereu vizibile deasupra câmpului de scris. */
function quickActionsFor(subject: Subject | null) {
  return subject
    ? [
        { label: "Rezumat", prompt: `Fă-mi un rezumat scurt din materialele de la ${subject.name}.` },
        { label: "Exercițiu", prompt: `Dă-mi un exercițiu de ${subject.name} și ajută-mă pas cu pas.` },
        { label: "Plan", prompt: `Planifică-mi sesiuni de studiu pentru ${subject.name} în zilele următoare.` },
      ]
    : [
        { label: "Azi", prompt: "Ce am de făcut azi?" },
        { label: "Termene", prompt: "Ce termene am în următoarele 7 zile?" },
        { label: "Timp liber", prompt: "Când am timp liber de învățat săptămâna asta?" },
        { label: "Plan", prompt: "Fă-mi un plan de studiu pentru examenele care urmează." },
      ];
}

type DockMessage = ChatMessage & { localImage?: string };
type Thread = { conversationId: string | null; messages: DockMessage[] };

export function AiDock({ subjects, aiAvailable }: { subjects: Subject[]; aiAvailable: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Câte o conversație pentru chatul general și pentru fiecare materie deschisă din dock; rămân la schimbarea paginii.
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ text: string; image: string | null } | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [sending, startSending] = useTransition();
  const [creatingQuiz, startCreatingQuiz] = useTransition();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const subjectId = pathname.match(SUBJECT_PATH)?.[1] ?? null;
  const subject = subjectId ? (subjects.find((s) => s.id === subjectId) ?? null) : null;
  const key = subject?.id ?? "general";
  const thread = threads[key] ?? { conversationId: null, messages: [] };
  const hidden = pathname.startsWith("/asistent");
  const busy = sending || creatingQuiz;

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, thread.messages.length, pending, error, creatingQuiz]);

  useEffect(() => {
    const openDock = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, openDock);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openDock);
  }, []);

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

  function resizeInput(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  function send(text: string, attached: string | null) {
    const question = text.trim();
    if ((!question && !attached) || busy || !aiAvailable) return;
    setError(null);
    setPending({ text: question, image: attached });
    setDraft("");
    setImage(null);
    requestAnimationFrame(() => resizeInput(inputRef.current));
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
          image: attached,
        });
      } catch {
        result = { ok: false, message: NETWORK_ERROR, retryable: true };
      }
      setPending(null);
      if (result.ok) {
        const ok = result;
        const added = ok.messages.map((m) => (m.role === "user" && attached ? { ...m, localImage: attached } : m));
        setThreads((all) => ({
          ...all,
          [key]: { conversationId: ok.conversationId, messages: [...(all[key]?.messages ?? []), ...added] },
        }));
        if (ok.proposals.length) setProposals((all) => ({ ...all, ...Object.fromEntries(ok.proposals.map((p) => [p.id, p])) }));
      } else {
        // Întrebarea revine în câmp, ca să poată fi retrimisă.
        setDraft(question);
        setImage(attached);
        setError({ message: result.message, retryable: result.retryable });
      }
      inputRef.current?.focus();
    });
  }

  function quiz() {
    if (!subject || busy || !aiAvailable) return;
    setError(null);
    startCreatingQuiz(async () => {
      try {
        const result = await createQuiz({ subjectId: subject.id, questionCount: 5 });
        if (result.ok) {
          setOpen(false);
          router.push(`/asistent/test/${result.quizId}`);
        } else setError({ message: result.message, retryable: false });
      } catch {
        setError({ message: NETWORK_ERROR, retryable: false });
      }
    });
  }

  async function attach(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setImageError("Alege o poză (JPEG, PNG sau WebP).");
    try {
      setImage(await resizeImage(file));
      inputRef.current?.focus();
    } catch {
      setImageError("Nu am putut citi poza. Încearcă JPEG sau PNG.");
    }
  }

  function newConversation() {
    setThreads((all) => ({ ...all, [key]: { conversationId: null, messages: [] } }));
    setError(null);
    inputRef.current?.focus();
  }

  const prompts = promptsFor(pathname, subject);
  const quickActions = quickActionsFor(subject);
  const empty = thread.messages.length === 0 && !pending;
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
        {/* pointer-events-none: pulsul crește de 2× și altfel „fură” atingerile butoanelor din jur. */}
        {!open ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-accent/40 [animation-duration:2.6s]" /> : null}
        <span className="relative">
          {open ? (
            <X className="size-6 animate-pop-in" aria-hidden="true" />
          ) : (
            <Sparkles className="size-6 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2} aria-hidden="true" />
          )}
        </span>
        {!open ? (
          <span
            aria-hidden="true"
            className={cn("absolute top-0.5 right-0.5 size-3.5 rounded-full border-2 border-canvas", aiAvailable ? "bg-success" : "bg-ink-faint")}
          />
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
          className="fixed inset-0 z-50 flex animate-sheet-in flex-col overflow-hidden border-line bg-surface/95 shadow-lg backdrop-blur-xl lg:inset-auto lg:right-8 lg:bottom-28 lg:h-[min(680px,calc(100dvh-9rem))] lg:w-[420px] lg:rounded-xl lg:border"
        >
          <header className="flex items-center gap-2 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:pt-3">
            <span className="relative mr-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-accent" aria-hidden="true">
              <Sparkles className="size-5" />
              <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface", aiAvailable ? "bg-success" : "bg-ink-faint")} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-[-0.01em] text-ink">Studiazo AI</p>
              <p className="truncate text-[12px] text-ink-muted">{aiAvailable ? "Online · te ajută oricând, non-stop" : "Indisponibil momentan"}</p>
            </div>
            {thread.messages.length > 0 ? (
              <HeaderButton label="Conversație nouă" onClick={newConversation} disabled={busy}>
                <SquarePen className="size-4" aria-hidden="true" />
              </HeaderButton>
            ) : null}
            <Link
              href={fullChatHref}
              onClick={() => setOpen(false)}
              aria-label="Deschide chatul complet"
              className="flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
            </Link>
            <HeaderButton label="Închide asistentul" onClick={close}>
              <X className="size-5" aria-hidden="true" />
            </HeaderButton>
          </header>

          {subject ? (
            <div className="flex items-center gap-2 border-b border-line bg-accent-soft/50 px-4 py-2 text-[12px] text-accent-ink">
              <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                Răspund din materialele de la <strong className="font-semibold">{subject.name}</strong>
              </span>
              <button
                type="button"
                onClick={quiz}
                disabled={!aiAvailable || busy}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-line bg-surface px-2.5 py-1 font-semibold text-accent-ink transition-colors hover:bg-accent-soft disabled:opacity-50"
              >
                <ListChecks className="size-3.5" aria-hidden="true" />
                Test grilă
              </button>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite" aria-busy={busy}>
            {empty ? (
              <div className="my-auto flex flex-col items-center text-center animate-rise-in">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-white shadow-accent" aria-hidden="true">
                  <Sparkles className="size-6" />
                </span>
                <p className="mt-4 text-[17px] font-bold tracking-[-0.02em] text-ink">Salut! Cu ce te ajut?</p>
                <p className="mt-1.5 max-w-xs text-[13px] leading-5 text-ink-muted">
                  Întreabă-mă orice despre facultate sau despre aplicație. Nimic nu se salvează în calendar fără confirmarea ta.
                </p>
                <ul aria-label="Ce pot face" className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {CAPABILITIES.map((c, i) => (
                    <li
                      key={c}
                      className="stagger rounded-full border border-line bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-ink-soft"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
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
                      onClick={() => send(p, null)}
                      disabled={!aiAvailable || busy}
                      style={{ "--i": i + 2 } as React.CSSProperties}
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
                <UserBubble key={m.id} text={m.content} image={m.localImage ?? m.imageUrl} hasImage={m.hasImage} />
              ) : (
                <div key={m.id} className="flex flex-col gap-3">
                  <AssistantBubble text={m.content} />
                  {m.proposalIds.map((id) => (proposals[id] ? <ProposalCard key={id} proposal={proposals[id]} subjects={subjects} /> : null))}
                </div>
              ),
            )}

            {pending ? (
              <>
                <UserBubble text={pending.text} image={pending.image} />
                <Typing label="Asistentul scrie…" />
              </>
            ) : null}
            {creatingQuiz ? <Typing label="Pregătesc un test grilă din materialele tale… durează câteva secunde." visible /> : null}

            {error ? (
              <Alert
                tone="danger"
                className="animate-rise-in"
                action={
                  error.retryable ? (
                    <Button variant="secondary" size="sm" onClick={() => send(draft, image)}>
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
              send(draft, image);
            }}
            className="border-t border-line px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {!empty ? (
              <div className="-mx-3 mb-2.5 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]" aria-label="Acțiuni rapide">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => send(a.prompt, null)}
                    disabled={!aiAvailable || busy}
                    className="shrink-0 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-accent-line hover:text-ink disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}

            {imageError ? <p className="mb-2 text-[13px] font-medium text-danger">{imageError}</p> : null}
            {image ? (
              <div className="relative mb-2 inline-flex animate-pop-in">
                {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare locală (data URL) */}
                <img src={image} alt="Poza atașată" className="h-16 w-auto rounded-md border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  aria-label="Scoate poza"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-night text-white ring-1 ring-line-strong"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <div className="flex items-end gap-1.5 rounded-xl border border-line-strong bg-surface-sunken p-1.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  void attach(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={!aiAvailable || busy}
                aria-label="Atașează o poză (exercițiu, tablă, notițe)"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-40"
              >
                <Camera className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </button>
              <label htmlFor="ai-dock-input" className="sr-only">
                Mesaj pentru asistent
              </label>
              <textarea
                id="ai-dock-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={AI_LIMITS.maxUserMessageChars}
                placeholder={aiAvailable ? (image ? "Ce vrei să afli despre poză?" : "Scrie o întrebare…") : "Asistentul nu este disponibil"}
                disabled={!aiAvailable}
                onChange={(e) => {
                  setDraft(e.target.value);
                  resizeInput(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft, image);
                  }
                }}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2 text-[15px] leading-6 text-ink placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={(!draft.trim() && !image) || busy || !aiAvailable}
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

function HeaderButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Avatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden="true">
      <Sparkles className="size-3.5" />
    </span>
  );
}

function Typing({ label, visible }: { label: string; visible?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 animate-fade-in" role="status">
      <Avatar />
      <span className="flex gap-1 rounded-full bg-surface-muted px-4 py-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </span>
      <span className={visible ? "text-[13px] text-ink-muted" : "sr-only"}>{label}</span>
    </div>
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

function UserBubble({ text, image, hasImage }: { text: string; image?: string | null; hasImage?: boolean }) {
  return (
    <div className="flex flex-col items-end gap-2 animate-rise-in">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- poza trimisă (data URL local sau URL semnat)
        <img src={image} alt="Poza trimisă" className="max-h-40 w-auto rounded-lg border border-line object-cover" />
      ) : hasImage ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs text-ink-muted">
          <ImageIcon className="size-3.5" aria-hidden="true" />
          Poză trimisă
        </span>
      ) : null}
      {text ? (
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[14px] leading-6 whitespace-pre-wrap text-white shadow-sm">{text}</p>
      ) : null}
    </div>
  );
}

async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
