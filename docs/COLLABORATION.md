# Colaborare David ↔ Sergiu

Sursa stării comune este **GitHub** (ramura `main`) plus comunicarea dintre voi. Fișierele Markdown nu blochează și nu sincronizează nimic automat.

## Ramuri

Lucrați **amândoi direct pe `main`** (decizia echipei, pentru viteză).

- O dată pe fiecare calculator: `git config pull.rebase true`.
- Înainte de lucru: `git pull`. După o bucată terminată: `npm run check` → `git add -A` → `git commit -m "…"` → `git pull` → `git push`.
- Colegul primește munca ta cu `git pull`; el dă `git push` doar pentru modificările lui.
- Push respins („fetch first”): `git pull`, apoi `git push`. **Niciodată `git push --force`.**
- Conflict la pull: se rezolvă păstrând munca amândurora, apoi `git rebase --continue` și `git push`.
- Commituri mici și dese; nu lucrați în același fișier în același timp; anunțați pe chat modificările la fișierele comune.

## Proprietari

| Zonă | Proprietar | Celălalt poate… |
| --- | --- | --- |
| `src/components/ui`, `components/layout`, `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx` | David | îi spune lui David înainte |
| `src/lib/contracts/domain.ts`, `lib/time/*`, `lib/supabase/*`, `lib/auth/*`, `proxy.ts` | David | îi spune lui David înainte |
| `src/lib/contracts/proposals.ts` | **amândoi** | doar după acordul amândurora |
| `src/lib/contracts/quiz.ts`, `ai-tools.ts`, `src/lib/ai/*` | Sergiu | îi spune lui Sergiu înainte |
| `features/auth`, `profile`, `dashboard`, `calendar`, `tasks`, `proposals` + rutele `azi`, `calendar`, `profil`, `bun-venit` | David | — |
| `features/subjects`, `materials`, `notes`, `assistant`, `quizzes` + rutele `materii`, `asistent`, `api/ai/*` | Sergiu | — |
| `features/resources` + `resurse` | David (simplu, la final) | — |
| `supabase/migrations` | David aprobă | Sergiu adaugă migrații pentru tabelele lui |
| `package.json`, `package-lock.json` | David aprobă | oricine adaugă o dependență, într-un commit separat cu motivul |
| `docs/*` | fiecare actualizează partea lui | — |

## Dependențe și lockfile

- Doar `npm`. Nu șterge și nu regenera `package-lock.json` din senin.
- Dependență nouă: commit separat, clar, cu motivul. Conflictele din lockfile: acceptă versiunea din `main`, apoi rulează din nou `npm install <pachetul tău>`.

## Migrații

- Nume unic cu marcaj de timp: `YYYYMMDDHHMMSS_descriere.sql`. Ca să nu aveți același marcaj, David folosește minute pare, iar Sergiu minute impare.
- Nu rescrieți o migrație deja aplicată pe proiectul Supabase comun. Pentru corecturi, creați o migrație nouă.
- Cine urcă o migrație o aplică pe proiectul comun (SQL Editor sau `supabase db push`) și anunță pe chat.

## Când ai nevoie de o schimbare în partea colegului

1. Deschide un issue (sau scrie pe chat) cu: ce îți trebuie, de ce, propunerea de semnătură sau câmp.
2. Între timp lucrează pe un adaptor local, în modulul tău, fără să modifici fișierele colegului.
3. Colegul implementează sau acceptă modificarea propusă.

## Integrarea planului de studiu

1. Sergiu creează propunerea (`ai_proposals`, status `pending`) și afișează în chat `<ProposalCard proposal={…} />`.
2. Până când David livrează `ProposalCard`, Sergiu afișează un rezumat simplu temporar, fără buton de salvare.
3. David livrează `features/proposals`: `ProposalCard`, `confirmProposal`, `rejectProposal`, cu teste.
4. Testul de integrare: fluxul din `docs/DEMO.md`.

## Predare la finalul fiecărui task

```
Terminat: …
Fișiere: …
Verificare: npm run check ✓, build ✓, capturi 360/1280 ✓, test manual: …
Probleme / dependențe: …
Următorul task: …
```
