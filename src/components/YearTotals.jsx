import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cumulativeYearSeries } from "../lib/year-totals.mjs";
import { yearColor } from "../lib/series.mjs";

const ProgressChart = dynamic(() => import("./ProgressChart"), { ssr: false });

export default function YearTotals({ runs, years, year, comparison, today }) {
  const points = useMemo(
    () => cumulativeYearSeries(runs, years, today),
    [runs, years, today]
  );
  return (
    <section className="panel chart-panel" aria-labelledby="year-totals-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EVERY KILOMETRE COUNTS</span>
          <h2 id="year-totals-title">Watch the years add up.</h2>
          <p>Cumulative recorded distance · January to December · kilometres</p>
        </div>
        <span className="pill">Jan 1 → Dec 31</span>
      </div>
      <div className="chart-legend">
        {years.map((y) => {
          const last = points.findLast((point) => point[`y${y}`] != null);
          return (
            <span key={y}>
              <i className="legend-dot" style={{ background: yearColor(y, year, comparison) }} />
              {y} · {last ? `${last[`y${y}`].toFixed(2)} km` : "no records"}
            </span>
          );
        })}
      </div>
      <ProgressChart
        data={points}
        years={years}
        primaryYear={year}
        comparisonYear={comparison}
        mode="distance"
        calendar
        cumulative
        annual
        empty={!points.some((point) => years.some((y) => point[`y${y}`] != null))}
      />
      <div className="chart-footnote">
        <span className="status-dot" />
        <p>
          Calendar years align by month and day. Each run adds to the total;
          days without a logged run stay flat. This year stops at today,
          while earlier years show their full recorded totals. Future entries
          are excluded. Use the year switches above to compare lines.
        </p>
      </div>
    </section>
  );
}
