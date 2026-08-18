import { ArrowRight, Check, Lightbulb } from "lucide-react";
import type { Piece, ProcessType } from "./pieces";
import { PHASE_TYPE_ICON, processSubject } from "./pieces";
import { PhaseRow } from "./PhaseRow";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";

/**
 * Part 3 — the walkthrough. A pinned title, and the process revealed one piece
 * at a time into an accordion stack (only one open at a time). Advancing is
 * manual; on the last piece the advance button becomes the "Configure" CTA.
 *
 * `settling` collapses everything to compact rows for the hand-off (Part 4);
 * the parent drives that flag, then swaps in the dashboard.
 */
export function Walkthrough({
  name,
  type,
  pieces,
  revealed,
  openIndex,
  settling,
  hideAdvance,
  banner,
  onOpen,
  onAdvance,
  onConfigure,
}: {
  name: string;
  type: ProcessType;
  pieces: Piece[];
  /** How many pieces are revealed (1-based count). */
  revealed: number;
  /** Which revealed piece is expanded. */
  openIndex: number;
  settling: boolean;
  /** Hide the inline advance/configure buttons (a parent footer drives them). */
  hideAdvance?: boolean;
  /** Optional note between the title and the pieces. */
  banner?: React.ReactNode;
  onOpen: (i: number) => void;
  onAdvance: () => void;
  onConfigure: () => void;
}) {
  const subject = processSubject(name, type);
  const allRevealed = revealed >= pieces.length;
  const nextPiece = allRevealed ? null : pieces[revealed];

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 pb-32 pt-8">
      {/* Pinned title — the same line as the transition. */}
      <h1 className="text-center font-serif text-[26px] font-semibold leading-tight tracking-tight text-balance">
        Here's how {subject} could run on Common
      </h1>
      <p className="mx-auto mt-2 max-w-md text-center text-[14px] text-[var(--color-muted-foreground)]">
        {settling
          ? "Setting up your workspace…"
          : "What each piece does and what you can set up — tap any to expand."}
      </p>

      {banner && <div className="mt-6">{banner}</div>}

      <div className="mt-8 space-y-3">
        {pieces.slice(0, revealed).map((piece, i) => {
          const expanded = !settling && i === openIndex;
          return expanded ? (
            <ExpandedPiece key={piece.name + i} piece={piece} />
          ) : (
            <PhaseRow
              key={piece.name + i}
              piece={piece}
              index={i + 1}
              showNumber={false}
              showChevron={false}
              onClick={settling ? undefined : () => onOpen(i)}
            />
          );
        })}
      </div>

      {/* Advance / configure — hidden while settling, or when a parent footer drives it. */}
      {!settling && !hideAdvance && (
        <div className="mt-6 flex flex-col items-center">
          {allRevealed ? (
            <>
              <p className="mb-3 text-[13px] text-[var(--color-muted-foreground)]">
                You'll set up and adjust each piece next.
              </p>
              <Button onClick={onConfigure} className="px-6">
                Configure this process
                <ArrowRight aria-hidden />
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onAdvance} className="px-5">
              Next: {nextPiece?.name}
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** The current piece — the full card. */
function ExpandedPiece({ piece }: { piece: Piece }) {
  const icon = PHASE_TYPE_ICON[piece.phaseType];
  return (
    <div
      className="animate-fade-up rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
      style={{ animationDuration: "0.4s" }}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon name={icon} className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            {piece.phaseType}
          </p>
          <h2 className="mt-1 font-serif text-[21px] font-semibold leading-tight">
            {piece.name}
          </h2>
          {piece.description && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-muted-foreground)]">
              {piece.description}
            </p>
          )}

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            You can
          </p>
          <ul className="mt-2 space-y-2">
            {piece.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
                  <Check className="size-3" aria-hidden />
                </span>
                <span className="text-[15px] leading-snug">{c}</span>
              </li>
            ))}
          </ul>

          {piece.norm && (
            <>
              <div className="my-4 h-px w-full bg-[var(--color-border)]" />
              <div className="flex items-start gap-2 text-[13px] text-[var(--color-muted-foreground)]">
                <Lightbulb
                  className="mt-0.5 size-4 shrink-0 text-[var(--color-pending)]"
                  aria-hidden
                />
                <span>{piece.norm}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
