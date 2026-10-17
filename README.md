# StudIA

> Al doilea creier al studentului ieșean.

Aplicație web (responsive, pregătită pentru PWA) pentru studenții din Iași: program, termene, materii cu cursuri în PDF și un asistent AI care explică materia, te testează și îți propune sesiuni de studiu pe care le confirmi tu.

**Stare:** Etapa 1 (fundația comună) este gata. Vezi [docs/TASKS.md](docs/TASKS.md) pentru ce e funcțional, demonstrativ sau planificat.

## Pornire rapidă

Cerințe: Node.js ≥ 20.9 (recomandat 24), npm. Folosim **doar npm** și un singur `package-lock.json`.

```bash
npm install
cp .env.example .env.local   # completează valorile (vezi docs/SETUP.md)
npm run dev                  # http://localhost:3000
```

Fără Supabase, poți vedea interfața cu date demonstrative:

```bash
# PowerShell:  $env:STUDIA_PREVIEW="1"; npm run dev
STUDIA_PREVIEW=1 npm run dev
```

## Comenzi

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | Server de dezvoltare |
| `npm run build` / `npm start` | Build și server de producție |
| `npm run check` | TypeScript + ESLint + teste (rulează înainte de fiecare PR) |
| `npm test` | Testele (Vitest) |
| `npm run screenshots` | Capturi la 360/390/768/1280/1440 px (server pornit cu `STUDIA_PREVIEW=1`) |

## Documentație

| Fișier | Pentru ce |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Reguli pentru Claude Code |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Scop, MVP, priorități |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Structură, fluxuri, decizii |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Reguli vizuale și componente |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, RLS, Storage |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | Contractele dintre module |
| [docs/COLLABORATION.md](docs/COLLABORATION.md) | Ramuri, proprietari, PR-uri |
| [docs/TASKS.md](docs/TASKS.md) | Taskuri și stare |
| [docs/SETUP.md](docs/SETUP.md) | GitHub, Supabase, OpenAI, domenii |
| [docs/HANDOFF_DAVID.md](docs/HANDOFF_DAVID.md) / [docs/HANDOFF_SERGIU.md](docs/HANDOFF_SERGIU.md) | Prompturile de continuare |
| [docs/DEMO.md](docs/DEMO.md) | Scenariul demonstrației |
