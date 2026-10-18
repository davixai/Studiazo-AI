# Baza de date (Supabase / Postgres)

Migrația inițială: `supabase/migrations/20261017100000_initial_schema.sql`. Proprietar schema: **David**. Sergiu poate adăuga migrații pentru tabelele lui, prin PR (vezi COLLABORATION.md).

## Tabele

| Tabel | Ce conține | Proprietar |
| --- | --- | --- |
| `profiles` | 1:1 cu `auth.users`; nume, universitate, facultate, an, oraș, fus orar, preferințe de studiu (`preferred_times` = listă cu momentele zilei, gol = nu contează; `preferred_time` = primul ales, păstrat pentru compatibilitate; `session_minutes`, `daily_study_limit_minutes`, `availability` jsonb); din configurarea pe pași (`/bun-venit`): `age` (15–99), `study_needs` (listă: examene, teme, note, organizare), `study_worries` (listă: inceput, volum, explicatii, timp, promovare), `study_goal` (promovare, nota_buna, nota_maxima), toate opționale; asistentul AI le primește în context ca să-și adapteze sfaturile. Creat automat de triggerul `on_auth_user_created`. | David |
| `subjects` | materiile; nume unic per utilizator (fără diferență de majuscule), culoare din paletă | Sergiu |
| `events` | activități din calendar: `kind` (curs, seminar, laborator, studiu, job, sport, personal, pauza), prima apariție `starts_at/ends_at`, `timezone`, `recurrence` (none/weekly/biweekly), `recurrence_until`, `excluded_dates`, `completed_at`, `proposal_id` + `proposal_item_index` ; orarul importat din poză la `/bun-venit` devine activități `weekly`/`biweekly` până la finalul semestrului | David |
| `tasks` | termene: `kind` (tema, proiect, examen, colocviu, test, altul), `due_at`, `duration_minutes` (examen), `estimated_minutes`, `completed_at`, legătura cu propunerea | David |
| `notes` | notițe pe materie (text, max. 50.000 de caractere) | Sergiu |
| `materials` | documente și fotografii (`mime_type`: pdf, docx, pptx, text/plain, jpeg, png, webp): `storage_path`, `size_bytes` ≤ 20 MB, `page_count`, `status` (incarcat, in_procesare, procesat, fara_text, esuat), `status_message`, `studied_at` | Sergiu |
| `material_pages` | text extras pe pagini (pentru citări „pagina N”; la PowerPoint un slide = o pagină, la Word și text secțiuni de ~3.000 de caractere) | Sergiu |
| `conversations`, `messages` | istoricul asistentului; `messages.metadata` jsonb (citări, propuneri, test) | David |
| `quizzes`, `quiz_attempts` | teste grilă (`questions` jsonb = `QuizSchema`) și încercări (`score`, `total`, `topic_breakdown`, `duration_seconds` pentru timpul de învățare) | David |
| `ai_proposals` | propuneri AI: `kind` (task / study_sessions), `payload` jsonb (`ProposalPayloadSchema`), `status` (pending, confirmed, rejected, expired), `expires_at` (24 h) | David |
| `ai_usage` | evidența consumului AI pentru limite (fără update/delete pentru utilizator); `kind` include `finance` (sfaturile din Buget) și `orar` (citirea orarului din poză) | David |
| `finance_entries` | Buget (`/buget`, migrația `20261017205000_finance.sql`): `kind` (venit, cheltuiala), `category` (lista din `src/features/finance/categories.ts`), `amount` numeric(10,2) > 0, `note` ≤ 120, `month` = prima zi a lunii. Statisticile se calculează în aplicație; sfaturile AI nu se salvează. Până la aplicarea migrației, pagina afișează un mesaj, fără erori. | David |

Toate cheile externe către utilizator au `on delete cascade`, deci ștergerea contului șterge tot. Materia ștearsă lasă activitățile și termenele fără materie (`set null`), dar șterge notițele, materialele și testele ei.

## RLS

RLS este activ pe **toate** tabelele. Modelul comun:

- `using (user_id = auth.uid())` pentru citire, modificare și ștergere;
- `with check (user_id = auth.uid() and owns_subject(subject_id))` la scriere: nu poți lega o activitate de materia altcuiva;
- `messages` și `quiz_attempts` verifică și că părintele (conversația sau testul) îți aparține;
- `ai_usage`: doar `select` și `insert` (limitele nu pot fi ocolite prin ștergere);
- `ai_proposals`: inserare doar cu `status = 'pending'`. Confirmarea revalidează pe server conținutul din DB.

`user_id` are `default auth.uid()`, deci la inserare nu trebuie trimis (și nu trebuie trimis de la AI).

## Storage

Bucket privat `materials`: `public = false`, limită de 20 MB, doar `application/pdf`, Word (`.docx`), PowerPoint (`.pptx`), `text/plain`, `image/jpeg`, `image/png`, `image/webp` (migrația `20261018110000_material_documents.sql`). Calea este `{user_id}/{subject_id}/{material_id}.{pdf|docx|pptx|txt|jpg}`, iar politicile permit `select`, `insert` și `delete` numai când primul segment al căii este `auth.uid()`. Previzualizarea se face cu URL-uri semnate de scurtă durată (`createSignedUrl`, ex. 60 s), niciodată cu linkuri publice.

Pozele trimise în chat stau în același bucket, la `{user_id}/chat/{uuid}.jpg`; mesajul le reține în `messages.metadata.imagePath`. Ștergerea unei conversații le șterge și pe ele; ștergerea contului golește tot folderul utilizatorului.

În aplicație: PDF-urile se salvează ca `{material_id}.pdf`, iar pozele mereu ca `{material_id}.jpg` (micșorate în browser), cu o miniatură alături, `{material_id}.thumb.jpg` (480 px). Ruta `/materii/[id]/fisier/[materialId]` verifică sesiunea și creează URL-ul semnat la fiecare deschidere (5 min pentru PDF, 60 s pentru poze; `?v=thumb` pentru miniatură). Ștergerea unui material șterge fișierul și miniatura, apoi rândul (paginile extrase dispar prin cascadă).

## Funcții

- `owns_subject(uuid)`: helper pentru politici (security invoker).
- `handle_new_user()`: creează profilul la înregistrare.
- `delete_my_account()`: șterge utilizatorul curent (security definer, doar `auth.uid()`; `execute` doar pentru `authenticated`). Aplicația șterge întâi fișierele din Storage.

## Date demonstrative

`supabase/seed/demo.sql` este separat de migrații, iar toate titlurile au sufixul „(demo)”. Se rulează manual după crearea unui cont de test (vezi SETUP.md).

## Reguli pentru migrații noi

1. Fișier nou `supabase/migrations/YYYYMMDDHHMMSS_descriere.sql`, cu marcaj de timp unic. **Nu edita migrațiile aplicate.**
2. Tabel nou cu date private: `user_id uuid not null default auth.uid() references auth.users on delete cascade`, RLS și politici.
3. Actualizează acest fișier, `lib/supabase/mappers.ts` și tipurile din `lib/contracts` în același PR.
