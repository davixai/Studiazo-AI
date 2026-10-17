import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, isClassroomConfigured, startAuthorization } from "@/features/classroom/google";
import { getCurrentUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";

/** Trimite studentul la Google ca să permită citirea cursurilor din Classroom. */
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  if (isPreviewMode() || !isClassroomConfigured()) return NextResponse.redirect(new URL("/classroom?eroare=config", origin));
  if (!(await getCurrentUser())) return NextResponse.redirect(new URL("/autentificare?next=/classroom", origin));

  const { url, cookie } = startAuthorization();
  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, cookie, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/classroom",
    maxAge: 600,
  });
  return response;
}
