import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Client Supabase pentru componente client (ex. încărcarea directă în Storage). */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseKey);
}
