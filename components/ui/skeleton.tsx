import { cn } from "@/lib/utils";

/** Shimmer placeholder. Size it with utilities (h-*, w-*). aria-hidden; pair with a labelled region. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("gx-skeleton h-4 w-full", className)} />;
}
