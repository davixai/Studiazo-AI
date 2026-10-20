"use client";

import { CircleCheck, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";

// Formularul „Suport online” (din subsol). Deocamdată doar interfața: trimiterea pe email nu este încă legată.

type Category = "problema" | "sugestie" | "altceva";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "problema", label: "Problemă" },
  { value: "sugestie", label: "Sugestie" },
  { value: "altceva", label: "Altceva" },
];

const MIN_MESSAGE = 10;

export function SupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<Category>("problema");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function close() {
    onClose();
    // Formularul se golește după ce dialogul s-a închis, ca să nu „sară” conținutul în animație.
    window.setTimeout(() => {
      setSent(false);
      setSubject("");
      setMessage("");
      setEmail("");
      setError(null);
      setCategory("problema");
    }, 200);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (message.trim().length < MIN_MESSAGE) {
      setError(`Descrie problema în cel puțin ${MIN_MESSAGE} caractere, ca să te putem ajuta.`);
      return;
    }
    setError(null);
    // TODO: trimiterea pe email (Server Action cu validare Zod).
    setSent(true);
  }

  if (sent) {
    return (
      <Dialog open={open} onClose={close} title="Suport online" size="sm">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success animate-pop-in">
            <CircleCheck className="size-7" aria-hidden="true" />
          </span>
          <p className="text-[17px] font-semibold text-ink">Mulțumim! Am primit mesajul.</p>
          <p className="max-w-xs text-sm leading-6 text-ink-muted">Echipa Studiazo îți răspunde pe email cât de curând.</p>
          <Button variant="secondary" className="mt-2" onClick={close}>
            Închide
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent-ink ring-1 ring-accent-line/60">
            <LifeBuoy className="size-4" aria-hidden="true" />
          </span>
          Suport online
        </span>
      }
      description="Ai întâlnit o problemă sau ai o idee? Scrie-ne și îți răspundem pe email."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Anulează
          </Button>
          <Button type="submit" form="support-form">
            Trimite mesajul
          </Button>
        </>
      }
    >
      <form id="support-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Segmented label="Tipul mesajului" options={CATEGORIES} value={category} onChange={setCategory} className="w-full" />

        <Field id="support-subject" label="Subiect" optional>
          <Input
            id="support-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Nu se încarcă orarul"
          />
        </Field>

        <Field id="support-message" label="Descrie problema" error={error}>
          <Textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Ce s-a întâmplat, pe ce pagină și ce ai încercat…"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy("support-message", { error })}
          />
        </Field>

        <Field id="support-email" label="Email pentru răspuns" optional hint="Dacă îl lași gol, îți răspundem pe emailul contului.">
          <Input
            id="support-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume@exemplu.ro"
            aria-describedby={describedBy("support-email", { hint: true })}
          />
        </Field>
      </form>
    </Dialog>
  );
}
