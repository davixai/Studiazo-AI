import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { NewPasswordForm } from "@/features/auth/components/recover-form";

export const metadata: Metadata = { title: "Parolă nouă" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <Logo className="self-start" />
      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
        <AuthHeading title="Alege o parolă nouă" description="După salvare, rămâi conectat și ajungi direct în aplicație." />
        <NewPasswordForm />
      </main>
    </div>
  );
}
