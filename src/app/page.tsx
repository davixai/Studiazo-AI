import { redirect } from "next/navigation";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  // Linkurile din emailuri ajung aici când Supabase folosește Site URL în loc de /auth/callback
  // (ex. înainte de configurarea „Redirect URLs”). Le trimitem mai departe la callback.
  const forward = new URLSearchParams();
  for (const key of ["code", "token_hash", "type", "next"]) {
    const value = params[key];
    if (typeof value === "string") forward.set(key, value);
  }
  if (forward.has("code") || forward.has("token_hash")) {
    if (!forward.has("next")) forward.set("next", forward.get("type") === "recovery" ? "/resetare-parola" : "/bun-venit");
    redirect(`/auth/callback?${forward.toString()}`);
  }

  redirect("/azi");
}
