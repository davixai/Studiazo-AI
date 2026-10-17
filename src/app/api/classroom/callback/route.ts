import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, TOKEN_COOKIE, exchangeCode, readStateCookie, tokenCookieValue } from "@/features/classroom/google";
import { getCurrentUser } from "@/lib/auth/session";

/** Întoarcerea de la Google: verifică `state`, schimbă codul pe token și îl păstrează în cookie-ul httpOnly. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const back = (error?: string) => {
    const response = NextResponse.redirect(new URL(error ? `/classroom?eroare=${error}` : "/classroom", origin));
    response.cookies.delete({ name: STATE_COOKIE, path: "/api/classroom" });
    return response;
  };

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/autentificare?next=/classroom", origin));
  if (searchParams.get("error")) return back("refuzat");

  const saved = readStateCookie(request.cookies.get(STATE_COOKIE)?.value);
  const state = searchParams.get("state") ?? "";
  const code = searchParams.get("code");
  if (!saved || !code || !sameString(saved.s, state)) return back("stare");

  const token = await exchangeCode(code, saved.v);
  if (!token) return back("schimb");

  const response = back();
  response.cookies.set(TOKEN_COOKIE, tokenCookieValue(user.id, token.accessToken), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, token.expiresIn - 120),
  });
  return response;
}

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
