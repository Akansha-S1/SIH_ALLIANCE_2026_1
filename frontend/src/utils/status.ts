export function statusColor(status: string | undefined): string {
  switch ((status || "").toUpperCase()) {
    case "NORMAL":
    case "SAFE":
    case "OPEN":
    case "LOW":
      return "#22c55e";
    case "MONITOR":
    case "AT_RISK":
    case "MODERATE":
      return "#eab308";
    case "WARNING":
      return "#f59e0b";
    case "HIGH":
    case "HIGH RISK":
      return "#f97316";
    case "CRITICAL":
    case "CLOSED":
      return "#ef4444";
    default:
      return "#7286a3";
  }
}

export function statusBg(status: string | undefined): string {
  const c = statusColor(status);
  return c + "22";
}

export function severityColor(sev: string | undefined): string {
  switch ((sev || "").toUpperCase()) {
    case "CRITICAL":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "WARNING":
    case "MEDIUM":
      return "#eab308";
    default:
      return "#22d3ee";
  }
}

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
