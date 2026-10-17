// Variabile publice (NEXT_PUBLIC_*): sigure în browser. Cele secrete se citesc doar în module server-only.
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function isSupabaseConfigured() {
  return (
    publicEnv.supabaseUrl.startsWith("https://") &&
    publicEnv.supabaseKey.length > 20 &&
    !publicEnv.supabaseUrl.includes("exemplu-proiect")
  );
}

/**
 * Modul previzualizare: interfața rulează cu date demonstrative, fără Supabase.
 * Activ doar când Supabase lipsește ȘI STUDIA_PREVIEW=1 (variabilă de server).
 * Folosit pentru revizuirea designului și capturi de ecran, niciodată în producție reală.
 */
export function isPreviewMode() {
  return !isSupabaseConfigured() && process.env.STUDIA_PREVIEW === "1";
}
