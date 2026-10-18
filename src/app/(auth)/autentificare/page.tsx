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
    </>
  );
}
