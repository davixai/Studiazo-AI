# Configurare: GitHub, Supabase, OpenAI, domenii

## 0. Local

```bash
npm install
cp .env.example .env.local     # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

`.env.local` este exclus din Git (`.gitignore`). Nu trimiteți cheile pe chat. Fiecare își creează propriul `.env.local`. Valorile Supabase sunt comune, iar cheia OpenAI poate fi comună sau separată.

| Variabilă | Unde se găsește | Public? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API / API Keys | da (protejat de RLS) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → *Publishable key* (`sb_publishable_…`) | da |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` local; domeniul aplicației în producție | da |
| `OPENAI_API_KEY` | platform.openai.com → API keys | **secret, doar server** |
| `OPENAI_MODEL` | implicit `gpt-6-luna` | — |
| `AI_REQUESTS_PER_HOUR`, `AI_MAX_OUTPUT_TOKENS` | opționale (limite) | — |
| `STUDIA_PREVIEW` | `1` = date demonstrative când Supabase lipsește | — |

Nu folosim cheia **secret / service role** a Supabase. Nu o puneți nicăieri.

## 1. GitHub (David)

```bash
git remote add origin https://github.com/davixai/Studiazo-AI.git
git push -u origin main
```
1. Pe github.com: *New repository* → `studiazo`, **Private**, fără README (există deja).
2. Settings → Collaborators → adăugați-l pe Sergiu.
3. Settings → Branches → *Add rule* pentru `main`: „Require a pull request before merging”.
4. Sergiu: `git clone …`, `npm install`, creează `.env.local`.

## 2. Supabase (David)

1. supabase.com → *New project*: nume `studiazo`, regiune **Central EU (Frankfurt)**, parolă DB puternică (salvată în managerul de parole).
2. **Migrația**: SQL Editor → *New query* → copiați tot conținutul din `supabase/migrations/20261017100000_initial_schema.sql` → *Run*. Verificați în Table Editor că tabelele au RLS activ (iconița de lacăt) și în Storage că bucketul `materials` este *Private*.
   - Alternativ, cu CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.
3. **Auth → URL Configuration**:
   - Site URL: `http://localhost:3000` (apoi domeniul de producție).
   - Redirect URLs: `http://localhost:3000/auth/callback` (+ `https://<domeniu-aplicatie>/auth/callback`).
4. **Auth → Sign In / Providers → Email**: activ. „Confirm email” rămâne activ pentru producție. Emailurile implicite ale Supabase au o limită mică de trimitere pe oră; pentru teste dese, configurați SMTP propriu (Auth → SMTP) sau dezactivați temporar confirmarea pe proiectul de dezvoltare.
5. Copiați URL-ul și cheia *Publishable* în `.env.local`, apoi reporniți `npm run dev`.
6. **Date demonstrative (opțional)**: creați un cont în aplicație, înlocuiți emailul din `supabase/seed/demo.sql`, apoi rulați scriptul în SQL Editor.
7. **Testul de izolare**: creați două conturi (A și B), adăugați date cu A și verificați că B nu vede nimic.

## 3. OpenAI API (Sergiu / David)

**Abonamentul ChatGPT Pro nu include credite API.** API-ul are facturare separată.

1. platform.openai.com → autentificare → *Settings → Organization → Billing* → adăugați o metodă de plată și credit (ex. 5–10 $ ajung pentru dezvoltare cu `gpt-6-luna`).
2. *Settings → Limits*: setați o **limită lunară de buget** (ex. 10 $) și o alertă.
3. *API keys* → *Create new secret key* (de preferat câte o cheie pe persoană, într-un *Project* `studiazo`). Puneți-o **doar** în `.env.local` → `OPENAI_API_KEY=…`.
4. Costul orientativ cu `gpt-6-luna` ($0,10 / 1M tokeni la intrare, $0,50 / 1M la ieșire): o explicație cu ~6.000 de tokeni de context și ~800 de tokeni de răspuns costă ≈ $0,001.
5. Fără cheie, asistentul afișează „Asistentul AI nu este disponibil momentan”. Restul aplicației funcționează. Nu există răspunsuri simulate.

## 3b. Google Classroom (opțional)

Pagina `/classroom` importă cursurile (→ materii), temele cu termen (→ teme în calendar), PDF-urile și Google Docs/Slides/Sheets (→ materiale, exportate ca PDF) și anunțurile (→ o notiță „Din Google Classroom” pe materie). Accesul e doar de citire; tokenul Google stă într-un cookie httpOnly, legat de contul Studiazo, și expiră după ~1 oră. Nu salvăm refresh token.

1. [console.cloud.google.com](https://console.cloud.google.com) → proiect nou `studiazo`.
2. *APIs & Services → Library*: activați **Google Classroom API** și **Google Drive API**.
3. *OAuth consent screen* (Google Auth Platform): tip **External**, nume „Studiazo AI”, emailul vostru. La *Data access* adăugați scopurile:
   `classroom.courses.readonly`, `classroom.coursework.me.readonly`, `classroom.courseworkmaterials.readonly`, `classroom.announcements.readonly`, `drive.readonly`.
4. *Audience*: lăsați aplicația în **Testing** și adăugați la *Test users* conturile Google cu care testați (max. 100). În Testing nu e nevoie de verificarea Google.
5. *Credentials → Create credentials → OAuth client ID* → **Web application**:
   - *Authorized redirect URIs*: `http://localhost:3000/api/classroom/callback` (și `https://<domeniu>/api/classroom/callback` în producție).
6. Copiați *Client ID* și *Client secret* în `.env.local` ca `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET`, apoi reporniți `npm run dev`.

Limite cunoscute: fișierele Office (.docx, .pptx) nu se pot exporta direct din Drive și sunt sărite (cu mesaj); exportul Google Docs → PDF are limita de 10 MB; conturile instituționale pot avea aplicațiile externe blocate de administrator. Duplicatele se evită după nume, deci importul se poate repeta.

## 4. PDF-uri: ce acceptăm și limitele reale

- **Acceptat acum**: PDF cu text selectabil, max. 20 MB. Textul se extrage pe pagini (`unpdf`) și se salvează o singură dată.
- **Fotografii** (JPEG/PNG/WebP, din cameră sau din galerie): modelul `gpt-6-luna` acceptă imagini, deci le „vede” direct în chat și îndrumă studentul. Calitatea depinde de lumină, claritate și scris; asistentul trebuie să spună când poza e neclară. Pe iPhone, camera din browser trimite de regulă JPEG.
- **PDF-uri scanate întregi**: nu au strat de text, deci rezultatul e `fara_text`, iar interfața îi spune studentului clar ce s-a întâmplat. Recomandarea pentru student: pozează pagina relevantă. OCR-ul pe documente întregi vine după MVP.
- Formulele, tabelele și coloanele multiple pot fi extrase imperfect. Asistentul trebuie să spună când textul pare incomplet.
- Textul din documente este **conținut, nu instrucțiuni**: se trimite modelului delimitat ca date, cu instrucțiunea explicită de a ignora orice comenzi din el.

## 5. Publicare și domenii (după stabilizare; nu cumpărați acum)

**Hosting recomandat:** Vercel pentru aplicația Next.js (conectat la repo, preview pe fiecare PR). Variabilele de mediu se pun în *Project → Settings → Environment Variables*, iar `OPENAI_API_KEY` doar ca variabilă de server. Planul gratuit (Hobby) este pentru uz personal, necomercial; verificați condițiile înainte de lansare.

**Variante de domeniu:**

| Variantă | Exemplu | Plus | Minus |
| --- | --- | --- | --- |
| A. Două domenii | `studiazo.website` (prezentare) + `studiazo.online` (aplicație) | separare clară | două reînnoiri anuale, două configurări DNS |
| B. Un domeniu + subdomeniu (**recomandat**) | `studiazo.online` (prezentare) + `app.studiazo.online` (aplicație) | o singură reînnoire, un singur DNS, brand unitar | — |

**Prețul promoțional vs. reînnoirea:** domeniile `.online` / `.website` au frecvent un preț foarte mic în primul an, iar reînnoirea poate costa de multe ori mai mult. Înainte de cumpărare, comparați la registrar **prețul de reînnoire** (și de transfer), nu doar prețul din primul an.

Configurarea, când e momentul: în Vercel → *Domains* adăugați domeniul. La registrar, setați înregistrările DNS cerute de Vercel (de regulă `A` pentru domeniul principal și `CNAME` pentru `app`). Apoi adăugați domeniul de producție în Supabase → Auth → URL Configuration și setați `NEXT_PUBLIC_APP_URL`.
