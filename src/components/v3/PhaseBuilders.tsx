import { useId, useRef, useState } from "react";
import { CopyPlus, GripVertical, History, Lock, Plus, Trash2, X } from "lucide-react";
import {
  ANSWER_FORMATS,
  NAME_LIMIT,
  RUBRIC_SCALES,
  type FormField,
  type RubricCriterion,
} from "./phaseModel";
import { cloneSet, type SavedSet } from "./savedSets";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/misc";
import { cn, uid } from "@/lib/utils";

const inputCls =
  "w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-surface)] px-3 py-2 text-[15px] outline-none transition-colors placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-ring)]";

// ---------------------------------------------------------------------------
// One editor for every kind of field — a submission question, a proposal
// question, a rubric criterion. Same shape, same order, same controls; only the
// wording and the set of answer types change with the phase. Description is
// optional and stays folded away until asked for, so the common case (a name
// and an answer type) is two decisions, not four.
// ---------------------------------------------------------------------------

export interface FieldCopy {
  nameLabel: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  /** "How should people answer this?" / "How should reviewers score this?" */
  answerLabel: string;
  requiredLabel: string;
}

function FieldCard<T extends string>({
  handle,
  copy,
  name,
  onName,
  description,
  onDescription,
  options,
  value,
  onValue,
  required,
  onRequired,
  onDelete,
}: {
  handle: React.ReactNode;
  copy: FieldCopy;
  name: string;
  onName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  options: readonly T[];
  value: T;
  onValue: (v: T) => void;
  required: boolean;
  onRequired: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [showDescription, setShowDescription] = useState(!!description);
  const nameId = useId();
  const descId = useId();

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={nameId} className="text-[13px] font-medium">
          {copy.nameLabel} <span className="text-[var(--color-danger)]">*</span>
        </label>
        {handle}
      </div>
      <input
        id={nameId}
        value={name}
        maxLength={NAME_LIMIT}
        onChange={(e) => onName(e.target.value)}
        placeholder={copy.namePlaceholder}
        className={inputCls}
      />
      <p className="mt-1 text-[12px] text-[var(--color-muted-foreground)]">
        {name.length}/{NAME_LIMIT}
      </p>

      {showDescription ? (
        <div className="mt-3">
          <label htmlFor={descId} className="mb-1 block text-[13px] font-medium">
            Description
          </label>
          <textarea
            id={descId}
            autoFocus={!description}
            rows={3}
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder={copy.descriptionPlaceholder}
            className={cn(inputCls, "resize-none leading-relaxed")}
          />
          {!description && (
            <button
              onClick={() => setShowDescription(false)}
              className="mt-1 text-[13px] font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:underline"
            >
              Remove description
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowDescription(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
        >
          <Plus className="size-3.5" aria-hidden />
          Add description
        </button>
      )}

      <fieldset className="mt-4">
        <legend className="mb-2 text-[13px] font-medium">{copy.answerLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const selected = value === o;
            return (
              <button
                key={o}
                role="radio"
                aria-checked={selected}
                onClick={() => onValue(o)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] transition-colors",
                  selected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-medium text-[var(--color-foreground)]"
                    : "border-[var(--color-input)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border-2",
                    selected ? "border-[var(--color-primary)]" : "border-[var(--color-input)]",
                  )}
                  aria-hidden
                >
                  {selected && (
                    <span className="size-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <label className="flex items-center gap-2 text-[13px] font-medium">
          {copy.requiredLabel}
          <Switch checked={required} onCheckedChange={onRequired} />
        </label>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </button>
      </div>
    </div>
  );
}

interface BuilderAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Exactly one action leads; the rest are outlined alternatives. */
  primary?: boolean;
}

/** Empty-state card. The ways in are ordered with the leading one first. */
function EmptyBuilder({ text, actions }: { text: string; actions: BuilderAction[] }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-input)] px-6 py-10 text-center">
      <p className="text-[14px] text-[var(--color-muted-foreground)]">{text}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {actions.map((a) => (
          <Button
            key={a.key}
            variant={a.primary ? "default" : "outline"}
            size="compact"
            onClick={a.onClick}
          >
            {a.icon}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** The quiet "+ add" link shown under a non-empty list. */
function AddLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] hover:underline"
    >
      <Plus className="size-4" aria-hidden />
      {label}
    </button>
  );
}

/** The footer under a non-empty list: add one more, or swap the whole set. */
function BuilderFooter({
  addLabel,
  onAdd,
  reuseLabel,
  onReuse,
}: {
  addLabel: string;
  onAdd: () => void;
  reuseLabel?: string;
  onReuse?: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <AddLink label={addLabel} onClick={onAdd} />
      {onReuse && (
        <button
          onClick={onReuse}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:underline"
        >
          <History className="size-3.5" aria-hidden />
          {reuseLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Pick a set from an earlier process. Replacing is destructive to whatever is
 * already there, so the confirm wording says so rather than the dialog quietly
 * swapping it out.
 */
function ReusePicker<T>({
  title,
  noun,
  sets,
  replacing,
  onPick,
  onClose,
}: {
  title: string;
  /** "questions" / "criteria" — used in the body copy. */
  noun: string;
  sets: SavedSet<T>[];
  /** True when the builder already has content that will be replaced. */
  replacing: boolean;
  onPick: (set: SavedSet<T>) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold leading-tight">{title}</h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted-foreground)]">
              {replacing
                ? `Picking one replaces the ${noun} you have now.`
                : `Start from a set you've used before — you can edit everything after.`}
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
          {sets.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onPick(s)}
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] p-3.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium leading-tight">{s.name}</span>
                  <span className="shrink-0 text-[13px] text-[var(--color-muted-foreground)]">
                    {s.items.length} {noun}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] text-[var(--color-muted-foreground)]">
                  From {s.source}
                </span>
                <span className="mt-2 block truncate text-[13px] text-[var(--color-muted-foreground)]">
                  {s.items.map((i) => (i as { label: string }).label).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// A small drag-reorderable list. Dragging is armed by the grip handle (so the
// row's inputs stay usable), and a pinned item (the Title field) can't be
// moved or dropped onto — it stays first.
// ---------------------------------------------------------------------------

function ReorderList<T extends { id: string; pinned?: boolean }>({
  items,
  onReorder,
  children,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T, handle: React.ReactNode) => React.ReactNode;
}) {
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = items.findIndex((i) => i.id === fromId);
    const to = items.findIndex((i) => i.id === toId);
    if (from < 0 || to < 0 || items[to].pinned) return;
    const next = items.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onReorder(next);
  };

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const handle = item.pinned ? (
          <span className="grid size-8 shrink-0 place-items-center text-[var(--color-input)]" aria-hidden>
            <GripVertical className="size-4" />
          </span>
        ) : (
          <span
            role="button"
            aria-label="Drag to reorder"
            onMouseDown={() => setArmed(item.id)}
            onMouseUp={() => setArmed(null)}
            className="grid size-8 shrink-0 cursor-grab place-items-center text-[var(--color-muted-foreground)] active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </span>
        );
        return (
          <li
            key={item.id}
            draggable={armed === item.id}
            onDragStart={(e) => {
              dragId.current = item.id;
              setDragging(item.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              dragId.current = null;
              setDragging(null);
              setArmed(null);
              setOver(null);
            }}
            onDragOver={(e) => {
              if (dragId.current && dragId.current !== item.id && !item.pinned) {
                e.preventDefault();
                setOver(item.id);
              }
            }}
            onDragLeave={() => setOver((o) => (o === item.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId.current) move(dragId.current, item.id);
              setOver(null);
            }}
            className={cn(
              "rounded-[var(--radius)] border bg-[var(--color-surface)] transition",
              dragging === item.id ? "opacity-50" : "",
              over === item.id
                ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                : "border-[var(--color-border)]",
            )}
          >
            {children(item, handle)}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Submission form / Develop requirements — fields with format + optional.
// ---------------------------------------------------------------------------

export function FormBuilder({
  fields,
  onChange,
  addLabel,
  emptyText = "No questions yet.",
  copy,
  sets,
  previous,
  previousLeads,
}: {
  fields: FormField[];
  onChange: (f: FormField[]) => void;
  addLabel: string;
  emptyText?: string;
  /** Wording for this phase — a submission form asks, a proposal form asks differently. */
  copy: FieldCopy;
  /** Question sets from earlier processes, when this phase has any. */
  sets?: SavedSet<FormField>[];
  /** The form people already filled in earlier in this process, to build on. */
  previous?: { name: string; fields: FormField[] };
  /** True when building on that form is the expected route, not starting over. */
  previousLeads?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const carried = fields.filter((f) => f.locked).length;
  const set = (id: string, patch: Partial<FormField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));
  const add = () =>
    onChange([...fields, { id: uid("fld"), label: "", format: "Short text", optional: false }]);

  const picker = picking && sets && (
    <ReusePicker
      title="Reuse questions from another process"
      noun="questions"
      sets={sets}
      replacing={fields.length > 0}
      onPick={(s) => {
        onChange(cloneSet(s.items, "fld"));
        setPicking(false);
      }}
      onClose={() => setPicking(false)}
    />
  );

  if (fields.length === 0) {
    // Carrying the earlier form over is the alternative to a blank one, and
    // which of the two leads depends on how this kind of process usually runs.
    const carryOver: BuilderAction | null = previous?.fields.length
      ? {
          key: "previous",
          label: "Add to previous form",
          icon: <CopyPlus aria-hidden />,
          // Carried questions are what people already answered, so they're
          // fixed here: this phase adds to them rather than rewriting them.
          onClick: () =>
            onChange(
              cloneSet(previous.fields, "fld").map((f) => ({
                ...f,
                locked: true,
                pinned: true,
              })),
            ),
          primary: previousLeads,
        }
      : null;
    const fresh: BuilderAction = {
      key: "new",
      label: carryOver ? "New form" : addLabel,
      icon: <Plus aria-hidden />,
      onClick: add,
      primary: !carryOver || !previousLeads,
    };
    const reuse: BuilderAction | null = sets
      ? {
          key: "sets",
          label: "Use ones from another process",
          icon: <History aria-hidden />,
          onClick: () => setPicking(true),
        }
      : null;

    const actions = (carryOver && previousLeads
      ? [carryOver, fresh, reuse]
      : [fresh, carryOver, reuse]
    ).filter(Boolean) as BuilderAction[];

    return (
      <>
        <EmptyBuilder text={emptyText} actions={actions} />
        {picker}
      </>
    );
  }

  return (
    <div>
      {carried > 0 && previous && (
        <p className="mb-2 flex items-start gap-1.5 text-[13px] leading-snug text-[var(--color-muted-foreground)]">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            The first {carried} {carried === 1 ? "question" : "questions"} come from{" "}
            <strong className="font-medium text-[var(--color-foreground)]">{previous.name}</strong>{" "}
            and stay as people answered them. Anything you add goes below.
          </span>
        </p>
      )}
      <ReorderList items={fields} onReorder={onChange}>
        {(f, handle) =>
          f.locked ? (
            <div className="flex items-center gap-2 bg-[var(--color-muted)]/50 p-3">
              <span
                className="grid size-8 shrink-0 place-items-center text-[var(--color-muted-foreground)]"
                aria-hidden
              >
                <Lock className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--color-muted-foreground)]">
                {f.label}
              </span>
              <span className="shrink-0 text-[13px] text-[var(--color-muted-foreground)]">
                {f.format}
                {!f.optional && " · Required"}
              </span>
            </div>
          ) : (
            <FieldCard
              handle={handle}
              copy={copy}
              name={f.label}
              onName={(v) => set(f.id, { label: v })}
              description={f.description ?? ""}
              onDescription={(v) => set(f.id, { description: v })}
              options={ANSWER_FORMATS}
              value={f.format}
              onValue={(v) => set(f.id, { format: v })}
              required={!f.optional}
              onRequired={(v) => set(f.id, { optional: !v })}
              onDelete={() => remove(f.id)}
            />
          )
        }
      </ReorderList>
      <BuilderFooter
        addLabel={addLabel}
        onAdd={add}
        reuseLabel={carried > 0 ? "Start a new form instead" : "Use a different set"}
        /* With carried questions in place the escape hatch is clearing them,
           since they can't be edited one by one. */
        onReuse={
          carried > 0 ? () => onChange([]) : sets ? () => setPicking(true) : undefined
        }
      />
      {picker}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review rubric — scoring criteria.
// ---------------------------------------------------------------------------

export function RubricBuilder({
  criteria,
  onChange,
  copy,
  sets,
}: {
  criteria: RubricCriterion[];
  onChange: (c: RubricCriterion[]) => void;
  copy: FieldCopy;
  /** Rubrics from earlier processes. */
  sets?: SavedSet<RubricCriterion>[];
}) {
  const [picking, setPicking] = useState(false);
  const set = (id: string, patch: Partial<RubricCriterion>) =>
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onChange(criteria.filter((c) => c.id !== id));
  const add = () =>
    onChange([
      ...criteria,
      { id: uid("crit"), label: "", scale: "Rating scale", optional: false },
    ]);

  const picker = picking && sets && (
    <ReusePicker
      title="Reuse a rubric from another process"
      noun="criteria"
      sets={sets}
      replacing={criteria.length > 0}
      onPick={(s) => {
        onChange(cloneSet(s.items, "crit"));
        setPicking(false);
      }}
      onClose={() => setPicking(false)}
    />
  );

  if (criteria.length === 0) {
    return (
      <>
        <EmptyBuilder
          text="No criteria yet."
          actions={[
            {
              key: "new",
              label: "Add a criterion",
              icon: <Plus aria-hidden />,
              onClick: add,
              primary: true,
            },
            ...(sets
              ? [
                  {
                    key: "sets",
                    label: "Use one from another process",
                    icon: <History aria-hidden />,
                    onClick: () => setPicking(true),
                  },
                ]
              : []),
          ]}
        />
        {picker}
      </>
    );
  }

  return (
    <div>
      <ReorderList items={criteria} onReorder={onChange}>
        {(c, handle) => (
          <FieldCard
            handle={handle}
            copy={copy}
            name={c.label}
            onName={(v) => set(c.id, { label: v })}
            description={c.description ?? ""}
            onDescription={(v) => set(c.id, { description: v })}
            options={RUBRIC_SCALES}
            value={c.scale}
            onValue={(v) => set(c.id, { scale: v })}
            required={!c.optional}
            onRequired={(v) => set(c.id, { optional: !v })}
            onDelete={() => remove(c.id)}
          />
        )}
      </ReorderList>
      <BuilderFooter
        addLabel="Add a criterion"
        onAdd={add}
        reuseLabel="Use a different rubric"
        onReuse={sets ? () => setPicking(true) : undefined}
      />
      {picker}
    </div>
  );
}
