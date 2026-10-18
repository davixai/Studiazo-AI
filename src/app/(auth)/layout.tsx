import { Camera, Gift, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { FeatureMarquee } from "@/features/auth/components/feature-marquee";
import { isPreviewMode } from "@/lib/env";

const HIGHLIGHTS = [
  { icon: Gift, title: "Gratuit pentru studenți", text: "Contul se face în mai puțin de un minut, fără card." },
  { icon: Camera, title: "Orarul din poză", text: "Pozezi orarul facultății, iar noi îl punem în calendar." },
  { icon: LockKeyhole, title: "Datele tale rămân private", text: "Doar tu îți vezi programul, cursurile și notițele." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
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
          <ul className="mt-12 hidden gap-3 border-t border-line/70 pt-8 lg:grid">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-ink">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{title}</p>
                  <p className="text-[13px] leading-5 text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </main>
        <div aria-hidden="true" className="-mx-5 mb-6 sm:-mx-10 lg:hidden">
          <FeatureMarquee single />
        </div>
        <p className="text-center text-xs text-ink-faint lg:text-left">Studiazo AI · pentru studenții din Iași</p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-surface-muted lg:block" aria-hidden="true">
        <AuthIllustration />
      </aside>
    </div>
  );
}

/** Panou editorial: titlul și două benzi cu previzualizări ale aplicației, fără date reale. */
function AuthIllustration() {
  return (
    <div className="flex h-full flex-col justify-between gap-10 py-14 xl:py-20">
      <div className="px-14 xl:px-20">
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
      </div>

      <div className="stagger" style={{ "--i": 3 } as React.CSSProperties}>
        <FeatureMarquee />
      </div>
    </div>
  );
}
