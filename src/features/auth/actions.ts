"use server";

import { redirect } from "next/navigation";
import { isPreviewMode, isSupabaseConfigured, publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import {
  NewPasswordSchema,
  RecoverSchema,
  SignInSchema,
  SignUpSchema,
  fieldErrorsFrom,
  type FormState,
} from "./schemas";

const NOT_AVAILABLE: FormState = {
  status: "error",
  message: "Autentificarea nu este disponibilă în modul previzualizare. Conectează Supabase (vezi docs/SETUP.md).",
};

function unavailable() {
  return isPreviewMode() || !isSupabaseConfigured();
}

/** Traduce codurile de eroare Supabase Auth în mesaje clare, fără jargon. */
function authMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "Emailul sau parola nu sunt corecte.";
    case "email_not_confirmed":
      return "Confirmă-ți mai întâi adresa de email. Verifică inboxul (și folderul Spam).";
    case "user_already_exists":
    case "email_exists":
      return "Există deja un cont cu acest email. Încearcă să te autentifici.";
    case "weak_password":
      return "Parola este prea ușor de ghicit. Alege una mai lungă sau mai variată.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Prea multe încercări într-un timp scurt. Așteaptă un minut și încearcă din nou.";
    case "same_password":
      return "Noua parolă trebuie să fie diferită de cea veche.";
    default:
      return fallback;
  }
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  if (unavailable()) return { ...NOT_AVAILABLE, values };

  const parsed = SignInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: authMessage(error.code, "Nu te-am putut autentifica. Încearcă din nou."), values };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: String(formData.get("fullName") ?? ""), email: String(formData.get("email") ?? "") };
  if (unavailable()) return { ...NOT_AVAILABLE, values };

  const parsed = SignUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv.appUrl}/auth/callback?next=/bun-venit`,
    },
  });
  // Cont existent: cu confirmarea emailului oprită, Supabase dă eroarea „user_already_exists”;
  // cu ea pornită, nu dă eroare și nu trimite niciun email, dar întoarce un utilizator fără identități.
  const exists = error ? error.code === "user_already_exists" || error.code === "email_exists" : data.user?.identities?.length === 0;
  if (exists) {
    return {
      status: "error",
      accountExists: true,
      message: `Există deja un cont cu ${parsed.data.email}. Intră în cont sau, dacă nu mai știi parola, resetează-o.`,
      fieldErrors: { email: "Adresa are deja un cont." },
      values,
    };
  }
  if (error) {
    return { status: "error", message: authMessage(error.code, "Nu am putut crea contul. Încearcă din nou."), values };
  }

  // Confirmarea emailului dezactivată → sesiune imediată.
  if (data.session) redirect("/bun-venit");

  return {
    status: "success",
    message: `Ți-am trimis un email la ${parsed.data.email}. Deschide linkul din el ca să-ți activezi contul.`,
    values,
  };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  if (unavailable()) return { ...NOT_AVAILABLE, values };

  const parsed = RecoverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.appUrl}/auth/callback?next=/resetare-parola`,
  });
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    return { status: "error", message: authMessage(error.code, ""), values };
  }

  // Același mesaj indiferent dacă există contul (nu dezvăluim ce adrese sunt înregistrate).
  return {
    status: "success",
    message: "Dacă există un cont cu această adresă, vei primi în câteva minute un email cu linkul de resetare.",
    values,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (unavailable()) return NOT_AVAILABLE;

  const parsed = NewPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { status: "error", message: "Linkul de resetare a expirat. Cere unul nou din pagina de recuperare." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: authMessage(error.code, "Nu am putut schimba parola. Încearcă din nou.") };

  redirect("/azi");
}

export async function signOut() {
  if (!unavailable()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/autentificare");
}
