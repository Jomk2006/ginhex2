import { cn } from "@/lib/utils";

/** Circular progress with animated stroke; the numeral sits in the centre (LTR digits). */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--genhex-cyan)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="gx-ring-fg"
          style={{ "--gx-circ": c } as React.CSSProperties}
        />
      </svg>
      <span role="img" aria-label={`${Math.round(v)}%`} dir="ltr" className="absolute text-xs font-semibold tabular-nums">
        {Math.round(v)}%
      </span>
    </div>
  );
}
