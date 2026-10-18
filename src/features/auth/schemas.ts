import { z } from "zod";

export const PASSWORD_MIN = 8;

const email = z.string().trim().toLowerCase().email("Introdu o adresă de email validă.").max(254);
const password = z
  .string()
  .min(PASSWORD_MIN, `Parola trebuie să aibă cel puțin ${PASSWORD_MIN} caractere.`)
  .max(72, "Parola poate avea cel mult 72 de caractere.");

export const SignInSchema = z.object({
  email,
  password: z.string().min(1, "Introdu parola."),
});

export const SignUpSchema = z.object({
  fullName: z.string().trim().min(2, "Spune-ne cum te numești.").max(120),
  email,
  password,
});

export const RecoverSchema = z.object({ email });

export const NewPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Parolele nu coincid." });

/** Starea comună a formularelor (folosită cu useActionState). */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** La înregistrare: emailul are deja cont → formularul arată „Intră în cont” / „Resetează parola”. */
  accountExists?: boolean;
  fieldErrors?: Record<string, string>;
  /** Valorile trimise, ca formularul să nu se golească la eroare (fără parole). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
