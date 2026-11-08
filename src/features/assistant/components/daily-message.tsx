"use client";

import { MessageCircleReply, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalCard } from "@/features/proposals/components/proposal-card";
import type { Subject } from "@/lib/contracts/domain";
import { getDailyMessage, type DailyResult } from "../actions";
import { MessageContent } from "./message-content";

type Daily = Extract<DailyResult, { ok: true }>;

// O singură cerere în zbor: în dezvoltare efectul rulează de două ori, iar asistentul nu trebuie să scrie de două ori.
let inflight: Promise<DailyResult> | null = null;
function loadDaily() {
  inflight ??= getDailyMessage().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Pe Acasă: asistentul îi scrie primul studentului, o dată pe zi, din ce știe despre el (program, termene,
 * ce i-a spus, când chiar învață). Mesajul stă în chatul general, ca să-i poată răspunde acolo.
 * Dacă asistentul nu e disponibil, cardul nu apare deloc.
 */
export function DailyMessage({ subjects, preview }: { subjects: Subject[]; preview?: Daily }) {
  const [state, setState] = useState<Daily | "loading" | "hidden">(preview ?? "loading");

  useEffect(() => {
    if (preview) return;
    let alive = true;
    loadDaily()
      .then((result) => alive && setState(result.ok ? result : "hidden"))
      .catch(() => alive && setState("hidden"));
    return () => {
      alive = false;
    };
  }, [preview]);

  if (state === "hidden") return null;
  const loading = state === "loading";

  return (
    <Card
      aria-labelledby="mesajul-asistentului"
      aria-busy={loading}
      className="stagger relative overflow-hidden border-accent-line/70 bg-[radial-gradient(120%_140%_at_0%_0%,var(--color-accent-soft),transparent_55%)]"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      {/* Pe telefon, mesajul și propunerea ocupă toată lățimea; de la sm, se aliniază sub titlu. */}
      <div className="flex flex-col gap-3 p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-accent" aria-hidden="true">
            <Sparkles className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 id="mesajul-asistentului" className="text-[15px] font-bold tracking-[-0.015em] text-ink">
              Asistentul tău
            </h2>
            <p className="text-xs text-ink-muted">{loading ? "Îți scrie…" : "Ți-a scris azi, din ce știe despre tine"}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:pl-14">

          {loading ? (
            <div className="flex flex-col gap-2" role="status">
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-2/5" />
              <span className="sr-only">Asistentul îți scrie mesajul de azi…</span>
            </div>
          ) : (
            <>
              <div className="animate-fade-in text-[15px]">
                <MessageContent text={state.message.content} />
              </div>
              {state.proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} subjects={subjects} />
              ))}
              <ButtonLink
                href={`/asistent?materie=general&conversatie=${state.conversationId}`}
                variant="secondary"
                size="sm"
                className="self-start"
              >
                <MessageCircleReply aria-hidden="true" />
                Răspunde-i
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
