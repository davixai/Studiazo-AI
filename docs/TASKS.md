# Taskuri

Legendă: ✅ gata și verificat · 🟡 demonstrativ sau parțial · ⬜ de făcut. Starea reală este pe GitHub. Actualizați acest fișier în PR-ul care schimbă starea.

## Etapa 1 — Fundația comună (David + Claude) ✅

| Ce | Stare | Verificare |
| --- | --- | --- |
| Next.js 16.4, TypeScript, Tailwind 4, npm, ESLint, Vitest | ✅ | `npm run check`, `npm run build` |
| Design system (tokeni, Geist + Newsreader, componente, `/sistem-design`) | ✅ | capturi 360–1440 px |
| Shell responsive: bară laterală / bară de jos, zone sigure, „Sari la conținut” | ✅ | capturi, fără derulare orizontală |
| Supabase: clienți SSR, `proxy.ts`, `requireUser`, callback pentru emailuri | ✅ cod · ⬜ testat pe proiect real | — |
| Autentificare: înregistrare, autentificare, recuperare, parolă nouă, deconectare | ✅ cod · ⬜ testat pe proiect real | capturi |
| Configurare inițială + profil + ștergerea contului | ✅ cod · ⬜ testat pe proiect real | capturi |
| Migrația SQL: toate tabelele MVP, RLS, Storage privat, `delete_my_account` | ✅ scrisă · ⬜ aplicată | — |
| Contracte: domeniu, propuneri AI, teste grilă, instrumente AI | ✅ | teste |
| Timp: fus București, recurență (inclusiv 25.10.2026), intervale libere, suprapuneri | ✅ | 28 de teste |
| Pagina Azi (programul de azi, termene, acțiuni rapide) | ✅ citire · 🟡 sesiunea recomandată și progresul sunt stări goale | capturi |
| Calendar: agendă pe 14 zile (doar citire) | 🟡 | capturi |
| Materii (listă), Asistent (pagina de pornire), Resurse Iași (linkuri verificate pe 17.10.2026) | 🟡 / ✅ | capturi |
| Modul AI: configurare `OPENAI_MODEL`, client cu timeout și reîncercări, mesaje de eroare | ✅ schelet | — |
| PWA: manifest, iconițe, fără service worker | ✅ | build |
| Documentație + prompturi de predare | ✅ | — |

## Manual (David) — înainte de etapa 2

- ⬜ Repo GitHub privat, push pe `main`, Sergiu adăugat ca colaborator (SETUP.md §1).
- ⬜ Proiect Supabase (regiunea Frankfurt), migrația aplicată, emailurile de autentificare configurate (SETUP.md §2).
- ⬜ `.env.local` pe ambele calculatoare. Cheia OpenAI se creează separat de ChatGPT Pro (SETUP.md §3).
- ⬜ Test: două conturi; fiecare își vede doar datele lui.

## Etapa 2 — În paralel

### David
| # | Task | Criteriu de finalizare |
| --- | --- | --- |
| D1 | Conectare Supabase reală + verificarea fluxurilor de autentificare | înregistrare → email → bun-venit → azi; recuperarea parolei funcționează |
| D2 | ✅ cod · ⬜ testat pe Supabase real — Calendar: formular pentru activitate (Dialog), recurență, editare, ștergere (o zi sau toată seria), finalizare | salvat în DB; după reîncărcare rămâne; validare Zod; suprapunerea e semnalată |
| D3 | ✅ cod · ⬜ testat pe Supabase real — Teme și examene: creare, editare, finalizare, ștergere; `?adauga=examen\|tema` deschide formularul | apar pe pagina Azi și în agendă |
| D4 | ✅ — Calendar: vederea săptămână (desktop) + zi; agenda rămâne implicită pe mobil | capturi 360/768/1440 |
| D5 | ✅ cod + teste logică · ⬜ testat pe Supabase real — `features/proposals`: `ProposalCard`, `confirmProposal`, `rejectProposal` | teste: fără confirmare nu se salvează nimic; dublu-click nu dublează; suprapunerea este respinsă; altă persoană nu poate confirma |
| D6 | ✅ cod · ⬜ testat pe Supabase real — Azi: „Sesiunea recomandată” (următoarea sesiune de studiu confirmată) + „Progres recent” (din testele grilă, S7) | date reale |
| D7 | ✅ cod · ⬜ testat pe Supabase real — Disponibilitatea în profil (un interval pe zi) | salvată în `profiles.availability` |
| D8 | **Progres și obicei**: streak, insigne (3/7/14/30/60/100 de zile), timpul de învățare pe ultimele 7 zile (grafic cu bare Lun–Dum) pe pagina Azi și într-o pagină Progres. Logica pură în `lib/progress/streak.ts`, cu teste (zile locale, schimbarea orei, zi fără activitate). Vezi CONTRACTS.md §7 | cifre doar din date reale; cont nou → 0 și „Începe-ți streak-ul azi” |

#### David — asistentul AI (preluat de la Sergiu pe 17.10.2026)
| # | Task | Criteriu de finalizare |
| --- | --- | --- |
| S4 | ✅ cod · ⬜ testat cap-coadă pe Supabase real — Chat: **un chat pentru fiecare materie a studentului** (listă: General + materiile lui, ex. Matematică, Analiză, Electronică, Programare) + istoric, Responses API, limite, erori, timeout. Butonul „Întreabă despre materie” din `/materii/[id]` deschide chatul materiei | chatul materiei folosește doar materialele ei; AI indisponibil → mesaj clar, restul aplicației merge |
| S4b | ✅ cod · ⬜ test cu poze reale — **AI vede poza**: studentul trimite o poză în chat (exercițiu, tablă, notițe), modelul (`gpt-6-luna`, intrare text + imagine) o citește și îl îndrumă pas cu pas, cu întrebări și indicii; spune clar când poza e neclară | test cu o poză reală clară + una neclară |
| S5 | ✅ cod + test cu OpenAI real (instrumente simulate) — Instrumentele AI (`ai-tools.ts`), cu validare și max. 4 pași | „Am examen vineri. Găsește-mi trei intervale.” → propunere `pending` |
| S6 | ✅ cod + test live (citare pagină, instrucțiune malițioasă ignorată) · ⬜ test cu un PDF real încărcat — Explicații din material, cu citare de pagină; „nu apare în materiale” când e cazul | test cu PDF real |
| S7 | ✅ cod + generare testată cu OpenAI real · ⬜ testat pe Supabase real — Teste grilă: generare (structured output), rezolvare, scor, istoric, teme slabe | `getRecentAttempts()` pentru David |
| S8 | ✅ cod + test live (examen + teme slabe + „nu încape”) — Propunerile de studiu țin cont de testele slabe și de examene | avertisment când nu încape |

### Sergiu — materii și fișiere
| # | Task | Criteriu de finalizare |
| --- | --- | --- |
| S1 | Materii: creare, editare, arhivare; pagina `/materii/[id]` — ✅ cod, capturi, tastatură · ⬜ test cu 2 conturi | RLS verificat cu 2 conturi |
| S2 | Notițe pe materie — ✅ cod, capturi, tastatură · ⬜ test pe date reale | creare, editare, ștergere |
| S3 | Încărcare PDF (Storage direct, validare 20 MB / PDF) + extragere text pe pagini (`unpdf`) + stări — ✅ cod, teste cu PDF-uri generate, capturi · ⬜ test pe date reale | PDF cu text → `procesat`; scanat → `fara_text`, cu mesaj clar; previzualizare cu URL semnat; ștergere |
| S3b | **Fotografii**: „Fă o poză” (`<input accept="image/*" capture="environment">` pe telefon) sau încărcare JPEG/PNG/WebP; redimensionare în browser (max. ~2000 px) înainte de upload; status `procesat` — ✅ cod, capturi · ⬜ test pe telefoane reale | poza apare la materie, se poate previzualiza și șterge |

S6 (explicații din material) depinde de S3: are nevoie de textul extras în `material_pages`.

## Etapa 3 — Integrare și verificare
⬜ Fluxul din DEMO.md cap-coadă · ⬜ izolarea datelor (2 conturi) · ⬜ refuzul salvării fără confirmare · ⬜ suprapuneri și duplicate · ⬜ OpenAI indisponibil · ⬜ telefon real (iOS și Android) + desktop.

## Etapa 4 — Simplu
⬜ Resurse Iași: mai multe linkuri oficiale verificate (burse, voluntariat), cu data verificării.

## Etapa 5 — După stabilizare
⬜ Finisaj · ⬜ site de prezentare (separat, cu secțiunea „Ține flacăra aprinsă”) · ⬜ PDF-uri scanate întregi (OCR pe mai multe pagini).
