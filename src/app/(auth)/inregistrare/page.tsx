import type { Metadata } from "next";
import Link from "next/link";
import { AuthFooter, AuthHeading } from "@/features/auth/components/auth-heading";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Creează cont" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Creează-ți contul"
        description="Durează un minut. Programul și materiile le poți adăuga oricând după."
      />
      <SignUpForm />
      <AuthFooter>
        Ai deja cont?{" "}
        <Link href="/autentificare" className="font-medium text-accent hover:underline">
          Intră în cont
        </Link>
      </AuthFooter>
    </>
  );
}
