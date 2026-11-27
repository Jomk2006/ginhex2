import * as React from "react";
import { cn } from "@/lib/utils";

/** Page title block: h1 + description + drawn rule, optional actions on the end side. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-accent-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--glow)]" />
            {eyebrow}
          </p>
        )}
        <h1 className="gx-ph text-2xl sm:text-3xl">{title}</h1>
        <span className="gx-rule" aria-hidden="true" />
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Section title with a short drawn rule; optional trailing action. */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        <span className="gx-rule" aria-hidden="true" />
      </div>
      {action}
    </div>
  );
}
