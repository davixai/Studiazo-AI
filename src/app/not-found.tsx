import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Logo className="mb-10" />
      <p className="text-[13px] font-medium text-ink-muted">Eroare 404</p>
      <h1 className="mt-2 font-display text-[34px] leading-tight font-medium tracking-[-0.02em]">Pagina nu există</h1>
      <p className="mt-3 text-[15px] leading-7 text-ink-soft">Poate linkul este greșit sau pagina a fost mutată.</p>
      <ButtonLink href="/azi" className="mt-8 self-start">
        Înapoi la Azi
      </ButtonLink>
    </main>
  );
}
