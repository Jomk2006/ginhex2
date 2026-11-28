import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex w-full rounded-xl border border-border-strong bg-input px-3.5 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-[color-mix(in_srgb,var(--foreground)_35%,transparent)] focus-visible:outline-none focus-visible:border-ring gx-field-glow focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive h-11 py-2 appearance-none bg-no-repeat pe-10 select-chevron cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
