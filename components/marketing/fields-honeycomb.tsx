import { Code2, Palette, BarChart3, Languages, Briefcase, FlaskConical } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * "Find your field" honeycomb — the hero's visual. Six hexagons are the
 * fields GENHEX teaches; the centre hex is the student's question. It is
 * static (no rotation): each cell fades in once, and hover/focus lights it
 * up. Pure SVG + CSS, so it costs no JavaScript and works without WebGL.
 */
const R = 62; // hex radius
const W = Math.sqrt(3) * R;

// axial (q, r) → pixel, pointy-top hexagons
const cell = (q: number, r: number) => ({ x: W * (q + r / 2), y: 1.5 * R * r });

const FIELDS = [
  { q: 1, r: -1, Icon: Code2, en: "Programming", ar: "البرمجة" },
  { q: 1, r: 0, Icon: Palette, en: "Design", ar: "التصميم" },
  { q: 0, r: 1, Icon: BarChart3, en: "Data", ar: "البيانات" },
  { q: -1, r: 1, Icon: Languages, en: "Languages", ar: "اللغات" },
  { q: -1, r: 0, Icon: Briefcase, en: "Business", ar: "الأعمال" },
  { q: 0, r: -1, Icon: FlaskConical, en: "Science", ar: "العلوم" },
];

function hexPoints(cx: number, cy: number, radius: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + radius * Math.cos(a)).toFixed(1)},${(cy + radius * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export function FieldsHoneycomb({ isAr }: { isAr: boolean }) {
  const pad = 14;
  const half = W * 1.5 + R + pad;
  const gap = 5; // visual gap between cells

  return (
    <svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      className="h-auto w-full max-w-[30rem]"
      role="group"
      aria-label={isAr ? "المجالات التي نُدرّسها" : "The fields we teach"}
    >
      {FIELDS.map(({ q, r, Icon, en, ar }, i) => {
        const { x, y } = cell(q, r);
        return (
          <g key={en} className="hex-cell" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
            <Link href="/courses" aria-label={isAr ? ar : en}>
              <g className="hex-link">
                <polygon points={hexPoints(x, y, R - gap)} className="hex-shape" />
                <Icon x={x - 11} y={y - 26} width={22} height={22} className="hex-ink" strokeWidth={1.75} aria-hidden="true" />
                <text x={x} y={y + 24} textAnchor="middle" className="hex-label hex-ink">
                  {isAr ? ar : en}
                </text>
              </g>
            </Link>
          </g>
        );
      })}

      {/* centre: the student's question */}
      <g className="hex-cell" style={{ animationDelay: "0.1s" }}>
        <polygon points={hexPoints(0, 0, R - gap)} fill="#00B6BF" />
        <text x={0} y={-4} textAnchor="middle" className="hex-label" fill="#0A0A0A" style={{ fontSize: 15, fontWeight: 700 }}>
          {isAr ? "اختر" : "Find"}
        </text>
        <text x={0} y={16} textAnchor="middle" className="hex-label" fill="#0A0A0A" style={{ fontSize: 15, fontWeight: 700 }}>
          {isAr ? "مجالك" : "your field"}
        </text>
      </g>
    </svg>
  );
}
