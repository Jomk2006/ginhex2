import { cn } from "@/lib/utils";

/**
 * Segmented tabs with a sliding indicator (CSS transform on --idx; mirrors in RTL).
 * Equal-width segments. Controlled: the parent owns `value`.
 */
export function Segmented({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("gx-seg", className)}
      style={{ "--n": options.length, "--idx": idx } as React.CSSProperties}
    >
      <span className="gx-seg-ind" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" className="gx-seg-btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
