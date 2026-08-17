import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface Admin {
  id: string;
  /** Display name for people already on the process; invitees show their email. */
  name: string;
  email: string;
  you?: boolean;
}

/** Two initials from a name, or from an email's local part. */
function initials(a: Admin): string {
  const source = a.name || a.email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Adding another admin — its own small modal rather than a detour through a
 * settings screen, since it's the one thing an admin does mid-setup when they
 * realise they shouldn't be doing this alone.
 */
export function AdminModal({
  admins,
  onAdd,
  onRemove,
  onClose,
}: {
  admins: Admin[];
  onAdd: (email: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const trimmed = email.trim();
  const duplicate = admins.some((a) => a.email.toLowerCase() === trimmed.toLowerCase());
  const valid = /.+@.+\..+/.test(trimmed) && !duplicate;

  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold leading-tight">Add an admin</h2>
            <p className="mt-1 text-[14px] leading-snug text-[var(--color-muted-foreground)]">
              Admins have full, equal access to set up and run this process.
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

        <form
          className="mt-4 flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) {
              onAdd(trimmed);
              setEmail("");
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="admin-email" className="sr-only">
              Email address
            </label>
            <Input
              id="admin-email"
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organisation.org"
            />
            {duplicate && (
              <p className="mt-1.5 text-[13px] text-[var(--color-danger)]">
                They're already an admin.
              </p>
            )}
          </div>
          <Button type="submit" disabled={!valid}>
            Add
          </Button>
        </form>

        <ul className="mt-5 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {admins.map((a) => (
            <li key={a.id} className="group/adm flex items-center gap-3 py-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[13px] font-semibold text-[var(--color-primary)]"
                aria-hidden
              >
                {initials(a)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-tight">
                  {a.name || a.email}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-[var(--color-muted-foreground)]">
                  {a.name ? a.email : "Invited just now"}
                </span>
              </span>
              {a.you ? (
                <Badge tone="neutral" className="shrink-0">
                  You
                </Badge>
              ) : (
                <button
                  onClick={() => onRemove(a.id)}
                  aria-label={`Remove ${a.email}`}
                  className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover/adm:opacity-100"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
