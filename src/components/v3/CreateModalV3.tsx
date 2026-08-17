import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import {
  SHAPE_QUESTION,
  TYPE_META,
  type ProcessType,
  type ShapeKey,
} from "./pieces";
import { Icon } from "@/components/Icon";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export interface Draft {
  name: string;
  type: ProcessType;
  shape: ShapeKey;
}

// The type options, all as stacked boxed rows.
const MAIN_TYPES: ProcessType[] = ["grant", "pb", "other"];

/**
 * Part 1 — the create modal. One screen that deepens in place:
 * name → type (four cards) → shape follow-up (after a type is picked the type
 * list collapses to a compact chip and the follow-up appears beneath it).
 * The header is constant the whole time the modal is open.
 */
export function CreateModalV3({
  onContinue,
  onCancel,
}: {
  onContinue: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ProcessType | null>(null);
  const [shape, setShape] = useState<ShapeKey | null>(null);
  const [description, setDescription] = useState("");

  const shapeQ = type ? SHAPE_QUESTION[type] : undefined;
  const canContinue =
    type === "other" ? description.trim().length > 0 : !!type && !!shape;

  const pickType = (t: ProcessType) => {
    setType(t);
    // "Other" has no shape question — its pieces come from a single custom set.
    setShape(t === "other" ? "custom" : null);
    setDescription("");
  };
  const changeType = () => {
    setType(null);
    setShape(null);
    setDescription("");
  };

  return (
    <Dialog open dismissable={false} className="max-w-[600px]">
      <div className="flex flex-col">
        {/* Close — matches the modal chrome; cancels back to the empty state. */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-7 pb-2">
          {/* Constant header — does not change as inputs are answered. */}
          <div className="mb-6">
            <h1 className="font-serif text-[24px] font-semibold leading-tight">
              Start a process
            </h1>
          </div>

          {/* 1 — Name (always visible, top). */}
          <div className="mb-6">
            <div className="mb-1.5">
              <Label htmlFor="v2-name">Name your process</Label>
            </div>
            <Input
              id="v2-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neighborhood Grants 2026"
            />
          </div>

          {/* 2 — Type. Collapses to a chip once chosen. The min-height keeps
              the modal from resizing when the shape follow-up appears. */}
          <div className="min-h-[320px]">
          {!type ? (
            <div>
              <h2 className="text-[16px] font-medium leading-tight">
                What kind of process are you running?
              </h2>
              <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
                We'll show you how it maps onto Common. You can change anything
                after.
              </p>
              <div className="mt-3 space-y-2.5">
                {MAIN_TYPES.map((t) => (
                  <TypeCard key={t} type={t} onClick={() => pickType(t)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-up" style={{ animationDuration: "0.3s" }}>
              <TypeChip type={type} onChange={changeType} />

              {/* 3 — Follow-up: a shape question, or a describe-it field for "Other". */}
              {type === "other" ? (
                <div className="mt-4">
                  <h2 className="text-[16px] font-medium leading-tight">
                    Describe your process
                  </h2>
                  <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
                    In a sentence or two — what are people deciding, and how?
                  </p>
                  <Textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Neighbors propose small projects, a committee reviews them, and we fund what fits the budget."
                    className="mt-3"
                  />
                </div>
              ) : (
                shapeQ && (
                  <div className="mt-4">
                    <h2 className="text-[16px] font-medium leading-tight">
                      {shapeQ.heading}
                    </h2>
                    <div className="mt-3 space-y-2.5">
                      {shapeQ.options.map((o) => (
                        <ShapeCard
                          key={o.key}
                          label={o.label}
                          desc={o.desc}
                          selected={shape === o.key}
                          onClick={() => setShape(o.key)}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer — single primary action, disabled until answered. */}
        <div className="mt-4 flex justify-end border-t border-[var(--color-border)] px-7 py-4">
          <Button
            onClick={() =>
              canContinue && type && shape && onContinue({ name, type, shape })
            }
            disabled={!canContinue}
            className="min-w-28"
          >
            Continue
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function TypeCard({ type, onClick }: { type: ProcessType; onClick: () => void }) {
  const m = TYPE_META[type];
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius)] border-2 border-[var(--color-border)] p-3.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
        <Icon name={m.icon} className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-tight">
          {m.label}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
          {m.desc}
        </span>
      </span>
    </button>
  );
}

function TypeChip({ type, onChange }: { type: ProcessType; onChange: () => void }) {
  const m = TYPE_META[type];
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-primary)] text-white">
        <Icon name={m.icon} className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-primary)]">
          Process type
        </span>
        <span className="block truncate text-[15px] font-medium leading-tight text-[var(--color-foreground)]">
          {m.label}
        </span>
      </span>
      <button
        onClick={onChange}
        className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
      >
        Change
      </button>
    </div>
  );
}

function ShapeCard({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={selected ? { borderColor: "var(--color-primary)" } : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius)] border-2 p-3.5 text-left transition-colors",
        selected
          ? "bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-tight">
          {label}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
          {desc}
        </span>
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
            : "border-[var(--color-input)]",
        )}
      >
        {selected && <Check className="size-3" aria-hidden />}
      </span>
    </button>
  );
}
