import type { LearningStats } from "@/lib/progress/streak";
import { formatDuration, formatWeekdayShort } from "@/lib/time/format";
import { dayBounds } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

const CHART_HEIGHT = 132;

/**
 * Timpul de învățare pe ultimele 7 zile: o singură serie, coloane subțiri (≤ 24px) cu capăt rotunjit,
 * eticheta doar pe maxim; restul valorilor în tooltip (hover/focus) și în tabelul pentru cititoare de ecran.
 */
export function LearningChart({ stats }: { stats: LearningStats }) {
  const days = stats.last7Days;
  const max = Math.max(...days.map((d) => d.minutes), 0);
  const scaleMax = niceMax(max);
  const maxIndex = max > 0 ? days.findIndex((d) => d.minutes === max) : -1;
  const lastIndex = days.length - 1;

  return (
    <figure>
      <div className="relative" style={{ height: CHART_HEIGHT + 28 }}>
        {/* Grilă discretă: baza + jumătate */}
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-line" style={{ top: 0 }} />
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-line/70" style={{ top: CHART_HEIGHT / 2 }} />
        <div aria-hidden="true" className="absolute inset-x-0 border-t border-line-strong" style={{ top: CHART_HEIGHT }} />
        <span aria-hidden="true" className="absolute -top-2 right-0 bg-surface pl-1 text-[10px] text-ink-faint tabular">
          {scaleMax} min
        </span>

        <ol className="absolute inset-x-0 top-0 grid grid-cols-7" style={{ height: CHART_HEIGHT + 28 }} aria-hidden="true">
          {days.map((d, i) => {
            const h = d.minutes > 0 ? Math.max(4, (d.minutes / scaleMax) * CHART_HEIGHT) : 0;
            const label = formatWeekdayShort(dayBounds(d.date).start).replace(".", "");
            return (
              <li key={d.date} tabIndex={-1} className="group relative flex flex-col items-center outline-none">
                <div className="relative flex w-full flex-1 items-end justify-center" style={{ height: CHART_HEIGHT, maxHeight: CHART_HEIGHT }}>
                  {i === maxIndex ? (
                    <span className="absolute text-[11px] font-bold text-ink tabular" style={{ bottom: h + 6 }}>
                      {d.minutes}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "w-[22px] origin-bottom animate-grow-y rounded-t-[6px] transition-[filter] group-hover:brightness-110",
                      i === lastIndex ? "bg-accent" : "bg-accent/70",
                    )}
                    style={{ height: h, animationDelay: `${120 + i * 60}ms` }}
                  />
                  {/* Tooltip la hover; pe ecranele tactile apare la atingere (li primește focus) */}
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 rounded-md bg-night px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                    {d.minutes > 0 ? formatDuration(d.minutes) : "0 min"}
                  </span>
                </div>
                <span className={cn("mt-2 text-[11px] font-semibold capitalize", i === lastIndex ? "text-accent" : "text-ink-muted")}>
                  {i === lastIndex ? "Azi" : label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="sr-only">Minute de învățare în ultimele 7 zile</figcaption>
      {/* sr-only pe un <div>, nu direct pe <table>: tabelele nu respectă overflow:hidden și pot împinge pagina lateral. */}
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              <th scope="col">Zi</th>
              <th scope="col">Minute</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{formatWeekdayShort(dayBounds(d.date).start)}</td>
                <td>{d.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

function niceMax(value: number) {
  if (value <= 15) return 15;
  if (value <= 30) return 30;
  if (value <= 60) return 60;
  return Math.ceil(value / 30) * 30;
}
