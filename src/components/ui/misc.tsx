import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[14px] font-medium leading-none text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "pending" | "primary" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)] border-transparent",
    success:
      "bg-[var(--color-success-soft)] text-[var(--color-success)] border-transparent",
    pending:
      "bg-[var(--color-pending-soft)] text-[var(--color-pending)] border-transparent",
    primary:
      "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent",
    danger:
      "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-0.5 text-[12px] font-medium leading-none [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-[var(--color-border)]", className)}
      role="separator"
    />
  );
}

/** Accessible toggle switch — state paired with text label by caller. */
export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-ring)] focus-visible:outline-offset-2",
        checked
          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
          : "bg-[var(--color-muted)] border-[var(--color-input)]",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
