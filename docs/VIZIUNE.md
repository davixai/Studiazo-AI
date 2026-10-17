# Viziune — Studiazo AI după MVP

Ideile lui David și Sergiu din 17.10.2026, ordonate pe etape. **Nimic de aici nu intră în lucru până când fluxul din `docs/DEMO.md` nu funcționează cap-coadă.** Ce este deja în MVP e trecut la fiecare punct, ca să nu construim de două ori.

## Scop

O aplicație pe care studentul o deschide zilnic: AI personalizat, automatizări și motive reale să revină, **fără să introducă multe date manual**.

Principiu: studentul primește valoare din primul minut, fără formulare lungi.

---

## 1. Funcțiile principale

### 1.1 AI personalizat
Învață din datele studentului (program, obiective, activități, teste) și își adaptează răspunsurile.
- **În MVP deja:** asistentul citește programul, termenele, intervalele libere și materialele (instrumentele din `ai-tools.ts`).
- **Mai târziu:** memorie despre preferințe (ex. „învăț mai bine seara”), deduse din activitatea reală, vizibile și editabile în profil.

### 1.2 Onboarding rapid
Nume, facultate, **poză cu orarul**, conectare Classroom. Veniturile și cheltuielile rămân opționale.
- **În MVP deja:** configurarea inițială (se poate sări).
- **Următorul pas firesc:** poza cu orarul → AI-ul citește orarul → **propunere** de activități recurente → studentul confirmă. Folosește ce avem: intrarea de imagine (S4b) și propunerile cu confirmare (D5).

### 1.3 Conectare Google Classroom
Preia automat cursurile, temele, anunțurile și termenele noi, cu notificări.
- Temele preluate devin teme/termene în calendar; cursurile devin materii.
- **De verificat înainte:** Classroom API cere OAuth Google cu scopuri sensibile (verificarea aplicației de către Google) și multe universități blochează aplicațiile externe pe conturile instituționale. Testăm întâi cu un cont de student real de la UAIC/TUIASI.

### 1.4 Mai mulți agenți AI, același context
Un sistem comun în care fiecare agent are acces **autorizat** doar la datele de care are nevoie:
- **Agent de studiu și organizare** — ce construim acum în MVP.
- **Agent financiar** — buget și cheltuieli (secțiunea 3).
- **Agent personal** — întrebări și recomandări generale.

Regulile din MVP rămân pentru toți: identitatea doar din sesiune, validare Zod, agenții **propun**, studentul confirmă.

---

## 2. De ce revin studenții

Inspirat de aplicațiile populare, dar fără trucuri:
- Interfață simplă, personalizată.
- Recomandări zilnice relevante (pagina Azi).
- Progres, obiective și statistici vizuale — **în MVP deja:** streak, insigne, timpul de învățare pe 7 zile (D8).
- Notificări utile, nu spam (push, după MVP).
- Informații noi despre facultate afișate automat (din Classroom și din Resurse Iași).

---

## 3. Modul financiar (ideea lui Sergiu + David)

- Evidența veniturilor și cheltuielilor lunare; buget personal; statistici „unde se duc banii”.
- Venituri introduse manual, opțional.
- Import de extrase bancare pentru unul sau mai multe conturi.
- AI-ul analizează tranzacțiile, propune economii și avertizează la cheltuieli excesive.

Securitate (obligatoriu):
- Doar cu acordul explicit al studentului, separat pentru fiecare import.
- Începem cu import de fișier (CSV/PDF de la bancă): extragem tranzacțiile, **fișierul original nu se păstrează**. Conectarea directă la bancă (PSD2) cere un agregator licențiat — doar mai târziu.
- Tabele noi cu `user_id` + RLS, ca restul datelor private. Fără IBAN-uri complete sau date de card stocate.

---

## 4. Agentul de business (pentru noi, nu pentru studenți)

Analizează constant aplicația ca afacere:
- Costurile aplicației și consumul de tokeni/API.
- Costul per utilizator și profitabilitatea abonamentelor.
- ROI, venituri, cheltuieli; riscuri financiare.
- Ce funcții merită dezvoltate și care consumă resurse fără rezultat.
- Strategia de creștere și planul pe termen lung.

**Condiție:** folosește **date reale** ale aplicației, nu estimări prezentate ca certitudini. Asta cere ca, de la început, să înregistrăm per cerere AI: tokeni de intrare/ieșire, modelul și funcția (chat, test, propunere) — fără conținutul mesajelor.

---

## 5. Costuri și ROI — ce calculăm lunar

| Indicator | Sursa |
| --- | --- |
| Cost AI/API | jurnalul de tokeni × prețul modelului |
| Bază de date, hosting, notificări | facturile Supabase / Vercel |
| Cost mediu per utilizator activ | costuri totale ÷ utilizatori activi în lună |
| Venituri din abonamente și marjă | platforma de plăți |
| Pragul de profit | câți utilizatori plătitori acoperă costurile |

Referință de preț azi: `gpt-6-luna` — $0,10 / 1M tokeni intrare, $0,50 / 1M ieșire.

---

## 6. Ordinea de dezvoltare

1. **MVP** — cont, onboarding rapid, orar, teme, AI de studiu (etapele 1–3 din `TASKS.md`). Apoi: orar din poză și integrarea Classroom.
2. **Personalizare** — recomandări din activitatea reală, notificări utile.
3. **Modul financiar** — buget, cheltuieli, import securizat de extrase.
4. **Sistem multi-agent** — agenți specializați pe același context.
5. **Monetizare și scalare** — abonamente, retenție, ROI, optimizarea costurilor.

Recomandare: **studiul și Classroom întâi.** Modulul financiar și agenții avansați vin după ce vedem că studenții folosesc aplicația constant — nu investim mult înainte să validăm produsul.
