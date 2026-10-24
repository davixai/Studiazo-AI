// Fără zod: componentele de client importă de aici, ca biblioteca să nu ajungă în browser.

export const PASSWORD_MIN = 8;

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
