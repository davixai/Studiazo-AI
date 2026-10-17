// Așezarea activităților într-o grilă orară: minute de la începutul zilei și benzi pentru suprapuneri
// (două activități în același timp stau una lângă alta, nu una peste alta).

export type Positioned<T> = { item: T; startMin: number; endMin: number; lane: number; lanes: number };

export function layoutLanes<T extends { start: Date; end: Date }>(items: T[], dayStart: Date, dayEnd: Date): Positioned<T>[] {
  const dayMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60_000;
  const clipped = items
    .map((item) => ({
      item,
      startMin: Math.max(0, (item.start.getTime() - dayStart.getTime()) / 60_000),
      endMin: Math.min(dayMinutes, (item.end.getTime() - dayStart.getTime()) / 60_000),
    }))
    .filter((p) => p.endMin > p.startMin)
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const result: Positioned<T>[] = [];
  let cluster: Positioned<T>[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    for (const p of cluster) p.lanes = lanes;
    result.push(...cluster);
    cluster = [];
  };

  for (const p of clipped) {
    if (cluster.length > 0 && p.startMin >= clusterEnd) closeCluster();
    const laneEnds = new Map<number, number>();
    for (const c of cluster) laneEnds.set(c.lane, Math.max(laneEnds.get(c.lane) ?? 0, c.endMin));
    let lane = 0;
    while ((laneEnds.get(lane) ?? -1) > p.startMin) lane++;
    cluster.push({ ...p, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, p.endMin);
  }
  if (cluster.length > 0) closeCluster();
  return result;
}

/** Orele afișate: implicit 08–20, extinse cât să încapă tot programul. */
export function hourRange(spans: Array<{ startMin: number; endMin: number }>, defaults = { start: 8, end: 20 }) {
  const start = Math.min(defaults.start, ...spans.map((s) => Math.floor(s.startMin / 60)));
  const end = Math.max(defaults.end, ...spans.map((s) => Math.ceil(s.endMin / 60)));
  return { start: Math.max(0, start), end: Math.min(24, end) };
}
