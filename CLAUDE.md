# Instrucțiuni pentru Claude Code — Studiazo AI

Lucrezi la Studiazo AI, o aplicație pentru studenții din Iași. Echipa: **David** și **Sergiu**, fiecare cu sesiunea lui de Claude Code, lucrând amândoi pe ramura `main`.

## Principiul de bază

Aplicația trebuie să fie **simplă, funcțională, verificată și premium**. Nu adăuga funcții, abstracții sau dependențe pe care taskul nu le cere. O pagină foarte îngrijită valorează mai mult decât multe pagini superficiale.

## Înainte de orice modificare

1. Citește `docs/PLAN_ECHIPA.md` (cine ce face, cu checkboxuri), `docs/TASKS.md` și documentul relevant pentru zona ta (`docs/CONTRACTS.md`, `docs/DATABASE.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`).
2. Verifică în `docs/COLLABORATION.md` cine deține fișierele pe care vrei să le modifici. Nu modifica modulele colegului; spune-i colegului ce îți trebuie (chat/issue).
3. Next.js 16.4 are schimbări față de ce știi: `proxy.ts` în loc de `middleware.ts`, API-uri async (`await params`, `await searchParams`, `await cookies()`). Documentația exactă este în `node_modules/next/dist/docs/`. Citește ghidul relevant înainte de a folosi un API Next.

## Reguli de cod

- TypeScript strict. Interfața și mesajele sunt **în română, cu diacritice** (ș, ț cu virgulă).
- Organizare pe funcționalități: `src/features/<modul>/` (queries.ts, actions.ts, schemas.ts, components/). Componentele comune sunt în `src/components/ui`, iar utilitarele comune în `src/lib`.
- Folosește componentele și tokenii existenți (`bg-surface`, `text-ink-muted`, `border-line`, `bg-accent`…). Nu introduce culori hex noi în componente.
- Validează toate datele de intrare cu Zod pe server, inclusiv argumentele venite de la AI.
- Identitatea vine **numai** din `requireUser()` / `getCurrentUser()` (`src/lib/auth/session.ts`). Nu accepta niciodată un `user_id` de la client sau de la model.
- Timpul: folosește `src/lib/time/*` (fus `Europe/Bucharest`, recurență corectă la schimbarea orei). Nu folosi `new Date().getHours()` sau formatări fără `timeZone`.
- Secretele (`OPENAI_API_KEY`) se citesc doar în module `import "server-only"`. Nu le loga, nu le pune în cod, în documentație sau în frontend.
- Nu folosi cheia Supabase service role. Accesul la date trece prin sesiunea utilizatorului și RLS.

## Baza de date

- Migrațiile sunt în `supabase/migrations/`, cu nume `YYYYMMDDHHMMSS_descriere.sql`. **Nu modifica o migrație deja aplicată**; creează una nouă.
- Orice tabel nou cu date private: `user_id` + RLS + politici „own”. Actualizează `docs/DATABASE.md`.

## Verificare înainte de commit

- `npm run check` (tipuri, lint, teste) și `npm run build`.
- Pentru UI: verifică la 360, 390, 768, 1280 și 1440 px (`npm run screenshots` cu serverul pornit cu `STUDIA_PREVIEW=1`) și navigarea cu tastatura.
- Raportează sincer ce ai verificat și ce nu ai putut verifica.

## Git

- Amândoi lucrați direct pe `main`. Ordinea: `git pull` înainte de lucru → commit → `git pull` → `git push`. `git config pull.rebase true` o dată.
- **Niciodată** `git push --force`. Dacă push-ul e respins: `git pull`, apoi `git push`. La conflict: rezolvă-l păstrând munca amândurora, apoi `git rebase --continue`.
- Commituri mici și dese (la 20–40 min), cu `npm run check` trecut înainte de push. Nu lucrați în același fișier în același timp.
- La finalul fiecărui task, raportează: ce s-a terminat, ce fișiere s-au modificat, cum s-a verificat, ce probleme au rămas și care e următorul task.
