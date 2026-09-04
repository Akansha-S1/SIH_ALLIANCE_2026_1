import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function HistoryChart({ title, data, unit, color = "#22d3ee" }: { title: string; data: { t: number; v: number }[]; unit?: string; color?: string }) {
  return (
    <div className="rounded-sm border border-panelborder bg-panel2 p-3">
      <div className="text-[11px] font-bold tracking-wide text-muted mb-2 uppercase">{title}{unit ? ` (${unit})` : ""}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2b42" />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#7286a3" }} tickFormatter={(v) => `${v}m`} />
          <YAxis tick={{ fontSize: 10, fill: "#7286a3" }} width={44} />
          <Tooltip
            contentStyle={{ background: "#0b1220", border: "1px solid #1c2b42", fontSize: 11 }}
            labelFormatter={(v) => `T+${v} min`}
          />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
