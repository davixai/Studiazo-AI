import { Camera, Gift, LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthFooter, AuthHeading } from "@/features/auth/components/auth-heading";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeNextPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Autentificare" };

export default async function SignInPage({ searchParams }: PageProps<"/autentificare">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeNextPath(params.next) : undefined;
  // Venit de la „Ai deja cont” din înregistrare: emailul e deja completat.
  const email = typeof params.email === "string" && params.email.length <= 254 ? params.email : undefined;

  return (
    <>
      <AuthHeading title="Bine ai revenit" description="Intră în cont ca să vezi ce ai de făcut azi." />
      <SignInForm next={next} email={email} linkError={params.eroare === "link"} />
      <AuthFooter>
        Nu ai cont?{" "}
        <Link href="/inregistrare" className="font-medium text-accent hover:underline">
          Creează unul gratuit
        </Link>
      </AuthFooter>
      {/* Doar pe Autentificare (nu și la Creează cont / Recuperare), doar pe calculator. */}
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
    </>
  );
}

const HIGHLIGHTS = [
  { icon: Gift, title: "Gratuit pentru studenți", text: "Contul se face în mai puțin de un minut, fără card." },
  { icon: Camera, title: "Orarul din poză", text: "Pozezi orarul facultății, iar noi îl punem în calendar." },
  { icon: LockKeyhole, title: "Datele tale rămân private", text: "Doar tu îți vezi programul, cursurile și notițele." },
];
