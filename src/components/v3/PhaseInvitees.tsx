import { useState } from "react";
import { MoreVertical, UserPlus, Users, X } from "lucide-react";
import type { Invitee, InviteeStatus } from "./phaseModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Another phase whose people can be carried across. */
export interface InviteeSource {
  id: string;
  name: string;
  /** "reviewers", "voters"… — what that phase calls them. */
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------
// The people invited to a phase. Rows carry where each person has got to —
// invited, joined, or done with whatever this phase asks of them — so the admin
// can see who still needs chasing without leaving the phase.
// ---------------------------------------------------------------------------

/** Two initials from an email's local part: "jamie.santos@…" → "JS". */
function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const chars = parts.length > 1 ? [parts[0][0], parts[1][0]] : [local[0], local[1] ?? ""];
  return chars.join("").toUpperCase();
}

/** A stable colour per person, so a face stays recognisable down the list. */
function avatarHue(email: string): number {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 360;
  return h;
}

function relativeTime(at: number, now: number): string {
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function PhaseInvitees({
  label,
  doneLabel,
  invitees,
  sources,
  onInvite,
  onCopyFrom,
  onRemove,
  onResend,
}: {
  label: { plural: string; lower: string };
  /** What finishing looks like here — "Submitted", "Voted"… or null. */
  doneLabel: string | null;
  invitees: Invitee[];
  /** Other phases that already have people, for reusing the same group. */
  sources: InviteeSource[];
  onInvite: () => void;
  onCopyFrom: (phaseId: string) => void;
  onRemove: (id: string) => void;
  onResend: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | InviteeStatus>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const now = Date.now();

  const copyPicker = copying && (
    <CopyFromPhase
      label={label}
      sources={sources}
      onPick={(id) => {
        onCopyFrom(id);
        setCopying(false);
      }}
      onClose={() => setCopying(false)}
    />
  );

  const statusLabel = (s: InviteeStatus) =>
    s === "done" ? (doneLabel ?? "Joined") : s === "joined" ? "Joined" : "Invited";

  const filters: { value: "all" | InviteeStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "invited", label: "Invited" },
    { value: "joined", label: "Joined" },
    ...(doneLabel ? [{ value: "done" as const, label: doneLabel }] : []),
  ];

  const shown = filter === "all" ? invitees : invitees.filter((i) => i.status === filter);

  if (invitees.length === 0) {
    return (
      <>
        <div className="mt-6 max-w-[700px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-sm">
          <p className="text-[15px] font-medium">No {label.lower} yet</p>
          <p className="mx-auto mt-1 max-w-[380px] text-[14px] leading-snug text-[var(--color-muted-foreground)]">
            Only the {label.lower} you invite can take part in this phase. You can add more at
            any time, before or after it opens.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onInvite}>
              <UserPlus aria-hidden />
              Invite {label.lower}
            </Button>
            {sources.length > 0 && (
              <Button variant="outline" onClick={() => setCopying(true)}>
                <Users aria-hidden />
                Use the same people as another phase
              </Button>
            )}
          </div>
        </div>
        {copyPicker}
      </>
    );
  }

  return (
    <div className="mt-6 max-w-[700px]">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = filter === f.value;
          const count =
            f.value === "all"
              ? invitees.length
              : invitees.filter((i) => i.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={cn(
                "h-8 rounded-full border px-3.5 text-[14px] font-medium transition-colors",
                active
                  ? "border-[var(--color-foreground)] bg-[var(--color-foreground)] text-white"
                  : "border-[var(--color-input)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
              )}
            >
              {f.label}
              <span className={cn("ml-1.5", active ? "text-white/70" : "text-[var(--color-muted-foreground)]")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        {shown.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-[var(--color-muted-foreground)]">
            No one here yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {shown.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: `hsl(${avatarHue(p.email)} 42% 40%)` }}
                  aria-hidden
                >
                  {initials(p.email)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-tight">{p.email}</span>
                  <span className="mt-0.5 block text-[13px] text-[var(--color-muted-foreground)]">
                    {statusLabel(p.status)} {relativeTime(p.at, now)}
                  </span>
                </span>
                <Badge
                  tone={p.status === "done" ? "success" : p.status === "joined" ? "pending" : "neutral"}
                  className="shrink-0"
                >
                  {statusLabel(p.status)}
                </Badge>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                    aria-label={`Actions for ${p.email}`}
                    aria-expanded={menuFor === p.id}
                    className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </button>
                  {menuFor === p.id && (
                    <>
                      {/* Click-away layer — closes the menu without a global listener. */}
                      <button
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setMenuFor(null)}
                      />
                      <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
                        <button
                          onClick={() => {
                            onResend(p.id);
                            setMenuFor(null);
                          }}
                          className="block w-full px-3 py-2 text-left text-[14px] hover:bg-[var(--color-muted)]"
                        >
                          Resend invite
                        </button>
                        <button
                          onClick={() => {
                            onRemove(p.id);
                            setMenuFor(null);
                          }}
                          className="block w-full px-3 py-2 text-left text-[14px] text-[var(--color-danger)] hover:bg-[var(--color-muted)]"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="compact" onClick={onInvite}>
          <UserPlus aria-hidden />
          Invite more
        </Button>
        {sources.length > 0 && (
          <Button variant="ghost" size="compact" onClick={() => setCopying(true)}>
            <Users aria-hidden />
            Add from another phase
          </Button>
        )}
      </div>

      {copyPicker}
    </div>
  );
}

/**
 * Reuse a group that's already been assembled elsewhere in the process — the
 * common case being the same panel reviewing and then voting. People come
 * across as freshly invited: joining one phase isn't joining another.
 */
function CopyFromPhase({
  label,
  sources,
  onPick,
  onClose,
}: {
  label: { plural: string; lower: string };
  sources: InviteeSource[];
  onPick: (phaseId: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold leading-tight">
              Use the same people as another phase
            </h2>
            <p className="mt-1 text-[14px] leading-snug text-[var(--color-muted-foreground)]">
              Everyone from the phase you pick is added here as invited {label.lower}. Anyone
              already on this list is skipped.
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
          {sources.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onPick(s.id)}
                className="flex w-full items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] p-3.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                  <Users className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium leading-tight">
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-[var(--color-muted-foreground)]">
                    {s.count} {s.count === 1 ? s.label.replace(/s$/, "") : s.label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
