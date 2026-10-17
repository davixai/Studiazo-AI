import { ChevronLeft, ChevronRight, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { ChatView } from "@/features/assistant/components/chat-view";
import { getChatThread, listConversations, NEW_CONVERSATION } from "@/features/assistant/queries";
import { listSubjects } from "@/features/subjects/queries";
import { getAiStatus } from "@/lib/ai/config";
import type { Subject } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Asistent" };

const GENERAL = "general";

// Un chat general + câte un chat pentru fiecare materie (?materie=<id>). Pe telefon: lista, apoi chatul ales.
export default async function AssistantPage({ searchParams }: PageProps<"/asistent">) {
  const params = await searchParams;
  const selected = typeof params.materie === "string" ? params.materie : null;
  const [subjects, status] = await Promise.all([listSubjects(), Promise.resolve(getAiStatus())]);

  const subject = selected && selected !== GENERAL ? (subjects.find((s) => s.id === selected) ?? null) : null;
  if (selected && selected !== GENERAL && !subject) notFound();
  const conversation = typeof params.conversatie === "string" ? params.conversatie : null;
  const [thread, conversations] = await Promise.all([getChatThread(subject?.id ?? null, conversation), listConversations(subject?.id ?? null)]);
  // Conversație ștearsă sau din alt chat: revenim la ultima conversație a chatului.
  if (!thread) redirect(`/asistent?materie=${subject?.id ?? GENERAL}`);

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(selected && "hidden lg:block")}>
        <PageHeader title="Asistent" description="Un chat pentru fiecare materie. Explică din cursurile tale, te ajută pas cu pas și îți planifică studiul." />
      </div>

      {!status.available ? (
        <Alert tone="warning" title="Asistentul AI nu este disponibil momentan">
          Calendarul și materiile funcționează în continuare normal.
        </Alert>
      ) : null}
      {isPreviewMode() ? (
        <Alert tone="info">În modul previzualizare chatul nu trimite mesaje. Interfața este doar pentru verificare.</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Chaturi" className={cn("min-w-0 lg:sticky lg:top-8 lg:self-start", selected && "hidden lg:block")}>
          <ChatList subjects={subjects} active={subject?.id ?? (selected === GENERAL || !selected ? GENERAL : null)} />
        </nav>

        <section aria-label="Conversație" className={cn("min-w-0", !selected && "hidden lg:block")}>
          {selected ? (
            <Link
              href="/asistent"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink lg:hidden"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Toate chaturile
            </Link>
          ) : null}
          <ChatView
            key={`${subject?.id ?? GENERAL}-${conversation ?? "ultima"}`}
            subject={subject}
            subjects={subjects}
            initialMessages={thread.messages}
            initialProposals={thread.proposals}
            aiAvailable={status.available && !isPreviewMode()}
            conversationId={thread.conversationId}
            isNew={conversation === NEW_CONVERSATION}
            conversations={conversations}
          />
        </section>
      </div>
    </div>
  );
}

function ChatList({ subjects, active }: { subjects: Subject[]; active: string | null }) {
  const items = [
    { id: GENERAL, name: "Chat general", detail: "Program, termene, orice materie", dot: null },
    ...subjects.map((s) => ({ id: s.id, name: s.name, detail: s.professor ?? "Din materialele materiei", dot: SUBJECT_COLOR_CLASSES[s.color].dot })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="stagger" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
              <Link
                href={`/asistent?materie=${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-3 transition-[background-color,border-color,transform] active:scale-[0.99] lg:py-2.5",
                  isActive
                    ? "border-accent-line bg-accent-soft"
                    : "border-line/70 bg-surface shadow-xs hover:border-line-strong lg:border-transparent lg:bg-transparent lg:shadow-none lg:hover:bg-surface",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    item.dot ? "bg-surface-muted" : "bg-accent-soft text-accent",
                  )}
                  aria-hidden="true"
                >
                  {item.dot ? <span className={cn("size-2.5 rounded-full", item.dot)} /> : <MessagesSquare className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm font-semibold", isActive ? "text-accent-ink" : "text-ink")}>{item.name}</span>
                  <span className="block truncate text-xs text-ink-muted">{item.detail}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-faint lg:hidden" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      {subjects.length === 0 ? (
        <p className="px-1 text-[13px] leading-5 text-ink-muted">
          Adaugă materii în{" "}
          <Link href="/materii" className="font-medium text-accent hover:underline">
            Materii
          </Link>{" "}
          și fiecare primește chatul ei.
        </p>
      ) : null}
    </div>
  );
}
