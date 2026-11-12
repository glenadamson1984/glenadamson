import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import seed from "../src/data/seed.json";
import history from "../src/data/weight-history.json";
import Sobriety from "../src/components/Sobriety";
import { DEFAULT_SOBRIETY, sobrietyProgress } from "../src/lib/sobriety.mjs";
import DataManager from "../src/components/DataManager";
import YearSelector from "../src/components/YearSelector";
import YearOutlook from "../src/components/YearOutlook";
import YearTotals from "../src/components/YearTotals";
import Trending from "../src/components/Trending";
import updates from "../src/data/updates.json";
import { applyHistory, applyUpdates } from "../src/lib/history.mjs";
import { loadData, saveData } from "../src/lib/storage.mjs";
import {
  DAYS,
  formatPace,
  isoWeek,
  STORAGE_KEY,
  weightSeries,
} from "../src/lib/progress.mjs";
import { localDateKey, weeklySummary } from "../src/lib/weekly-summary.mjs";
import { buildWeeklyBriefing } from "../src/lib/briefing.mjs";
import { yearColor } from "../src/lib/series.mjs";
const ProgressChart = dynamic(() => import("../src/components/ProgressChart"), {
  ssr: false,
});
const TABS = ["Distance", "Pace", "Weight", "Sobriety", "Trending"];
const km = (value) => (value == null ? "—" : value.toFixed(2));
const shortDate = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
function Metric({ label, value, unit, detail, accent }) {
  return (
    <div className={`metric ${accent ? "accent" : ""}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
}
export default function Home() {
  const [data, setData] = useState(null),
    [now, setNow] = useState(null);
  const [tab, setTab] = useState("Distance"),
    [visibleYears, setVisibleYears] = useState(null);
  const [showManager, setShowManager] = useState(false),
    [blocked, setBlocked] = useState(false),
    [storageError, setStorageError] = useState("");
  // Hydrate from browser storage after SSR, then subscribe to external changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 30000);
    try {
      const saved = loadData(window.localStorage, seed),
        loaded = applyUpdates(applyHistory(saved, history), updates);
      if (loaded !== saved) saveData(window.localStorage, loaded);
      setData(loaded);
    } catch {
      setData({ version: 1, runs: [], weights: [] });
      setBlocked(true);
      setShowManager(true);
      setStorageError(
        "Your saved data could not be read and has not been overwritten. Enable browser storage or recover a JSON/CSV backup."
      );
    }
    const changed = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setBlocked(true);
        setStorageError("Data changed in another tab. Reload before editing.");
      }
    };
    window.addEventListener("storage", changed);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", changed);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  function save(next, recovery = false) {
    if (blocked && !recovery)
      throw new Error("Resolve the browser storage warning before editing.");
    const clean = saveData(window.localStorage, {
      ...next,
      imports: [
        ...new Set([
          ...(data?.imports || []),
          ...(next.imports || []),
          history.id,
          ...updates.map(update => update.id),
        ]),
      ],
    });
    setData(clean);
    setStorageError("");
    if (recovery) setBlocked(false);
  }
  function openManager() {
    setShowManager(true);
    setTimeout(
      () =>
        document
          .getElementById("data-manager")
          ?.scrollIntoView({ behavior: "smooth" }),
      30
    );
  }
  const today = now ? localDateKey(now) : null;
  const summary = data && today ? weeklySummary(data, today) : null;
  const soberConfig = data?.sobriety || DEFAULT_SOBRIETY;
  const soberProgress = now ? sobrietyProgress(soberConfig, now) : null;
  const briefing = summary ? buildWeeklyBriefing(summary) : null;
  const year = summary?.year,
    comparison = summary?.comparison,
    week = summary?.week;
  const recordedYears = [
    ...new Set(
      (tab === "Weight" ? data?.weights || [] : data?.runs || []).flatMap((r) =>
        tab === "Weight" ? [Number(r.date.slice(0, 4))] : [isoWeek(r.date).year, Number(r.date.slice(0, 4))]
      )
    ),
  ];
  const availableYears = summary
    ? [
        year,
        comparison,
        ...recordedYears
          .filter((y) => y !== year && y !== comparison)
          .sort((a, b) => b - a),
      ]
    : [];
  const chartYears = availableYears.filter(
    (y) => visibleYears === null || visibleYears.includes(y)
  );
  const weightData = weightSeries(data?.weights || [], chartYears);
  const weeklyData = summary
    ? DAYS.map((day, i) => ({
        day,
        [`y${year}`]:
          tab === "Pace"
            ? summary.current.points[i].cumulativePace
            : summary.current.points[i].distance,
        [`y${comparison}`]:
          tab === "Pace"
            ? summary.previous.points[i].cumulativePace
            : summary.previous.points[i].distance,
        [`daily${year}`]: summary.current.points[i].dailyPace,
        [`daily${comparison}`]: summary.previous.points[i].dailyPace,
        [`date${year}`]: summary.current.points[i].date,
        [`date${comparison}`]: summary.previous.points[i].date,
      }))
    : [];
  // Hide the rest of the current week: future days are not completed observations.
  if (summary)
    weeklyData.forEach((point, i) => {
      if (summary.current.dates[i] > today) {
        point[`y${year}`] = null;
        point[`daily${year}`] = null;
      }
    });
  const timeZone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  return (
    <>
      <Head>
        <title>Running Progress · Glen Adamson</title>
        <meta
          name="description"
          content="Your weekly running targets, progress and weight at a glance."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#232323" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <a className="skip-link" href="#main">
        Skip to dashboard
      </a>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M3 17h7l4-10 5 19 4-9h6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            RUNNING<span className="brand-light"> / PROGRESS</span>
          </span>
        </Link>
        <div className="header-right">
          <span className="personal-label">GLEN ADAMSON · PERSONAL LOG</span>
          <button onClick={openManager}>Manage data →</button>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <span className="eyebrow">
              <span className="status-dot" />
              THE LONG GAME
            </span>
            <h1>
              Running <span>Progress</span>
              <span className="title-dot">.</span>
            </h1>
            <p>Your week. Your benchmark. Your next step.</p>
          </div>
          <button className="primary add-button" onClick={openManager}>
            ＋ Add an entry
          </button>
        </section>
        {storageError && (
          <div role="alert" className="storage-warning">
            {storageError}
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        )}
        {!summary ? (
          <div className="panel loading" role="status">
            Loading this week’s progress…
          </div>
        ) : (
          <>
            <section
              className="panel weekly-brief"
              aria-labelledby="brief-title"
            >
              <span className="eyebrow">YOUR WEEK AT A GLANCE</span>
              <div className="brief-date">
                <time dateTime={now.toISOString()}>
                  {now.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  ·{" "}
                  {now.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </time>
                <span>
                  {timeZone} · ISO week {week}
                </span>
              </div>
              <h2 id="brief-title">
                It’s {now.toLocaleDateString("en-GB", { weekday: "long" })} of
                week {week}. Here’s your aim.
              </h2>
              <div className="goal-grid" aria-label="Weekly distance targets">
                <Metric accent label={briefing.targetExtra === 0 ? "AHEAD OF LAST YEAR" : "TO BEAT LAST YEAR"} value={briefing.targetExtra == null ? "—" : briefing.targetExtra === 0 ? `+${km(summary.aheadKm)}` : km(briefing.targetExtra)} unit="km" detail={summary.previous.hasData ? `${comparison} week ${week}: ${km(summary.previous.distance)} km${briefing.targetExtra === 0 ? " · beaten" : ""}` : "No recorded benchmark for last year"}/>
                <Metric label={briefing.recordExtra === 0 ? `NEW WEEK ${week} RECORD` : `TO BEAT WEEK ${week} RECORD`} value={briefing.recordExtra == null ? "—" : briefing.recordExtra === 0 ? `+${km(summary.bestAheadKm)}` : km(briefing.recordExtra)} unit="km" detail={summary.bestWeek ? `${summary.bestWeek.year} best: ${km(summary.bestWeek.distance)} km${briefing.recordExtra === 0 ? " · beaten" : " · all prior years"}` : "No earlier recorded benchmark for this week"}/>
              </div>
              <p className="brief-weight">
                <span className="weight-brief-label">WEIGHT</span>
                {summary.currentWeight ? <>
                  Your {summary.weightThisWeek ? "latest weigh-in this week" : "latest recorded weigh-in"} is <strong>{summary.currentWeight.weightKg} kg</strong> ({shortDate(summary.currentWeight.date)} {summary.currentWeight.date.slice(0,4)}).
                </> : "No current weigh-in is recorded."}{" "}
                {summary.previousWeight ? <>
                  In the equivalent week last year, your last weigh-in was <strong>{summary.previousWeight.weightKg} kg</strong> ({shortDate(summary.previousWeight.date)} {comparison}).
                  {summary.currentWeight && <> {summary.currentWeight.weightKg === summary.previousWeight.weightKg ? "That matches last year’s reading." : <>That’s <strong>{Math.abs(summary.currentWeight.weightKg-summary.previousWeight.weightKg).toFixed(1)} kg {summary.currentWeight.weightKg < summary.previousWeight.weightKg ? "lower" : "higher"}</strong> than that reading.</>}</>}
                </> : "No weigh-in was recorded in the equivalent week last year."}{" "}
                Your target is <strong>74 kg</strong>.
              </p>
              <p className="brief-target">{briefing.target}</p>
              <div className="brief-action">{briefing.challenge}</div>
              {briefing.pace && <p className="brief-pace">{briefing.pace}</p>}
              <p className="brief-progress">
                So far this week:{" "}
                <strong>{km(summary.current.distance)} km</strong>
                {summary.current.pace != null ? (
                  <>
                    {" "}
                    at <strong>{formatPace(summary.current.pace)}/km</strong>
                  </>
                ) : (
                  " · no measured runs logged yet"
                )}
                .
                {summary.priorToDay != null ? (
                  <>
                    {" "}
                    By the end of the equivalent{" "}
                    {now.toLocaleDateString("en-GB", { weekday: "long" })} last
                    year, you had recorded{" "}
                    <strong>{km(summary.priorToDay)} km</strong>.
                  </>
                ) : (
                  ""
                )}
              </p>

            </section>
            {soberProgress && (
              <button
                className="sober-summary"
                onClick={() => {
                  setTab("Sobriety");
                  document
                    .getElementById("progress-panel")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="status-dot" />
                <strong>
                  {soberProgress.wholeDays.toLocaleString("en-GB")} days sober
                </strong>
                <span>
                  Since{" "}
                  {new Date(soberConfig.startedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · Keep moving forward →
                </span>
              </button>
            )}
            <div className="metrics-grid">
              <Metric
                accent
                label={`THIS WEEK · ${year} / W${week}`}
                value={km(summary.current.distance)}
                unit="km"
                detail={
                  summary.previous.hasData
                    ? `Last year’s full week: ${km(
                        summary.previous.distance
                      )} km`
                    : "No equivalent-week distance recorded last year"
                }
              />
              <Metric
                label="THIS WEEK’S AVERAGE PACE"
                value={formatPace(summary.current.pace)}
                unit="/km"
                detail={
                  summary.previous.pace != null
                    ? `Last year’s week: ${formatPace(
                        summary.previous.pace
                      )}/km · lower is faster`
                    : "No equivalent-week pace recorded last year"
                }
              />
              <Metric
                label={
                  summary.weightThisWeek
                    ? "WEIGHT · THIS WEEK"
                    : "LATEST RECORDED WEIGHT"
                }
                value={
                  summary.currentWeight
                    ? summary.currentWeight.weightKg.toFixed(1)
                    : "—"
                }
                unit="kg"
                detail={
                  summary.previousWeight
                    ? `Last year’s week: ${summary.previousWeight.weightKg} kg · target 74 kg`
                    : "No weigh-in in last year’s equivalent week · target 74 kg"
                }
              />
            </div>
            <div className="dashboard-controls">
              <div className="tabs" role="tablist" aria-label="Progress metric">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    role="tab"
                    id={`tab-${t.toLowerCase()}`}
                    aria-selected={tab === t}
                    aria-controls="progress-panel"
                    tabIndex={tab === t ? 0 : -1}
                    onClick={() => setTab(t)}
                    onKeyDown={(e) => {
                      const keys = {
                        ArrowRight: (i + 1) % TABS.length,
                        ArrowLeft: (i + TABS.length - 1) % TABS.length,
                        Home: 0,
                        End: TABS.length - 1,
                      };
                      if (keys[e.key] !== undefined) {
                        e.preventDefault();
                        const next = TABS[keys[e.key]];
                        setTab(next);
                        document
                          .getElementById(`tab-${next.toLowerCase()}`)
                          ?.focus();
                      }
                    }}
                  >
                    <span className="tab-number">0{i + 1}</span>
                    {t}
                  </button>
                ))}
              </div>
              <span className="muted">
                {tab === "Trending" ? "Completed weeks · EMA outlook" : <>Always comparing week {week}: {year} vs {comparison}</>}
              </span>
            </div>
            <section
              id="progress-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab.toLowerCase()}`}
            >
              {tab === "Sobriety" ? (
                <Sobriety
                  config={soberConfig}
                  blocked={blocked}
                  onSave={(config) => save({ ...data, sobriety: config })}
                />
              ) : tab === "Trending" ? (
                <Trending runs={data.runs} today={today} />
              ) : (
                <>
                  <YearSelector
                    years={availableYears}
                    selected={chartYears}
                    year={year}
                    comparison={comparison}
                    onChange={setVisibleYears}
                  />
                  {tab !== "Weight" && (
                    <YearOutlook
                      runs={data.runs}
                      year={year}
                      comparison={comparison}
                      week={week}
                      mode={tab.toLowerCase()}
                      chartYears={chartYears}
                    />
                  )}
                  <section className="panel chart-panel" id="weekly-chart">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          {tab === "Weight"
                            ? "BODY & BALANCE"
                            : `THIS WEEK · ${year} VS ${comparison}`}
                        </span>
                        <h2>
                          {tab === "Distance"
                            ? "This week, side by side."
                            : tab === "Pace"
                            ? "This week’s running rhythm."
                            : "See the bigger picture."}
                        </h2>
                        <p>
                          {tab === "Weight"
                            ? "All actual weigh-ins · aligned by month and day"
                            : tab === "Distance"
                            ? "Cumulative distance · Monday to Sunday"
                            : "Daily pace & cumulative weekly average · min:sec /km"}
                        </p>
                      </div>
                      {tab !== "Weight" && (
                        <span className="pill">
                          Week {week} · {shortDate(summary.current.dates[0])}–
                          {shortDate(summary.current.dates[6])}
                        </span>
                      )}
                    </div>
                    <div className="chart-legend">
                      {(tab === "Weight" ? chartYears : [year, comparison]).map(
                        (y) => (
                          <span key={y}>
                            <i
                              className="legend-dot"
                              style={{
                                background: yearColor(y, year, comparison),
                              }}
                            />
                            {y}
                          </span>
                        )
                      )}
                      {tab === "Pace" && (
                        <span className="legend-note">
                          Solid: weekly average · Dotted: daily pace
                        </span>
                      )}
                      {tab === "Weight" && (
                        <span className="legend-note">
                          Dashed: 74 kg target
                        </span>
                      )}
                    </div>
                    <ProgressChart
                      mode={tab.toLowerCase()}
                      years={tab === "Weight" ? chartYears : [year, comparison]}
                      primaryYear={year}
                      comparisonYear={comparison}
                      data={tab === "Weight" ? weightData : weeklyData}
                      empty={
                        tab === "Weight"
                          ? !weightData.length
                          : !summary.current.hasData &&
                            !summary.previous.hasData
                      }
                    />
                    <div className="chart-footnote">
                      <span className="status-dot" />
                      <p>
                        {tab === "Weight"
                          ? "Dots are actual measurements; connecting lines are visual guides. No missing readings are filled in."
                          : tab === "Pace"
                          ? "Pace uses total moving time ÷ total distance. Lower is faster; days without runs have no daily pace."
                          : "The same ISO week, aligned Monday to Sunday. This year stops at today; last year’s full week remains visible as your target."}
                      </p>
                    </div>
                  </section>
                  {tab === "Distance" && (
                    <YearTotals
                      runs={data.runs}
                      years={chartYears}
                      year={year}
                      comparison={comparison}
                      today={today}
                    />
                  )}
                </>
              )}
            </section>
            {showManager && (
              <DataManager
                data={data}
                onSave={(next) => save(next)}
                blocked={blocked}
                onRecover={(next) => save(next, true)}
              />
            )}
            <div className="journal-banner">
              <div>
                <span className="eyebrow">KEEP SHOWING UP</span>
                <p>Progress is built in the everyday.</p>
              </div>
              <button onClick={openManager}>Update your log →</button>
            </div>
          </>
        )}
        <footer>
          <span>RUNNING / PROGRESS</span>
          <p>Personal edits stay in this browser. Back them up regularly.</p>
          <span>THE NEXT RUN IS WHAT COUNTS.</span>
        </footer>
      </main>
    </>
  );
}
