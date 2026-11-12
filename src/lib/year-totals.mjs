import { validDate } from "./progress.mjs";

// Calendar years share a leap-year axis so March–December stay aligned.
export function cumulativeYearSeries(runs, years, today) {
  const points = Array.from({ length: 366 }, (_, index) => ({ day: index + 1 }));
  for (const year of years) {
    const recorded = runs.filter(
      (run) => Number(run.date.slice(0, 4)) === year && run.date <= today
    );
    const daily = new Map();
    for (const run of recorded) {
      daily.set(run.date, (daily.get(run.date) || 0) + run.distanceKm);
    }
    let total = 0;
    for (const point of points) {
      const anchor = new Date(Date.UTC(2000, 0, point.day));
      const date = `${year}-${anchor.toISOString().slice(5, 10)}`;
      point[`y${year}`] = null;
      if (!recorded.length || !validDate(date) || date > today) continue;
      total += daily.get(date) || 0;
      point[`y${year}`] = total;
      point[`date${year}`] = date;
    }
  }
  return points;
}
