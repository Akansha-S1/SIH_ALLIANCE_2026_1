import { statusColor, statusBg } from "../utils/status";

export default function StatusPill({ status, small }: { status: string; small?: boolean }) {
  const color = statusColor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide mono ${small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
      style={{ color, background: statusBg(status), border: `1px solid ${color}55` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}
