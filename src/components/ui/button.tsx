import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-4 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 shadow-sm",
        secondary:
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]",
        outline:
          "border border-[var(--color-input)] bg-[var(--color-surface)] hover:bg-[var(--color-muted)]",
        ghost: "hover:bg-[var(--color-muted)]",
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
        destructive:
          "bg-[var(--color-danger)] text-white hover:brightness-110 shadow-sm",
      },
      size: {
        // Two heights only: 40px default, 32px compact
        default: "h-10 px-4 text-[16px]",
        compact: "h-8 px-3 text-[14px]",
        icon: "h-10 w-10",
        iconCompact: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
