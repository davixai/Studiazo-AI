# Sesiuni cu mentorii — 17.10.2026

Scop: validăm deciziile de produs și AI **înainte** de etapa 2 (lucrul în paralel David/Sergiu).
Notați răspunsurile direct aici; apoi le transformăm în taskuri în `docs/TASKS.md`.

Pitch de 30 de secunde (citiți-l la început):
> StudIA e „al doilea creier al studentului ieșean”. Studentul își pune orarul, examenele și cursurile în PDF.
> Asistentul AI explică materia din cursurile lui, îl testează cu grile și îi propune sesiuni de studiu
> în golurile reale din program. Nimic nu se salvează în calendar fără confirmarea studentului.

---

## 11:30–12:00 · Expert în educație

Ce vrem să aflăm: dacă fluxul „explică → testează → planifică” ajută cu adevărat învățarea.

1. **Testele:** ce face o întrebare grilă să verifice *înțelegerea*, nu memorarea? Ne puteți da 2–3 tipare (aplicare, contraexemplu, „care e greșeala”)?
2. **Feedback după test:** e mai util să explicăm imediat fiecare răspuns greșit sau la final? Cât de lungă să fie explicația?
3. **Recapitularea:** propunem sesiuni pe capitolele unde studentul greșește. E corect să folosim repetare spațiată (ex. ziua 1, 3, 7)? Câte sesiuni pe zi sunt realiste?
4. **Durata sesiunilor:** lăsăm studentul să aleagă (25/50/90 min). Ar trebui să recomandăm noi o valoare implicită?
5. **„Lucrez singur”:** când studentul vrea indicii, nu soluția — care e o secvență bună de indicii (întrebare → indiciu → pas → soluție)?
6. **Riscul de dependență:** cum evităm ca AI-ul să facă temele în locul studentului? Ce limite ar trebui să aibă asistentul la teme notate?
7. **Motivația:** plănuim un streak (zile la rând cu studiu), insigne la 3/7/14/30 de zile și timpul de învățare pe 7 zile. Ajută la formarea obiceiului sau creează presiune/anxietate? Ce ar trebui să se întâmple când studentul „rupe” streak-ul?
8. **Demonstrația:** dacă ați avea 3 minute să vedeți aplicația, ce v-ar convinge că ajută un student real?

Notițe:

-

---

## 12:00–12:30 · Expert în AI

Ce vrem să aflăm: dacă arhitectura AI e sigură, ieftină și stabilă.

Context tehnic de spus pe scurt:
- OpenAI Responses API, model `gpt-6-luna` ($0,10 / 1M tokeni intrare, $0,50 / 1M ieșire), configurabil prin `OPENAI_MODEL`.
- Instrumente (function calling): citește programul, termene, intervale libere (calculate de cod, nu de model), material din materie, *propune* temă/sesiuni, generează test.
- Modelul doar **propune**; serverul validează (Zod), verifică suprapunerile și salvează numai după „Confirmă”.
- PDF-uri cu text selectabil; textul extras e salvat pe pagini, pentru citări „pagina N”.

Întrebări:
1. **Context din PDF:** pentru cursuri de 50–200 de pagini, ajunge să trimitem paginile relevante după căutare full-text (Postgres) sau avem nevoie de embeddings/pgvector de la început?
2. **Prompt injection din documente:** ce măsuri concrete recomandați pe lângă: delimitarea clară a materialului ca date, instrucțiuni de sistem stricte, instrumente fără efecte directe, confirmare umană?
3. **Structured outputs:** generăm testele și propunerile cu JSON schema strict. Ce validări suplimentare merită (ex. verificarea că răspunsul corect chiar apare în material)?
4. **Alegerea modelului:** `gpt-6-luna` cu reasoning `low` e suficient pentru explicații și grile corecte? Când ar merita un model mai mare, doar pentru generarea testelor?
5. **Costuri:** limite rezonabile per student (cereri/oră, tokeni/zi)? Cum folosim prompt caching (instrucțiuni de sistem stabile la început)?
6. **Halucinații:** cum facem ca asistentul să spună clar „nu apare în materialele tale”? Merită un pas de verificare a citărilor?
7. **Evaluare:** cum testăm calitatea răspunsurilor înainte de demo, cu un set mic de întrebări de referință?
8. **Poze în chat:** studentul pozează un exercițiu și AI-ul îl îndrumă. Ajunge intrarea de imagine a `gpt-6-luna` sau e nevoie de OCR separat pentru formule și scris de mână? Ce rezoluție să trimitem ca să păstrăm costul mic? Cum tratăm pozele neclare?
9. **Chat pe fiecare materie:** un chat separat pe materie (Analiză, Electronică, Programare…) cu materialele ei. Merită instrucțiuni de sistem diferite pe tip de materie (ex. pași de calcul la matematică, cod la programare)?

Notițe:

-
