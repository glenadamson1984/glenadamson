import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cumulativeYearSeries } from "../src/lib/year-totals.mjs";
import { weeklyTrends } from "../src/lib/trends.mjs";
import { applyUpdates } from "../src/lib/history.mjs";
import { dayOfYear } from "../src/lib/progress.mjs";
const run = (id, date, distanceKm, movingSeconds = 3000) => ({ id, date, distanceKm, movingSeconds, estimated: false });

test("calendar totals sum same-day runs, stay flat, align leap days, and stop at today", () => {
  const runs = [run("a", "2024-02-28", 5), run("b", "2024-02-29", 3), run("c", "2024-03-01", 2),
    run("d", "2025-03-01", 4), run("e", "2026-01-01", 2), run("f", "2026-01-01", 3),
    run("future", "2026-11-13", 99), run("december", "2025-12-31", 6)];
  const points = cumulativeYearSeries(runs, [2024, 2025, 2026, 2027, 2023], "2026-11-12");
  const at = (date) => points[dayOfYear(date) - 1];
  assert.equal(at("2024-02-29").y2024, 8);
  assert.equal(at("2024-02-29").y2025, null);
  assert.equal(at("2024-03-01").y2024, 10);
  assert.equal(at("2025-03-01").y2025, 4);
  assert.equal(at("2026-01-01").y2026, 5);
  assert.equal(at("2026-11-12").y2026, 5);
  assert.equal(at("2026-11-13").y2026, null);
  assert.equal(at("2025-12-31").y2025, 10);
  assert.ok(points.every((point) => point.y2027 === null && point.y2023 === null));
});

test("EMA uses completed weighted weeks, skips missing weeks, and excludes current and future records", () => {
  const runs = [run("a", "2026-10-19", 10, 3000), run("b", "2026-10-20", 20, 7200),
    run("c", "2026-11-02", 10, 3000), run("current", "2026-11-09", 100, 10000), run("future", "2026-12-01", 200)];
  const result = weeklyTrends(runs, "2026-11-12", 4);
  assert.equal(result.distanceCount, 2);
  assert.equal(result.distanceEMA, 22); // .4 * 10 + .6 * 30
  assert.equal(result.paceEMA, 324); // .4 * 300 + .6 * (10200 / 30)
  const gap = result.points.find((point) => point.monday === "2026-10-26");
  assert.equal(gap.distance, null);
  assert.equal(gap.distanceEMA, null);
  const projection = result.points.filter((point) => point.forecast);
  assert.equal(projection.length, 4);
  assert.ok(projection.every((point) => point.distance === null && point.distanceForecast === 22 && point.paceForecast === 324));
  assert.equal(result.lastRecorded, "2026-11-02");
  assert.equal(weeklyTrends([runs[0]], "2026-11-12").points.at(-1).distanceForecast, null);
  const zero = weeklyTrends([run("zero", "2026-11-02", 0)], "2026-11-12");
  assert.equal(zero.distanceEMA, 0);
  assert.equal(zero.paceEMA, null);
});

test("9 November correction replaces only the original estimate and never resurrects deleted records", () => {
  const updates = JSON.parse(fs.readFileSync(new URL("../src/data/updates.json", import.meta.url)));
  const original = { ...run("manual-2026-11-09-run", "2026-11-09", 10, 3780), estimated: true };
  const data = { version: 1, runs: [original], weights: [], imports: updates.filter((update) => update.id !== "correct-run-2026-11-09-v1").map((update) => update.id) };
  const result = applyUpdates(data, updates);
  assert.deepEqual(result.runs, [run(original.id, original.date, 10.01, 3767)]);
  assert.equal(applyUpdates(result, updates), result);
  const edited = applyUpdates({ ...data, runs: [{ ...original, distanceKm: 12 }] }, updates);
  assert.equal(edited.runs[0].distanceKm, 12);
  const rescheduled = applyUpdates({ ...data, runs: [{ ...original, date: "2026-11-08" }] }, updates);
  assert.equal(rescheduled.runs[0].date, "2026-11-08");
  assert.equal(applyUpdates({ ...data, runs: [] }, updates).runs.length, 0);
});
