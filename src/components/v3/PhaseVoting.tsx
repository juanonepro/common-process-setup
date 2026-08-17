import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { VOTE_METHODS, VOTE_METHOD_META, type VoteMethod } from "./phaseModel";
import { Field } from "./PhaseSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// How voting works. A phase can combine ways to vote — spread a budget, then
// rank what's left — so this is an ordered list the admin builds up, not a
// single pick. The order is the order people work through on the ballot, which
// is why each step is numbered and can be moved.
// ---------------------------------------------------------------------------

export function VotingMethods({
  methods,
  budget,
  pickCount,
  onChange,
  onBudget,
  onPickCount,
}: {
  methods: VoteMethod[];
  budget: string;
  pickCount: string;
  onChange: (m: VoteMethod[]) => void;
  onBudget: (v: string) => void;
  onPickCount: (v: string) => void;
}) {
  const remaining = VOTE_METHODS.filter((m) => !methods.includes(m));

  const move = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= methods.length) return;
    const next = methods.slice();
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  return (
    <div>
      {methods.length > 1 && (
        <p className="mb-3 text-[13px] text-[var(--color-muted-foreground)]">
          People work through these in order.
        </p>
      )}

      {methods.length === 0 ? (
        /* Nothing chosen yet — one way in, and it's this one. */
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-input)] px-6 py-8 text-center">
          <p className="text-[14px] text-[var(--color-muted-foreground)]">No way to vote yet.</p>
          <div className="mt-3 flex justify-center">
            <AddMethodMenu
              label="Choose how people vote"
              lead
              remaining={remaining}
              onPick={(m) => onChange([...methods, m])}
            />
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {methods.map((m, i) => {
            const meta = VOTE_METHOD_META[m];
            return (
              <li
                key={m}
                className="rounded-[var(--radius)] border border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40 p-3.5"
              >
                <div className="flex items-start gap-3">
                  {methods.length > 1 && (
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[13px] font-semibold text-white"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium leading-tight">
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                      {meta.helper}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center">
                    {methods.length > 1 && (
                      <>
                        <IconButton
                          label={`Move ${meta.label} earlier`}
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label={`Move ${meta.label} later`}
                          disabled={i === methods.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      label={`Remove ${meta.label}`}
                      danger
                      onClick={() => onChange(methods.filter((x) => x !== m))}
                    >
                      <X className="size-4" aria-hidden />
                    </IconButton>
                  </span>
                </div>

                {/* What each way of voting needs to know, inside its own step. */}
                {m === "spread" && (
                  <div className="mt-3">
                    <Field label="Total budget">
                      <Input
                        value={budget}
                        onChange={(e) => onBudget(e.target.value)}
                        placeholder="e.g. $300,000"
                      />
                    </Field>
                  </div>
                )}
                {m === "pick" && (
                  <div className="mt-3">
                    <Field label="How many can they pick?">
                      <Input
                        value={pickCount}
                        onChange={(e) => onPickCount(e.target.value)}
                        placeholder="e.g. 3"
                      />
                    </Field>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Only once something's been chosen, and only while there's more to add. */}
      {methods.length > 0 && remaining.length > 0 && (
        <div className="mt-2.5">
          <AddMethodMenu
            label="Add another way to vote"
            remaining={remaining}
            onPick={(m) => onChange([...methods, m])}
          />
        </div>
      )}
    </div>
  );
}

/** The picker, shared by the empty state's CTA and the add row under the list. */
function AddMethodMenu({
  label,
  lead,
  remaining,
  onPick,
}: {
  label: string;
  /** Render as the filled CTA rather than the quiet dashed row. */
  lead?: boolean;
  remaining: readonly VoteMethod[];
  onPick: (m: VoteMethod) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", lead ? "inline-block" : "block")}>
      {lead ? (
        <Button
          size="compact"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Plus aria-hidden />
          {label}
        </Button>
      ) : (
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-[var(--color-input)] py-2.5 text-[14px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="size-4" aria-hidden />
          {label}
        </button>
      )}

      {open && (
        <>
          {/* Click-away layer — closes without a global listener. */}
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className={cn(
              "absolute z-20 overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 text-left shadow-xl",
              lead
                ? "left-1/2 top-full mt-2 w-[300px] -translate-x-1/2"
                : "left-0 top-0 w-full",
            )}
          >
            {remaining.map((m) => (
              <button
                key={m}
                role="menuitem"
                onClick={() => {
                  onPick(m);
                  setOpen(false);
                }}
                className="block w-full rounded-[var(--radius-sm)] p-2 text-left transition-colors hover:bg-[var(--color-primary-soft)]/60"
              >
                <span className="block text-[14px] font-medium leading-tight">
                  {VOTE_METHOD_META[m].label}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                  {VOTE_METHOD_META[m].helper}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
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
          ? "hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          : "hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
