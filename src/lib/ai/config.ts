import "server-only";

// Configurarea AI se citește DOAR pe server. Cheia nu ajunge niciodată în browser sau în loguri.

const DEFAULT_MODEL = "gpt-6-luna";

function intFromEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;
}

export function getAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  // Furnizor compatibil OpenAI (ex. Groq, gratuit: https://api.groq.com/openai/v1). Gol = OpenAI.
  const baseURL = process.env.AI_BASE_URL?.trim() || undefined;
  // Serviciu public fără cheie (ex. Pollinations: https://text.pollinations.ai/openai), cu AI_KEYLESS=1.
  const keyless = process.env.AI_KEYLESS === "1" && Boolean(baseURL);
  return {
    enabled: keyless || (apiKey.length >= 20 && !apiKey.includes("EXEMPLU")),
    apiKey: keyless ? "fara-cheie" : apiKey,
    /** „responses” (OpenAI, Groq) sau „chat” (Chat Completions, pentru furnizorii care nu au Responses API). */
    apiStyle: process.env.AI_API === "chat" ? ("chat" as const) : ("responses" as const),
    baseURL,
    /** Parametrii pe care doar OpenAI îi acceptă (store, include, prompt_cache_key, safety_identifier). */
    openaiExtras: !baseURL,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    requestsPerHour: intFromEnv("AI_REQUESTS_PER_HOUR", 30, 1, 500),
    maxOutputTokens: intFromEnv("AI_MAX_OUTPUT_TOKENS", 1200, 200, 8000),
    /** Timeout per cerere către OpenAI. */
    timeoutMs: 30_000,
    /** Reîncercări automate ale SDK-ului pentru erori temporare (429/5xx/rețea). */
    maxRetries: 1,
  };
}

/** Starea afișată în interfață. Nu dezvăluie detalii tehnice utilizatorului final. */
export type AiStatus = { available: true; model: string } | { available: false; reason: "not_configured" };

export function getAiStatus(): AiStatus {
  const config = getAiConfig();
  return config.enabled ? { available: true, model: config.model } : { available: false, reason: "not_configured" };
}
