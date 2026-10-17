import { Logo } from "@/components/brand/logo";

/** Afișat când aplicația rulează fără Supabase și fără modul previzualizare. */
export function SetupRequired() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <Logo className="mb-10" />
      <h1 className="font-display text-[34px] leading-tight font-bold tracking-[-0.03em]">Aplicația nu este configurată încă</h1>
      <p className="mt-4 text-[15px] leading-7 text-ink-soft">
        Lipsește conexiunea la baza de date. Completează variabilele din <code className="font-mono text-sm">.env.local</code>{" "}
        după pașii din <code className="font-mono text-sm">docs/SETUP.md</code>, apoi repornește serverul.
      </p>
      <p className="mt-4 text-[15px] leading-7 text-ink-soft">
        Vrei doar să vezi interfața? Pornește cu <code className="font-mono text-sm">STUDIA_PREVIEW=1</code> pentru date
        demonstrative.
      </p>
    </main>
  );
}
