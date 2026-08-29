import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the official GENHEX logo exactly as supplied — never
 * regenerated or redrawn. Drop the real exported file(s) at
 * public/brand/genhex-logo.png (see public/brand/README.md).
 */
export function Logo({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/brand/genhex-logo.png"
      alt="GENHEX — Build What's Next."
      width={height * 3.6}
      height={height}
      className={cn("h-8 w-auto object-contain", className)}
      priority
    />
  );
}
