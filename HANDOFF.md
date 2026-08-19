# Handoff — rebuilding this in the product

This repo is a **design prototype**, not a codebase to port. It's here so you can
read the behaviour, the rules and the copy, then implement them with the real
design system. Match components from your own library — don't carry across the
Tailwind, the tokens, or the primitives in `src/components/ui/`.

What follows is the part the code can't tell you: which choices are deliberate,
which are scaffolding, and what isn't real.

## Where to start reading

| Concern | File |
| --- | --- |
| Stage machine for the whole flow | `src/components/v3/CreateFlowV3.tsx` |
| Entry screen — **throwaway, see below** | `src/components/v3/EmptyStateV3.tsx` |
| Intro wizard (5 steps, incl. the branching pathways) | `src/components/v3/WizardV3.tsx` |
| The mapping walkthrough (step 4) | `src/components/v3/Walkthrough.tsx`, `PhaseRow.tsx` |
| The "other process" question sequence + phase mapping | `src/components/v3/OtherQuestions.tsx`, `otherFlow.ts` |
| Fixed phase mappings per process type | `src/components/v3/pieces.ts` |
| Phase state model, defaults, toggles | `src/components/v3/phaseModel.ts` |
| Process page (the editable public page) | `src/components/v3/ProcessPage.tsx` |
| Page content sections, pinned resources | `src/components/v3/PageSections.tsx` |
| Phase structure — add / delete / reorder | `src/components/v3/EditProcessModal.tsx` |
| Per-phase setup page | `src/components/v3/PhaseSetup.tsx` |
| Phase bodies — form, rubric, voting, invitees | `PhaseBuilders.tsx`, `PhaseVoting.tsx`, `PhaseInvitees.tsx` |
| Who owns phase state and structural edits | `src/components/v3/Workspace.tsx` |

All state is local React state. There is no store, no persistence, no backend —
reload and it's gone. That's a prototype constraint, not a design position.

## Deliberate rules — preserve these

These were each decided on purpose and are easy to mistake for arbitrary code.

**Publishing**
- `Publish process` is hidden until the Submissions phase has *both* at least one
  question and a start and end date. A process that can't run shouldn't be
  publishable. A process with no Submissions phase can therefore never publish —
  known, unresolved.
- Before that point, exactly one phase carries a filled CTA. Once publishing is
  available the emphasis drops: every unconfigured phase gets a quiet secondary
  CTA instead, and the row tint goes away.

**Phases**
- There is **no Save** on a phase page. Edits apply as made; leaving the page is
  what marks the phase set up and advances the rail's CTA.
- Access defaults: Review is always invite-only; every other phase inherits the
  audience chosen in the wizard.
- One Submissions phase and one Results phase per process — both drop out of the
  "add a phase" menu once present. Review, Develop and Voting can repeat.
- The last phase can't be deleted.

**Develop phases**
- "Add to previous form" copies the questions from the nearest earlier
  Submissions phase and **locks** them: shown, not editable, pinned above, with
  new questions added below. People already answered them.
- Which of "Add to previous form" / "New form" leads depends on process type:
  participatory budgeting develops a rough idea into something new, so a fresh
  form leads. Everywhere else the proposal builds on what was submitted.

**Grantmaking**
- The funding decision is a question, not an assumption (rubric / applicants vote
  / shortlist then vote). In the letter-of-intent shape only the **last** review
  is reshaped — the earlier one picks who advances, which happens either way.

**The "other" pathway**
- Four questions, no free text except "Something else". Picking several subjects
  forces a choice **only** when the process has a timeline; an always-open space
  covers all of them at once.
- Always-open maps to a single open-ended, invite-only intake with comment/like
  support — deliberately not a multi-phase process.

**Invitees**
- Copying a group from another phase brings people across as freshly *invited*.
  Joining one phase isn't joining another.
- The invitee tab badge shows `0` in a warning tone: an invite-only phase with
  nobody in it can't run.

## The entry point is not part of the design

`EmptyStateV3.tsx` — the empty page with a **New process** button in the middle
— exists only so the prototype has somewhere to start. It was never a proposal.

In the product, creating one of these starts the way it already does: the
**Create** button in the top right, then the **decision-making process** option.
Use that. Everything worth reviewing begins at the next screen, the intro
wizard.

So: drop the empty state entirely, and hang `WizardV3` off the existing Create
menu. `CreateFlowV3.tsx` treats `"empty"` as its first stage and returns there
on exit — both of those go away, and exiting should return wherever your Create
flow normally returns to.

## The wizard is a first-run experience

The intro wizard — the mapping walkthrough especially — is teaching material.
It's aimed at someone setting up their first process and learning what Common
does with one. Someone on their fifth shouldn't have to sit through the
explanation again.

**For now, keep showing it to everyone.** There's no repeat-user design yet, and
a half-guessed shortcut would be worse than the full run. Build it as it is, and
treat "what a returning admin sees instead" as known, designed later — don't
invent a skip link or a condition for it in this pass.

## The wizard, screen by screen

Five steps, each with Back, a progress line along the bottom, and one primary
action. Step 3 branches by process type and is a small sequence of its own — the
progress line advances through those sub-steps and Back walks out through them,
so it never feels like a different mechanism.

1. **Intro.** One screen setting up what's about to happen. Skippable content, not
   a form.
2. **What kind of process.** Three options: participatory grantmaking,
   participatory budgeting, other. `TYPE_META` in `pieces.ts` also contains an
   `election` type flagged `wired: false` — it is deliberately **not offered**.
   Don't surface it because you found it in the data.
3. **The branch.**
   - Grantmaking → how applications arrive (one full application, or a letter of
     intent first), then **who decides** what gets funded.
   - Participatory budgeting → what people submit first (rough ideas, or complete
     proposals).
   - Other → the four-question sequence described under *Deliberate rules*.
4. **The mapping walkthrough.** Every phase the answers produced, as a stack of
   cards: one expanded at a time, each with a plain-language description and a
   **"YOU CAN"** list underneath. This is the teaching moment the whole wizard
   exists for — someone learning what Common does with their process.
   - The phase names, descriptions and capability lists all live in `pieces.ts`
     and `otherFlow.ts`. Treat them as **content, not chrome**.
   - The capability lists are promises about what the product can do. Check them
     against what's actually shipped before this goes in front of anyone.
5. **Name and access.** Process name, who can submit (open to the public /
   invite only), and a *Make submissions private* toggle for admin-and-reviewer
   only visibility.
   - These aren't cosmetic: the audience answer seeds **every** phase (subject to
     the defaults rule — Review stays invite-only), and the privacy toggle sets
     the first Submissions phase's "show submissions to everyone" option.
   - Choosing an always-open process in the "other" pathway pre-selects invite
     only here, because that setup is for a named group.

## The process page is the live process page, in edit mode

`ProcessPage.tsx` is not a new screen. It's the **existing process page overview
layout** with editing turned on — the prototype only approximates it, because it
was built from a screenshot. Your current overview page is the source of truth
for the layout: same banner, same left rail, same content column, same grid,
spacing and type. Take it from the real page, not from mine.

The reason this matters: **publishing flips the same page into the
participant-facing, read-only view, and nothing should move.** Same containers,
same positions, same rhythm before and after. What changes is the editing
affordances, not the layout:

- inline editable fields become plain text — so the editable versions have to
  occupy the same box as the text they'll turn into, not a taller input
- the rail's per-phase "Set it up" buttons and the "Edit process" action drop
  away; the phases themselves stay exactly where they are
- Exit / Add admin / Preview / Publish give way to the live page's own chrome
- "Add a section" and the hover remove controls disappear once there's nothing
  to add

Treat any reflow between draft and published as a bug. If an edit control can't
sit in the same footprint as its read-only counterpart, reserve the space rather
than letting the page jump.

## What the process page actually sets up

Two zones, and the division between them is the point: the rail is **the
process**, the middle column is **the page participants will read**. Everything
is edited in place on the thing itself — there is no settings screen (see below).

**Left rail — the process**
- Every phase as a row: name, type, date window, and whether it's set up. Each
  row is the way into that phase's own setup page.
- `Edit process` opens the structure — add, delete, reorder phases. Structure
  lives there; the detail lives on the phase pages. Keeping those apart is
  deliberate, so the modal stays a skeleton view of the whole thing.
- Below that, **Pinned Resources** — guides, documents and links, added as title
  + URL, with an empty state until there's one.

**Middle column — the participant-facing page**
- Composed from sections: **About** by default, then **Events**, **FAQs** and
  free **Text** sections added through "Add a section".
- Section titles are fixed except for free text sections. Sections are removable
  on hover. Events and FAQs hold repeatable items.
- Helper text under a section heading only shows while that section is empty —
  it explains, then gets out of the way.
- An earlier version auto-listed the phases here as a "Phases" section. It was
  cut for being noisy: the rail already carries them. Don't reintroduce it.

**Banner**
- The process name is edited where it's read, inline in the banner — not in a
  settings form. Long names wrap at display size rather than scrolling.
- Under it, **Stewarded by** — who's accountable for the process — same
  principle: on the page, not buried.

**Top bar, in draft**
- Exit · `Draft` badge · Add admin · Preview · Publish (gated as above).
- Add admin is its own small modal (`AdminModal.tsx`), not a detour into a
  settings screen, because it's the thing someone does mid-setup when they
  realise they shouldn't be doing this alone. Email in, list below, hover-remove
  on everyone but you.

**There is no process-settings screen.** An earlier version had one (rename,
visibility, admins, export, duplicate, delete) and it was removed on purpose —
everything worth editing is on the page. The consequence is real and unresolved:
nothing in the prototype can delete a whole process or set its visibility. Those
need to come from the product's own patterns, not be reinvented here.

## Phase setup pages

Clicking a phase in the rail opens its own full page. Every phase type uses the
**same shell** — only the left pane changes. Keeping that shell identical is
deliberate: it's what makes five quite different setups read as one system.

**The shell**
- Top bar is the same height as the process page's, so moving between them
  doesn't jump. Just `Back` — which is also what saves (see below).
- Hero: the phase type in small caps, the phase name **inline-editable**, and one
  line saying what this page is for.
- Tabs sit under the hero, not in the top bar, and only exist when the phase is
  invite-only: the phase type, and the people tab with its count badge.
- Body is two panes: **left** is the thing this phase is for, **right** is the
  settings that govern it.
- `Delete this phase` at the very bottom, below a divider, away from the settings
  it would undo. Hidden when it's the only phase left.

**Left pane, per phase type**
- **Submissions → "Submission form".** The question builder. Empty state offers
  three routes: `Add a question` (primary), `Upload questions` (secondary — a
  stub), and `Questions from a previous process` (tertiary → picker of saved
  question sets).
- **Review → "Scoring rubric".** Same builder shape, for criteria. Reviewers
  answer with a Rating scale, Yes / No, or Text. Reuse from a previous process is
  offered the same way.
- **Develop → "Proposal form".** The submissions builder plus the locked
  carry-over rule described under *Deliberate rules*.
- **Voting → "How voting works".** An ordered list of ways to vote — **more than
  one can run in the same phase** (spread a budget, then rank what's left).
  Numbered and reorderable once there are two; "Spread a budget" carries a total,
  "Pick a set number" carries a count.
- **Results → "How results are shown".** Just the titles of what won, or the full
  entries as submitted.

**The field editor** — one component behind all three builders, wording adapted
per context ("Question" vs "Criterion", "How should people answer this?" vs "How
should reviewers score this?"):
- Name, required, capped at 50 characters with a live counter.
- Description is **optional and folded away** behind "Add description" — the
  common case is a name and an answer type, two decisions rather than four.
- Answer type as radio pills, a `Required?` toggle, and Delete.
- Drag to reorder (mouse only in the prototype — see *Scaffolding*).

**Right pane — always in this order: when it runs, options, access.** Access is
last on purpose; dates are what every admin looks for first.
- **When it runs** is labelled per phase (Submission window, Review period,
  Development period, Voting window, When results are shared). Empty state is a
  single `Add dates` button; once open, Opens / Closes plus a line naming the
  previous phase and when it ends — the thing you're actually dating against.
- **Options** are the per-phase toggles in `TOGGLES` (`phaseModel.ts`).
- **Access** is one `Invite only` toggle. Switching it on reveals the people tab;
  switching it off hides the tab but keeps the list, so it's not destructive.

**The people tab** — named for the phase: Participants, Reviewers, Voters
(Results uses Participants).
- Filter chips with counts: All / Invited / Joined / and the phase's own finished
  state — Submitted, Reviewed, Voted. Results has no finished state.
- Rows: initials avatar, email, "Invited 4 minutes ago", a status badge, and a ⋮
  menu with Resend invite / Remove.
- Two ways in: invite by email (one per line or comma-separated), or
  `Use the same people as another phase`, which copies them across as freshly
  invited.
- Only *Invited* can occur in a draft — Joined and Submitted need a live process.
  The model and rendering support all three so they fill in later.

## Stubs — don't rebuild these as they are

These open a "not wired up in this prototype" dialog. Wire them to something
real or leave them out; don't port the placeholder.

- Preview, Publish process, Edit banner (process page)
- Upload questions (submission form)
- Resend invite (invitee row menu)

Prototype-only data that should come from the product instead:

- `savedSets.ts` — the "questions/rubric from a previous process" library is
  invented. Real version reads the org's own history.
- The seeded admin (`Lorena Reyes`) and the "Stewarded by" options in
  `ProcessPage.tsx`.

## Scaffolding — replace, don't preserve

- `src/components/ui/*` — thin local primitives. `card.tsx` and `sheet.tsx`
  aren't even used. `Icon.tsx` resolves lucide icons by name at runtime, which
  ships the whole icon set — use your own icon component.
- `src/index.css` `@theme` block — prototype tokens, and ~160 hardcoded
  `text-[15px]`-style sizes across the screens because there's no named type
  scale. Use your ramp.
- **Hand-rolled interaction patterns, weakest part of the prototype.** Use your
  design system's versions: the dialog has no focus trap and no focus restore;
  menus close on outside click but not Escape or arrow keys; the phase tabs use
  `role="tab"` without keyboard navigation; drag-to-reorder is mouse-only with
  no keyboard alternative.
- Duplicated inline patterns that should each be one component: click-away
  popovers (3 copies), `IconButton` (2), dashed "add" rows (5), pills and chips
  (6). `WizardBits.tsx` and `PhaseSettings.tsx` are the prototype's own local
  primitives — same treatment.
- Motion is incidental, not designed: the process page fades in on arrival and
  process ↔ phase navigation uses a View Transition crossfade. Use whatever your
  product does; nothing depends on it.
- `CreateModalV3.tsx` and `TransitionV3.tsx` are unreachable — leftovers from an
  earlier version. Ignore them.

## Suggested order

Take it in slices rather than all at once:

1. **Wizard** — entered from your existing Create menu, then intro → type →
   shape/questions → mapping walkthrough → name and access. Self-contained, and
   it's where the copy matters most.
2. **Process page** — start from your live overview layout and add the edit
   mode on top of it, rather than building the draft page and retrofitting the
   published one.
3. **Phase setup pages** — one shell, five bodies (form, rubric, proposal form,
   voting, results), plus the people tab. Build the shell and the field editor
   first; the five bodies are small once those exist.
