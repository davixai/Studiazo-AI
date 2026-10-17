import "server-only";
import OpenAI from "openai";
import { getAiConfig } from "./config";

// Punctul unic de acces la OpenAI. Pentru alt furnizor se schimbă doar acest modul și config.ts.

let cached: OpenAI | null = null;

export class AiUnavailableError extends Error {
  constructor() {
    super("Asistentul AI nu este configurat.");
    this.name = "AiUnavailableError";
  }
}

export function getOpenAI(): OpenAI {
  const config = getAiConfig();
  if (!config.enabled) throw new AiUnavailableError();
  cached ??= new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: config.timeoutMs, maxRetries: config.maxRetries });
  return cached;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Planurile gratuite limitează ritmul (ex. un răspuns la 30 de secunde). La 402/429 așteptăm cât cere
 * serviciul („Retry after Ns”) și reîncercăm de câteva ori, în loc să afișăm direct o eroare.
 */
export async function withFreeTierRetry<T>(request: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      const limited = error instanceof OpenAI.APIError && (error.status === 402 || error.status === 429);
      if (!limited || attempt >= attempts) throw error;
      const seconds = Number(/retry after (\d+)\s*s/i.exec(error.message)?.[1] ?? 30);
      await sleep((Math.min(seconds, 60) + 1) * 1000);
    }
  }
}

/** Transformă erorile SDK în mesaje pentru student (fără detalii interne). */
export function describeAiError(error: unknown): { code: string; message: string; retryable: boolean } {
  if (error instanceof AiUnavailableError) {
    return { code: "not_configured", message: "Asistentul AI nu este disponibil momentan.", retryable: false };
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return { code: "timeout", message: "Asistentul a răspuns prea greu. Încearcă din nou.", retryable: true };
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return { code: "network", message: "Nu am putut contacta asistentul. Verifică conexiunea.", retryable: true };
  }
  if (error instanceof OpenAI.RateLimitError || (error instanceof OpenAI.APIError && error.status === 402)) {
    return { code: "rate_limited", message: "Sunt prea multe cereri acum. Încearcă peste un minut.", retryable: true };
  }
  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    return { code: "auth", message: "Asistentul AI nu este disponibil momentan.", retryable: false };
  }
  if (error instanceof OpenAI.APIError && (error.status ?? 0) >= 500) {
    return { code: "upstream", message: "Serviciul AI are o problemă temporară. Încearcă din nou.", retryable: true };
  }
  return { code: "unknown", message: "A apărut o eroare neașteptată la asistent.", retryable: false };
}
