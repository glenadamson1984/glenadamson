import { validateData } from "./progress.mjs";
// One-time, additive import: existing dates and IDs win, and subsequent deletions stay deleted.
export function applyHistory(data, history) {
  if (data.imports?.includes(history.id)) return data;
  const ids = new Set(data.weights.map((r) => r.id));
  const dates = new Set(data.weights.map((r) => r.date));
  const additions = history.weights.filter(
    (r) => !ids.has(r.id) && !dates.has(r.date)
  );
  return validateData({
    ...data,
    weights: [...data.weights, ...additions],
    imports: [...(data.imports || []), history.id],
  });
}

// Add intentional new batches once. Existing manual entries take precedence.
export function applyUpdates(data, updates) {
  let result = data;
  for (const update of updates) {
    if (result.imports?.includes(update.id)) continue;
    let correctedRuns = result.runs;
    for (const { previous, record } of update.runCorrections || []) {
      correctedRuns = correctedRuns.map(run => run.id === previous.id && (!previous.date || run.date === previous.date) && run.distanceKm === previous.distanceKm && run.movingSeconds === previous.movingSeconds && run.estimated === previous.estimated ? record : run);
    }
    const runs = (update.runs || []).filter(record => !result.runs.some(r => r.id === record.id || r.date === record.date));
    const weights = (update.weights || []).filter(record => !result.weights.some(r => r.id === record.id || (r.date === record.date && (!r.time || r.time === record.time))));
    result = validateData({ ...result, runs: [...correctedRuns, ...runs], weights: [...result.weights, ...weights], imports: [...(result.imports || []), update.id] });
  }
  return result;
}
