import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the official GENHEX logo exactly as supplied -- never
 * regenerated, redrawn, or cropped. The source file is a square,
 * icon-over-wordmark lockup on a white background (no alpha channel),
 * so it's wrapped in a small white rounded plate rather than placed
 * directly on the page background -- this keeps it reading cleanly on
 * both dark and light surfaces without touching a single pixel of the
 * actual asset. The plate is a container we own, not an edit to the logo.
 */
export function Logo({ className, height = 48 }: { className?: string; height?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5",
        className
      )}
      style={{ height }}
    >
      <Image
        src="/brand/genhex-logo.jpeg"
        alt="GENHEX — Build What's Next."
        width={height - 8}
        height={height - 8}
        className="h-full w-auto object-contain"
        priority
      />
    </span>
  );
}
