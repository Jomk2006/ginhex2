import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Dashboard KPI: icon chip, big numeral, quiet label. Numerals stay LTR-tabular. */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="gx-icon-chip" aria-hidden="true">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="gx-stat-num text-foreground">{value}</p>
      {hint && <p className="-mt-2 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
