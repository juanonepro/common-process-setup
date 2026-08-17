import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { PHASE_TYPE_ICON, type ProcessType } from "./pieces";
import {
  DONE_LABEL,
  INVITEE_LABEL,
  PAGE_DESCRIPTION,
  TOGGLES,
  bodyKindFor,
  isBuilderKind,
  type BodyKind,
  type FormField,
  type PhaseInstance,
} from "./phaseModel";
import { PhaseInvitees } from "./PhaseInvitees";
import { VotingMethods } from "./PhaseVoting";
import { FORM_SETS, RUBRIC_SETS } from "./savedSets";
import { FormBuilder, RubricBuilder, type FieldCopy } from "./PhaseBuilders";
import { DatesSection, OptionRows, SettingsCard, ToggleRow } from "./PhaseSettings";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { cn, formatShortDate, uid } from "@/lib/utils";

/** One field editor, three contexts — only the wording changes. */
const FIELD_COPY: Partial<Record<BodyKind, FieldCopy>> = {
  form: {
    nameLabel: "Question",
    namePlaceholder: "What are you asking for?",
    descriptionPlaceholder: "Provide additional guidance for participants…",
    answerLabel: "How should people answer this?",
    requiredLabel: "Required?",
  },
  requirements: {
    nameLabel: "Question",
    namePlaceholder: "What should the proposal cover?",
    descriptionPlaceholder: "Provide additional guidance for participants…",
    answerLabel: "How should people answer this?",
    requiredLabel: "Required?",
  },
  rubric: {
    nameLabel: "Criterion",
    namePlaceholder: "What are reviewers judging?",
    descriptionPlaceholder: "Explain what reviewers should look for…",
    answerLabel: "How should reviewers score this?",
    requiredLabel: "Required?",
  },
};

/** The left pane's heading — what this phase is actually for. */
const BODY_TITLE: Record<BodyKind, string> = {
  form: "Submission form",
  rubric: "Scoring rubric",
  requirements: "Proposal form",
  voting: "How voting works",
  results: "How results are shown",
};

const BODY_SUBTITLE: Record<BodyKind, string> = {
  form: "Drag to reorder. This is what people fill in.",
  rubric: "Drag to reorder. Reviewers score each one.",
  requirements: "Drag to reorder. This is what people fill in.",
  voting: "How people decide between what's in front of them.",
  results: "What participants see when the outcome is published.",
};

/** The dedicated dates section's label, per phase. */
const WINDOW_LABEL: Record<BodyKind, string> = {
  form: "Submission window",
  rubric: "Review period",
  requirements: "Development period",
  voting: "Voting window",
  results: "When results are shared",
};

type Tab = "setup" | "people";

/**
 * The phase-setup page. One consistent shell for every phase — a top bar the
 * same height as the process page's so moving between them doesn't jump, then a
 * hero with an inline-editable name; only the body adapts. There's no Save:
 * edits apply as they're made, and Back returns to the process page.
 *
 * An invite-only phase gains a second tab under the hero for the people invited
 * to it, named for the phase (reviewers, voters, participants), plus an invite
 * CTA in the bar so it's reachable from either tab.
 */
export function PhaseSetup({
  phase,
  otherPhases,
  previousForm,
  previousPhase,
  processType,
  onPatch,
  onBack,
  onDelete,
  canDelete,
}: {
  phase: PhaseInstance;
  /** The rest of the process — for reusing a group already invited elsewhere. */
  otherPhases: PhaseInstance[];
  /** The form filled in earlier in this process, for a Develop phase to build on. */
  previousForm?: { name: string; fields: FormField[] };
  /** The phase that runs immediately before this one, for dating this one. */
  previousPhase?: { name: string; endDate: string };
  processType: ProcessType;
  onPatch: (patch: Partial<PhaseInstance>) => void;
  onBack: () => void;
  /** Removes the phase from the process and returns to the process page. */
  onDelete: () => void;
  /** False when this is the only phase left — a process needs one. */
  canDelete: boolean;
}) {
  const kind = bodyKindFor(phase.phaseType);
  const builder = isBuilderKind(kind);
  const people = INVITEE_LABEL[phase.phaseType];
  const inviteOnly = phase.audience === "invite";
  const [tab, setTab] = useState<Tab>("setup");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Dropping out of invite-only takes its tab with it.
  const activeTab: Tab = inviteOnly ? tab : "setup";

  const addEmails = (emails: string[]) => {
    const known = new Set(phase.invitees.map((i) => i.email));
    const added = emails
      .filter((e) => !known.has(e))
      .map((email) => ({ id: uid("inv"), email, status: "invited" as const, at: Date.now() }));
    onPatch({ invitees: [...phase.invitees, ...added] });
    setTab("people");
  };

  const invite = (emails: string[]) => {
    addEmails(emails);
    setInviteOpen(false);
  };

  // Phases whose group can be carried over — only those with someone in them.
  const sources = otherPhases
    .filter((p) => p.invitees.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name || "Untitled phase",
      label: INVITEE_LABEL[p.phaseType].lower,
      count: p.invitees.length,
    }));

  const copyFrom = (phaseId: string) => {
    const src = otherPhases.find((p) => p.id === phaseId);
    if (src) addEmails(src.invitees.map((i) => i.email));
  };

  // Shared setting blocks — identical in the side panel and the single column.
  const accessCard = (
    <SettingsCard label="Access">
      <ToggleRow
        title="Invite only"
        helper={`On limits this phase to the ${people.lower} you invite. Off opens it to anyone taking part.`}
        checked={inviteOnly}
        onChange={(v) => onPatch({ audience: v ? "invite" : "anyone" })}
      />
    </SettingsCard>
  );
  const toggleCard = (label: string, defs = TOGGLES[kind]) => (
    <SettingsCard label={label}>
      {defs.map((t) => (
        <ToggleRow
          key={t.key}
          title={t.title}
          helper={t.helper}
          checked={!!phase.toggles[t.key]}
          onChange={(v) => onPatch({ toggles: { ...phase.toggles, [t.key]: v } })}
        />
      ))}
    </SettingsCard>
  );
  const datesCard = (
    <DatesSection
      label={WINDOW_LABEL[kind] ?? "When it's open"}
      startDate={phase.startDate}
      endDate={phase.endDate}
      onStart={(d) => onPatch({ startDate: d })}
      onEnd={(d) => onPatch({ endDate: d })}
      hint={
        previousPhase
          ? previousPhase.endDate
            ? `“${previousPhase.name || "The phase before"}” ends ${formatShortDate(previousPhase.endDate)}.`
            : `“${previousPhase.name || "The phase before"}” runs before this one and has no dates yet.`
          : undefined
      }
    />
  );

  return (
    <div className="flex h-screen flex-col bg-[var(--color-muted)]">
      {/* Top bar — same height as the process page's: compact controls, py-2.5. */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5">
        <Button variant="ghost" size="compact" onClick={onBack}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        {inviteOnly && (
          <Button variant="outline" size="compact" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden />
            Invite {people.lower}
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {/* One width for every phase and every tab, so nothing shifts when you
            move between them. */}
        <div className="mx-auto max-w-[1040px] px-6 py-8">
          {/* Hero — identical shell for every phase. */}
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon name={PHASE_TYPE_ICON[phase.phaseType]} className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                {phase.phaseType}
              </p>
              <EditableName name={phase.name} onRename={(n) => onPatch({ name: n })} />
              <p className="mt-1 text-[14px] text-[var(--color-muted-foreground)]">
                {PAGE_DESCRIPTION[kind]}
              </p>
            </div>
          </div>

          {/* Tabs sit under the hero — they switch what this phase shows, so
              they belong to the page, not the app chrome. */}
          {inviteOnly && (
            <div
              role="tablist"
              aria-label="Phase sections"
              className="mt-6 flex items-center gap-6 border-b border-[var(--color-border)]"
            >
              {(
                [
                  ["setup", phase.phaseType, null],
                  ["people", people.plural, phase.invitees.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={activeTab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "-mb-px border-b-2 pb-2.5 text-[15px] font-medium transition-colors",
                    activeTab === value
                      ? "border-[var(--color-primary)] text-[var(--color-foreground)]"
                      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {label}
                  {!!count && (
                    <span className="ml-1.5 text-[13px] text-[var(--color-primary)]">{count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === "people" ? (
            <PhaseInvitees
              label={people}
              doneLabel={DONE_LABEL[phase.phaseType]}
              invitees={phase.invitees}
              sources={sources}
              onInvite={() => setInviteOpen(true)}
              onCopyFrom={copyFrom}
              onRemove={(id) => onPatch({ invitees: phase.invitees.filter((i) => i.id !== id) })}
              onResend={(id) =>
                onPatch({
                  invitees: phase.invitees.map((i) =>
                    i.id === id ? { ...i, at: Date.now() } : i,
                  ),
                })
              }
            />
          ) : (
            /* Every phase shares one shape: the thing this phase is for on the
               left, the settings that govern it on the right. */
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <h2 className="font-serif text-[18px] font-semibold leading-tight">
                  {BODY_TITLE[kind]}
                </h2>
                <p className="mt-1 text-[13px] text-[var(--color-muted-foreground)]">
                  {BODY_SUBTITLE[kind]}
                </p>
                <div className="mt-4">
                  {kind === "rubric" ? (
                    <RubricBuilder
                      criteria={phase.criteria}
                      onChange={(c) => onPatch({ criteria: c })}
                      copy={FIELD_COPY.rubric!}
                      sets={RUBRIC_SETS}
                    />
                  ) : builder ? (
                    <FormBuilder
                      fields={phase.fields}
                      onChange={(f) => onPatch({ fields: f })}
                      addLabel="Add a question"
                      emptyText={
                        kind === "requirements" ? "No proposal form yet." : "No questions yet."
                      }
                      copy={FIELD_COPY[kind]!}
                      sets={kind === "form" ? FORM_SETS : undefined}
                      previous={kind === "requirements" ? previousForm : undefined}
                      /* A PB process develops a rough idea into something new,
                         so a fresh form leads. Everywhere else the proposal
                         builds on what was already submitted. */
                      previousLeads={processType !== "pb"}
                    />
                  ) : kind === "voting" ? (
                    <VotingMethods
                      methods={phase.voteMethods}
                      budget={phase.budget}
                      pickCount={phase.pickCount}
                      onChange={(m) => onPatch({ voteMethods: m })}
                      onBudget={(v) => onPatch({ budget: v })}
                      onPickCount={(v) => onPatch({ pickCount: v })}
                    />
                  ) : (
                    /* results — how much of what won people get to see. */
                    <OptionRows
                      options={[
                        {
                          value: "titles",
                          label: "Just the titles",
                          helper: "A list of what won, by name. Quickest to read and nothing more to review.",
                        },
                        {
                          value: "full",
                          label: "The full proposals",
                          helper: "Each winning entry in full, as it was submitted — questions, answers, and attachments.",
                        },
                      ]}
                      value={phase.resultsDisplay}
                      onChange={(v) => onPatch({ resultsDisplay: v })}
                    />
                  )}
                </div>
              </div>
              {/* Dates first — the thing every admin looks for — then the
                  phase's options, with who can reach it last. */}
              <aside className="space-y-4 self-start lg:sticky lg:top-4">
                {datesCard}
                {toggleCard("Options")}
                {accessCard}
              </aside>
            </div>
          )}

          {/* Removing the phase is the last thing on the page, away from the
              settings it would undo. */}
          {activeTab === "setup" && canDelete && (
            <div className="mt-10 border-t border-[var(--color-border)] pt-5">
              <Button
                variant="ghost"
                size="compact"
                className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden />
                Delete this phase
              </Button>
            </div>
          )}
        </div>
      </div>

      {inviteOpen && (
        <InviteDialog
          label={people}
          onInvite={invite}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(false)} className="max-w-md">
          <div className="p-6">
            <h2 className="font-serif text-[20px] font-semibold leading-tight">
              Delete “{phase.name || "this phase"}”?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              This removes the phase and everything set up in it — its{" "}
              {kind === "rubric" ? "criteria" : "questions"}, dates, options
              {phase.invitees.length > 0 && `, and ${phase.invitees.length} invited ${people.lower}`}
              . The rest of your process is untouched.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                Delete phase
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function InviteDialog({
  label,
  onInvite,
  onClose,
}: {
  label: { plural: string; lower: string };
  onInvite: (emails: string[]) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const emails = text
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (emails.length) onInvite(emails);
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-[20px] font-semibold leading-tight">
            Invite {label.lower}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-[14px] text-[var(--color-muted-foreground)]">
          One email per line, or separated by commas.
        </p>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={`${label.plural} to invite`}
          placeholder={"maria@example.org\nsam@example.org"}
          className="mt-3 min-h-28"
        />
        <div className="mt-5 flex items-center justify-end gap-2">
          {emails.length > 0 && (
            <span className="mr-auto text-[13px] text-[var(--color-muted-foreground)]">
              {emails.length} {emails.length === 1 ? "person" : "people"}
            </span>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!emails.length}>
            Send invites
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** The hero phase name — inline-editable, auto-sizing, updates everywhere. */
function EditableName({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <input
      autoFocus
      value={name}
      size={Math.max(name.length, 6)}
      onChange={(e) => onRename(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") setEditing(false);
      }}
      placeholder="Phase name"
      className="mt-0.5 border-b-2 border-[var(--color-primary)] bg-transparent font-serif text-[28px] font-semibold leading-tight tracking-tight outline-none [field-sizing:content]"
    />
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="group -mx-1.5 mt-0.5 flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-left transition-colors hover:bg-[var(--color-muted)]"
    >
      <span className="font-serif text-[28px] font-semibold leading-tight tracking-tight">
        {name || "Untitled phase"}
      </span>
      <Pencil
        className="size-4 shrink-0 text-[var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}
