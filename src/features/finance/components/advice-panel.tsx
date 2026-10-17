"use client";

import { CalendarCheck, LineChart, PiggyBank, RefreshCw, ShieldCheck, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MessageContent } from "@/features/assistant/components/message-content";
import { getFinanceAdvice } from "../actions";
import { splitAdvice } from "../advice-prompt";

const SECTION_ICONS: Array<[RegExp, LucideIcon]> = [
  [/scurt/i, Stethoscope],
  [/economis/i, PiggyBank],
  [/urgen/i, ShieldCheck],
  [/invest/i, LineChart],
  [/plan/i, CalendarCheck],
];

function iconFor(title: string) {
  return SECTION_ICONS.find(([re]) => re.test(title))?.[1] ?? Sparkles;
}

/** Sfaturile AI pentru luna afișată: generate la cerere din datele reale ale studentului. */
export function AdvicePanel({ month, hasData, aiAvailable }: { month: string; hasData: boolean; aiAvailable: boolean }) {
  const [advice, setAdvice] = useState<{ month: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = advice?.month === month ? advice.text : null;

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await getFinanceAdvice(month);
      if (result.ok) setAdvice({ month, text: result.text });
      else setError(result.message);
    });
  }

  return (
    <section aria-labelledby="sfaturi-ai" className="stagger rounded-xl bg-brand p-px shadow-accent" style={{ "--i": 3 } as React.CSSProperties}>
      <div className="relative overflow-hidden rounded-[calc(var(--radius-xl)-1px)] bg-surface p-5 sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-accent">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="sfaturi-ai" className="text-[16px] font-bold tracking-[-0.015em] text-ink">
                Sfaturi AI pentru bugetul tău
              </h2>
              <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">Cum economisești, fondul de urgență și unde poți investi, pornind de la cifrele tale.</p>
            </div>
          </div>
          {aiAvailable && hasData ? (
            <Button onClick={generate} loading={pending} className="shrink-0">
              {current ? <RefreshCw aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              {current ? "Generează din nou" : "Analizează luna"}
            </Button>
          ) : null}
        </div>

        <div className="relative mt-5">
          {!aiAvailable ? (
            <Alert tone="info">Asistentul AI nu este configurat pe acest server, așa că sfaturile nu sunt disponibile momentan.</Alert>
          ) : !hasData ? (
            <p className="text-sm text-ink-muted">Adaugă veniturile și cheltuielile lunii, apoi cere o analiză.</p>
          ) : error ? (
            <Alert tone="danger">{error}</Alert>
          ) : pending && !current ? (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Spinner /> Analizez veniturile și cheltuielile tale…
            </p>
          ) : current ? (
            <div className="grid gap-3 md:grid-cols-2">
              {splitAdvice(current).map((section, i) => {
                const Icon = iconFor(section.title);
                const wide = !section.title || /scurt|plan/i.test(section.title);
                return (
                  <article
                    key={i}
                    className={`animate-rise-in rounded-lg border border-line/70 bg-surface-muted/50 p-4 ${wide ? "md:col-span-2" : ""}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {section.title ? (
                      <h3 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink">
                        <Icon className="size-4 text-accent-ink" aria-hidden="true" />
                        {section.title}
                      </h3>
                    ) : null}
                    <div className="text-[14px] [&_div]:text-[14px] [&_div]:leading-6">
                      <MessageContent text={section.body} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Apasă „Analizează luna” și primești în câteva secunde un plan personalizat.</p>
          )}
        </div>
      </div>
    </section>
  );
}
