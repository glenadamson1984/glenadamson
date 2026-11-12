import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  aggregate,
  dayOfYear,
  distanceDifference,
  formatPace,
  isoWeek,
  mergeData,
  parseDuration,
  STORAGE_KEY,
  validDate,
  validateData,
  weekDates,
  weeklySeries,
  weeksInYear,
  weightSeries,
} from "../src/lib/progress.mjs";
import { fromCSV, parseBackup, toCSV } from "../src/lib/backup.mjs";
import { loadData, saveData } from "../src/lib/storage.mjs";
const seed = JSON.parse(
  fs.readFileSync(new URL("../src/data/seed.json", import.meta.url))
);
const currentSeed = structuredClone(seed);
const dailyUpdates = JSON.parse(fs.readFileSync(new URL('../src/data/updates.json',import.meta.url)));
const addedRunIds = new Set(dailyUpdates.flatMap(update => update.runs || []).map(r => r.id));
const addedWeightIds = new Set(dailyUpdates.flatMap(update => update.weights || []).map(r => r.id));
seed.runs = seed.runs.filter(r => !addedRunIds.has(r.id));
seed.weights = seed.weights.filter(r => !addedWeightIds.has(r.id));
const run = (id, date, distanceKm, movingSeconds) => ({
  id,
  date,
  distanceKm,
  movingSeconds,
  estimated: false,
});
const empty = { version: 1, runs: [], weights: [] };
test("StatsHunters import retains all 466 runs, exact recent distances and moving times", () => {
  const data = validateData(seed);
  assert.equal(data.runs.length, 466);
  assert.equal(data.weights.length, 851);
  assert.equal(data.runs.filter((r) => r.distanceKm === 0).length, 14);
  assert.deepEqual(
    data.runs
      .filter((r) => r.date >= "2026-11-02")
      .map((r) => [r.date, r.distanceKm, r.movingSeconds]),
    [
      ["2026-11-02", 6.3865, 2099],
      ["2026-11-03", 5.1188, 1744],
      ["2026-11-04", 9.6658, 3424],
      ["2026-11-05", 10.0237, 3587],
      ["2026-11-07", 9.2682, 3505],
    ]
  );
  assert.ok(
    Math.abs(weeklySeries(data.runs, 2026, 45).distance - 40.463) < 1e-8
  );
});
test("ISO weeks align Mondays through Sundays, including boundary weeks and week 53", () => {
  assert.deepEqual(weekDates(2026, 45), [
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
  ]);
  assert.equal(weekDates(2025, 45)[0], "2025-11-03");
  assert.deepEqual(isoWeek("2025-12-29"), { year: 2026, week: 1 });
  assert.equal(weekDates(2026, 1)[0], "2025-12-29");
  assert.equal(weeksInYear(2026), 53);
  assert.equal(weeksInYear(2025), 52);
  assert.deepEqual(weekDates(2025, 53), []);
  assert.equal(weeklySeries(seed.runs, 2025, 53).hasData, false);
});
test("daily and weekly pace use time / distance, including multiple same-day runs", () => {
  const runs = [
    run("a", "2026-11-02", 1, 300),
    run("b", "2026-11-02", 9, 3600),
    run("c", "2026-11-03", 5, 1500),
    run("zero", "2026-11-03", 0, 500),
  ];
  const series = weeklySeries(runs, 2026, 45);
  assert.equal(series.points[0].dailyPace, 390);
  assert.equal(series.points[1].dailyPace, 300);
  assert.equal(series.pace, 360);
  assert.equal(series.points[1].cumulativePace, 360);
  assert.equal(series.points[2].dailyPace, null);
  assert.equal(series.points[2].cumulativePace, 360);
  assert.equal(aggregate(runs).seconds, 5400);
  assert.equal(formatPace(359.8), "6:00");
  assert.equal(formatPace(null), "—");
});
test("missing weeks stay missing and a zero baseline does not produce infinity", () => {
  assert.equal(weeklySeries([], 2026, 45).points[0].distance, null);
  assert.deepEqual(distanceDifference(5, 0), { km: 5, percent: null });
  assert.deepEqual(distanceDifference(5, 2), { km: 3, percent: 150 });
  assert.deepEqual(distanceDifference(5, 0, true, false), {
    km: null,
    percent: null,
  });
});
test("weight alignment preserves exact observations, leap-day calendar and missing values", () => {
  assert.equal(dayOfYear("2025-11-05"), dayOfYear("2026-11-05"));
  const points = weightSeries(
    seed.weights
      .filter((r) => r.id.startsWith("weight-"))
      .map(({ time, ...r }) => r),
    [2026, 2025]
  );
  assert.equal(points.filter((p) => p.y2026 !== null).length, 3);
  assert.equal(points.filter((p) => p.y2025 !== null).length, 13);
  const nov5 = points.find((p) => p.day === dayOfYear("2026-11-05"));
  assert.equal(nov5.y2026, 79.5);
  assert.equal(nov5.y2025, 84.7);
  assert.equal(
    points.find((p) => p.day === dayOfYear("2025-10-22")).y2026,
    null
  );
  assert.equal(dayOfYear("2024-03-01"), dayOfYear("2025-03-01"));
  assert.equal(dayOfYear("2024-02-29") + 1, dayOfYear("2025-03-01"));
});
test("JSON and CSV backups round-trip every value and imports are validated atomically", () => {
  assert.deepEqual(fromCSV(toCSV(seed)), validateData(seed));
  assert.deepEqual(
    parseBackup(JSON.stringify(seed), "backup.JSON"),
    validateData(seed)
  );
  assert.throws(() =>
    fromCSV("kind,date,distanceKm,movingSeconds\nrun,2026-11-02,,300")
  );
  assert.throws(() =>
    validateData({
      ...empty,
      weights: [{ id: "w", date: "2026-02-30", weightKg: 80 }],
    })
  );
  assert.equal(validDate("2026-02-30"), false);
  assert.throws(() => validateData({ ...seed, version: 2 }));
  assert.throws(() =>
    validateData({ ...empty, runs: [run("a", "2026-11-02", Infinity, 300)] })
  );
  assert.throws(() =>
    validateData({
      ...empty,
      weights: [
        { id: "a", date: "2026-01-01", weightKg: 80 },
        { id: "b", date: "2026-01-01", weightKg: 81, time: "25:00" },
      ],
    })
  );
});
test("merge is repeatable, updates IDs and replaces estimated distances", () => {
  assert.deepEqual(mergeData(seed, seed), validateData(seed));
  const old = {
    ...empty,
    runs: [{ ...run("estimate", "2026-11-02", 6.38, 2100), estimated: true }],
  };
  const incoming = {
    ...empty,
    runs: [run("exact", "2026-11-02", 6.3865, 2099)],
  };
  assert.deepEqual(mergeData(old, incoming).runs, incoming.runs);
  const updated = { ...empty, runs: [run("exact", "2026-11-02", 7, 2400)] };
  assert.equal(mergeData(incoming, updated).runs.length, 1);
  assert.equal(mergeData(incoming, updated).runs[0].distanceKm, 7);
});
test("saved edits, deletions and empty datasets survive seed updates without writes on load", () => {
  let raw = null;
  let writes = 0;
  const storage = {
    getItem: (key) => {
      assert.equal(key, STORAGE_KEY);
      return raw;
    },
    setItem: (key, value) => {
      assert.equal(key, STORAGE_KEY);
      raw = value;
      writes++;
    },
  };
  assert.equal(loadData(storage, seed).runs.length, 466);
  assert.equal(writes, 0);
  const edited = { ...empty, runs: [run("custom", "2027-01-05", 10, 3600)] };
  saveData(storage, edited);
  assert.deepEqual(loadData(storage, seed), edited);
  saveData(storage, empty);
  assert.deepEqual(loadData(storage, seed), empty);
  raw = "{broken";
  assert.throws(() => loadData(storage, seed));
  assert.equal(raw, "{broken");
  assert.equal(writes, 2);
  assert.throws(
    () =>
      saveData(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        seed
      ),
    /quota/
  );
});
test("duration accepts hours and rejects ambiguous or invalid entries", () => {
  assert.equal(parseDuration("35:00"), 2100);
  assert.equal(parseDuration("1:05:00"), 3900);
  assert.throws(() => parseDuration("5:99"));
  assert.throws(() => parseDuration("1:65:00"));
  assert.throws(() => parseDuration("0:00"));
});

test("full-year benchmarks include remaining comparison weeks without inventing current observations", async () => {
  const { yearlyWeeks } = await import("../src/lib/progress.mjs");
  const rows = yearlyWeeks(
    [run("old", "2025-12-22", 12, 3600), run("new", "2026-11-02", 5, 1800)],
    2026,
    2025
  );
  assert.equal(rows.length, 53);
  assert.equal(rows[51].y2025, 12);
  assert.equal(rows[51].y2026, null);
  assert.equal(rows[51].pace2025, 300);
  assert.equal(rows[44].y2026, 5);
  assert.equal(rows[52].y2025, null);
  const updated = yearlyWeeks(
    [run("old", "2025-12-22", 12, 3600), run("new", "2026-12-21", 8, 3200)],
    2026,
    2025
  );
  assert.equal(updated[51].y2026, 8);
  assert.equal(updated[51].pace2026, 400);
});

test("all 851 PDF weight observations, including same-day readings, survive charts and backups", () => {
  assert.equal(seed.weights.length, 851);
  const years = [
    ...new Set(seed.weights.map((r) => Number(r.date.slice(0, 4)))),
  ];
  assert.deepEqual(years, [2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  const points = weightSeries(seed.weights, years);
  assert.equal(
    points.reduce(
      (sum, p) => sum + years.filter((y) => p[`y${y}`] != null).length,
      0
    ),
    851
  );
  assert.equal(seed.weights.filter((r) => r.date === "2020-07-11").length, 2);
  assert.equal(seed.weights.filter((r) => r.date === "2025-07-01").length, 4);
  assert.deepEqual(fromCSV(toCSV(seed)), validateData(seed));
  assert.equal(mergeData(seed, seed).weights.length, 851);
});
test("new weight history is additive, preserves browser edits and old seed deletions, and applies only once", async () => {
  const { applyHistory } = await import("../src/lib/history.mjs");
  const history = JSON.parse(
    fs.readFileSync(new URL("../src/data/weight-history.json", import.meta.url))
  );
  const current = {
    ...empty,
    runs: [run("mine", "2026-11-08", 3, 900)],
    weights: [{ id: "mine", date: "2026-01-02", weightKg: 81 }],
  };
  const imported = applyHistory(current, history);
  assert.equal(imported.weights.find((r) => r.id === "mine").weightKg, 81);
  assert.equal(
    imported.weights.filter((r) => r.date === "2026-01-02").length,
    1
  );
  assert.equal(
    imported.weights.some((r) => r.id === "weight-2026-11-05"),
    false
  );
  assert.deepEqual(imported.runs, current.runs);
  const deleted = { ...imported, weights: [] };
  assert.equal(applyHistory(deleted, history), deleted);
  const storage = { getItem: () => JSON.stringify(deleted) };
  assert.equal(loadData(storage, seed).weights.length, 0);
  assert.deepEqual(loadData(storage, seed).imports, [history.id]);
});

test("weekly briefing follows the real date, not the latest recorded run, with full-week and same-weekday benchmarks", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const result = weeklySummary(seed, "2026-11-09");
  assert.equal(result.year, 2026);
  assert.equal(result.week, 46);
  assert.equal(result.comparison, 2025);
  assert.equal(result.current.distance, 0);
  assert.equal(result.current.pace, null);
  assert.ok(result.previous.distance > 0);
  assert.equal(result.remainingKm, result.previous.distance);
  assert.equal(result.currentWeight.date, "2026-11-05");
  assert.equal(result.weightThisWeek, false);
  const sunday = weeklySummary(seed, "2026-11-08");
  assert.ok(Math.abs(sunday.current.distance - 40.463) < 1e-8);
  assert.ok(Math.abs(sunday.previous.distance - 29.6991) < 1e-8);
  assert.ok(sunday.aheadKm > 10);
  assert.equal(sunday.remainingKm, 0);
  assert.equal(sunday.previousWeight.date, "2025-11-07");
  assert.equal(sunday.previousWeight.weightKg, 83.8);
});
test("weekly briefing excludes future runs and weigh-ins, handles missing benchmarks and ISO-year boundaries", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const records = {
    ...empty,
    runs: [
      run("today", "2026-11-09", 5, 1500),
      run("future", "2026-11-10", 20, 6000),
      run("old", "2025-11-10", 8, 3200),
    ],
    weights: [
      { id: "now", date: "2026-11-09", weightKg: 79 },
      { id: "future", date: "2026-11-10", weightKg: 78 },
    ],
  };
  const monday = weeklySummary(records, "2026-11-09");
  assert.equal(monday.current.distance, 5);
  assert.equal(monday.current.pace, 300);
  assert.equal(monday.remainingKm, 3);
  assert.equal(monday.priorToDay, 8);
  assert.equal(monday.currentWeight.weightKg, 79);
  assert.equal(monday.previousWeight, null);
  const missing = weeklySummary(empty, "2026-11-09");
  assert.equal(missing.remainingKm, null);
  assert.equal(missing.currentWeight, null);
  const boundary = weeklySummary(empty, "2027-01-01");
  assert.equal(boundary.year, 2026);
  assert.equal(boundary.week, 53);
  assert.equal(boundary.previous.dates.length, 0);
});

test("historical briefing finds the strongest equivalent week across all previous running years", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const s = weeklySummary(seed, "2026-11-08");
  assert.equal(s.bestWeek.year, 2023);
  assert.ok(Math.abs(s.bestWeek.distance - 59.4595) < 1e-8);
  assert.equal(formatPace(s.bestWeek.pace), "5:55");
  assert.equal(s.historyWeeks.length, 3);
  assert.ok(Math.abs(s.bestRemainingKm - 18.9965) < 1e-8);
  assert.equal(s.comparison, 2025);
  assert.ok(Math.abs(s.previous.distance - 29.6991) < 1e-8);
});
test("historical distance and pace bests are separate, weighted, and exclude missing, future and current weeks", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const data = {
    ...empty,
    runs: [
      run("a", "2023-11-06", 10, 3600),
      run("b", "2023-11-07", 20, 6000),
      run("c", "2024-11-04", 5, 1500),
      run("zero", "2022-11-07", 0, 500),
      run("otherweek", "2025-10-01", 200, 60000),
      run("current", "2026-11-02", 40, 12000),
      run("future", "2027-11-08", 100, 30000),
    ],
  };
  const s = weeklySummary(data, "2026-11-08");
  assert.equal(s.bestWeek.year, 2023);
  assert.equal(s.bestWeek.distance, 30);
  assert.equal(s.bestWeek.pace, 320);
  assert.equal(s.fastestWeek.year, 2024);
  assert.equal(s.fastestWeek.pace, 300);
  assert.equal(s.historyWeeks.length, 2);
  assert.equal(s.bestAheadKm, 10);
  assert.equal(s.bestRemainingKm, 0);
  assert.equal(s.previous.hasData, false);
  assert.equal(weeklySummary(empty, "2026-11-08").bestWeek, null);
});

test("intelligent briefing keeps last year primary and calculates the extra distance to beat the all-year record", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const { buildWeeklyBriefing, kilometresToBeat } = await import(
    "../src/lib/briefing.mjs"
  );
  const s = weeklySummary(seed, "2026-11-08"),
    b = buildWeeklyBriefing(s);
  assert.match(b.target, /already beaten last year/);
  assert.match(b.target, /29.70/);
  assert.match(b.challenge, /2023/);
  assert.match(b.challenge, /59.46/);
  assert.match(b.challenge, /another 19.00 km/);
  assert.equal(b.targetExtra, 0);
  assert.equal(b.recordExtra, 19);
  assert.equal(kilometresToBeat(10, 5), 5.01);
  assert.equal(kilometresToBeat(10, 10), 0.01);
  assert.equal(kilometresToBeat(10, 10.01), 0);
  assert.ok(s.current.distance + b.recordExtra > s.bestWeek.distance);
});
test("intelligent briefing adapts to an unmet target, tied record, new record and missing history", async () => {
  const { weeklySummary } = await import("../src/lib/weekly-summary.mjs");
  const { buildWeeklyBriefing } = await import("../src/lib/briefing.mjs");
  const make = (distance) =>
    weeklySummary(
      {
        ...empty,
        runs: [
          run("old", "2025-11-03", 10, 3600),
          ...(distance ? [run("current", "2026-11-02", distance, 3600)] : []),
        ],
      },
      "2026-11-08"
    );
  const behind = buildWeeklyBriefing(make(5));
  assert.match(behind.target, /main target/);
  assert.match(behind.target, /another 5.01 km/);
  assert.match(behind.challenge, /Last year is also/);
  assert.equal(buildWeeklyBriefing(make(10)).recordExtra, 0.01);
  const ahead = buildWeeklyBriefing(make(11));
  assert.match(ahead.challenge, /already your highest-distance/);
  assert.equal(ahead.recordExtra, 0);
  const missing = buildWeeklyBriefing(weeklySummary(empty, "2026-11-08"));
  assert.equal(missing.recordExtra, null);
  assert.match(missing.challenge, /first recorded benchmark/);
});

test("sobriety counter uses the exact start instant, elapsed days and sensible estimates", async () => {
  const { DEFAULT_SOBRIETY, sobrietyProgress } = await import(
    "../src/lib/sobriety.mjs"
  );
  const s = sobrietyProgress(DEFAULT_SOBRIETY, "2026-11-08T11:33:00Z");
  assert.equal(s.wholeDays, 440);
  assert.equal(s.hours, 4);
  assert.equal(s.minutes, 33);
  assert.ok(Math.abs(s.moneySaved - s.days * 4) < 1e-8);
  assert.ok(Math.abs(s.caloriesSaved - s.days * 306) < 1e-8);
  const before = sobrietyProgress(DEFAULT_SOBRIETY, "2025-08-24T07:00:00Z");
  assert.equal(before.days, 0);
  assert.equal(before.moneySaved, 0);
  assert.equal(before.started, false);
  const next = sobrietyProgress(DEFAULT_SOBRIETY, "2025-08-26T07:00:01Z");
  assert.equal(next.wholeDays, 1);
  assert.equal(next.seconds, 1);
});
test("sobriety settings survive validation, local storage and JSON/CSV backup and reject invalid values", async () => {
  const { DEFAULT_SOBRIETY, validateSobriety } = await import(
    "../src/lib/sobriety.mjs"
  );
  const data = {
    ...empty,
    sobriety: { ...DEFAULT_SOBRIETY, dailySpending: 5.5 },
  };
  assert.deepEqual(fromCSV(toCSV(data)), validateData(data));
  assert.deepEqual(
    parseBackup(JSON.stringify(data), "backup.json"),
    validateData(data)
  );
  let raw;
  const storage = { setItem: (k, v) => (raw = v), getItem: () => raw };
  saveData(storage, data);
  assert.equal(loadData(storage, seed).sobriety.dailySpending, 5.5);
  assert.equal(mergeData(seed, data).sobriety.dailySpending, 5.5);
  assert.throws(() =>
    validateSobriety({ ...DEFAULT_SOBRIETY, dailySpending: -1 })
  );
  assert.throws(() =>
    validateSobriety({ ...DEFAULT_SOBRIETY, startedAt: "nonsense" })
  );
  assert.throws(() =>
    validateSobriety({ ...DEFAULT_SOBRIETY, dailyCalories: Infinity })
  );
});

test('daily screenshot updates add estimated runs and exact weights once while preserving user data',async()=>{
 const {applyUpdates}=await import('../src/lib/history.mjs');const updates=JSON.parse(fs.readFileSync(new URL('../src/data/updates.json',import.meta.url)));
 const result=applyUpdates(seed,updates);assert.equal(result.runs.length,469);assert.equal(result.weights.length,852);const run=result.runs.find(r=>r.id==='manual-2026-11-09-run');assert.equal(run.distanceKm,10.01);assert.equal(run.movingSeconds,3767);assert.equal(formatPace(run.movingSeconds/run.distanceKm),'6:16');assert.equal(run.estimated,false);
 const weight=result.weights.find(r=>r.id==='weight-2026-11-09T17:30');assert.equal(weight.weightKg,79.7);assert.equal(weight.time,'17:30');assert.equal(applyUpdates(result,updates),result);
 const edited={...seed,runs:[...seed.runs,{...run,id:'mine',distanceKm:10.03}],weights:[...seed.weights,{...weight,id:'mine',weightKg:79.6}]};const preserved=applyUpdates(edited,updates);assert.equal(preserved.runs.filter(r=>r.date==='2026-11-09').length,1);assert.equal(preserved.weights.find(r=>r.id==='mine').weightKg,79.6);
 const deleted={...result,runs:seed.runs,weights:seed.weights};assert.equal(applyUpdates(deleted,updates),deleted);
 const today=result.runs.find(r=>r.id==='manual-2026-11-10-run');assert.equal(today.distanceKm,7.4);assert.equal(today.movingSeconds,2803);assert.equal(formatPace(today.movingSeconds/today.distanceKm),'6:19');assert.equal(today.estimated,false);
 const week=weeklySeries(result.runs,2026,46);assert.ok(Math.abs(week.distance-27.42)<1e-8);assert.equal(week.seconds,10200);assert.equal(formatPace(week.pace),'6:12');
 assert.deepEqual(result.runs,validateData(currentSeed).runs);assert.deepEqual(result.weights,validateData(currentSeed).weights);
});

test('12 November update corrects the old estimate without duplicates and preserves edits and deletions',async()=>{
 const {applyUpdates}=await import('../src/lib/history.mjs');const {weeklySummary}=await import('../src/lib/weekly-summary.mjs');const {buildWeeklyBriefing}=await import('../src/lib/briefing.mjs');const updates=JSON.parse(fs.readFileSync(new URL('../src/data/updates.json',import.meta.url)));
 const old= { ...seed, runs:[...seed.runs,run('manual-2026-11-09-run','2026-11-09',10,3780),{...run('manual-2026-11-10-run','2026-11-10',7.3,2820),estimated:true}], imports:['daily-records-2026-11-09','daily-records-2026-11-10'] };
 const fixed=applyUpdates(old,updates);const tuesday=fixed.runs.filter(r=>r.date==='2026-11-10');assert.equal(tuesday.length,1);assert.equal(tuesday[0].distanceKm,7.4);assert.equal(tuesday[0].movingSeconds,2803);assert.equal(tuesday[0].estimated,false);
 const thursday=fixed.runs.find(r=>r.date==='2026-11-12');assert.equal(thursday.distanceKm,10.01);assert.equal(thursday.movingSeconds,3630);assert.equal(formatPace(thursday.movingSeconds/thursday.distanceKm),'6:03');assert.equal(applyUpdates(fixed,updates),fixed);
 const edited={...old,runs:old.runs.map(r=>r.date==='2026-11-10'?{...r,distanceKm:7.42}:r)};assert.equal(applyUpdates(edited,updates).runs.find(r=>r.date==='2026-11-10').distanceKm,7.42);
 const deleted={...old,runs:old.runs.filter(r=>r.date!=='2026-11-10')};assert.equal(applyUpdates(deleted,updates).runs.some(r=>r.date==='2026-11-10'),false);
 const briefing=buildWeeklyBriefing(weeklySummary(fixed,'2026-11-12'));assert.equal(briefing.targetExtra,2.33);assert.equal(briefing.recordExtra,31.64);
});
