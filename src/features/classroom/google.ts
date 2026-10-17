import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { GCourse, GCourseWork, GPost, GSubmission } from "./mapping";

// Clientul Google (OAuth + Classroom + Drive), doar pe server. Secretul nu ajunge niciodată în browser.
// Tokenul de acces stă într-un cookie httpOnly legat de contul Studiazo, valabil cât îl lasă Google (~1 oră).
// Nu păstrăm refresh token și nu salvăm nimic de la Google în baza de date.

export const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

export const TOKEN_COOKIE = "studiazo_classroom";
export const STATE_COOKIE = "studiazo_classroom_state";

const CLASSROOM = "https://classroom.googleapis.com/v1";
const DRIVE = "https://www.googleapis.com/drive/v3";
const MAX_PAGES = 10;

function credentials() {
  return { clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" };
}

export function isClassroomConfigured() {
  const { clientId, clientSecret } = credentials();
  return clientId.endsWith(".apps.googleusercontent.com") && clientSecret.length > 10;
}

export function redirectUri() {
  return `${publicEnv.appUrl}/api/classroom/callback`;
}

/** Începutul fluxului OAuth: `state` contra CSRF și PKCE (verificatorul rămâne în cookie-ul nostru). */
export function startAuthorization() {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: credentials().clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    include_granted_scopes: "true",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: JSON.stringify({ s: state, v: verifier }) };
}

export function readStateCookie(value: string | undefined): { s: string; v: string } | null {
  try {
    const parsed = JSON.parse(value ?? "");
    return typeof parsed?.s === "string" && typeof parsed?.v === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string, verifier: string): Promise<{ accessToken: string; expiresIn: number } | null> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  return data.access_token ? { accessToken: data.access_token, expiresIn: data.expires_in ?? 3600 } : null;
}

export function tokenCookieValue(userId: string, accessToken: string) {
  return JSON.stringify({ u: userId, t: accessToken });
}

/** Tokenul Google al utilizatorului curent; null dacă lipsește, a expirat sau aparține altui cont Studiazo. */
export async function readToken(userId: string): Promise<string | null> {
  const raw = (await cookies()).get(TOKEN_COOKIE)?.value;
  try {
    const parsed = JSON.parse(raw ?? "");
    return parsed?.u === userId && typeof parsed?.t === "string" ? parsed.t : null;
  } catch {
    return null;
  }
}

export async function forgetToken() {
  (await cookies()).delete(TOKEN_COOKIE);
}

export class GoogleError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string,
  ) {
    super(`Google API ${status}: ${reason}`);
  }
}

async function call(token: string, url: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) {
    let reason = "";
    try {
      const body = (await res.json()) as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
      reason = body.error?.errors?.[0]?.reason ?? body.error?.message ?? "";
    } catch {
      // corp gol sau ne-JSON
    }
    throw new GoogleError(res.status, reason);
  }
  return res;
}

async function getJson<T>(token: string, url: string): Promise<T> {
  return (await call(token, url)).json() as Promise<T>;
}

/** Toate paginile unei liste Classroom (limitat, ca un curs uriaș să nu blocheze importul). */
async function listAll<T>(token: string, url: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const u = new URL(url);
    u.searchParams.set("pageSize", "100");
    if (pageToken) u.searchParams.set("pageToken", pageToken);
    const data = await getJson<Record<string, unknown>>(token, u.toString());
    out.push(...((data[key] as T[] | undefined) ?? []));
    pageToken = data.nextPageToken as string | undefined;
    if (!pageToken) break;
  }
  return out;
}

const id = (value: string) => encodeURIComponent(value);

export const classroom = {
  courses: (token: string) => listAll<GCourse>(token, `${CLASSROOM}/courses?courseStates=ACTIVE`, "courses"),
  course: (token: string, courseId: string) => getJson<GCourse>(token, `${CLASSROOM}/courses/${id(courseId)}`),
  courseWork: (token: string, courseId: string) =>
    listAll<GCourseWork>(token, `${CLASSROOM}/courses/${id(courseId)}/courseWork`, "courseWork"),
  courseWorkMaterials: (token: string, courseId: string) =>
    listAll<GPost>(token, `${CLASSROOM}/courses/${id(courseId)}/courseWorkMaterials`, "courseWorkMaterial"),
  announcements: (token: string, courseId: string) =>
    listAll<GPost>(token, `${CLASSROOM}/courses/${id(courseId)}/announcements`, "announcements"),
  mySubmissions: (token: string, courseId: string) =>
    listAll<GSubmission>(token, `${CLASSROOM}/courses/${id(courseId)}/courseWork/-/studentSubmissions?userId=me`, "studentSubmissions"),
};

export type DriveFile = { id: string; name: string; mimeType: string; size?: string };

export const drive = {
  meta: (token: string, fileId: string) =>
    getJson<DriveFile>(token, `${DRIVE}/files/${id(fileId)}?fields=id,name,mimeType,size&supportsAllDrives=true`),
  async bytes(token: string, fileId: string, exportAsPdf: boolean): Promise<Uint8Array> {
    const url = exportAsPdf
      ? `${DRIVE}/files/${id(fileId)}/export?mimeType=application%2Fpdf`
      : `${DRIVE}/files/${id(fileId)}?alt=media&supportsAllDrives=true`;
    return new Uint8Array(await (await call(token, url)).arrayBuffer());
  },
};
