import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  ImagePlus,
  Link2,
  Pencil,
  Plus,
  Settings,
  UserPlus,
  X,
} from "lucide-react";
import type { PhaseType } from "./pieces";
import { PHASE_TYPE_ICON } from "./pieces";
import type { PhaseInstance } from "./phaseModel";
import { EditProcessModal } from "./EditProcessModal";
import { AdminModal, type Admin } from "./AdminModal";
import {
  DashedEmptyState,
  PageContent,
  defaultSections,
  type PageSection,
} from "./PageSections";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatShortDate, uid } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  link: string;
}

/** Who's accountable for the process — sits under the name on the page. */
const STEWARDS = ["One Project", "Lorena Reyes (you)", "A partner organization"];

/**
 * Part 5 — the process page. This is the same page participants will read once
 * the process is live, shown to the admin in draft/edit mode: the phase rail on
 * the left, the page content in the middle, both editable in place. There is no
 * separate "config screen" and "home page" any more — you edit the real thing.
 *
 * Draft mode differs from the live page in its chrome: Exit instead of Back, no
 * Overview/Current phase switch, and Preview + Publish in place of the account
 * cluster. The banner carries the process name (editable) and nothing else —
 * the description and participant CTAs only exist once it's live.
 */
export function ProcessPage({
  name,
  phases,
  entering,
  onExit,
  onRename,
  onOpenPhase,
  onAddPhase,
  onDeletePhase,
  onMovePhase,
}: {
  name: string;
  phases: PhaseInstance[];
  entering: boolean;
  onExit: () => void;
  onRename: (name: string) => void;
  onOpenPhase: (p: PhaseInstance) => void;
  onAddPhase: (t: PhaseType) => void;
  onDeletePhase: (id: string) => void;
  onMovePhase: (id: string, direction: -1 | 1) => void;
}) {
  const [sections, setSections] = useState<PageSection[]>(defaultSections);
  const [steward, setSteward] = useState(STEWARDS[0]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([
    { id: "admin-you", name: "Lorena Reyes", email: "lorena@example.org", you: true },
  ]);
  const [placeholder, setPlaceholder] = useState<{ title: string; body: string } | null>(null);

  // Publishing opens the first phase, so it only makes sense once that phase can
  // actually run: something to fill in, and a window to do it in. Until then the
  // action isn't offered at all.
  const canPublish = phases.some(
    (p) => p.phaseType === "Submissions" && p.fields.length > 0 && !!p.startDate && !!p.endDate,
  );

  const enter = (order: number): React.CSSProperties =>
    entering ? { animationDuration: "0.5s", animationDelay: `${order * 80}ms` } : {};
  const enterCls = entering ? "animate-fade-up" : "";

  const stub = (t: string, body: string) => () => setPlaceholder({ title: t, body });

  return (
    <div className="flex h-screen flex-col bg-[var(--color-surface)]">
      {/* Top bar — draft chrome: exit, the draft marker, and the actions that
          matter before launch. The page itself carries the name. */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="compact" onClick={onExit}>
            <X aria-hidden />
            Exit
          </Button>
          <span className="h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden />
          <Badge tone="neutral" className="shrink-0">
            Draft
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="compact" onClick={() => setAdminOpen(true)}>
            <UserPlus aria-hidden />
            Add admin
          </Button>
          <Button
            variant="outline"
            size="compact"
            onClick={stub(
              "Preview",
              "This shows the page exactly as participants will see it once the process is live. It isn't wired up in this prototype.",
            )}
          >
            <Eye aria-hidden />
            Preview
          </Button>
          {/* Publish appears once the submissions phase is set up. */}
          {canPublish && (
            <Button
              size="compact"
              onClick={stub(
                "Publish process",
                "Publishing makes the page public and opens the first phase. It isn't wired up in this prototype.",
              )}
            >
              Publish process
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {/* Banner — the process name, editable in place. No description or
            participant buttons in draft: those belong to the live page. */}
        <section
          className={cn(
            "relative border-b border-[var(--color-border)] bg-[var(--color-muted)] px-6 py-14",
            enterCls,
          )}
          style={enter(0)}
        >
          <Button
            variant="outline"
            size="compact"
            className="absolute right-5 top-5"
            onClick={stub(
              "Edit banner",
              "This is where you'd set the banner image and colours for the page. It isn't wired up in this prototype.",
            )}
          >
            <ImagePlus aria-hidden />
            Edit banner
          </Button>
          <div className="mx-auto max-w-[620px]">
            <BannerName name={name} onRename={onRename} />
            <StewardSelect value={steward} onChange={setSteward} />
          </div>
        </section>

        <main
          className={cn(
            "mx-auto grid max-w-[1000px] gap-x-12 gap-y-10 px-6 py-10 md:grid-cols-[264px_1fr]",
            enterCls,
          )}
          style={enter(1)}
        >
          {/* Left rail — the process itself, then what's pinned beside it. */}
          <aside className="space-y-8">
            <section>
              <RailLabel>Process Overview</RailLabel>
              <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                {phases.map((phase, i) => (
                  <PhaseRow
                    key={phase.id}
                    phase={phase}
                    /* Before the process can run, one phase leads with a filled
                       CTA. After that the remaining phases are all optional
                       polish, so each offers a quiet way in instead. */
                    cta={
                      canPublish
                        ? !phase.configured
                        : i === phases.findIndex((p) => !p.configured)
                    }
                    emphasis={!canPublish}
                    onOpen={() => onOpenPhase(phase)}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="compact"
                className="mt-2 -ml-2 text-[var(--color-muted-foreground)]"
                onClick={() => setEditOpen(true)}
              >
                <Settings aria-hidden />
                Edit process
              </Button>
            </section>

            <section>
              <RailLabel>Pinned Resources</RailLabel>
              {resources.length === 0 ? (
                <DashedEmptyState
                  message="Nothing pinned yet — add the guides, documents, and links people need."
                  actionLabel="Add a resource"
                  onAction={() => setResourceOpen(true)}
                />
              ) : (
                <>
                  <ul className="space-y-2">
                    {resources.map((r) => (
                      <li
                        key={r.id}
                        className="group/res flex items-start gap-2 rounded-[var(--radius)] border border-[var(--color-border)] p-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium leading-tight">
                            {r.title}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-muted-foreground)]">
                            <Link2 className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{r.link || "No link yet"}</span>
                          </span>
                        </span>
                        <button
                          onClick={() => setResources((x) => x.filter((i) => i.id !== r.id))}
                          aria-label={`Remove ${r.title}`}
                          className="grid size-7 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover/res:opacity-100"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setResourceOpen(true)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] hover:underline"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add a resource
                  </button>
                </>
              )}
            </section>
          </aside>

          {/* The page body — what used to be the separate home page editor. */}
          <PageContent sections={sections} onChange={setSections} />
        </main>
      </div>

      {resourceOpen && (
        <ResourceDialog
          onAdd={(r) => {
            setResources((x) => [...x, { ...r, id: uid("res") }]);
            setResourceOpen(false);
          }}
          onClose={() => setResourceOpen(false)}
        />
      )}

      {editOpen && (
        <EditProcessModal
          phases={phases}
          onAdd={onAddPhase}
          onDelete={onDeletePhase}
          onMove={onMovePhase}
          onClose={() => setEditOpen(false)}
        />
      )}

      {adminOpen && (
        <AdminModal
          admins={admins}
          onAdd={(email) => setAdmins((a) => [...a, { id: uid("admin"), name: "", email }])}
          onRemove={(id) => setAdmins((a) => a.filter((x) => x.id !== id))}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {placeholder && (
        <PlaceholderDialog
          title={placeholder.title}
          body={placeholder.body}
          onClose={() => setPlaceholder(null)}
        />
      )}
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[13px] font-medium text-[var(--color-muted-foreground)]">
      {children}
    </p>
  );
}

/** The banner heading — the process name, edited where it's read. A textarea so
 * a long name wraps at display size instead of scrolling out of view. */
function BannerName({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  // Grow to fit the wrapped text; measured on every render so it's right after
  // an external rename (settings modal) too, not just on typing.
  const fit = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="group relative">
      <textarea
        ref={fit}
        rows={1}
        value={name}
        onChange={(e) => {
          fit(e.currentTarget);
          onRename(e.target.value);
        }}
        aria-label="Process name"
        placeholder="Name your process"
        className="w-full resize-none overflow-hidden rounded-[var(--radius)] bg-transparent px-3 py-1 text-center font-serif text-[40px] font-semibold leading-tight tracking-tight text-[var(--color-primary)] outline-none transition-colors placeholder:text-[var(--color-primary)]/35 hover:bg-[var(--color-surface)]/70 focus:bg-[var(--color-surface)]"
      />
      <Pencil
        className="pointer-events-none absolute right-1 top-2.5 size-4 text-[var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

/** Who's accountable for the process, chosen where it's read: one quiet line
 * under the name rather than a field buried in settings. */
function StewardSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <p className="mt-1 flex items-center justify-center gap-1.5 text-[15px] text-[var(--color-muted-foreground)]">
      <label htmlFor="steward">Stewarded by</label>
      <span className="relative inline-flex items-center">
        <select
          id="steward"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-[var(--radius-sm)] bg-transparent py-0.5 pl-1.5 pr-6 text-[15px] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]/70 focus:bg-[var(--color-surface)]"
        >
          {STEWARDS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1.5 size-4 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
      </span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// The phase rail
// ---------------------------------------------------------------------------

/** ISO dates → "Jun 15 – Jul 30"; falls back to whatever half is set. */
function windowLabel(phase: PhaseInstance): string {
  const { startDate: from, endDate: to } = phase;
  if (from && to) return `${formatShortDate(from)} – ${formatShortDate(to)}`;
  if (from) return `Opens ${formatShortDate(from)}`;
  if (to) return `Closes ${formatShortDate(to)}`;
  return "No dates set";
}

/**
 * A phase in the rail. Status at a glance and a way in — but the list is read
 * far more often than it's clicked, so the rows carry no frame of their own:
 * hairlines separate them, and only the phase that needs attention is filled.
 */
function PhaseRow({
  phase,
  cta,
  emphasis,
  onOpen,
}: {
  phase: PhaseInstance;
  /** Show the "Set it up" button on this row. */
  cta: boolean;
  /** Fill the row and the button — the one phase that has to happen next. */
  emphasis: boolean;
  onOpen: () => void;
}) {
  const done = phase.configured;
  const lead = cta && emphasis;
  return (
    <div
      className={cn(
        "group/phase px-3 py-3 transition-colors",
        lead ? "bg-[var(--color-primary-soft)]/60" : "hover:bg-[var(--color-muted)]/60",
      )}
    >
      <button onClick={onOpen} className="flex w-full items-start gap-2 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 truncate font-serif text-[18px] font-semibold leading-tight">
              {phase.name || "Untitled phase"}
            </span>
            {done && (
              <CheckCircle2
                className="size-4 shrink-0 text-[var(--color-success)]"
                aria-label="Set up"
              />
            )}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-muted-foreground)]">
            <Icon
              name={PHASE_TYPE_ICON[phase.phaseType]}
              className="size-3.5 shrink-0"
              aria-hidden
            />
            <span className="truncate">
              {phase.phaseType} · {windowLabel(phase)}
            </span>
          </span>
        </span>
        {!cta && (
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-[var(--color-muted-foreground)] opacity-0 transition-opacity group-hover/phase:opacity-100 group-focus-within/phase:opacity-100"
            aria-hidden
          />
        )}
      </button>
      {cta && (
        <Button
          variant={lead ? "default" : "secondary"}
          size="compact"
          className="mt-2.5 w-full"
          onClick={onOpen}
        >
          Set it up
          <ArrowRight aria-hidden />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

function ResourceDialog({
  onAdd,
  onClose,
}: {
  onAdd: (r: { title: string; link: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onAdd({ title: title.trim(), link: link.trim() });
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-[20px] font-semibold leading-tight">Add a resource</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="res-title" className="mb-1.5 block text-[14px] font-medium">
              Title
            </label>
            <Input
              id="res-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Location guide"
            />
          </div>
          <div>
            <label htmlFor="res-link" className="mb-1.5 block text-[14px] font-medium">
              Link
            </label>
            <Input
              id="res-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Add resource
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PlaceholderDialog({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-[20px] font-semibold leading-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
          {body}
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </Dialog>
  );
}
