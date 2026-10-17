# Sistem de design

Direcție: **dark, modern, premium**. Fundal bleumarin adânc cu o „aurora” violet–albastră care se mișcă lent, carduri albastru-noapte cu margine luminoasă fină, accent albastru → violet (`bg-brand`), animații scurte.

## Fundamente

**Culori**: tokeni în `src/app/globals.css` (`@theme`). Nu folosi culori hex în componente.

| Rol | Token | Folosire |
| --- | --- | --- |
| Fundal pagină | `canvas` `#080b1a` | bleumarin adânc + aurora din `body::before/after` |
| Suprafețe | `surface` (albastru-noapte), `surface-muted`, `surface-sunken` (câmpuri), `night` (panouri de contrast) | carduri, câmpuri, zone secundare |
| Contururi | `line`, `line-strong` | 1px, discrete (`border-line/70` pe carduri) |
| Text | `ink` > `ink-soft` > `ink-muted` > `ink-faint` | ierarhie prin ton, nu prin mărime |
| Accent | `accent` `#7c5cff` (violet), `accent-blue`, `accent-pink`, gradientul `bg-brand`, `accent-hover`, `accent-soft`, `accent-line`, `accent-ink`, `accent-deep` | acțiunea principală, starea activă, focus, cardurile-erou |
| Stări | `success`, `warning`, `danger` (+ `-soft`) | doar pentru a comunica o stare |
| Categorii | `cat-blue/teal/green/amber/rose/violet/slate` | materii și tipuri de activități: `SUBJECT_COLOR_CLASSES` (punct, pastilă, fundal soft) |

Contrast: textul `ink-muted` pe `canvas` și pe `surface` ≥ 4,5:1. `ink-faint` se folosește doar pentru informație secundară non-esențială.

**Tipografie**
- Un singur font: **Plus Jakarta Sans** (`font-sans` = `font-display`, subset latin-ext, cu ș/ț corecte).
- Titluri: `font-display font-bold tracking-[-0.03em]`.
- Scară: titlu pagină 28–32px · titlu card 15–17px semibold · text 14–15px · meta 13px · etichete mici 11–12px.
- Cifrele orelor și statisticile folosesc `tabular` (cifre de lățime egală).

**Spațiere și formă**
- Grilă de 4px; carduri `p-4 sm:p-5` sau `p-5 sm:p-6`; între secțiuni 16–32px.
- Raze: `sm` 8 · `md` 12 (butoane, câmpuri) · `lg` 18 (carduri) · `xl` 24 (dialoguri).
- Umbre: `shadow-xs` / `shadow-sm` pe carduri, `shadow-md` la hover (clasa `lift`), `shadow-lg` pentru dialoguri, `shadow-accent` doar pentru cardurile violet.

**Mișcare** (în `globals.css`, toate oprite automat la `prefers-reduced-motion`):

| Clasă | Folosire |
| --- | --- |
| `stagger` + `style={{ "--i": n }}` | intrarea în cascadă a cardurilor unei pagini (70 ms între ele) |
| `animate-rise-in` / `animate-fade-in` | un element nou apărut (mesaj, rând adăugat, stare de succes) |
| `animate-sheet-in` | foaie de jos pe mobil (deja în `Dialog`) |
| `animate-pop-in` | o confirmare mică (insignă, bifă) |
| `animate-grow-y` / `animate-fill-x` | grafice și bare de progres (ex. progresul unei încărcări) |
| `lift` | carduri pe care se poate apăsa: se ridică ușor la hover |
| `active:scale-[0.99]` | apăsare pe carduri-link și butoane mari, pe telefon |

Reguli: animațiile ajută la orientare, nu decorează. 200–500 ms, `ease-out`. Fără confetti, fără mișcare continuă (excepție: flacăra streak-ului). Animă doar `opacity` și `transform`, ca să rămână fluide pe telefon.

## Componente (`src/components/ui`)

| Componentă | Reguli |
| --- | --- |
| `Button` / `ButtonLink` | `primary` (un singur buton principal pe ecran), `secondary`, `ghost`, `danger`, `quiet-danger`; mărimi `sm` `md` `lg` `icon`; `loading` păstrează lățimea |
| `Field` + `Input` / `Select` / `Textarea` | eticheta deasupra, ajutorul dedesubt, eroarea înlocuiește ajutorul; `aria-invalid` + `aria-describedby` (`describedBy()`); înălțime 44px pe mobil |
| `Card`, `CardHeader`, `CardBody` | contur fin, fără umbre grele |
| `Badge` | stări și termene scurte („mâine”, „în 3 zile”) |
| `Alert` | `info` / `success` / `warning` / `danger` (cu `role="alert"`) |
| `EmptyState` | ce lipsește + pasul următor, fără vină și fără jargon |
| `Skeleton`, `Spinner` | încărcare; `loading.tsx` pe rute |
| `Dialog` | `<dialog>` nativ: foaie de jos pe mobil, centrat pe desktop; Escape, focus prins, zona sigură respectată |
| `Segmented` | opțiuni exclusive (ex. Zi / Săptămână / Agendă) |
| `ColorDot`, `SUBJECT_COLOR_CLASSES` | culorile de categorie |
| `PageHeader` | supratitlu, titlu serif, descriere, acțiuni |

## Layout și responsive

- **≥ 1024px**: bară laterală fixă de 256px și conținut de max. 1152px.
- **< 1024px**: bară de sus (logo + avatar) și **bară de jos** cu 5 destinații (ținte de 64px, `safe-area-inset-bottom`).
- Verifică la 360, 390, 768, 1280 și 1440 px. Nicio derulare orizontală (scriptul de capturi o detectează).
- Formulare pe mobil: o coloană, câmpuri de 16px (fără zoom pe iOS), butoanele pe toată lățimea.
- Dialogurile pe mobil: `100dvh`, iar `interactive-widget=resizes-content` le ține deasupra tastaturii.
- Calendarul pe mobil: **agenda** este vederea implicită (listă pe zile, ușor de folosit cu degetul).

## Text

- Româna corectă, cu diacritice: „ș”, „ț” (cu virgulă), ghilimele „…”.
- Ton calm și direct, la persoana a doua singular („Adaugă-ți orarul”).
- Erorile spun ce s-a întâmplat și ce poate face studentul („Nu am putut salva. Încearcă din nou.”). Fără coduri tehnice.

## Accesibilitate

Focus vizibil (`outline` accent de 2px), link „Sari la conținut”, `aria-current` în navigare, etichete pe toate câmpurile, `sr-only` pentru informațiile transmise doar vizual, contrast AA, navigare completă cu tastatura.
