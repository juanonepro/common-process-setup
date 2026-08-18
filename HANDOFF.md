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
| The "other process" question sequence + phase mapping | `src/components/v3/OtherQuestions.tsx`, `otherFlow.ts` |
| Fixed phase mappings per process type | `src/components/v3/pieces.ts` |
| Phase state model, defaults, toggles | `src/components/v3/phaseModel.ts` |
| Process page (the editable public page) | `src/components/v3/ProcessPage.tsx` |
| Per-phase setup page | `src/components/v3/PhaseSetup.tsx` |
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
  aren't even used.
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
  (6).
- `CreateModalV3.tsx` and `TransitionV3.tsx` are unreachable — leftovers from an
  earlier version. Ignore them.

## Suggested order

Take it in slices rather than all at once:

1. **Wizard** — entered from your existing Create menu, then intro → type →
   shape/questions → mapping walkthrough → name and access. Self-contained, and
   it's where the copy matters most.
2. **Process page** — the phase rail, the editable page content, the modals.
3. **Phase setup pages** — one shell, five bodies (form, rubric, proposal form,
   voting, results), plus the invitee tab.
