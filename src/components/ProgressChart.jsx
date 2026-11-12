import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calendarLabel, formatPace, TARGET_KG } from "../lib/progress.mjs";
import { yearColor } from "../lib/series.mjs";
function ChartTooltip({ active, payload, label, mode, calendar }) {
  if (!active || !payload?.length) return null;
  const actual = payload.filter((p) => p.value != null);
  if (!actual.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{mode === "weight" || calendar ? calendarLabel(label) : label}</strong>
      {actual.map((p) => {
        const year = p.dataKey.match(/\d{4}/)?.[0];
        const date = p.payload[`date${year}`];
        return (
          <div key={p.dataKey}>
            <span style={{ color: p.color }}>{p.name}</span>
            <b>
              {mode === "pace"
                ? `${formatPace(p.value)} /km`
                : `${Number(p.value).toFixed(2)} ${
                    mode === "weight" ? "kg" : "km"
                  }`}
            </b>
            {date && <small>{date}</small>}
          </div>
        );
      })}
    </div>
  );
}
export default function ProgressChart({
  data,
  years,
  mode,
  empty,
  annual = false,
  calendar = false,
  cumulative = false,
  selectedWeek,
  primaryYear = years[0],
  comparisonYear = years[1],
}) {
  const weight = mode === "weight",
    pace = mode === "pace";
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label={
        cumulative
          ? "Cumulative recorded running distance by calendar year, aligned by month and day."
          : weight
          ? "Actual weight observations by month and day. Individual observations are available in Manage data."
          : `${
              annual
                ? "Full-year weekly targets and recorded results"
                : pace
                ? "Daily and cumulative average pace"
                : "Cumulative distance"
            } ${
              annual ? "by ISO week" : "by weekday"
            }. Individual activities are available in Manage data.`
      }
    >
      {empty ? (
        <div className="empty-chart">
          <span>
            {years.length
              ? "NO RECORDS FOR THIS SELECTION"
              : "NO YEARS SELECTED"}
          </span>
          <h3>
            {years.length ? "A fresh starting line." : "Choose a year to plot."}
          </h3>
          <p>
            {years.length
              ? "Select another week or add your data below."
              : "Turn on a year using the switches above."}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 18, right: 16, bottom: 5, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="#ffffff0d" vertical={false} />
            <XAxis
              dataKey="day"
              type={weight || calendar ? "number" : "category"}
              domain={
                calendar ? [1, 366] : weight ? [(min) => Math.max(1, min - 2), 366.999] : undefined
              }
              tickFormatter={weight || calendar ? calendarLabel : undefined}
              ticks={calendar ? [1, 32, 61, 92, 122, 153, 183, 214, 245, 275, 306, 336, 366] : undefined}
              tick={{ fill: "#a7a7ad", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              interval={weight || annual ? "preserveStartEnd" : 0}
              dy={10}
            />
            <YAxis
              width={58}
              tick={{ fill: "#a7a7ad", fontSize: 12 }}
              tickFormatter={pace ? formatPace : undefined}
              reversed={pace}
              domain={
                weight
                  ? [
                      (min) => Math.floor(Math.min(min, TARGET_KG) - 1),
                      (max) => Math.ceil(max + 1),
                    ]
                  : pace
                  ? ["auto", "auto"]
                  : [0, "auto"]
              }
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip mode={mode} calendar={calendar} />}
              cursor={{ stroke: "#ffffff30", strokeDasharray: "4 4" }}
              filterNull
            />
            {annual && selectedWeek && (
              <ReferenceLine
                x={`W${selectedWeek}`}
                stroke="#ffffff40"
                strokeDasharray="4 4"
              />
            )}
            {weight && (
              <ReferenceLine
                y={TARGET_KG}
                stroke="#c4c4ca"
                strokeDasharray="5 5"
                label={{
                  value: "TARGET · 74 KG",
                  fill: "#c4c4ca",
                  position: "insideTopRight",
                  fontSize: 10,
                }}
              />
            )}
            {years.map((year, i) =>
              pace && !annual ? (
                <Line
                  key={`${year}-daily`}
                  type="linear"
                  dataKey={`daily${year}`}
                  name={`${year} daily`}
                  stroke={yearColor(year, primaryYear, comparisonYear)}
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ) : null
            )}
            {years.map((year, i) => (
              <Line
                key={year}
                type={cumulative ? "stepAfter" : "linear"}
                dataKey={`y${year}`}
                name={`${year}${pace ? " weekly average" : ""}`}
                stroke={yearColor(year, primaryYear, comparisonYear)}
                strokeWidth={3}
                dot={cumulative ? false : {
                  r: weight ? 4 : 3,
                  fill: yearColor(year, primaryYear, comparisonYear),
                  stroke: "#262626",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 7, strokeWidth: 3 }}
                connectNulls={weight || cumulative}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
