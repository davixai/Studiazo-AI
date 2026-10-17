"use client";

import { ArrowUp, Camera, History, ImageIcon, ListChecks, RotateCcw, Sparkles, SquarePen, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ProposalCard } from "@/features/proposals/components/proposal-card";
import { createQuiz } from "@/features/quizzes/actions";
import type { Subject } from "@/lib/contracts/domain";
import type { Proposal } from "@/lib/contracts/proposals";
import { cn } from "@/lib/utils";
import { formatDayShort, formatRelativeDay } from "@/lib/time/format";
import { deleteConversation, sendMessage } from "../actions";
import type { ChatMessage, ConversationSummary } from "../queries";
import { MessageContent } from "./message-content";

type ChatViewProps = {
  subject: Subject | null;
  subjects: Subject[];
  initialMessages: ChatMessage[];
  initialProposals: Record<string, Proposal>;
  aiAvailable: boolean;
  /** Conversația deschisă (null = încă nu există: se creează la primul mesaj). */
  conversationId: string | null;
  /** true când studentul a ales „Conversație nouă”. */
  isNew: boolean;
  conversations: ConversationSummary[];
};

const NETWORK_ERROR = "Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.";

const MAX_IMAGE_SIDE = 1280;

const GENERAL_EXAMPLES = [
  "Am examen vineri. Găsește-mi trei intervale de studiu.",
  "Ce termene am săptămâna asta?",
  "Adaugă o temă la matematică pentru luni, ora 18.",
];

const subjectExamples = (name: string) => [
  `Explică-mi pe scurt ideile principale de la ${name}.`,
  `Dă-mi un exercițiu de ${name} și ajută-mă pas cu pas.`,
  `Fă-mi un plan de recapitulare pentru ${name} săptămâna asta.`,
];

export function ChatView({
  subject,
  subjects,
  initialMessages,
  initialProposals,
  aiAvailable,
  conversationId: initialConversationId,
  isNew,
  conversations,
}: ChatViewProps) {
  const router = useRouter();
  const chatKey = subject?.id ?? "general";
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [historyOpen, setHistoryOpen] = useState(false);
  // localImage: poza trimisă în această sesiune se arată imediat, fără să așteptăm URL-ul semnat.
  const [messages, setMessages] = useState<Array<ChatMessage & { localImage?: string }>>(initialMessages);
  const [proposals, setProposals] = useState(initialProposals);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<{ text: string; image: string | null } | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [creatingQuiz, startCreatingQuiz] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pendingQuestion, error]);

  const send = (text: string, attached: string | null) => {
    const question = text.trim();
    if ((!question && !attached) || sending || !aiAvailable) return;
    setError(null);
    setPendingQuestion({ text: question, image: attached });
    setDraft("");
    setImage(null);
    startSending(async () => {
      let result: Awaited<ReturnType<typeof sendMessage>>;
      try {
        result = await sendMessage({
          subjectId: subject?.id ?? null,
          conversationId,
          newConversation: isNew && conversationId === null,
          text: question,
          image: attached,
        });
      } catch {
        result = { ok: false, message: NETWORK_ERROR, retryable: true };
      }
      setPendingQuestion(null);
      if (result.ok) {
        if (result.conversationId !== conversationId) {
          // Conversația nouă primește adresa ei, ca reîncărcarea paginii să o redeschidă.
          setConversationId(result.conversationId);
          window.history.replaceState(null, "", `/asistent?materie=${chatKey}&conversatie=${result.conversationId}`);
        }
        setMessages((prev) => [
          ...prev,
          ...result.messages.map((m) => (m.role === "user" && attached ? { ...m, localImage: attached } : m)),
        ]);
        if (result.proposals.length) setProposals((prev) => ({ ...prev, ...Object.fromEntries(result.proposals.map((p) => [p.id, p])) }));
      } else {
        // Întrebarea revine în compozitor, ca să poată fi retrimisă.
        setDraft(question);
        setImage(attached);
        setError({ message: result.message, retryable: result.retryable });
      }
      textareaRef.current?.focus();
    });
  };

  const quiz = () => {
    if (!subject) return;
    setError(null);
    startCreatingQuiz(async () => {
      try {
        const result = await createQuiz({ subjectId: subject.id, questionCount: 5 });
        if (result.ok) router.push(`/asistent/test/${result.quizId}`);
        else setError({ message: result.message, retryable: false });
      } catch {
        setError({ message: NETWORK_ERROR, retryable: false });
      }
    });
  };

  const attach = async (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Alege o poză (JPEG, PNG sau WebP).");
      return;
    }
    try {
      setImage(await resizeImage(file));
    } catch {
      setImageError("Nu am putut citi poza. Încearcă JPEG sau PNG.");
    }
  };

  const examples = subject ? subjectExamples(subject.name) : GENERAL_EXAMPLES;
  const empty = messages.length === 0 && !pendingQuestion;

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] min-w-0 flex-col lg:min-h-[calc(100dvh-10rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-bold tracking-[-0.02em] text-ink">{subject ? subject.name : "Chat general"}</h2>
          <p className="truncate text-[13px] text-ink-muted">
            {subject ? "Răspunde din materialele acestei materii" : "Program, termene și orice materie"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {subject ? (
            <Button variant="secondary" size="sm" onClick={quiz} loading={creatingQuiz} disabled={!aiAvailable || sending}>
              <ListChecks aria-hidden="true" />
              Test grilă
            </Button>
          ) : null}
          {conversations.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} disabled={sending} aria-label="Istoricul conversațiilor">
              <History aria-hidden="true" />
              <span className="hidden sm:inline">Istoric</span>
            </Button>
          ) : null}
          {messages.length > 0 ? (
            <ButtonLink
              href={`/asistent?materie=${chatKey}&conversatie=nou`}
              variant="ghost"
              size="sm"
              aria-label="Conversație nouă"
              aria-disabled={sending || undefined}
            >
              <SquarePen aria-hidden="true" />
              <span className="hidden sm:inline">Nouă</span>
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <HistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        chatKey={chatKey}
        conversations={conversations}
        currentId={conversationId}
        onDeleted={(id) => {
          setHistoryOpen(false);
          if (id === conversationId) router.replace(`/asistent?materie=${chatKey}`);
          else router.refresh();
        }}
      />

      <div className="flex flex-1 flex-col gap-6 py-6" aria-live="polite" aria-busy={sending}>
        {empty ? (
          <div className="my-auto flex flex-col items-center text-center animate-rise-in">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="mt-4 text-[17px] font-bold tracking-[-0.02em] text-ink">Cu ce te pot ajuta?</p>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-muted">
              Întreabă orice sau trimite o poză cu un exercițiu. Nimic nu se salvează în calendar fără confirmarea ta.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-2">
              {examples.map((example, i) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => send(example, null)}
                  disabled={!aiAvailable || sending}
                  className="stagger rounded-md border border-line/70 bg-surface px-4 py-3 text-left text-sm text-ink-soft shadow-xs transition-[border-color,transform] hover:border-accent-line hover:text-ink active:scale-[0.99] disabled:opacity-60"
                  style={{ "--i": i + 1 } as React.CSSProperties}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.content} hasImage={m.hasImage} image={m.localImage ?? m.imageUrl} />
          ) : (
            <div key={m.id} className="flex flex-col gap-3">
              <AssistantMessage text={m.content} />
              {m.proposalIds.map((id) =>
                proposals[id] ? (
                  <div key={id} className="sm:pl-11">
                    <ProposalCard proposal={proposals[id]} subjects={subjects} />
                  </div>
                ) : null,
              )}
            </div>
          ),
        )}

        {pendingQuestion ? (
          <>
            <UserBubble text={pendingQuestion.text} image={pendingQuestion.image} />
            <div className="flex items-center gap-3 animate-fade-in" role="status">
              <AssistantAvatar />
              <span className="flex gap-1 rounded-full bg-surface px-4 py-3 shadow-xs" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-accent/70" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
              <span className="sr-only">Asistentul scrie…</span>
            </div>
          </>
        ) : null}

        {creatingQuiz ? (
          <div className="flex items-center gap-3 animate-fade-in" role="status">
            <AssistantAvatar />
            <p className="text-sm text-ink-muted">Pregătesc un test grilă din materialele tale… durează câteva secunde.</p>
          </div>
        ) : null}

        {error ? (
          <Alert
            tone="danger"
            className="animate-rise-in"
            action={
              error.retryable ? (
                <Button variant="secondary" size="sm" onClick={() => send(draft, image)}>
                  <RotateCcw aria-hidden="true" />
                  Încearcă din nou
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
        className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-1 rounded-xl border border-line/70 bg-surface p-2 shadow-md lg:bottom-6"
      >
        {imageError ? <p className="px-2 pt-1 pb-2 text-[13px] font-medium text-danger">{imageError}</p> : null}
        {image ? (
          <div className="relative mb-2 ml-1 inline-flex animate-pop-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare locală (data URL), nu o imagine de optimizat */}
            <img src={image} alt="Poza atașată" className="h-20 w-auto rounded-md border border-line object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow-sm"
              aria-label="Scoate poza"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-1.5">
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
            disabled={!aiAvailable || sending}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
            aria-label="Atașează o poză (exercițiu, tablă, notițe)"
          >
            <Camera className="size-5" strokeWidth={1.8} />
          </button>
          <label htmlFor="chat-input" className="sr-only">
            Mesaj pentru asistent
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft, image);
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Scrie o întrebare…"
            disabled={!aiAvailable}
            className="max-h-40 min-h-10 flex-1 resize-none [field-sizing:content] bg-transparent px-1 py-2 text-[15px] leading-6 text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={!aiAvailable || sending || (!draft.trim() && !image)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm transition-[background-color,transform,opacity] hover:bg-accent-hover active:scale-95 disabled:opacity-40"
            aria-label="Trimite"
          >
            <ArrowUp className="size-5" strokeWidth={2.2} />
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryDialog({
  open,
  onClose,
  chatKey,
  conversations,
  currentId,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  chatKey: string;
  conversations: ConversationSummary[];
  currentId: string | null;
  onDeleted: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();
  const now = new Date();

  const remove = (id: string) => {
    setFailure(null);
    startDeleting(async () => {
      try {
        const result = await deleteConversation({ id });
        if (result.ok) {
          setConfirmId(null);
          onDeleted(id);
        } else setFailure(result.message);
      } catch {
        setFailure(NETWORK_ERROR);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Istoricul conversațiilor" description="Redeschide o conversație și continu-o de unde ai rămas.">
      {failure ? (
        <Alert tone="danger" className="mb-3">
          {failure}
        </Alert>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {conversations.map((c) => {
          const updated = new Date(c.updatedAt);
          const isCurrent = c.id === currentId;
          return (
            <li
              key={c.id}
              className={cn("flex items-center gap-2 rounded-md border px-3 py-2.5", isCurrent ? "border-accent-line bg-accent-soft" : "border-line/70")}
            >
              {confirmId === c.id ? (
                <div className="flex w-full flex-wrap items-center gap-2 animate-fade-in">
                  <p className="min-w-0 flex-1 text-sm text-ink">Ștergi definitiv conversația?</p>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmId(null)} disabled={deleting}>
                    Renunță
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(c.id)} loading={deleting}>
                    Șterge
                  </Button>
                </div>
              ) : (
                <>
                  <Link href={`/asistent?materie=${chatKey}&conversatie=${c.id}`} onClick={onClose} className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-semibold", isCurrent ? "text-accent-ink" : "text-ink")}>{c.title}</span>
                    <span className="block text-xs text-ink-muted first-letter:uppercase">
                      {formatRelativeDay(updated, now)} · {formatDayShort(updated)}
                      {isCurrent ? " · deschisă acum" : ""}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmId(c.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    aria-label={`Șterge conversația „${c.title}”`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

function AssistantAvatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
      <Sparkles className="size-4" strokeWidth={1.8} />
    </span>
  );
}

function AssistantMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 animate-rise-in">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5">
        <MessageContent text={text} />
      </div>
    </div>
  );
}

function UserBubble({ text, hasImage, image }: { text: string; hasImage?: boolean; image?: string | null }) {
  return (
    <div className="flex flex-col items-end gap-2 animate-rise-in">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- poza tocmai trimisă, ținută doar local
        <img src={image} alt="Poza trimisă" className="max-h-48 w-auto rounded-lg border border-line object-cover" />
      ) : hasImage ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs text-ink-muted">
          <ImageIcon className="size-3.5" aria-hidden="true" />
          Poză trimisă
        </span>
      ) : null}
      {text ? (
        <p className={cn("max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] leading-6 whitespace-pre-wrap text-white shadow-sm")}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

/** Micșorează poza în browser (max. 1280 px, JPEG): mai rapid de trimis și mai ieftin pentru AI. */
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
