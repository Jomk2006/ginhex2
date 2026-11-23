import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium select-none transition-[transform,box-shadow,background-color,border-color,color,filter] duration-200 ease-out will-change-transform active:translate-y-0 active:duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.28),var(--sh-sm)] hover:-translate-y-px hover:brightness-105 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_6px_20px_-6px_var(--glow)] active:brightness-95",
        outline:
          "border border-border-strong bg-card/60 text-foreground shadow-xs hover:-translate-y-px hover:bg-muted hover:border-[color-mix(in_srgb,var(--genhex-cyan)_50%,var(--border-strong))] hover:shadow-sm",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:-translate-y-px hover:brightness-105",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3.5",
        lg: "h-12 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
