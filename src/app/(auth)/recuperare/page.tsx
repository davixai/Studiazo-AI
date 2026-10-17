import type { Metadata } from "next";
import Link from "next/link";
import { AuthFooter, AuthHeading } from "@/features/auth/components/auth-heading";
import { RecoverForm } from "@/features/auth/components/recover-form";

export const metadata: Metadata = { title: "Recuperează accesul" };

export default function RecoverPage() {
  return (
    <>
      <AuthHeading
        title="Ai uitat parola?"
        description="Scrie adresa contului și îți trimitem un link pentru a alege o parolă nouă."
      />
      <RecoverForm />
      <AuthFooter>
        Ți-ai amintit?{" "}
        <Link href="/autentificare" className="font-medium text-accent hover:underline">
          Înapoi la autentificare
        </Link>
      </AuthFooter>
    </>
  );
}
