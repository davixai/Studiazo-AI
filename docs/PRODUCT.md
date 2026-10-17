# Produs

**Studiazo AI** — „Al doilea creier al studentului ieșean.”

Studentul își pune orarul, temele și examenele, își încarcă cursurile pe materii, iar asistentul AI îl ajută să înțeleagă materia, îl testează și îi propune sesiuni de studiu în golurile reale din program.

Public inițial: studenții din Iași. Profilul are deja `city` și `timezone`, ca alte orașe să poată fi adăugate fără restructurare.

## MVP (în această ordine)

1. **Cont și profil simplu**: înregistrare, autentificare, recuperare parolă, configurare inițială (care se poate sări), profil, deconectare, ștergerea contului.
2. **Azi**: programul zilei, următoarele termene, sesiunea recomandată, progresul recent și acțiuni rapide.
3. **Calendar**: cursuri, seminare și laboratoare recurente (inclusiv o dată la două săptămâni), job, sport, activități personale; teme, proiecte și examene; vedere de agendă (mobil) și săptămână; detectarea suprapunerilor.
4. **Materii**: notițe, PDF-uri cu text selectabil și **fotografii** (tablă, caiet, exercițiu făcut de mână; JPEG/PNG/WebP, max. 20 MB), cu stări clare de încărcare și procesare.
5. **Asistent (OpenAI)**: **un chat pentru fiecare materie a studentului** (ex. Matematică, Analiză, Electronică, Programare — create automat din materiile lui) plus un chat general. Explică materia din materialele acelei materii, cu trimitere la pagină; **vede fotografiile** și îl îndrumă pas cu pas (întrebări și indicii, nu doar soluția); generează teste grilă; propune teme sau sesiuni de studiu, care se salvează **doar după confirmare**.
6. **Resurse Iași**: o singură pagină cu linkuri oficiale verificate (universități, cămine, biblioteci, transport, joburi).

## Fluxul demonstrației (criteriul de finalizare)

Cont → adaugă examen → încarcă material → primește explicație → completează test → cere plan de studiu → confirmă → vede sesiunile salvate după reîncărcarea paginii.

## Principii

- Simplu, funcțional, verificat, premium. Nimic în plus față de MVP până când fluxul de mai sus funcționează.
- AI-ul propune, studentul decide. Nimic nu se salvează în calendar fără „Confirmă”.
- Calendarul și materiile funcționează și când AI-ul nu e disponibil.
- Recomandările se adaptează persoanei (nu presupunem că dimineața e mai bună).
- Nu inventăm date: fără oferte de joburi, testimoniale sau statistici false. Datele demonstrative sunt etichetate.

## Imediat după fluxul principal: progres și obicei („Ține flacăra aprinsă”)

- **Streak**: zile consecutive (în ora României) în care studentul a învățat: o sesiune de studiu finalizată sau un test rezolvat.
- **Insigne de etapă**: 3, 7, 14, 30, 60 și 100 de zile. Calculate din date reale, fără puncte inventate.
- **Timp de învățare, ultimele 7 zile**: grafic cu bare Lun–Dum (minute din sesiunile finalizate + durata testelor).
- Mesaj: „Învață puțin în fiecare zi ca să-ți crești streak-ul și să deblochezi insigne de etapă. Victorii mici care transformă intențiile bune într-un obicei.”
- Fără date demonstrative prezentate ca reale: un cont nou vede 0 minute și „Începe-ți streak-ul azi”.
- Textul „Începe-ți streak-ul azi. Intră gratuit…” se folosește și pe site-ul de prezentare.

## După MVP (planificat, nu acum)

- PDF-uri scanate întregi (OCR pe mai multe pagini). Fotografiile individuale sunt deja în MVP.
- Notificări push, integrare cu Google Calendar.
- Replanificarea automată a sesiunilor ratate (în MVP: propunere la cerere).
- Site de prezentare (separat, același brand).
