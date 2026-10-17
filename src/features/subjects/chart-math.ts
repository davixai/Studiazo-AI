import { shiftDateKey, startOfWeekKey, toDateKey } from "@/lib/time/zone";

// Matematica graficelor din panoul „Materii”: pură, testată, fără DOM.

export type WeekBucket = { weekKey: string; count: number };

/**
 * Câte elemente au fost adăugate în fiecare din ultimele `weeks` săptămâni (luni–duminică, ora României),
 * de la cea mai veche la săptămâna curentă. Ce e mai vechi sau în viitor nu intră.
 */
export function weeklyCounts(timestamps: string[], now: Date, weeks = 8): WeekBucket[] {
  const current = startOfWeekKey(toDateKey(now));
  const keys = Array.from({ length: weeks }, (_, i) => shiftDateKey(current, -7 * (weeks - 1 - i)));
  const index = new Map(keys.map((k, i) => [k, i]));
  const counts = new Array<number>(weeks).fill(0);
  for (const ts of timestamps) {
    const i = index.get(startOfWeekKey(toDateKey(new Date(ts))));
    if (i !== undefined) counts[i]++;
  }
  return keys.map((weekKey, i) => ({ weekKey, count: counts[i] }));
}

/** Diferența dintre săptămâna curentă și cea dinainte (pentru eticheta „+3 față de săptămâna trecută”). */
export function weekTrend(buckets: WeekBucket[]) {
  const n = buckets.length;
  if (n < 2) return 0;
  return buckets[n - 1].count - buckets[n - 2].count;
}

export type Point = { x: number; y: number };

/**
 * Punctele graficului în coordonate SVG: x împărțit egal pe lățime, y de jos în sus.
 * Maximul ocupă înălțimea minus `padTop`; dacă toate valorile sunt 0, linia stă jos.
 */
export function chartPoints(values: number[], width: number, height: number, padTop = 6): Point[] {
  if (values.length === 0) return [];
  const max = Math.max(...values, 0);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * step : width / 2,
    y: max > 0 ? height - (v / max) * (height - padTop) : height,
  }));
}

/**
 * Curbă netedă prin puncte (Catmull–Rom transformat în Bézier). Punctele de control ale fiecărui segment
 * rămân între valorile capetelor lui, deci curba nu coboară sub 0 și nu urcă peste valorile reale.
 */
export function smoothLine(points: Point[], height: number) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const lo = Math.max(0, Math.min(p1.y, p2.y));
    const hi = Math.min(height, Math.max(p1.y, p2.y));
    const clampY = (y: number) => Math.min(hi, Math.max(lo, y));
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clampY(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clampY(p2.y - (p3.y - p1.y) / 6) };
    d += ` C${round(c1.x)},${round(c1.y)} ${round(c2.x)},${round(c2.y)} ${round(p2.x)},${round(p2.y)}`;
  }
  return d;
}

/** Zona de sub curbă, închisă pe axa de jos. */
export function smoothArea(points: Point[], height: number) {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  return `${smoothLine(points, height)} L${last.x},${height} L${points[0].x},${height} Z`;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
