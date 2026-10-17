# Plan de echipă — cine ce face

Lista comună pentru David, Sergiu și sesiunile lor de Claude Code. **Bifează `[x]` în același commit în care termini un punct.** Detaliile fiecărui task sunt în `docs/TASKS.md`, iar promptul complet al fiecăruia în `docs/HANDOFF_DAVID.md` / `docs/HANDOFF_SERGIU.md`.

Amândoi lucrați pe `main`: `git pull` → lucru → `npm run check` → commit → `git pull` → `git push`. Niciodată `--force`. Nu modificați fișierele colegului (vezi `docs/COLLABORATION.md`).

---

## Sergiu — materii și fișiere

**S1 · Materii**
- [ ] Buton „Adaugă materie” → Dialog (nume, culoare din paletă); validare Zod pe server; nume duplicat → mesaj clar
- [ ] Editare și arhivare (cu confirmare); materia arhivată dispare din listă
- [ ] Cardurile din `/materii` arată numărul real de materiale și notițe; card întreg apăsabil (`lift`, intrare `stagger`)
- [ ] Pagina `/materii/[id]`: antet cu culoarea materiei, tab-uri **Materiale / Notițe**, buton „Întreabă despre materie” → `/asistent?materie=<id>`
- [ ] Materie inexistentă sau a altcuiva → `notFound()`
- [ ] Testat cu 2 conturi: fiecare își vede doar materiile lui

**S2 · Notițe**
- [ ] Creare, editare, ștergere (cu confirmare); max. 50.000 de caractere, cu contor
- [ ] Lista sortată după ultima modificare, cu data relativă („acum 2 ore”)
- [ ] Stare goală prietenoasă cu pasul următor

**S3 · PDF-uri**
- [ ] Încărcare direct în Storage (`materials/{user_id}/{subject_id}/{material_id}.pdf`), cu bară de progres; drag & drop pe laptop, alegere de fișier pe telefon
- [ ] Validare în browser și pe server: doar PDF, max. 20 MB, mesaje clare
- [ ] Extragere text pe pagini cu `unpdf` → `material_pages`; stări vizibile: încărcat → se procesează → gata / fără text / eșuat
- [ ] PDF scanat → `fara_text`, cu explicația „Acest PDF nu are text selectabil…”
- [ ] Previzualizare prin URL semnat (60 s); ștergere (fișier + rânduri); marcare „parcurs”
- [ ] **Exportă pentru David** din `features/materials/queries.ts`: `listMaterials(subjectId)` și `getMaterialPages(subjectId, { query?, maxChars })` (text pe pagini, pentru asistent)

**S3b · Fotografii**
- [ ] „Fă o poză” (camera din spate pe telefon) + „Alege din galerie”; JPEG/PNG/WebP
- [ ] Redimensionare în browser (max. ~2000 px, JPEG ~0.85) înainte de upload
- [ ] Miniaturi în grilă, previzualizare mare la apăsare, ștergere
- [ ] **Exportă pentru David**: `getMaterialImageUrl(materialId)` (URL semnat, pentru chat)

**La fiecare task (Sergiu)**
- [ ] Arată bine la 360, 390, 768, 1280 și 1440 px, fără derulare orizontală (`npm run screenshots`, `npm run check:layout`)
- [ ] Merge doar cu tastatura (Tab, Enter, Escape), focus vizibil
- [ ] Stări: încărcare (Skeleton), gol, eroare — toate în română, cu diacritice

---

## David — calendar, organizare și tot AI-ul

**Calendar și termene**
- [ ] D2 · Formular activitate (curs, seminar, laborator, job, sport…): creare, editare, ștergere, finalizare, recurență săptămânal / la 2 săptămâni, avertisment la suprapunere
- [ ] D3 · Teme și examene: creare, editare, finalizare; `?adauga=examen|tema` deschide formularul
- [ ] D4 · Vederea săptămână (desktop) și zi; agenda rămâne pe mobil
- [ ] D7 · Disponibilitatea pe zile, în profil

**Asistentul AI**
- [ ] S4 · Chat General + câte un chat pe fiecare materie; istoric; limite; erori clare; compozitor lipit jos pe telefon
- [ ] S4b · Poza în chat: AI-ul o citește și îndrumă pas cu pas (indicii, nu soluția direct); spune când poza e neclară
- [ ] S5 · Instrumentele AI (program, termene, intervale libere, material, propuneri), validate cu Zod, max. 4 pași
- [ ] S6 · Explicații din materiale cu „(pagina N)”; „nu apare în materialele tale” când e cazul — **după S3 al lui Sergiu**
- [ ] S7 · Teste grilă: generare, rezolvare, scor, explicații, istoric, teme slabe
- [ ] S8 · Plan de studiu pe examene + teme slabe, cu avertisment când nu încape

**Legătura**
- [ ] D5 · `ProposalCard` + Confirmă / Renunță; fără duplicate la dublu-click; nimic salvat fără confirmare
- [ ] D6 · Azi: sesiunea recomandată + progres recent din teste
- [x] D8 · Streak, insigne, timpul de învățare pe 7 zile

---

## Împreună — la final

- [ ] Fluxul din `docs/DEMO.md` cap-coadă: cont → examen → material → explicație → test → plan → confirmare → sesiunile rămân după reîncărcare
- [ ] Izolarea datelor cu 2 conturi (materii, fișiere, chat, calendar)
- [ ] OpenAI oprit / cheie greșită → mesaj clar, restul aplicației merge
- [ ] Telefon real: iPhone și Android (cameră, încărcare, tastatură peste chat) + laptop
- [ ] Animații fluide pe telefon, oprite la „Reducere mișcare”

## Puncte de legătură (cine așteaptă pe cine)

| Ce | De la | Pentru | Folosit în |
| --- | --- | --- | --- |
| `listSubjects()` | Sergiu (există deja) | David | formulare calendar, lista de chaturi |
| `getMaterialPages()` | Sergiu (S3) | David | S6 explicații cu pagină |
| `getMaterialImageUrl()` | Sergiu (S3b) | David | S4b, „întreabă despre această poză” |
| ruta `/asistent?materie=<id>` | David (S4) | Sergiu | butonul „Întreabă despre materie” (până atunci, linkul duce la `/asistent`) |
