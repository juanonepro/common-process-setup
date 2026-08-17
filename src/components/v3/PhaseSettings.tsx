import { useRef, useState } from "react";
import { CalendarClock, CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared settings controls — identical whether they sit in a builder phase's
// side panel or a config phase's single column. This is what makes every phase
// read as one system.
// ---------------------------------------------------------------------------

export function SettingsCard({
  label,
  children,
}: {
  /** Optional quiet uppercase group label. */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[14px] font-medium leading-none">{label}</p>
      {children}
    </div>
  );
}

/**
 * The dedicated "when it's open" section. Its own card with a label; an empty
 * state until the admin adds dates, at which point a date picker opens and two
 * date fields (Opens / Closes) appear.
 */
export function DatesSection({
  label,
  startDate,
  endDate,
  onStart,
  onEnd,
  hint,
}: {
  label: string;
  startDate: string;
  endDate: string;
  onStart: (d: string) => void;
  onEnd: (d: string) => void;
  /** When the phase before this one closes — the anchor for picking dates. */
  hint?: string;
}) {
  const hasDates = !!(startDate || endDate);
  const [adding, setAdding] = useState(false);
  const startRef = useRef<HTMLInputElement>(null);

  const beginAdd = () => {
    setAdding(true);
    // Reveal the fields, then open the native picker on the start date.
    requestAnimationFrame(() => {
      const el = startRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
      try {
        el?.showPicker?.();
      } catch {
        /* not supported — the field is still editable */
      }
    });
  };

  return (
    <SettingsCard label={label}>
      {hasDates || adding ? (
        <div className="grid grid-cols-2 items-start gap-3">
          <label className="text-[12px] text-[var(--color-muted-foreground)]">
            Opens
            <Input
              ref={startRef}
              type="date"
              value={startDate}
              onChange={(e) => onStart(e.target.value)}
              className="mt-1 h-9"
            />
            {/* What this date has to follow, right where it's being picked. */}
            {hint && (
              <span className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug">
                <CalendarClock className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>{hint}</span>
              </span>
            )}
          </label>
          <label className="text-[12px] text-[var(--color-muted-foreground)]">
            Closes
            <Input type="date" value={endDate} onChange={(e) => onEnd(e.target.value)} className="mt-1 h-9" />
          </label>
        </div>
      ) : (
        <Button variant="outline" size="compact" onClick={beginAdd}>
          <CalendarPlus aria-hidden />
          Add dates
        </Button>
      )}
    </SettingsCard>
  );
}

export function ToggleRow({
  title,
  helper,
  checked,
  onChange,
}: {
  title: string;
  helper: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-muted-foreground)]">{helper}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function OptionRows<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; helper: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
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
              <span className="block text-[15px] font-medium leading-tight">{o.label}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                {o.helper}
              </span>
            </span>
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-input)]",
              )}
            >
              {selected && <Check className="size-3" aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
