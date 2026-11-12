import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { weeklyTrends } from "../lib/trends.mjs";
import { formatPace } from "../lib/progress.mjs";
const TrendChart = dynamic(() => import("./TrendChart"), { ssr: false });

export default function Trending({ runs, today }) {
  const [span, setSpan] = useState(4);
  const trends = useMemo(() => weeklyTrends(runs, today, span), [runs, today, span]);
  return <>
    <section className="panel">
      <div className="section-heading">
        <div><span className="eyebrow">THE DIRECTION OF TRAVEL</span><h2>Your recent running trend.</h2>
          <p>26 completed weeks · distance and pace · a four-week EMA baseline</p></div>
        <label className="trend-smoothing">Smoothing
          <select value={span} onChange={(event) => setSpan(Number(event.target.value))}>
            <option value={4}>4 weeks · responsive</option><option value={8}>8 weeks · balanced</option><option value={12}>12 weeks · smoother</option>
          </select>
        </label>
      </div>
      <p className="muted">An exponential moving average gives more weight to recent recorded weeks.
        The dashed outlook holds the latest EMA steady; it does not predict improvement or prescribe training.
        It cannot account for terrain, recovery or weather. This week’s unfinished total is excluded.
        Unrecorded weeks are gaps, not assumed zero-distance weeks.</p>
      <p className="muted">Latest recorded completed week: {trends.lastRecorded || "none"}.
        {" "}Based on {trends.distanceCount} recorded weeks; estimated activities are included.
        {" "}The baseline needs at least two recorded weeks and may be stale after a break.</p>
    </section>
    {["distance", "pace"].map((mode) => {
      const pace = mode === "pace", value = pace ? trends.paceEMA : trends.distanceEMA;
      return <section className="panel chart-panel" key={mode} aria-labelledby={`trend-${mode}-title`}>
        <div className="section-heading"><div>
          <span className="eyebrow">{pace ? "FINDING YOUR RHYTHM" : "BUILDING CONSISTENCY"}</span>
          <h2 id={`trend-${mode}-title`}>{pace ? "Pace, smoothed out." : "Distance, week by week."}</h2>
          <p>{pace ? "Weekly pace uses total moving time ÷ distance · lower is faster" : "Weekly recorded distance · kilometres"}</p>
        </div><span className="pill">EMA · {value == null ? "—" : pace ? `${formatPace(value)} /km` : `${value.toFixed(2)} km/week`}</span></div>
        <div className="chart-legend"><span>Grey: recorded</span><span>Pink: {span}-week EMA</span><span>Green dashed: estimated baseline</span></div>
        <TrendChart points={trends.points} mode={mode} />
      </section>;
    })}
  </>;
}
