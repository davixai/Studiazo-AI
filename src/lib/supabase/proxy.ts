import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPreviewMode, isSupabaseConfigured, publicEnv } from "@/lib/env";
import { isAuthRoute, isPublicRoute } from "@/lib/routes";

/**
 * Reîmprospătează sesiunea la fiecare cerere și face redirecționări optimiste.
 * Autorizarea reală rămâne în pagini/acțiuni (requireUser) și în RLS.
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured() || isPreviewMode()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nu adăuga cod între crearea clientului și getClaims().
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (!isSignedIn && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/autentificare";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return redirectWithCookies(url, response);
  }

  if (isSignedIn && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/azi";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
