import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--radius)] border border-[var(--color-input)] bg-[var(--color-surface)] px-3 py-2 text-[16px] leading-relaxed placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-0 focus-visible:border-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
