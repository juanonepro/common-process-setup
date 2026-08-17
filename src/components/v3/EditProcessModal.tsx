import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { PHASE_TYPE_ICON, type PhaseType } from "./pieces";
import { NEW_PHASE_NAME, type PhaseInstance } from "./phaseModel";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PHASE_TYPES: PhaseType[] = ["Submissions", "Review", "Develop", "Voting", "Results"];

/** A process collects once and reports once; review, develop and vote can all
 * repeat. So the one-per-process types drop out of the menu once they exist. */
const SINGLETON_TYPES: PhaseType[] = ["Submissions", "Results"];

const TYPE_HELPER: Record<PhaseType, string> = {
  Submissions: "People send something in.",
  Review: "A named group scores what came in.",
  Develop: "Shortlisted entries are built up into full proposals.",
  Voting: "People decide between what's left.",
  Results: "The outcome is published.",
};

/**
 * The shape of the process itself — which phases run, in what order. Deliberately
 * separate from a phase's own setup page: this is the skeleton, that's the
 * detail. Changes apply straight away; the modal is a workspace, not a form.
 */
export function EditProcessModal({
  phases,
  onAdd,
  onDelete,
  onMove,
  onClose,
}: {
  phases: PhaseInstance[];
  onAdd: (t: PhaseType) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirming = phases.find((p) => p.id === confirmId) ?? null;

  const addable = PHASE_TYPES.filter(
    (t) => !(SINGLETON_TYPES.includes(t) && phases.some((p) => p.phaseType === t)),
  );

  return (
    <Dialog open onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold leading-tight">Edit process</h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted-foreground)]">
              Add, remove, and reorder the phases people move through.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {phases.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                <Icon name={PHASE_TYPE_ICON[p.phaseType]} className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-tight">
                  {p.name || "Untitled phase"}
                </span>
                <span className="mt-0.5 block text-[13px] text-[var(--color-muted-foreground)]">
                  {p.phaseType}
                </span>
              </span>
              <span className="flex shrink-0 items-center">
                <IconButton
                  label={`Move ${p.name} earlier`}
                  disabled={i === 0}
                  onClick={() => onMove(p.id, -1)}
                >
                  <ArrowUp className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label={`Move ${p.name} later`}
                  disabled={i === phases.length - 1}
                  onClick={() => onMove(p.id, 1)}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label={`Delete ${p.name}`}
                  danger
                  disabled={phases.length === 1}
                  onClick={() => setConfirmId(p.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </span>
            </li>
          ))}
        </ul>

        {/* The type choice is a popover off the button — the list of phases
            stays put behind it instead of being pushed down the modal. */}
        <div className="relative mt-3">
          <button
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            aria-haspopup="menu"
            className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-[var(--color-input)] py-3 text-[14px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Plus className="size-4" aria-hidden />
            Add a phase
          </button>

          {adding && (
            <>
              {/* Click-away layer — closes without a global listener. */}
              <button
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close menu"
                onClick={() => setAdding(false)}
              />
              <div
                role="menu"
                className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-xl"
              >
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  What happens in the new phase?
                </p>
                {addable.map((t) => (
                  <button
                    key={t}
                    role="menuitem"
                    onClick={() => {
                      onAdd(t);
                      setAdding(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-[var(--radius)] p-2 text-left transition-colors hover:bg-[var(--color-primary-soft)]/60"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                      <Icon name={PHASE_TYPE_ICON[t]} className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium leading-tight">
                        {NEW_PHASE_NAME[t]}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                        {TYPE_HELPER[t]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <Button size="compact" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {confirming && (
        <Dialog open onClose={() => setConfirmId(null)} className="max-w-md">
          <div className="p-6">
            <h2 className="font-serif text-[20px] font-semibold leading-tight">
              Delete “{confirming.name || "this phase"}”?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              This removes the phase and everything set up in it. The rest of your process is
              untouched.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(confirming.id);
                  setConfirmId(null);
                }}
              >
                Delete phase
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors disabled:opacity-30",
        danger
          ? "hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-muted-foreground)]"
          : "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
