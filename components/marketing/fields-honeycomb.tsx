import { Code2, Palette, BarChart3, Languages, Briefcase, FlaskConical, GraduationCap } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Static SVG honeycomb (no JavaScript, no WebGL). It is both the interactive
 * "fields" picture and the fallback for no-WebGL / low-power /
 * prefers-reduced-motion. `HexCluster` is the decorative variant used as the
 * 3D scenes' fallback.
 */
const R = 62;
const W = Math.sqrt(3) * R;
const cell = (q: number, r: number) => ({ x: W * (q + r / 2), y: 1.5 * R * r });

export const FIELD_ICONS = [Code2, Palette, BarChart3, Languages, Briefcase, FlaskConical];
const FIELD_CELLS: Array<[number, number]> = [
  [1, -1],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
];

function hexPoints(cx: number, cy: number, radius: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + radius * Math.cos(a)).toFixed(1)},${(cy + radius * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export function FieldsHoneycomb({
  items,
  label,
  decorative = false,
}: {
  items: string[];
  label?: string;
  /** Hide from assistive tech and drop links (the cards beside it carry the links). */
  decorative?: boolean;
}) {
  const half = W * 1.5 + R + 14;
  const gap = 5;
  return (
    <svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      className="h-auto w-full max-w-[30rem]"
      {...(decorative ? { "aria-hidden": true } : { role: "group", "aria-label": label })}
    >
      {FIELD_CELLS.map(([q, r], i) => {
        const { x, y } = cell(q, r);
        const Icon = FIELD_ICONS[i];
        const name = items[i] ?? "";
        const inner = (
          <g className="hex-link">
            <polygon points={hexPoints(x, y, R - gap)} className="hex-shape" />
            <Icon x={x - 11} y={y - 26} width={22} height={22} className="hex-ink" strokeWidth={1.75} aria-hidden="true" />
            <text x={x} y={y + 24} textAnchor="middle" className="hex-label hex-ink">
              {name}
            </text>
          </g>
        );
        return (
          <g key={i} className="hex-cell" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
            {decorative ? inner : <Link href="/courses" aria-label={name}>{inner}</Link>}
          </g>
        );
      })}
      <g className="hex-cell" style={{ animationDelay: "0.1s" }}>
        <polygon points={hexPoints(0, 0, R - gap)} fill="#00B6BF" />
        <GraduationCap x={-16} y={-16} width={32} height={32} stroke="#313A43" strokeWidth={1.75} fill="none" aria-hidden="true" />
      </g>
    </svg>
  );
}

/** Decorative 19-cell cluster: the static stand-in for the 3D hero scene. */
export function HexCluster({ className = "" }: { className?: string }) {
  const rr = 40;
  const w = Math.sqrt(3) * rr;
  const cells: Array<{ x: number; y: number; tone: number }> = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
      const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
      cells.push({ x: w * (q + r / 2), y: 1.5 * rr * r, tone: d === 0 ? 3 : d === 1 ? (q + r) % 2 === 0 ? 2 : 1 : 0 });
    }
  }
  const fills = ["#313A43", "#343D46", "#374049", "#00B6BF"];
  const half = w * 2.6;
  return (
    <svg viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`} className={className} aria-hidden="true">
      {cells.map((c, i) => (
        <polygon
          key={i}
          points={hexPoints(c.x, c.y, rr - 3)}
          fill={fills[c.tone]}
          stroke="rgba(0,182,191,0.45)"
          strokeWidth={1.2}
          className="hex-cell"
          style={{ animationDelay: `${0.05 * i}s`, opacity: c.tone === 3 ? 0.95 : 0.9 }}
        />
      ))}
    </svg>
  );
}
