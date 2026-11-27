import { cn } from "@/lib/utils";

/**
 * Decorative honeycomb cluster (seven hexes) in the brand palette. Pure SVG +
 * CSS: cells scale in with a stagger, the centre cell traces its outline and
 * breathes. `tone="dark"` is for the slate panels (white strokes); `tone="auto"`
 * follows the theme. Always aria-hidden.
 */
const CELLS: Array<{ x: number; y: number; hot?: boolean }> = [
  { x: 100, y: 100, hot: true },
  { x: 100, y: 30 },
  { x: 160.6, y: 65 },
  { x: 160.6, y: 135 },
  { x: 100, y: 170 },
  { x: 39.4, y: 135 },
  { x: 39.4, y: 65 },
];

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export function HexMotif({ className, tone = "auto" }: { className?: string; tone?: "auto" | "dark" }) {
  const stroke = tone === "dark" ? "rgb(255 255 255 / 0.28)" : "color-mix(in srgb, var(--foreground) 24%, transparent)";
  const fill = tone === "dark" ? "rgb(255 255 255 / 0.04)" : "color-mix(in srgb, var(--foreground) 4%, transparent)";
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={cn("overflow-visible", className)}>
      {CELLS.map((c, i) => (
        <g key={i} className="gx-hex-in" style={{ "--i": i } as React.CSSProperties}>
          <polygon
            points={hexPoints(c.x, c.y, 31)}
            fill={c.hot ? "rgb(0 182 191 / 0.18)" : fill}
            stroke={c.hot ? "#00b6bf" : stroke}
            strokeWidth={c.hot ? 2 : 1.25}
            strokeLinejoin="round"
            className={c.hot ? "gx-hex-trace gx-breathe" : undefined}
            pathLength={c.hot ? 1 : undefined}
          />
        </g>
      ))}
      <circle cx="100" cy="100" r="5" fill="#00b6bf" className="gx-breathe" />
    </svg>
  );
}
