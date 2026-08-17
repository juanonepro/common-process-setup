import { ChevronRight } from "lucide-react";
import type { Piece } from "./pieces";
import { PHASE_TYPE_ICON } from "./pieces";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

/**
 * The compact phase row — shared between the walkthrough's collapsed "done"
 * rows and the dashboard's process zone, so a piece reads as the same thing
 * across the hand-off. `index` (1-based) shows on the dashboard; the walkthrough
 * passes it too but can hide the number via `showNumber={false}`.
 */
export function PhaseRow({
  piece,
  index,
  onClick,
  showNumber = true,
  showChevron = true,
  status,
}: {
  piece: Piece;
  index: number;
  onClick?: () => void;
  showNumber?: boolean;
  showChevron?: boolean;
  /** Optional dashboard status badge. */
  status?: { label: string; tone: "amber" | "muted" };
}) {
  const icon = PHASE_TYPE_ICON[piece.phaseType];
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-left transition-colors hover:bg-[var(--color-muted)]/50"
    >
      {showNumber && (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-muted)] text-[12px] font-semibold text-[var(--color-muted-foreground)]">
          {index}
        </span>
      )}
      <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon name={icon} className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium leading-tight">
          {piece.name}
        </span>
        <span className="mt-0.5 block text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {piece.phaseType}
        </span>
      </span>
      {status && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-[12px] font-medium",
            status.tone === "amber"
              ? "bg-[var(--color-pending-soft)] text-[var(--color-pending)]"
              : "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
          )}
        >
          {status.label}
        </span>
      )}
      {showChevron && (
        <ChevronRight
          className="size-4 shrink-0 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
      )}
    </button>
  );
}
