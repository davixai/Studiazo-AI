# Arhitectură

## Stack

| Strat | Alegere | Note |
| --- | --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack), React 19.3 | `proxy.ts` (fost middleware) |
| Limbaj | TypeScript 5.9 strict | versiunea fixată de șablonul oficial `create-next-app@16.4.2` |
| Stil | Tailwind CSS 4.3 + tokeni în `src/app/globals.css` | vezi DESIGN_SYSTEM.md |
| Date | Supabase: Auth, Postgres cu RLS, Storage privat | `@supabase/ssr` 0.12, cheie *publishable* |
| AI | OpenAI Responses API, SDK oficial `openai` 7.x | doar pe server |
| Validare | Zod 4 | formulare, contracte, argumentele instrumentelor AI |
| Timp | `@date-fns/tz` + `src/lib/time` | fus `Europe/Bucharest` |
| PDF | `unpdf` (instalat pentru Sergiu) | text pe pagini |
| Teste | Vitest 5; Playwright cu Chrome-ul instalat pentru capturi | |

Manager de pachete: **npm** (un singur `package-lock.json`).

## Structură

```
src/
  app/                    rute (subțiri: compun componente din features)
    (auth)/               autentificare, înregistrare, recuperare (layout cu panou editorial)
    (app)/                aplicația cu shell (bară laterală / bară de jos); necesită sesiune
      azi/ calendar/ materii/ asistent/ resurse/ profil/ sistem-design/
    bun-venit/            configurarea inițială
    auth/callback/        linkurile din emailuri (PKCE `code` sau `token_hash`)
    resetare-parola/
  components/
    ui/                   componente comune (Button, Field, Card, Dialog, Alert, …)
    layout/               shell, navigare, antet de pagină
    brand/                logo
  features/<modul>/       queries.ts (citiri server), actions.ts (Server Actions),
                          schemas.ts (Zod), components/
  lib/
    contracts/            tipuri și scheme comune (domeniu, propuneri AI, teste, instrumente AI)
    time/                 fus orar, formatare, recurență, intervale libere, suprapuneri
    supabase/             clienți (server, browser, proxy) și mapări rând → tip
    ai/                   configurare și client OpenAI (server-only)
    auth/session.ts       getCurrentUser / requireUser
    preview/fixtures.ts   date demonstrative (doar STUDIA_PREVIEW=1)
supabase/
  migrations/             migrații SQL versionate
  seed/demo.sql           date demonstrative opționale (separate)
tests/                    stub-uri pentru teste
scripts/                  capturi de ecran, generarea iconițelor
```

## Fluxuri

### Autentificare
1. `proxy.ts` → `updateSession()` reîmprospătează sesiunea (`getClaims()`) și redirecționează optimist (fără cont → `/autentificare`; cu cont pe paginile de auth → `/azi`).
2. Paginile și acțiunile verifică din nou cu `requireUser()`. Proxy-ul nu este singura barieră.
3. RLS în Postgres este ultima barieră: chiar și o interogare greșită nu poate citi datele altui cont.

### Citirea calendarului
`features/calendar/queries.ts` citește activitățile unice din interval și toate activitățile recurente începute înainte de sfârșitul intervalului, apoi `expandEvents()` le extinde **în ora locală** (un curs de luni la 08:00 rămâne la 08:00 după schimbarea orei).

### Propunere AI → confirmare → salvare
```
Student: „Am examen vineri, găsește-mi 3 intervale”
  → Chat (Sergiu): modelul apelează get_upcoming_deadlines, find_free_slots
  → codul calculează intervalele libere (computeFreeSlots), modelul alege și explică
  → propose_study_sessions: serverul validează payload-ul (ProposalPayloadSchema + checkProposalTiming)
    și îl salvează în ai_proposals (status 'pending'). NIMIC în calendar încă.
  → UI (David): <ProposalCard> arată exact ce se va salva + butonul Confirmă
  → confirmProposal(id) (David): requireUser → citește propunerea din DB (nu de la client)
    → revalidează → verifică suprapunerile cu programul actual → inserează cu (proposal_id, item_index)
    → marchează 'confirmed' → revalidatePath
  → AI-ul spune „Am salvat” numai după rezultatul ok.
```
Duplicatele sunt prevenite de indexul unic `(proposal_id, proposal_item_index)` și de tranziția `pending → confirmed`.

### Materiale (Sergiu)
Încărcarea se face direct din browser în Storage (`materials/{user_id}/{subject_id}/{material_id}.pdf`), cu validare în browser și în bucket (doar PDF, max. 20 MB). Apoi o acțiune pe server extrage textul pe pagini cu `unpdf` și îl salvează în `material_pages`. Dacă PDF-ul nu are text selectabil, statusul devine `fara_text`, cu un mesaj clar. Textul extras se salvează o singură dată.

## Decizii

- **`cacheComponents` dezactivat, randare dinamică peste tot** (`dynamic = "force-dynamic"` în layoutul rădăcină). Datele sunt private și citite din sesiune. Modelul de cache al Next 16 cere reguli stricte de Suspense și cache privat, iar beneficiul lui e mic aici. Așa nu riscăm ca o pagină privată să fie prerandată sau pusă în cache.
- **Fără service worker** în etapa 1. Manifestul PWA există (instalare pe ecranul principal), dar nimic nu se păstrează offline, deci nicio dată privată nu rămâne pe dispozitiv. Dacă adăugăm unul: doar resurse statice `/_next/static`, niciodată HTML sau API.
- **Fără cheia service role.** Ștergerea contului folosește funcția SQL `delete_my_account()` (security definer, limitată la `auth.uid()`).
- **Modul previzualizare** (`STUDIA_PREVIEW=1` + Supabase neconfigurat): date demonstrative etichetate, pentru design și capturi. Funcțiile noi **nu** trebuie să-l suporte; pot afișa starea goală.
- **Tipuri DB**: mapări manuale în `lib/supabase/mappers.ts`. După conectarea proiectului Supabase se pot genera tipuri (`supabase gen types`), într-un PR separat.

## Model AI

`OPENAI_MODEL` (implicit `gpt-6-luna`). Verificat în documentația OpenAI pe 17.10.2026: model recomandat, nedepreciat, cu function calling și structured outputs prin Responses API, cost $0,10 / 1M tokeni la intrare ($0,01 cu cache) și $0,50 / 1M la ieșire. Recomandare: `reasoning: { effort: "low" }`, cu `none` pentru răspunsuri simple. Limitele (cereri pe oră, tokeni de ieșire, pași de instrumente, dimensiunea contextului) sunt în `lib/ai/config.ts` și `lib/contracts/ai-tools.ts`.

## Hosting și domenii

Vezi `docs/SETUP.md` → „Publicare și domenii”. Aplicația și site-ul de prezentare rămân proiecte separate (site-ul vine după stabilizarea aplicației).
