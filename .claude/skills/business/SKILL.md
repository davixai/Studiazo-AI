---
name: business
description: Analistul de business al Studiazo AI. Calculează lunar, din datele reale ale aplicației, costurile (AI/tokeni, Supabase, hosting, notificări), costul per utilizator activ, veniturile, marja, pragul de profit și ROI; semnalează riscurile financiare, funcțiile care merită dezvoltate și cele care consumă resurse fără rezultat; propune strategia de creștere. Folosește-l când David sau Sergiu scriu „/business”, „raport de business”, „cât ne costă aplicația”, „suntem pe profit?”, „ce preț punem la abonament” sau întreabă ceva despre costuri, venituri, ROI sau strategie.
argument-hint: [luna YYYY-MM sau o întrebare anume, ex. „ce preț la abonament?”]
---

# /business — analistul aplicației ca afacere

Cererea: $ARGUMENTS (dacă e goală: raportul lunar complet pentru luna curentă).

## Regula de aur: date reale, nu estimări prezentate ca certitudini

Fiecare număr din raport primește una dintre etichete:
- **[real]** — vine din `date-reale.sql`, dintr-o factură sau din dashboardul unui furnizor, cu data citirii.
- **[calculat]** — derivat doar din numere [real] (ex. tokeni × preț). Arată formula.
- **[ipoteză]** — orice presupunere (preț de abonament, rată de conversie, creștere). Spune pe ce se bazează și dă un interval, nu un singur număr.

Dacă o dată lipsește, scrie „lipsește” și ce trebuie făcut ca s-o avem. Nu completa golurile cu valori plauzibile. Cu puțini utilizatori, spune deschis că mediile nu sunt încă semnificative.

## Pasul 1 — Datele din aplicație

Accesul la date trece prin RLS (fiecare își vede doar datele lui) și **nu folosim cheia service role**, deci agregatele se citesc din Supabase → SQL Editor, care e consola de administrare.

1. Spune-i utilizatorului, scurt: „Deschide Supabase → SQL Editor, lipește interogarea de mai jos, Run, și trimite-mi rezultatul.” Dă-i conținutul fișierului [date-reale.sql](date-reale.sql) într-un bloc de cod, gata de copiat. Interogarea doar citește, nu atinge conținutul mesajelor și întoarce numai numere agregate.
2. Dacă există deja un raport din luna cerută în `docs/business/`, întreabă dacă vrea date noi sau refolosești ce e acolo.

Ce **nu** poate da baza de date și de unde vine:
- tokenii din cererile care nu au fost înregistrate (ex. funcții noi care cheamă OpenAI fără `ai_usage`) — verifică cu `grep -rln "lib/ai/client" src` că fiecare apel are o inserare în `ai_usage` cu `kind` corect; ce lipsește apare în raport la „Goluri de date”;
- costul real facturat — vezi pasul 2.

## Pasul 2 — Costurile fixe și facturile

Citește `docs/business/costuri.md`. Dacă nu există, creează-l din șablonul de mai jos și cere utilizatorului doar ce lipsește, într-un singur mesaj (planul Supabase, planul de hosting, suma reală din OpenAI → Usage pentru luna respectivă, domeniu, alte abonamente). La rulările următoare întreabă doar ce s-a schimbat.

```markdown
# Costuri Studiazo AI (actualizat: YYYY-MM-DD)

| Cost | Furnizor / plan | Sumă / lună | Sursă și data verificării |
| --- | --- | --- | --- |
| Bază de date + Storage | Supabase … | … | factură / dashboard, YYYY-MM-DD |
| Hosting | Vercel … | … | … |
| AI (facturat real) | OpenAI | … pe YYYY-MM | platform.openai.com → Usage |
| Notificări / email | … | … | … |
| Domeniu | … | … /an | … |

## Venituri
| Lună | Abonați plătitori | Încasări brute | Comisioane platformă | Sursă |
| --- | --- | --- | --- | --- |

## Prețuri modele AI
| Model | Intrare / 1M tokeni | Ieșire / 1M tokeni | Sursă și data |
| --- | --- | --- | --- |
```

**Prețurile modelelor:** modelul folosit e în `src/lib/ai/config.ts` (și `OPENAI_MODEL`). Verifică prețul curent pe pagina oficială de prețuri OpenAI (WebSearch/WebFetch) și notează sursa și data în `costuri.md`. Dacă nu poți verifica, folosește valoarea din `docs/VIZIUNE.md` §5 și marchează-o „neverificat”.

Plățile/abonamentele nu există încă în aplicație: veniturile sunt 0 [real] până când apar. Nu inventa încasări.

## Pasul 3 — Calculele lunare

Pentru fiecare lună din date (curentă + 2 anterioare, pentru tendință):

1. **Cost AI calculat** = Σ (tokeni_intrare × preț_intrare + tokeni_ieșire × preț_ieșire) / 1.000.000, pe model și pe funcție (`kind`). Compară cu suma reală din OpenAI; o diferență peste ~10% înseamnă apeluri neînregistrate sau preț greșit — spune asta.
2. **Cost total** = AI real (sau calculat, marcat ca atare) + costuri fixe pe lună (cele anuale ÷ 12).
3. **Cost per utilizator activ** = cost total ÷ `utilizatori_activi`. Separat: **cost AI marginal** per utilizator (median și p90 din `tokeni_per_utilizator` × preț) — p90 arată cât costă un student intens, care contează pentru limite și prețuri.
4. **Rata de eșec AI** = esuate ÷ cereri, pe funcție (eșecurile costă încredere, nu bani).
5. **Retenție** = `utilizatori_luna_trecuta_inca_activi` ÷ activi luna trecută; **activare** = `onboarding_terminat` ÷ `conturi_noi`.
6. **Venituri, marjă** = încasări nete (după comisioane și TVA, dacă se aplică) − cost total; marjă % = marjă ÷ încasări nete.
7. **Pragul de profit** = costuri fixe ÷ (preț net abonament − cost AI marginal per abonat). Fără abonament real, calculează-l pe 2–3 prețuri [ipoteză] (ex. 15 / 25 / 35 lei) și cu costul p90, nu cu medianul — ca să fie prudent.
8. **ROI** (doar dacă există investiții notate în `costuri.md`) = (venit net cumulat − cost cumulat) ÷ cost cumulat.

Fă calculele cu un script mic (node) din directorul temporar, nu din cap, și arată rezultatele rotunjite (lei/USD cu 2 zecimale; precizează cursul folosit și data lui).

## Pasul 4 — Analiza

Scurt și concret, cu numerele de mai sus ca dovadă:
- **Funcții care merită**: folosire mare (`functii`) și cost mic per utilizare, sau care aduc retenție. **Funcții care consumă fără rezultat**: cost AI mare per utilizator față de folosire, propuneri AI create dar rar confirmate, rată de eșec mare. Sugerează măsura cea mai simplă (limită, model mai ieftin, prompt mai scurt, cache) — nu funcții noi.
- **Riscuri financiare**: un singur utilizator cu consum disproporționat (`max_*` vs. median), limitele din `AI_REQUESTS_PER_HOUR` / `AI_MAX_OUTPUT_TOKENS` prea largi, dependența de un singur furnizor, scumpirea modelului, plan Supabase/Vercel aproape de limita gratuită, retenție în scădere.
- **Strategie de creștere**: 3 pași cel mult, legați de ce arată datele și de ordinea din `docs/VIZIUNE.md` §6 (nu monetizare înainte de retenție validată).
- **Goluri de date**: ce nu putem măsura încă și ce ar trebui înregistrat (fără conținutul mesajelor).

Nu modifica codul aplicației din acest skill. Dacă analiza cere o schimbare (ex. o funcție care nu scrie în `ai_usage`), propune-o și spune cine deține fișierul conform `docs/COLLABORATION.md`.

## Pasul 5 — Raportul

Salvează `docs/business/RAPORT_YYYY-MM.md` (luna analizată), în română cu diacritice:

1. **Pe scurt** — 3–5 rânduri: cât am cheltuit, cât am încasat, cost per utilizator activ, pragul de profit, cea mai importantă recomandare.
2. **Utilizatori** — conturi, activi, activare, retenție, zile active (tabel pe 3 luni).
3. **Costuri** — tabel pe categorii, cu eticheta [real]/[calculat]/[ipoteză] și sursa fiecărui rând.
4. **Cost AI pe funcție și model** — cereri, tokeni, cost, rată de eșec.
5. **Venituri, marjă, prag de profit, ROI** — scenariile clar marcate ca ipoteze.
6. **Funcții: merită / nu merită**.
7. **Riscuri**.
8. **Strategie și următorii pași** (3 cel mult).
9. **Goluri de date și ipoteze folosite**.

În chat răspunde doar cu „Pe scurt” și calea raportului. Dacă cererea a fost o întrebare anume (ex. prețul abonamentului), răspunde direct la ea cu cifrele relevante și etichetele lor; salvezi raport doar dacă ți se cere.

Fișierele din `docs/business/` conțin doar cifre agregate, fără date personale sau chei. Commit doar dacă utilizatorul cere, după regulile din `CLAUDE.md`.
