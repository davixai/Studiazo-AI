/** Ora exactă a serverului (ms), pentru sincronizarea ceasului din interfață (components/layout/live-clock.tsx). */
export function GET() {
  return Response.json({ now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
