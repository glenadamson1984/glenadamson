import { aggregate, isoWeek, weekDates } from "./progress.mjs";
const shift = (date, weeks) => new Date(Date.parse(`${date}T00:00:00Z`) + weeks * 604800000).toISOString().slice(0, 10);

export function weeklyTrends(runs, today, span = 4) {
  const current = isoWeek(today);
  const currentMonday = weekDates(current.year, current.week)[0];
  const buckets = new Map();
  for (const run of runs) {
    if (run.date >= currentMonday) continue;
    const { year, week } = isoWeek(run.date);
    const monday = weekDates(year, week)[0];
    if (!buckets.has(monday)) buckets.set(monday, []);
    buckets.get(monday).push(run);
  }
  const alpha = 2 / (span + 1);
  let distanceEMA = null, paceEMA = null, distanceCount = 0, paceCount = 0, lastRecorded = null;
  const history = new Map();
  for (const monday of [...buckets.keys()].sort()) {
    const stats = aggregate(buckets.get(monday));
    distanceEMA = distanceEMA == null ? stats.distance : alpha * stats.distance + (1 - alpha) * distanceEMA;
    distanceCount++;
    if (stats.pace != null) {
      paceEMA = paceEMA == null ? stats.pace : alpha * stats.pace + (1 - alpha) * paceEMA;
      paceCount++;
    }
    lastRecorded = monday;
    history.set(monday, { distance: stats.distance, pace: stats.pace, distanceEMA,
      paceEMA: stats.pace == null ? null : paceEMA,
      estimated: buckets.get(monday).some((run) => run.estimated) });
  }
  const points = Array.from({ length: 30 }, (_, index) => {
    const monday = shift(currentMonday, index - 26);
    const actual = history.get(monday);
    const forecast = index >= 26;
    const baseline = forecast || index === 25;
    return { monday, forecast,
      distance: actual?.distance ?? null, pace: actual?.pace ?? null,
      distanceEMA: actual?.distanceEMA ?? null, paceEMA: actual?.paceEMA ?? null,
      estimated: actual?.estimated || false,
      distanceForecast: baseline && distanceCount >= 2 ? distanceEMA : null,
      paceForecast: baseline && paceCount >= 2 ? paceEMA : null };
  });
  return { points, distanceEMA, paceEMA, distanceCount, paceCount, lastRecorded };
}
