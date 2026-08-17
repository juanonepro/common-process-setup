import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius)] border border-[var(--color-input)] bg-[var(--color-surface)] px-3 py-2 text-[16px] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-0 focus-visible:border-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
