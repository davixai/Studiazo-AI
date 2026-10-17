# Sistem de design

Direcție: **calm, matur, minimalist, premium**. Un produs care pare făcut cu grijă, nu un panou generic. Referința vie: `/sistem-design` (disponibilă în dezvoltare și în modul previzualizare).

## Fundamente

**Culori**: tokeni în `src/app/globals.css` (`@theme`). Nu folosi culori hex în componente.

| Rol | Token | Folosire |
| --- | --- | --- |
| Fundal pagină | `canvas` `#f7f6f3` | neutru cald („hârtie”) |
| Suprafețe | `surface`, `surface-muted`, `surface-sunken` | carduri, câmpuri, zone secundare |
| Contururi | `line`, `line-strong` | 1px, discrete |
| Text | `ink` > `ink-soft` > `ink-muted` > `ink-faint` | ierarhie prin ton, nu prin mărime |
| Accent unic | `accent` `#3049c4` (albastru-cerneală), `accent-soft`, `accent-ink` | acțiunea principală, starea activă, focus |
| Stări | `success`, `warning`, `danger` (+ `-soft`) | doar pentru a comunica o stare |
| Categorii | `cat-blue/teal/green/amber/rose/violet/slate` | materii și tipuri de activități: punct, bară de 3px, fundal 8% |

Contrast: textul `ink-muted` pe `canvas` și pe `surface` ≥ 4,5:1. `ink-faint` se folosește doar pentru informație secundară non-esențială.

**Tipografie**
- UI: **Geist** (subset latin-ext, cu ș/ț corecte).
- Titluri de pagină și momente editoriale: **Newsreader** (`font-display`), greutate 500, `tracking-[-0.02em]`.
- Scară: titlu pagină 32/40px · titlu secțiune 15px semibold · text 14–15px · meta 13px · etichete mici 11–12px.
- Cifrele orelor folosesc `tabular` (cifre de lățime egală).

**Spațiere și formă**
- Grilă de 4px; carduri `p-5 sm:p-6`; între secțiuni 24–40px.
- Raze: `sm` 6 · `md` 10 (butoane, câmpuri) · `lg` 14 (carduri) · `xl` 20 (dialoguri).
- Umbre: `shadow-xs` implicit, `shadow-sm` la hover sau elemente active, `shadow-lg` doar pentru dialoguri.

**Mișcare**: 150–260 ms, `ease-out`; `fade-in`, `rise-in`, `sheet-in`. Toate se opresc la `prefers-reduced-motion`.

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
