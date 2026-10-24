"use client";

import { ArrowUp, ArrowUpRight, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { SupportDialog } from "./support-dialog";

// Subsolul paginilor din aplicație: linkuri utile pe coloane, universitățile din Iași și „Suport online” (formular de contact).

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Organizare",
    links: [
      { href: "/azi", label: "Programul de azi" },
      { href: "/calendar", label: "Calendar și orar" },
      { href: "/calendar?adauga=activitate", label: "Adaugă o activitate" },
      { href: "/calendar?adauga=examen", label: "Adaugă un examen" },
      { href: "/calendar?adauga=tema", label: "Adaugă o temă" },
    ],
  },
  {
    title: "Învățare",
    links: [
      { href: "/materii", label: "Materiile mele" },
      { href: "/materii", label: "Încarcă cursuri și poze" },
      { href: "/asistent", label: "Asistentul AI" },
      { href: "/asistent?materie=general", label: "Plan de studiu" },
      { href: "/progres", label: "Progresul tău" },
      { href: "/resurse", label: "Resurse în Iași" },
    ],
  },
  {
    title: "Contul meu",
    links: [
      { href: "/profil", label: "Profil" },
      { href: "/profil#disponibilitate", label: "Când pot învăța" },
      { href: "/bun-venit", label: "Refă configurarea inițială" },
    ],
  },
];

const UNIVERSITIES = [
  { href: "https://www.uaic.ro", label: "UAIC" },
  { href: "https://www.tuiasi.ro", label: "TUIASI" },
  { href: "https://www.umfiasi.ro", label: "UMF Iași" },
  { href: "https://www.iuls.ro", label: "IULS" },
  { href: "https://www.unage.ro", label: "UNAGE" },
];

const linkClass =
  "inline-flex min-h-9 items-center text-[14px] text-ink-muted transition-colors duration-150 hover:text-accent-ink focus-visible:text-accent-ink";

export function SiteFooter() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <footer className="mt-16 border-t border-line bg-surface/40 backdrop-blur-sm lg:mt-20">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-12 lg:pb-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:gap-8">
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="max-w-xs text-[14px] leading-6 text-ink-muted">
              Programul, materiile și un asistent AI care te ajută să înveți la timp. Făcut pentru studenții din Iași.
            </p>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[14px] font-semibold text-white shadow-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              <MessageCircleQuestion className="size-5 transition-transform group-hover:-rotate-6" aria-hidden="true" />
              Suport online
            </button>
            <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:col-span-4">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="mb-3 text-[15px] font-semibold text-accent-ink">{col.title}</h2>
                <ul className="flex flex-col gap-0.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <nav aria-label="Universități din Iași">
              <h2 className="mb-3 text-[15px] font-semibold text-accent-ink">Universități din Iași</h2>
              <ul className="flex flex-col gap-0.5">
                {UNIVERSITIES.map((u) => (
                  <li key={u.href}>
                    <a href={u.href} target="_blank" rel="noopener noreferrer" className={`group ${linkClass} gap-1`}>
                      {u.label}
                      <ArrowUpRight
                        className="size-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <span className="sr-only">(se deschide într-o filă nouă)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* sm:pr-16: loc pentru butonul plutitor al asistentului, ca „Înapoi sus” să nu stea sub el. */}
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between sm:pr-16">
          <p className="text-[13px] leading-5 text-ink-faint">
            © 2026 Studiazo AI · Făcut cu grijă de studenți, pentru studenți · Datele tale rămân private
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-full border border-line px-3.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-accent-line hover:text-ink sm:self-auto"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            Înapoi sus
          </button>
        </div>
      </div>
    </footer>
  );
}
