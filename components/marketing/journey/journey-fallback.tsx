/** Static journey visual: a hex cluster whose lit cells change with the active step (CSS only). */
const R = 34;
const W = Math.sqrt(3) * R;

function pts(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function litSteps(q: number, r: number): string {
  const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
  const u = q + r / 2;
  const s: number[] = [];
  if (d <= 1) s.push(0);
  if (r % 2 === 0 && Math.abs(r) <= 2 && Math.abs(u) <= 2) s.push(1);
  if (d === 0 || d === 2) s.push(2);
  if (d <= 1) s.push(3);
  return s.join(" ");
}

export function JourneyFallback() {
  const cells: Array<{ x: number; y: number; lit: string; key: string }> = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = Math.max(-3, -q - 3); r <= Math.min(3, -q + 3); r++) {
      cells.push({ x: W * (q + r / 2), y: 1.5 * R * r, lit: litSteps(q, r), key: `${q},${r}` });
    }
  }
  const half = W * 3.6;
  return (
    <svg viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`} className="journey-fb" aria-hidden="true">
      {cells.map((c) => (
        <polygon key={c.key} points={pts(c.x, c.y, R - 3)} className="fb-cell" data-lit={c.lit} />
      ))}
    </svg>
  );
}
