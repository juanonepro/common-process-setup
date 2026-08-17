import { X } from "lucide-react";
import { TYPE_META, processSubject, type ProcessType } from "./pieces";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";

/**
 * Part 2 — the full-screen takeover. The modal chrome is gone; a single X
 * (top-left) exits the whole flow. This proposes how the process could run,
 * then hands off to the walkthrough.
 */
export function TransitionV3({
  name,
  type,
  onExit,
  onWalk,
}: {
  name: string;
  type: ProcessType;
  onExit: () => void;
  onWalk: () => void;
}) {
  const m = TYPE_META[type];
  const subject = processSubject(name, type);

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
      <ExitButton onExit={onExit} />

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-xl text-center animate-fade-up"
          style={{ animationDuration: "0.5s" }}
        >
          <span className="mx-auto grid size-16 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Icon name={m.icon} className="size-7" aria-hidden />
          </span>

          <h1 className="mt-7 font-serif text-[34px] font-semibold leading-[1.15] tracking-tight text-balance">
            Here's how {subject} could run on Common
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[var(--color-muted-foreground)]">
            We'll walk through it piece by piece — what each does and what you
            can set up. You can adjust anything after.
          </p>

          <div className="mt-8 flex justify-center">
            <Button onClick={onWalk} className="px-6">
              Walk me through it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The persistent full-flow exit — top-left X. */
export function ExitButton({ onExit }: { onExit: () => void }) {
  return (
    <button
      onClick={onExit}
      aria-label="Exit"
      className="absolute left-5 top-5 z-20 grid size-9 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
    >
      <X className="size-5" aria-hidden />
    </button>
  );
}
