# Running Progress

A personal running dashboard replacing Modern Investor. Built with Next.js, React and Recharts, retaining the charcoal, pink, Poppins and Inter visual theme.

## Run locally

Use Node.js **26 LTS** (the verified version is **26.13.1**, also recorded in `.nvmrc`). Vercel uses the `26.x` engine in `package.json`, allowing subsequent Node 26 patch updates.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm start
```

The dashboard uses Next.js 16, React 19 and Recharts 3. Linting runs through the ESLint CLI with the Next.js flat configuration. The existing Pages Router and browser backup format are retained.

## Cumulative years and trends

The bottom Distance chart accumulates recorded kilometres from January 1 in each calendar year. Month/day alignment handles leap years; days without logged runs stay flat, absent years stay empty, and the current year stops at today. The year switches control its visible lines.

Trending shows the last 26 completed ISO weeks, with distance and distance-weighted weekly pace plus an exponential moving average. Choose 4, 8 or 12 recorded weeks for smoothing (`alpha = 2 / (span + 1)`). Unrecorded weeks are gaps and are skipped by the EMA; zero-distance-only records affect distance but not pace. Four dashed outlook points hold the latest EMA constant after at least two relevant recorded weeks. This is a baseline estimate, including any estimated activities, rather than a prediction of improvement. Current incomplete weeks and future activities are excluded.

The exact 9 November 2026 run replaces its original estimate: 10.01 km in 1:02:47 (3,767 seconds), rounded pace 6:16/km. A one-time correction updates unchanged original estimates in existing browser logs and preserves custom edits or deleted records.

The homepage has Distance, Pace and Weight tabs, accessible on mobile and desktop. Old investment, admin, authentication and API routes have been removed, along with Firebase and investment dependencies. No Firebase or other service credentials are needed. Existing hosting can continue building this repository with `npm run build`.

## Activity source

`src/data/seed.json` contains 466 Run / VirtualRun activities from the supplied **StatsHunters-Export-2026-11-07.xlsx**, covering 2017–2026, plus 851 individual weight entries from the supplied MonitorYourWeight PDF (2020–2026). Only activity IDs, dates, exact distance in kilometres and moving seconds were retained; GPS, names and device metadata were omitted. The workbook itself is not published. All 14 zero-distance activities are retained for completeness but excluded from pace calculations. Other activity types are excluded.

The exact recent distances are 6.3865 km (2 Nov), 5.1188 km (3 Nov), 9.6658 km (4 Nov), 10.0237 km (5 Nov) and 9.2682 km (7 Nov 2026): **40.463 km** in total. Pace is calculated from exported moving seconds, so it can differ from a pace estimated using rounded speeds.

## Calculations

- Weeks use ISO week numbers and Monday–Sunday dates, rather than matching calendar dates between years. ISO week years may include dates from an adjacent calendar year. Week 53 is supported, and a year without it shows no comparison data. Both full selected weeks are compared; incomplete weeks are not projected.
- Distance is the cumulative sum of recorded activity distances. A day with no record in a week containing measured runs adds zero recorded distance; a completely unrecorded week stays missing. Differences are primary year minus comparison year; percentages use the comparison year as the baseline. Missing or zero baselines have no percentage.
- Daily and cumulative pace use summed moving seconds / summed distance, never a mean of per-run paces. Multiple same-day runs are combined. Zero-distance activities contribute neither time nor distance to pace. Lower pace is faster; the chart has a reversed pace axis. Dotted lines show daily pace; solid lines show cumulative weekly pace. Days without a daily pace are gaps.
- Weight uses a leap-year calendar anchor to align month/day across years, including February 29. Only observed values have dots and tooltip entries; connecting lines are visual guides, not interpolated records. The weekly briefing reports the latest recorded weight and the latest actual weigh-in within the equivalent ISO week last year, with dates and explicit missing-data states.

## Updating and backups

Open **Manage data** or **Add an entry** to add, edit or delete runs and weigh-ins. Run moving time accepts `mm:ss` or `h:mm:ss`. Multiple weigh-ins and runs per day are supported; weigh-ins optionally retain their recorded HH:mm time. Future years appear automatically after adding records.

The initial data is loaded only if the `running-progress:v1` local-storage key is absent. Existing saved data, including an empty dataset or deleted seed records, always takes precedence over bundled seeds. Records are validated and saved before the UI reports success. Invalid stored data is not overwritten. Concurrent tab changes block edits until reload. This is a single-device browser log, not a server account or synchronized database. Clearing browser data removes saved changes: export backups regularly.

- **Export JSON** is a complete, versioned backup. Import and choose **Replace all records** to restore it exactly, including deletions. Replacement is an explicit step after previewing record counts.
- **Export CSV** provides an editable template with columns `kind,id,date,distanceKm,movingSeconds,weightKg,estimated,time`. Kind is `run` or `weight`; dates are `YYYY-MM-DD`; distance is kilometres; moving time is numeric seconds; weight is kilograms. Leave irrelevant fields blank. `estimated` is `true` or `false`. Keep exported IDs to update records. New CSV rows may omit IDs.
- **Merge records** updates existing IDs and retains separate same-day weigh-ins. Exact runs replace estimated runs on the same date. Stable import IDs prevent repeat imports from duplicating records. To remove a row through a backup, use Replace, not Merge.
- For future StatsHunters exports, filter to Run / VirtualRun, convert `Distance (m)` to kilometres, use `Moving time` in seconds, and convert Date to `YYYY-MM-DD` in the template. Preserve stable IDs across repeated imports. No averages of rounded exported speeds are needed.

Changes to the bundled seed apply to new browsers only, so future deployments never overwrite personal edits. Import updates intentionally in an existing browser.

## Validation

`npm test` checks exact import values, ISO week boundaries, weighted daily and weekly pace, missing-data behavior, weight alignment and leap days, validation, backup round-trips, merges, and persistence including deletions and corruption. `npm run lint` and `npm run build` validate the Next.js application. Interactive chart tooltips expose values, and individual records remain available in Manage data.

## Full-year benchmarks

Distance and Pace include a year outlook showing every ISO week through year-end. The comparison year remains visible for the remainder of the year as a weekly benchmark. The primary year shows recorded weeks only; missing weeks are blank, with no projected actual values. The live briefing shows the current week’s benchmark and remaining distance; large homepage breakdown tables have been removed. Weekly pace uses total moving time / total distance. Weight charts extend to December 31 without adding observations. New records update all views automatically.

## All-year chart series and full weight history

Year switches control chart visibility independently of the comparison cards. All years are visible by default. Show all years restores every recorded year, Comparison years limits the historical charts to this week’s two comparison years, and each historical year can be switched independently. The annual distance/pace charts and weight chart use consistent year colours; the daily comparison remains fixed to the current and prior year. The comparison always uses the current ISO week and the equivalent week in the previous ISO year.

The November 8 weight PDF contains 851 entries spanning 2020–2026. Every exported row is retained, including multiple same-day readings and identical timestamp entries, with unique IDs and recorded times. Month/day alignment also preserves time of day, and all observations remain available in the log and JSON/CSV backups. No missing measurements are interpolated. The dashboard retains the explicitly requested 74 kg target despite the export's older 72 kg setting. Email headers and the PDF itself are not included in the website.

Existing browsers receive the 835 newly supplied historical entries through a one-time additive import. Existing IDs and dates take precedence over the supplement, preserving browser edits and avoiding duplicates on dates with user entries. The 16 original seed dates are excluded from this supplement, so deleted original seed records stay deleted. An import marker is saved with browser data and JSON backups; subsequent refreshes do not re-import deleted history. Imports through the interface preserve that marker. New browsers start with the complete 851-entry dataset. The running workbook has been reconciled again against all 466 stored running activities.

## Live weekly briefing

The homepage reads the browser's local date and time, displays its timezone, and refreshes every 30 seconds. The current ISO week changes automatically, even when no new runs have been logged. A short briefing compares this week's recorded distance and distance-weighted pace with the full equivalent ISO week last year, states the remaining distance to match it (or how far ahead you are), and gives the previous year's same-week weigh-in alongside the latest current measurement with its date. The same-weekday distance is explicitly an end-of-day comparison, not a claim of hour-by-hour matching. Future-dated runs and weights are excluded from the live summary. Missing benchmarks and missing weigh-ins are reported without inventing observations.

The three summary cards stay visible above all tabs. Full-year history charts default to every recorded year; weekday distance and pace charts always compare this current week with last year's equivalent. Weight retains all 851 observations. Homepage detail/target/weight tables and week/year pickers have been removed. The record editor and JSON/CSV backups remain behind Manage data.

## Historical equivalent-week highlights

The weekly briefing also compares the current ISO week with every earlier ISO year containing measured runs for that week. It identifies the highest-distance equivalent week, reports that week's distance-weighted average pace, and uses it as a clearly labelled stretch benchmark. If another historical year has the fastest weighted weekly pace, that is highlighted separately with its distance. Last year's comparison and the fixed current-versus-prior-year chart remain visible. These are bests for the equivalent week number, not claims about the best week of an entire year. Missing weeks, zero-distance-only weeks, future years and the current year are excluded from historical ranking.

The source workbook has been checked against every stored running ID, exact distance and moving time: 462 Run plus 4 VirtualRun records. Ride, VirtualRide, Walk, GravelRide, Elliptical, WeightTraining, Rowing, Golf, Workout and EMountainBikeRi records are excluded. Weight observations stay separate from running distance and pace.

## Adaptive weekly guidance

Last year's equivalent week is the main target. The briefing changes when you are behind, tied or already ahead, and then gives a separate challenge to make this the highest-distance equivalent week across all recorded years. If last year was already the historical best, it avoids repeating it as a separate older-year example. When the current week sets a record, the wording acknowledges that achievement. Remaining distances are rounded upward to the next 0.01 km increment needed to strictly exceed the exact, unrounded total; simply matching a record is never labelled beating it. Pace comparisons are separately described as faster, slower or equal to the nearest second, with a distinct historical pace best where applicable. Missing historical data never creates a fictional target.

## Sobriety

The Sobriety tab adds a one-second live counter, next-day milestone, estimated money saved, and estimated calories avoided. The supplied screenshot sets the default start to **25 August 2025 at 08:00 Europe/London** (stored as the unambiguous instant `2025-08-25T07:00:00.000Z` because British Summer Time was in effect). Defaults are GBP 4/day and 306 kcal/day. The top summary shows complete sober days and links to this tab.

Settings can be edited in the tab and are saved through the same validated local-storage path as activities. They are backed up in JSON and in an optional `kind=sobriety` CSV row with `startedAt,dailySpending,dailyCalories,currency` columns. Existing activity-only backups remain supported. Old browser records use defaults until sobriety settings are explicitly saved; running and weight records are preserved when saving settings. The saved start is an absolute instant, displayed and edited in the device's timezone. Future start dates are rejected by the settings form, and counters never go negative. Money and calories are estimates from actual elapsed time multiplied by the configured daily amounts, not measured spending or dietary data. The counter uses complete 24-hour days with a separate hours/minutes/seconds remainder.

## New activity batches

`src/data/updates.json` contains intentional additions for existing browsers, applied once with the same import markers as the full weight history. New browsers receive these entries in `seed.json`. The 9 November 2026 screenshots add a 79.7 kg weigh-in at 17:30 and an approximate 10 km run in 1:03:00 (6:18/km). Apple Health displays rounded distance and workout duration, so the run is marked estimated; the supplied duration is used as a provisional moving-time value pending an exact export. Existing run entries on that date, and weigh-ins with a matching time or no recorded time, take precedence to avoid duplicates and preserve user edits. Updates are not re-applied after deletion or replacement through the interface.

Two highlighted distance cards at the top of the weekly briefing show the additional kilometres needed to beat last year's full equivalent week and the highest-distance equivalent week across all prior recorded years. They use the same strict-exceed calculation as the narrative. After a target is passed, each card switches to the distance ahead; absent benchmarks display a dash. The historical record is explicitly for the current ISO week number, not the largest unrelated week of the year.

The 10 November 2026 workout screenshot adds an approximate 7.3 km run in 47 minutes (6:26/km), using the rounded workout duration provisionally as moving time. It is marked estimated and delivered once to existing browsers via its own update batch. Together with 9 November, the recorded week totals 17.3 km in 1:50:00, with a distance-weighted pace of 6:22/km.

On 12 November, the supplied activity rows replace the 10 November estimate with 7.40 km in 46:43 and add a 10.01 km run in 1:00:30 for 12 November. Pace is derived from duration / distance and rounded to the nearest second, yielding 6:19/km and 6:03/km respectively; the pasted source pace appears truncated. Existing browsers receive a one-time correction only if the original 7.3 km / 47-minute estimated record is unchanged. Custom edits and deleted records are preserved, and no second 10 November run is created. The 9 November run remains approximate.
