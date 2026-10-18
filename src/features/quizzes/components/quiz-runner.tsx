"use client";

import { ArrowRight, Check, ChevronLeft, MessageCircleQuestion, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import type { Quiz } from "@/lib/contracts/quiz";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/features/assistant/components/message-content";
import { explainAttempt, submitAttempt, type SubmitAttemptResult } from "../actions";

type QuizRunnerProps = { quizId: string; quiz: Quiz; subject: { id: string; name: string } };

const LETTERS = ["A", "B", "C", "D"];

/** O întrebare pe rând, cu răspunsul și explicația imediat după alegere; la final scorul pe teme. */
export function QuizRunner({ quizId, quiz, subject }: QuizRunnerProps) {
  const total = quiz.questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null));
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [result, setResult] = useState<Extract<SubmitAttemptResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [review, setReview] = useState<{ text: string; href: string } | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [explaining, startExplaining] = useTransition();
  const reviewRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  const question = quiz.questions[index];
  const chosen = answers[index];
  const revealed = chosen !== null;
  const correctSoFar = answers.filter((a, i) => a === quiz.questions[i].correctIndex).length;
  const chatHref = `/asistent?materie=${subject.id}`;

  // Pe telefon explicația și butonul următor ies din ecran: le aducem în vedere după răspuns.
  useEffect(() => {
    if (revealed) explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed, index]);

  const choose = (option: number) => {
    if (revealed) return;
    setAnswers((prev) => prev.map((a, i) => (i === index ? option : a)));
  };

  const finish = () => {
    setError(null);
    startSaving(async () => {
      const saved = await submitAttempt({ quizId, answers, durationSeconds: Math.round((Date.now() - startedAt) / 1000) });
      if (saved.ok) setResult(saved);
      else setError(saved.message);
    });
  };

  const explain = () => {
    if (!result) return;
    setReviewError(null);
    startExplaining(async () => {
      const explained = await explainAttempt({ attemptId: result.attemptId });
      if (explained.ok) {
        setReview({ text: explained.text, href: explained.href });
        requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      } else setReviewError(explained.message);
    });
  };

  const restart = () => {
    setReview(null);
    setReviewError(null);
    setAnswers(quiz.questions.map(() => null));
    setIndex(0);
    setResult(null);
    setStartedAt(Date.now());
  };

  if (result) {
    const ratio = result.score / result.total;
    const hasMistakes = result.score < result.total;
    const verdict = ratio === 1 ? "Perfect!" : ratio >= 0.8 ? "Foarte bine!" : ratio >= 0.5 ? "Pe drumul cel bun" : "Mai exersăm puțin";
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <BackLink href={chatHref} label={subject.name} />
        <div className="flex flex-col items-center rounded-lg border border-line/70 bg-surface p-6 text-center shadow-sm sm:p-8">
          <ScoreRing score={result.score} total={result.total} />
          <h1 className="mt-5 text-[22px] font-bold tracking-[-0.03em] text-ink">{verdict}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Testul contează la streak-ul și timpul tău de învățare de azi.
          </p>

          <ul className="mt-6 flex w-full flex-col gap-3 text-left">
            {Object.entries(result.breakdown).map(([topic, { correct, total: count }], i) => (
              <li key={topic}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-ink">{topic}</span>
                  <span className="shrink-0 text-ink-muted tabular">
                    {correct}/{count}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className={cn("h-full origin-left animate-fill-x rounded-full", correct / count >= 0.6 ? "bg-success" : "bg-warning")}
                    style={{ width: `${Math.max((correct / count) * 100, 4)}%`, animationDelay: `${i * 90}ms` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {result.weak.length > 0 ? (
            <Alert tone="warning" className="mt-6 w-full text-left" title="De recapitulat">
              {result.weak.join(", ")}.
            </Alert>
          ) : null}

          {reviewError ? (
            <Alert tone="danger" className="mt-6 w-full text-left">
              {reviewError}
            </Alert>
          ) : null}

          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={restart} disabled={explaining}>
              <RotateCcw aria-hidden="true" />
              Refă testul
            </Button>
            {hasMistakes && !review ? (
              <Button onClick={explain} loading={explaining}>
                <Sparkles aria-hidden="true" />
                Explică-mi ce n-a mers bine
              </Button>
            ) : (
              <ButtonLink href={review?.href ?? chatHref} variant={review ? "secondary" : "primary"}>
                <MessageCircleQuestion aria-hidden="true" />
                {review ? "Continuă în chatul materiei" : "Înapoi la chat"}
              </ButtonLink>
            )}
          </div>
        </div>

        {explaining ? (
          <div className="flex flex-col gap-3 rounded-lg border border-accent-line bg-surface p-5 shadow-sm animate-rise-in sm:p-6" role="status">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-ink">
              <Sparkles className="size-4 animate-pulse" aria-hidden="true" />
              Asistentul îți analizează greșelile…
            </p>
            {[92, 78, 85, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded-full bg-surface-muted" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        ) : null}

        {review ? (
          <section
            ref={reviewRef}
            aria-labelledby="ce-nu-a-mers"
            className="scroll-mt-6 rounded-lg border border-accent-line bg-surface p-5 shadow-sm animate-rise-in sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="ce-nu-a-mers" className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em] text-ink">
                <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent-ink" aria-hidden="true">
                  <Sparkles className="size-4" />
                </span>
                Ce n-a mers bine
              </h2>
              <span className="text-xs text-ink-muted">Salvat în istoricul materiei</span>
            </div>
            <MessageContent text={review.text} />
            <ButtonLink href={review.href} variant="secondary" className="mt-5 w-full sm:w-auto">
              <MessageCircleQuestion aria-hidden="true" />
              Întreabă mai departe în chat
            </ButtonLink>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <BackLink href={chatHref} label={subject.name} />
      <header>
        <p className="text-[13px] font-medium text-ink-muted">
          Întrebarea {index + 1} din {total} · {correctSoFar} corecte
        </p>
        <h1 className="mt-1 text-[22px] leading-tight font-bold tracking-[-0.03em] text-ink">{quiz.title}</h1>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-label="Progres în test"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + (revealed ? 1 : 0)}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${((index + (revealed ? 1 : 0)) / total) * 100}%` }} />
        </div>
      </header>

      <section key={question.id} className="flex flex-col gap-4 rounded-lg border border-line/70 bg-surface p-5 shadow-sm animate-rise-in sm:p-6">
        <p className="text-[17px] leading-7 font-semibold text-ink">{question.prompt}</p>
        <div role="radiogroup" aria-label="Variante de răspuns" className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const isChosen = i === chosen;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={revealed}
                onClick={() => choose(i)}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-4 py-3 text-left text-[15px] leading-6 transition-[background-color,border-color,transform,opacity] duration-200",
                  !revealed && "border-line-strong bg-surface hover:border-accent-line hover:bg-accent-soft/50 active:scale-[0.99]",
                  revealed && isCorrect && "border-success/40 bg-success-soft text-ink",
                  revealed && isChosen && !isCorrect && "border-danger/40 bg-danger-soft text-ink",
                  revealed && !isCorrect && !isChosen && "border-line bg-surface opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    revealed && isCorrect ? "bg-success text-white animate-pop-in" : revealed && isChosen ? "bg-danger text-white" : "bg-surface-muted text-ink-muted",
                  )}
                  aria-hidden="true"
                >
                  {revealed && isCorrect ? <Check className="size-3.5" strokeWidth={3} /> : revealed && isChosen ? <X className="size-3.5" strokeWidth={3} /> : LETTERS[i]}
                </span>
                <span className="min-w-0 flex-1">{option}</span>
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div ref={explanationRef} className="scroll-mb-40 rounded-md bg-surface-muted p-4 animate-rise-in" aria-live="polite">
            <p className={cn("text-sm font-bold", chosen === question.correctIndex ? "text-success" : "text-danger")}>
              {chosen === question.correctIndex ? "Corect!" : `Nu chiar. Răspunsul corect: ${LETTERS[question.correctIndex]}.`}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{question.explanation}</p>
            {question.source.page ? <p className="mt-2 text-xs text-ink-muted">Sursa: pagina {question.source.page} din curs</p> : null}
          </div>
        ) : null}
      </section>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex justify-end">
        {index < total - 1 ? (
          <Button size="lg" onClick={() => setIndex((i) => i + 1)} disabled={!revealed} className="w-full sm:w-auto">
            Următoarea întrebare
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button size="lg" onClick={finish} disabled={!revealed} loading={saving} className="w-full sm:w-auto">
            Vezi rezultatul
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink">
      <ChevronLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const ratio = total > 0 ? score / total : 0;
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="relative size-36 animate-pop-in" role="img" aria-label={`${score} din ${total} corecte`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-surface-sunken" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", ratio >= 0.6 ? "stroke-success" : "stroke-warning")}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] leading-none font-bold tracking-[-0.03em] text-ink tabular">
          {score}/{total}
        </span>
        <span className="mt-1 text-xs text-ink-muted">corecte</span>
      </div>
    </div>
  );
}
