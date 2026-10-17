# Scenariul demonstrației (~4 minute)

Marcaj: ✅ funcțional · 🟡 parțial · ⬜ planificat (etapa 2). Actualizați marcajele pe măsură ce livrați.

| # | Pas | Ce arătăm | Stare |
| --- | --- | --- | --- |
| 1 | Cont nou → confirmare email → configurare inițială (se poate sări) | cont real, profil în română | ✅ cod · ⬜ testat cu Supabase |
| 2 | Adaugă orarul: curs recurent luni 08:00, laborator o dată la două săptămâni | recurență, agenda pe telefon | ⬜ D2 |
| 3 | Adaugă examenul de vineri | termenul apare pe pagina Azi („în 6 zile”) | ⬜ D3 |
| 4 | Materii → încarcă un curs PDF | stare „Se procesează” → „Gata de folosit” | ⬜ S1–S3 |
| 5 | „Explică-mi capitolul 2” | explicație simplă, cu „pagina 7” | ⬜ S4–S6 |
| 5b | În chatul materiei: pozează un exercițiu din caiet | AI-ul citește poza și îndrumă pas cu pas | ⬜ S3b, S4b |
| 6 | „Dă-mi cinci întrebări” → rezolvă testul | scor, explicații, teme slabe | ⬜ S7 |
| 7 | „Am examen vineri. Găsește-mi trei intervale.” | propunere cu explicație și avertismente | ⬜ S5, S8 |
| 8 | Confirmă | sesiunile apar în calendar | ⬜ D5 |
| 9 | Reîncarcă pagina | sesiunile rămân salvate | ⬜ |
| 10 | Pagina Azi: streak și timpul de învățare pe 7 zile | progresul crește după test și sesiune | ⬜ D8 |
| 11 | (Opțional) Al doilea cont | nu vede nimic din primul | ⬜ etapa 3 |

## Pregătire

- Cont de demo dedicat, cu orarul introdus din timp (sau `supabase/seed/demo.sql`).
- Un PDF scurt (5–15 pagini) cu text selectabil, verificat în prealabil.
- Cheie OpenAI cu credit și limită de buget.
- Planul B dacă internetul cade: capturile din `npm run screenshots` și o înregistrare video a fluxului.

## Ce spunem sincer

- AI-ul propune, studentul confirmă. Nimic nu se salvează automat.
- PDF-urile scanate și fotografiile vin într-o etapă următoare.
- Linkurile din „Resurse Iași” sunt oficiale, verificate la data afișată.
