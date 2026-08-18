import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// The wizard's shared furniture — one heading and two card shapes, so every
// question screen in the flow looks like the same question screen.
// ---------------------------------------------------------------------------

export function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h1 className="font-serif text-[24px] font-semibold leading-tight tracking-tight text-balance">
        {title}
      </h1>
      {sub && (
        <p className="mx-auto mt-1.5 max-w-md text-[14px] text-[var(--color-muted-foreground)]">
          {sub}
        </p>
      )}
    </div>
  );
}

const cardCls = (selected: boolean) =>
  cn(
    "flex w-full items-start gap-3 rounded-[var(--radius)] border-2 bg-[var(--color-surface)] p-3.5 text-left transition-colors",
    selected
      ? "bg-[var(--color-primary-soft)]"
      : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
  );

/** One-of-many. */
export function ChoiceCard({
  selected,
  onClick,
  title,
  desc,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  /** Revealed under the card's text while it's selected. */
  children?: React.ReactNode;
}) {
  return (
    <div
      style={selected ? { borderColor: "var(--color-primary)" } : undefined}
      className={cn(cardCls(selected), "flex-col !p-0")}
    >
      <button onClick={onClick} aria-pressed={selected} className="flex w-full items-start gap-3 p-3.5 text-left">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
            selected ? "border-[var(--color-primary)]" : "border-[var(--color-input)]",
          )}
          aria-hidden
        >
          {selected && <span className="size-2.5 rounded-full bg-[var(--color-primary)]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-tight">{title}</span>
          {desc && (
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
              {desc}
            </span>
          )}
        </span>
      </button>
      {selected && children && <div className="w-full px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}

/** Any-of-many — a checkbox rather than a radio, so the difference is visible. */
export function CheckCard({
  selected,
  onToggle,
  title,
  desc,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={selected ? { borderColor: "var(--color-primary)" } : undefined}
      className={cn(cardCls(selected), "flex-col !p-0")}
    >
      <button
        onClick={onToggle}
        role="checkbox"
        aria-checked={selected}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-[var(--radius-sm)] border-2",
            selected
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-input)]",
          )}
          aria-hidden
        >
          {selected && <Check className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-tight">{title}</span>
          {desc && (
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
              {desc}
            </span>
          )}
        </span>
      </button>
      {selected && children && <div className="w-full px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}
