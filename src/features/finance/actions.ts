"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fieldErrorsFrom, type FormState } from "@/features/auth/schemas";
import { describeAiError, getOpenAI, withFreeTierRetry } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ADVICE_INSTRUCTIONS, buildAdvicePrompt } from "./advice-prompt";
import { getFinance } from "./queries";
import { EntryFormSchema, MonthSchema } from "./schemas";
import { shiftMonth, summarize, trend } from "./stats";

// user_id nu se trimite: coloana are `default auth.uid()`, iar RLS permite doar rândurile proprii.

const PREVIEW_STATE: FormState = { status: "error", message: "Modul previzualizare nu salvează date. Conectează Supabase ca să-ți salvezi bugetul." };
const MIGRATION_MESSAGE = "Bugetul nu este încă activ pe server (lipsește migrația bazei de date).";

function revalidateBudget() {
  revalidatePath("/buget");
}

export async function addEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const values = {
    kind: String(formData.get("kind") ?? ""),
    category: String(formData.get("category") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    note: String(formData.get("note") ?? ""),
    month: String(formData.get("month") ?? ""),
  };
  const parsed = EntryFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { kind, category, amount, note, month } = parsed.data;
  const { error } = await supabase.from("finance_entries").insert({ kind, category, amount, note, month: `${month}-01` });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { status: "error", message: MIGRATION_MESSAGE, values };
  if (error) return { status: "error", message: "Nu am putut salva. Încearcă din nou.", values };

  revalidateBudget();
  // Păstrăm tipul și categoria, ca următoarea înregistrare să fie mai rapidă.
  return { status: "success", message: kind === "venit" ? "Venit adăugat." : "Cheltuială adăugată.", values: { kind, category, month } };
}

export async function deleteEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Înregistrarea nu mai există." };

  const supabase = await createClient();
  const { error } = await supabase.from("finance_entries").delete().eq("id", id.data);
  if (error) return { status: "error", message: "Nu am putut șterge. Încearcă din nou." };

  revalidateBudget();
  return { status: "success" };
}

/** Copiază înregistrările lunii trecute într-o lună goală (chiria, bursa și abonamentele se repetă). */
export async function copyPreviousMonth(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const month = MonthSchema.safeParse(formData.get("month"));
  if (!month.success) return { status: "error", message: "Lună invalidă." };

  const supabase = await createClient();
  const [{ data: current }, { data: previous, error }] = await Promise.all([
    supabase.from("finance_entries").select("id").eq("month", `${month.data}-01`).limit(1),
    supabase.from("finance_entries").select("kind, category, amount, note").eq("month", `${shiftMonth(month.data, -1)}-01`),
  ]);
  if (error) return { status: "error", message: "Nu am putut citi luna trecută." };
  if ((current ?? []).length > 0) return { status: "error", message: "Luna aceasta are deja înregistrări." };
  if (!previous?.length) return { status: "error", message: "Luna trecută nu are nimic de copiat." };

  const { error: insertError } = await supabase.from("finance_entries").insert(previous.map((r) => ({ ...r, month: `${month.data}-01` })));
  if (insertError) return { status: "error", message: "Nu am putut copia. Încearcă din nou." };

  revalidateBudget();
  return { status: "success", message: `Am copiat ${previous.length} înregistrări. Ajustează sumele care s-au schimbat.` };
}

export type AdviceResult = { ok: true; text: string } | { ok: false; message: string };

/** Sfaturile AI pentru luna aleasă, generate din datele reale ale studentului. Nu se salvează. */
export async function getFinanceAdvice(input: unknown): Promise<AdviceResult> {
  const user = await requireUser();
  const month = MonthSchema.safeParse(input);
  if (!month.success) return { ok: false, message: "Lună invalidă." };

  const config = getAiConfig();
  if (!config.enabled) return { ok: false, message: "Asistentul AI nu este disponibil momentan." };

  const data = await getFinance(month.data);
  if (!data.available) return { ok: false, message: MIGRATION_MESSAGE };
  if (data.entries.length === 0) return { ok: false, message: "Adaugă mai întâi veniturile și cheltuielile lunii." };

  const supabase = await createClient();
  if (!isPreviewMode()) {
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
    if ((count ?? 0) >= config.requestsPerHour) return { ok: false, message: "Ai folosit AI-ul de multe ori în ultima oră. Mai încearcă puțin mai târziu." };
  }

  const prompt = buildAdvicePrompt(month.data, summarize(data.entries), data.entries, trend(data.history, month.data));

  try {
    let text: string;
    let usage = { input: 0, output: 0 };
    if (config.apiStyle === "chat") {
      const chat = await withFreeTierRetry(() =>
        getOpenAI().chat.completions.create({
          model: config.model,
          messages: [
            { role: "system", content: ADVICE_INSTRUCTIONS },
            { role: "user", content: prompt },
          ],
        }),
      );
      text = chat.choices[0]?.message?.content ?? "";
      usage = { input: chat.usage?.prompt_tokens ?? 0, output: chat.usage?.completion_tokens ?? 0 };
    } else {
      const response = await withFreeTierRetry(() =>
        getOpenAI().responses.create({
          model: config.model,
          instructions: ADVICE_INSTRUCTIONS,
          input: [{ role: "user", content: prompt }],
          reasoning: { effort: "low" },
          max_output_tokens: Math.max(config.maxOutputTokens, 2000),
          ...(config.openaiExtras ? { store: false, safety_identifier: createHash("sha256").update(user.id).digest("hex").slice(0, 32) } : {}),
        }),
      );
      text = response.output_text;
      usage = { input: response.usage?.input_tokens ?? 0, output: response.usage?.output_tokens ?? 0 };
    }

    if (!isPreviewMode()) {
      await supabase.from("ai_usage").insert({ kind: "finance", model: config.model, input_tokens: usage.input, output_tokens: usage.output });
    }
    text = text.trim();
    return text ? { ok: true, text } : { ok: false, message: "AI-ul nu a trimis niciun sfat. Încearcă din nou." };
  } catch (error) {
    if (!isPreviewMode()) await supabase.from("ai_usage").insert({ kind: "finance", model: config.model, ok: false });
    return { ok: false, message: describeAiError(error).message };
  }
}
