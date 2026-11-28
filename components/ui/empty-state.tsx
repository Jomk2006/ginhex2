import * as React from "react";
import { HexMotif } from "@/components/ui/hex-motif";
import { cn } from "@/lib/utils";

/** Friendly empty state with the animated hex motif. Pass an action (Button/Link) as children. */
export function EmptyState({
  title,
  description,
  children,
  className,
  compact = false,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-card/60 px-6 text-center",
        compact ? "py-8" : "py-14",
        className
      )}
    >
      <div className="gx-hex-float">
        <HexMotif className={compact ? "h-24 w-24" : "h-32 w-32"} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
