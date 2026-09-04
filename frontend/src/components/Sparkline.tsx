export default function Sparkline({ data, color = "#22d3ee", width = 96, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / span) * height}`).join(" ");
  const last = data[data.length - 1];
  const lastY = height - ((last - min) / span) * height;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      <circle cx={width} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
