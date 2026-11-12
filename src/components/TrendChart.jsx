import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPace } from "../lib/progress.mjs";
const labelDate = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function TrendTooltip({ active, payload, label, pace }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>Week of {label}</strong>
    {payload.filter((point) => point.value != null).map((point) => <div key={point.dataKey}>
      <span style={{ color: point.color }}>{point.name}</span><b>{pace ? `${formatPace(point.value)} /km` : `${point.value.toFixed(2)} km`}</b>
    </div>)}{payload[0]?.payload.estimated && <small>Includes estimated activity</small>}
  </div>;
}
export default function TrendChart({ points, mode }) {
  const pace = mode === "pace", forecastStart = points.find((point) => point.forecast)?.monday;
  if (!points.some((point) => point[mode] != null || point[`${mode}Forecast`] != null)) {
    return <div className="empty-chart"><h3>No recent recorded weeks.</h3><p>Add running records to see this trend.</p></div>;
  }
  return <div className="chart-wrap" role="img" aria-label={`Weekly ${mode}, exponential moving average, and four-week estimated baseline`}>
    <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 18, right: 16, bottom: 5, left: 0 }} accessibilityLayer>
      <CartesianGrid stroke="#ffffff0d" vertical={false} />
      <XAxis dataKey="monday" tickFormatter={labelDate} tick={{ fill: "#a7a7ad", fontSize: 12 }} minTickGap={30} tickLine={false} axisLine={false} />
      <YAxis width={58} tickFormatter={pace ? formatPace : undefined} reversed={pace} domain={pace ? ["auto", "auto"] : [0, "auto"]} tick={{ fill: "#a7a7ad", fontSize: 12 }} tickLine={false} axisLine={false} />
      <Tooltip content={<TrendTooltip pace={pace} />} />
      <ReferenceLine x={forecastStart} stroke="#ffffff40" strokeDasharray="4 4" label={{ value: "OUTLOOK", fill: "#aaaab0", position: "insideTopRight", fontSize: 10 }} />
      <Line dataKey={mode} name="Recorded" stroke="#aaaab0" strokeWidth={1.5} dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
      <Line dataKey={`${mode}EMA`} name="EMA" stroke="#ff408b" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
      <Line dataKey={`${mode}Forecast`} name="Estimated baseline" stroke="#7bcda4" strokeWidth={2.5} strokeDasharray="6 5" dot={false} connectNulls={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div>;
}
