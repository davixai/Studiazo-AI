import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { isPreviewMode } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10">
        <Link href="/autentificare" className="self-start rounded-md" aria-label="Studiazo AI">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-[400px] flex-1 animate-rise-in flex-col justify-center py-12">
          {isPreviewMode() ? (
            <Alert tone="warning" title="Mod previzualizare" className="mb-8">
              Supabase nu este conectat, așa că formularele nu creează conturi.{" "}
              <Link href="/azi" className="font-medium text-ink underline underline-offset-2">
                Vezi aplicația cu date demonstrative
              </Link>
              .
            </Alert>
          ) : null}
          {children}
        </main>
        <p className="text-center text-xs text-ink-faint lg:text-left">Studiazo AI · pentru studenții din Iași</p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-surface-muted lg:block" aria-hidden="true">
        <AuthIllustration />
      </aside>
    </div>
  );
}

/** Panou editorial: o „pagină de agendă” stilizată, fără date reale. */
function AuthIllustration() {
  const rows = [
    { time: "08:00", title: "Curs", width: "w-40", tone: "bg-cat-blue" },
    { time: "10:00", title: "Seminar", width: "w-28", tone: "bg-cat-teal" },
    { time: "14:00", title: "Studiu", width: "w-48", tone: "bg-accent" },
    { time: "18:00", title: "Temă", width: "w-32", tone: "bg-cat-amber" },
  ];
  return (
    <div className="flex h-full flex-col justify-between p-14 xl:p-20">
      <div className="max-w-md animate-rise-in">
        <p className="font-display text-[44px] leading-[1.05] font-bold tracking-[-0.03em] text-ink xl:text-[52px]">
          Al doilea creier
          <br />
          <span className="text-accent">al studentului ieșean.</span>
        </p>
        <p className="mt-6 max-w-sm text-[15px] leading-6 text-ink-soft">
          Programul tău, materiile tale și un asistent care te ajută să înveți la timp, nu în ultima noapte.
        </p>
      </div>

      <div className="max-w-sm animate-float rounded-xl border border-line bg-surface p-6 shadow-md">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Azi</span>
          <span className="h-2 w-16 rounded-full bg-surface-sunken" />
        </div>
        <ul className="space-y-4">
          {rows.map((row, i) => (
            <li key={row.time} className="stagger flex items-center gap-4" style={{ "--i": i + 3 } as React.CSSProperties}>
              <span className="w-11 text-xs text-ink-muted tabular">{row.time}</span>
              <span className={`h-8 w-0.5 rounded-full ${row.tone}`} />
              <span className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">{row.title}</span>
                <span className={`h-1.5 rounded-full bg-surface-sunken ${row.width}`} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
