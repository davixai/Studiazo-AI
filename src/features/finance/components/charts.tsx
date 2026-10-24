import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLei, formatPercent, monthLabel, type CategoryTotal, type MonthSummary, type TrendPoint } from "../stats";

/** Cheltuielile pe categorii: o singură serie, sortată descrescător, cu valoarea scrisă pe fiecare rând. */
export function CategoryBars({ items, tone = "expense" }: { items: CategoryTotal[]; tone?: "expense" | "income" }) {
  const max = Math.max(...items.map((i) => i.amount), 0);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={item.category} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
          <span className="truncate text-[13px] font-medium text-ink">
            <span aria-hidden="true" className="mr-1.5">
              {item.emoji}
            </span>
            {item.label}
          </span>
          <span className="text-[13px] text-ink-soft tabular">
            <span className="font-semibold text-ink">{formatLei(item.amount)}</span>
            <span className="text-ink-muted"> · {formatPercent(item.share)}</span>
          </span>
          <span className="col-span-2 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
            <span
              className={cn("block h-full origin-left animate-fill-x rounded-full", tone === "income" ? "bg-viz-income" : "bg-viz-expense")}
              style={{ width: `${max > 0 ? Math.max(2, (item.amount / max) * 100) : 0}%`, animationDelay: `${i * 60}ms` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

const RULE_ROWS = [
  { key: "nevoi", label: "Nevoi", hint: "chirie, mâncare, transport, facturi, facultate", target: 0.5, kind: "max" },
  { key: "dorinte", label: "Dorințe", hint: "ieșiri, abonamente, cumpărături", target: 0.3, kind: "max" },
  { key: "economii", label: "Economii", hint: "ce rămâne din venit", target: 0.2, kind: "min" },
] as const;

/** Regula 50/30/20: ponderea reală din venit față de țintă (marcată pe bară). */
export function RuleMeter({ rule }: { rule: NonNullable<MonthSummary["rule"]> }) {
  return (
    <ul className="flex flex-col gap-4">
      {RULE_ROWS.map((row) => {
        const value = rule[row.key];
        const ok = row.kind === "max" ? value <= row.target : value >= row.target;
        const width = Math.min(100, Math.max(0, value * 100));
        return (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink">
                {row.label} <span className="font-normal text-ink-muted">· {row.hint}</span>
              </p>
              <p className="text-[13px] font-bold text-ink tabular">{formatPercent(value)}</p>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-surface-sunken">
              <span className="absolute inset-y-0 left-0 origin-left animate-fill-x rounded-full bg-accent" style={{ width: `${width}%` }} />
              <span
                aria-hidden="true"
                className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink-soft"
                style={{ left: `${row.target * 100}%` }}
                title={`Țintă: ${row.kind === "max" ? "maximum" : "minimum"} ${formatPercent(row.target)}`}
              />
            </div>
            <p className={cn("mt-1.5 flex items-center gap-1 text-[12px] font-medium", ok ? "text-success" : "text-warning")}>
              {ok ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <TriangleAlert className="size-3.5" aria-hidden="true" />}
              {ok ? "În țintă" : "În afara țintei"} ({row.kind === "max" ? "max." : "min."} {formatPercent(row.target)})
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const CHART_HEIGHT = 140;

/** Venituri și cheltuieli pe ultimele luni: două serii, coloane grupate, legendă, tooltip la hover și tabel ascuns. */
export function TrendChart({ points, month }: { points: TrendPoint[]; month: string }) {
  const max = Math.max(...points.flatMap((p) => [p.income, p.expenses]), 0);
  const scaleMax = niceMax(max);
  const bar = (v: number) => (v > 0 ? Math.max(3, (v / scaleMax) * CHART_HEIGHT) : 0);

  return (
    <figure>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-viz-income" /> Venituri
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-viz-expense" /> Cheltuieli
        </span>
      </div>

      <div className="relative" style={{ height: CHART_HEIGHT + 26 }}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-line/70" />
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-line/70" style={{ top: CHART_HEIGHT / 2 }} />
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-line-strong" style={{ top: CHART_HEIGHT }} />
        <span aria-hidden="true" className="absolute -top-2 right-0 bg-surface pl-1 text-[10px] text-ink-faint tabular">
          {formatLei(scaleMax)}
        </span>

        <ol aria-hidden="true" className="absolute inset-x-0 top-0 grid" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`, height: CHART_HEIGHT + 26 }}>
          {points.map((p, i) => {
            const current = p.month === month;
            return (
              <li key={p.month} className="group relative flex flex-col items-center">
                <div className="relative flex w-full items-end justify-center gap-0.5" style={{ height: CHART_HEIGHT }}>
                  <span
                    className="w-3 origin-bottom animate-grow-y rounded-t-[4px] bg-viz-income transition-[filter] group-hover:brightness-110 sm:w-4"
                    style={{ height: bar(p.income), animationDelay: `${100 + i * 60}ms` }}
                  />
                  <span
                    className="w-3 origin-bottom animate-grow-y rounded-t-[4px] bg-viz-expense transition-[filter] group-hover:brightness-110 sm:w-4"
                    style={{ height: bar(p.expenses), animationDelay: `${130 + i * 60}ms` }}
                  />
                  {/* Eticheta primei și ultimei luni se aliniază la margine, ca să nu iasă din ecran pe telefon. */}
                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-full z-10 mb-1 rounded-md bg-night px-2.5 py-1.5 text-[11px] whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100",
                      i === 0 && "left-0",
                      i === points.length - 1 && "right-0",
                    )}
                  >
                    <span className="block font-semibold">{monthLabel(p.month)}</span>
                    <span className="block text-white/80">Venituri: {formatLei(p.income)}</span>
                    <span className="block text-white/80">Cheltuieli: {formatLei(p.expenses)}</span>
                  </span>
                </div>
                <span className={cn("mt-2 text-[11px] font-semibold", current ? "text-accent" : "text-ink-muted")}>{monthLabel(p.month, "short")}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <figcaption className="sr-only">Venituri și cheltuieli pe ultimele {points.length} luni</figcaption>
      {/* sr-only pe un <div>, nu direct pe <table>: tabelele nu respectă overflow:hidden și împingeau pagina lateral sub 310px. */}
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              <th scope="col">Luna</th>
              <th scope="col">Venituri</th>
              <th scope="col">Cheltuieli</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <td>{monthLabel(p.month)}</td>
                <td>{formatLei(p.income)}</td>
                <td>{formatLei(p.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

function niceMax(value: number) {
  if (value <= 0) return 1000;
  const step = value <= 2000 ? 500 : value <= 10000 ? 1000 : 5000;
  return Math.ceil(value / step) * step;
}
