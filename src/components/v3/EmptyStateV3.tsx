import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Part 1 — the near-empty page you land on before any process exists.
 * A single primary CTA opens the create modal. No on-ramp menu, no skip.
 */
export function EmptyStateV3({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <header className="flex items-center gap-2 px-6 py-5">
        <span className="grid size-7 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] font-serif text-[15px] font-semibold text-white">
          C
        </span>
        <span className="font-serif text-[19px] font-semibold tracking-tight">
          Common
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-dashed border-[var(--color-input)] bg-[var(--color-surface)] p-10 text-center">
          <p className="font-serif text-[20px] font-semibold leading-tight">
            No processes yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-[var(--color-muted-foreground)]">
            Start one and we'll show you how it could run on Common — piece by
            piece — then help you set it up.
          </p>
          <div className="mt-5 flex justify-center">
            <Button onClick={onNew}>
              <Plus aria-hidden />
              New process
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
