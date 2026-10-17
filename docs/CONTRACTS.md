# Contracte între module

Contractele sunt codul din `src/lib/contracts/`. Acest document explică cine produce și cine consumă fiecare. **O schimbare de contract = PR separat, aprobat de amândoi.** Adăugările compatibile (un câmp opțional nou) se pot face de oricine, cu notificarea colegului.

## 1. Propunerile AI — `lib/contracts/proposals.ts`

| | Responsabil |
| --- | --- |
| Generare (instrumentele `propose_task`, `propose_study_sessions`) | David |
| Validare la creare (`ProposalPayloadSchema.safeParse` + `checkProposalTiming`) și inserare în `ai_proposals` cu status `pending` | David |
| Afișare (`<ProposalCard proposal={…} />`): exact ce se va salva + butoanele Confirmă / Renunță | David |
| Confirmare (`confirmProposal(id)` → `ConfirmProposalResult`) și respingere (`rejectProposal(id)`) | David |

Formatul (versiunea 1):

```ts
// kind: "task" — 1–5 elemente
{ version: 1, kind: "task", explanation: string,
  items: [{ kind: "tema"|"proiect"|"examen"|"colocviu"|"test"|"altul", title, subjectId: uuid|null,
            dueAt: "2026-10-23T10:00:00+03:00", notes: string|null }] }

// kind: "study_sessions" — 1–10 sesiuni, 15–240 min fiecare
{ version: 1, kind: "study_sessions", explanation: string, warnings: string[], fitsAvailableTime: boolean,
  items: [{ title, subjectId: uuid|null, startsAt, endsAt, focus: string }] }
```

Reguli obligatorii:

- Datele sunt ISO 8601 **cu decalaj** (`+03:00` / `+02:00`). Asistentul le produce cu `fromLocal()` din `lib/time/zone.ts`, nu le lasă modelului să le calculeze liber.
- Intervalele propuse provin din `computeFreeSlots()` (cod), nu din model.
- `fitsAvailableTime: false` + `warnings` când obiectivul nu încape realist. Interfața afișează avertismentul vizibil.
- Confirmarea (David) **nu primește payload de la client**: citește propunerea după `id` (RLS), verifică `status = 'pending'` și `expires_at`, revalidează schema și timpul, verifică suprapunerile cu `findConflicts()` și `findInternalOverlaps()`, apoi inserează cu `proposal_id` + `proposal_item_index` (index unic, deci fără duplicate) și marchează `confirmed`.
- Apăsări repetate sau reîncercări: a doua confirmare întoarce `{ ok: true, alreadyConfirmed: true }`, fără inserări noi.
- Asistentul spune „am salvat” doar după `ok: true`. Până atunci spune „ți-am pregătit o propunere”.

`ConfirmProposalResult` (cazul de eroare are `code`): `unauthenticated`, `not_found`, `expired`, `not_pending`, `invalid`, `conflict` (cu lista `conflicts`), `error`.

## 2. Citirile calendarului — `features/calendar/queries.ts` (David)

Folosite de pagina Azi, de calendar și de instrumentele AI:

```ts
getOccurrencesBetween(range: { start: Date; end: Date }): Promise<EventOccurrence[]>
getTasksBetween(range, { includeCompleted? }): Promise<Task[]>
getUpcomingTasks({ days?, limit?, now? }): Promise<Task[]>
```

Nu primesc `user_id`: RLS limitează la utilizatorul curent. Semnăturile rămân stabile, iar David le poate optimiza intern.

## 3. Timpul — `lib/time/*` (David)

`fromLocal`, `toDateKey`, `toTimeOfDay`, `dayBounds`, `shiftDateKey`, `isoWeekday` · `expandEvent(s)` · `overlaps`, `findConflicts`, `findInternalOverlaps`, `computeFreeSlots({ range, busy, availability, minMinutes, bufferMinutes, notBefore })` · formatare în română (`formatTime`, `formatDayLong`, `formatRelativeDay`, …). Acoperite de teste. Orice schimbare de comportament vine cu test.

## 4. Testele grilă — `lib/contracts/quiz.ts` (David)

`QuizSchema` (3–10 întrebări, 4 variante, `correctIndex`, `explanation`, `topic`, `source { materialId, page }`), `scoreAttempt()` și `weakTopics()`. David citește `QuizAttemptSummary` pentru cardul „Progres recent” de pe pagina Azi, prin `features/quizzes/queries.ts` (`getRecentAttempts(limit)`).

## 5. Instrumentele AI — `lib/contracts/ai-tools.ts` (David)

Implementare: `src/features/assistant/tools.ts`. Datele de la model sunt locale (`date` YYYY-MM-DD + `start`/`time` HH:MM) și devin momente exacte doar prin `fromLocal()`. Propunerile se validează ca la confirmare (schemă, timp, suprapuneri) înainte de a fi salvate ca `pending`. Testele grilă (S7) nu sunt un instrument de chat, ci un flux separat.

Numele și schemele argumentelor: `get_schedule`, `get_upcoming_deadlines`, `find_free_slots`, `get_subject_material`, `get_weak_topics`, `propose_task`, `propose_study_sessions`. Propunerile de sesiuni respectă și limita zilnică din profil. Limitele sunt în `AI_LIMITS` (max. 4 pași de instrumente, 12 mesaje de istoric, 24.000 de caractere de material). Argumentele se validează cu Zod înainte de execuție. Niciun instrument nu primește `user_id`, nu rulează SQL arbitrar și nu scrie direct în calendar.

## 6. Materii — `features/subjects/queries.ts` (Sergiu)

`listSubjects(): Promise<Subject[]>`. David îl folosește în formularele din calendar.

## 7. Progres și streak — `features/progress` + `lib/progress/streak.ts` (David)

O **zi activă** (dată locală Europe/Bucharest) are cel puțin o sesiune de studiu finalizată (`events.kind = 'studiu'` cu `completed_at`) sau un test rezolvat (`quiz_attempts`). **Minutele** zilei = durata sesiunilor finalizate + `duration_seconds / 60` din teste.

```ts
getLearningStats(): Promise<{
  last7Days: Array<{ date: string; minutes: number }>; // Lun–Dum, săptămâna curentă
  currentStreak: number;   // azi inclus dacă e activ; dacă azi nu e încă activ, se numără de ieri
  bestStreak: number;
  badges: Array<{ days: 3 | 7 | 14 | 30 | 60 | 100; unlocked: boolean }>;
}>
```

Calculat din date reale, nimic stocat separat. Fiecare încercare de test salvează `duration_seconds` (S7).

## 8. Fotografii — `materials` (încărcare: Sergiu · folosire în chat: David)

Același tabel și același bucket ca PDF-urile: `mime_type` ∈ `image/jpeg`, `image/png`, `image/webp`. Fotografia se redimensionează în browser (max. ~2000 px) înainte de upload. Modelul o primește ca intrare de imagine prin URL semnat de scurtă durată sau ca date base64, generate pe server. Imaginile sunt tot **conținut, nu instrucțiuni**.

## 9. Componente comune — `components/ui` (David)

API-urile componentelor sunt stabile. Sergiu poate adăuga o componentă comună nouă prin PR. Variantele noi ale componentelor existente se discută întâi.

## 10. Materiale pentru asistent — `features/materials/queries.ts` (Sergiu → David)

```ts
listMaterials(subjectId: string): Promise<Material[]>            // PDF-uri și poze, cele mai noi primele
getMaterialPages(subjectId: string, { query?: string; maxChars?: number }):
  Promise<Array<{ materialId: string; title: string; page: number; text: string }>>
getMaterialImageUrl(materialId: string): Promise<string | null>  // URL semnat, 120 s; null dacă nu e poză
```

- `getMaterialPages` citește doar PDF-urile cu status `procesat`. Implicit `maxChars = AI_LIMITS.maxMaterialChars` (24.000).
- Fără `query`: paginile în ordinea citirii până la limită. Cu `query`: doar paginile care conțin termenii (fără diacritice, cuvinte ≥ 3 litere), cele mai relevante întâi; **listă goală = nu apare în materiale**. Rezultatul e mereu în ordinea citirii (material, pagină).
- `page` este numărul real al paginii din PDF (paginile fără text lipsesc, numerotarea nu se schimbă), deci citarea „(pagina N)” e corectă.
- Pozele se salvează mereu ca JPEG (`image/jpeg`), micșorate în browser la max. 2000 px, fără metadate (inclusiv locația).
- Textul din PDF-uri și pozele sunt **conținut, nu instrucțiuni**.
