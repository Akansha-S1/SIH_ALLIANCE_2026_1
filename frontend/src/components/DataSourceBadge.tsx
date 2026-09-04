const COLOR: Record<string, string> = {
  LIVE: "#22c55e",
  CACHED: "#eab308",
  SIMULATED: "#7286a3",
};

export default function DataSourceBadge({ source, small }: { source: string; small?: boolean }) {
  const color = COLOR[source] || COLOR.SIMULATED;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold tracking-widest mono ${small ? "text-[8px]" : "text-[9px]"}`}
      style={{ color }}
      title={source === "SIMULATED" ? "Simulated demo data — not a real feed" : `${source} data from the configured real-data source`}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {source}
    </span>
  );
}
