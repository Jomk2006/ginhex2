import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]", className)}>
      <div
        className="gx-bar h-full rounded-full bg-gradient-to-r from-[var(--genhex-cyan)] to-[color-mix(in_srgb,var(--genhex-cyan)_70%,white)] shadow-[0_0_10px_var(--glow)] rtl:bg-gradient-to-l"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
