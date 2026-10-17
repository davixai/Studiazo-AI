# Predare — David (continuare)

**Când:** după ce fundația e pe GitHub (`main`) și proiectul Supabase e creat (SETUP.md §1–2).
**Ramura:** `david/<task>` pentru fiecare task (ex. `david/supabase-conectare`, `david/calendar-formular`).

## Prompt de copiat în Claude Code

```text
Ești dezvoltatorul principal pentru partea lui David în StudIA (Next.js 16.4 + Supabase + OpenAI).
Fundația comună (etapa 1) este gata pe main. Lucrăm în paralel cu Sergiu, care are materiile, PDF-urile, chatul AI și testele.

Înainte de orice:
1. Citește CLAUDE.md, docs/TASKS.md, docs/CONTRACTS.md, docs/COLLABORATION.md, docs/DATABASE.md și docs/DESIGN_SYSTEM.md.
2. Citește docs/MENTORI.md (notițele de la mentori) și spune-mi dacă schimbă ceva în taskurile mele.
3. Pentru API-urile Next 16, citește ghidurile din node_modules/next/dist/docs/ (proxy, forms, server actions).

Principiu: simplu, funcțional, verificat, premium. Nimic peste ce cere taskul. Folosește doar componentele și tokenii existenți.

Proprietatea mea (pot modifica): components/ui, components/layout, globals.css, layouturile, lib/time, lib/supabase, lib/auth,
lib/contracts/domain.ts, features/auth|profile|dashboard|calendar|tasks|proposals, rutele azi, calendar, profil, bun-venit, migrațiile mele.
NU modific: features/subjects|materials|notes|assistant|quizzes, lib/ai, lib/contracts/quiz.ts|ai-tools.ts (ale lui Sergiu).
lib/contracts/proposals.ts se schimbă doar prin PR aprobat de amândoi.

Taskuri, în ordine. Unul pe ramură, cu PR. Te oprești după fiecare cu raportul de predare:
D1. Conectare Supabase reală: verifică .env.local, aplică/verifică migrația, testează înregistrare → email → /bun-venit → /azi,
    autentificare, recuperarea parolei, deconectare, ștergerea contului. Testează izolarea cu 2 conturi. Corectează ce nu merge.
D2. Calendar: formular în Dialog (foaie de jos pe mobil) pentru activități: tip, materie (listSubjects), titlu, loc,
    dată, oră de început și de sfârșit (ora locală Europe/Bucharest → fromLocal), recurență none/weekly/biweekly + până la.
    Creare, editare, ștergere (cu confirmare), finalizare. Server Actions cu Zod și requireUser.
    Semnalează suprapunerile cu findConflicts (avertisment; studentul poate salva totuși o activitate manuală).
D3. Teme și examene: același tipar; /calendar?adauga=examen|tema deschide direct formularul. Apar pe Azi și în agendă.
D4. Vederea săptămână (desktop, ≥768px) și zi, cu Segmented; agenda rămâne implicită pe mobil. Navigare între săptămâni.
D5. features/proposals: <ProposalCard proposal /> (arată exact ce se salvează, avertismentele, Confirmă/Renunță),
    confirmProposal(id) și rejectProposal(id) după docs/CONTRACTS.md §1: citește propunerea din DB, nu de la client;
    revalidează; verifică suprapunerile cu programul actual și între sesiuni; inserează cu proposal_id + proposal_item_index;
    pending → confirmed atomic; a doua apăsare → alreadyConfirmed, fără duplicate. Dacă e nevoie de o funcție SQL
    pentru atomicitate, creeaz-o într-o migrație nouă. Teste: fără confirmare nu se salvează nimic, dublu-click,
    suprapunere respinsă, propunere expirată, propunerea altui utilizator.
D6. Azi: „Sesiunea recomandată” = următoarea sesiune de studiu confirmată (sau CTA către asistent);
    „Progres recent” din getRecentAttempts() al lui Sergiu (când există; până atunci starea goală).
D7. Profil: disponibilitatea pe zile (profiles.availability, AvailabilitySchema).

La fiecare task:
- npm run check && npm run build; pentru UI, capturi la 360/390/768/1280/1440 (npm run screenshots, serverul cu STUDIA_PREVIEW=1
  sau cu un cont de test) pe care le verifici tu vizual; navigare cu tastatura.
- Actualizează docs/TASKS.md (și DATABASE.md / CONTRACTS.md dacă e cazul).
- Raport: ce s-a terminat, fișierele modificate, cum s-a verificat, probleme/dependențe, următorul task.
Nu pretinde verificări pe care nu le-ai rulat. Începe cu D1.
```
