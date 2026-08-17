import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createPhase, makePhaseInstances, type PhaseInstance } from "./phaseModel";
import type { PhaseType } from "./pieces";
import { ProcessPage } from "./ProcessPage";
import { PhaseSetup } from "./PhaseSetup";
import type { WizardDraft } from "./WizardV3";

/** Wrap a state change in a View Transition when the browser supports one. The
 * DOM update runs either way; only the animation is skipped if the transition
 * can't run (e.g. the tab is hidden), and its abort rejection is swallowed. */
function withViewTransition(fn: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => {
      finished?: Promise<unknown>;
      ready?: Promise<unknown>;
      updateCallbackDone?: Promise<unknown>;
    };
  };
  if (typeof doc.startViewTransition !== "function") {
    fn();
    return;
  }
  try {
    const t = doc.startViewTransition(() => flushSync(fn));
    const swallow = () => {};
    t?.finished?.catch(swallow);
    t?.ready?.catch(swallow);
    t?.updateCallbackDone?.catch(swallow);
  } catch {
    fn();
  }
}

/** Build the editable phases from the wizard's answers: every phase inherits
 * the audience chosen there (except Review, which is invite-only by default),
 * and the first submissions phase also carries the privacy answer. */
function initialPhases(draft: WizardDraft): PhaseInstance[] {
  const base = makePhaseInstances(draft.pieces, draft.audience);
  let seeded = false;
  return base.map((p) => {
    if (!seeded && p.phaseType === "Submissions") {
      seeded = true;
      return { ...p, toggles: { ...p.toggles, showToAll: !draft.submissionsPrivate } };
    }
    return p;
  });
}

/**
 * The process config surface: the process page and the per-phase setup pages.
 * The process page stays mounted (its state persists) but is hidden while a
 * phase is open, so a View Transition can crossfade into the phase page and back.
 */
export function Workspace({
  draft,
  onExit,
  onRename,
}: {
  draft: WizardDraft;
  onExit: () => void;
  onRename: (name: string) => void;
}) {
  const [phases, setPhases] = useState<PhaseInstance[]>(() => initialPhases(draft));
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [entering, setEntering] = useState(true);

  // Let the arrival entrance play once, then stop animating on later renders.
  useEffect(() => {
    const t = window.setTimeout(() => setEntering(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const patchPhase = (id: string, patch: Partial<PhaseInstance>) =>
    setPhases((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const openPhase = (p: PhaseInstance) => withViewTransition(() => setActivePhaseId(p.id));

  // There's no Save on the phase page — edits apply as they're made — so
  // leaving a phase is what marks it set up and moves the rail's CTA on.
  const closePhase = () => {
    if (activePhaseId) patchPhase(activePhaseId, { configured: true });
    withViewTransition(() => setActivePhaseId(null));
  };

  // Structure edits — from the edit-process modal, or a phase deleting itself.
  const addPhase = (t: PhaseType) =>
    setPhases((ps) => [...ps, createPhase(t, draft.audience)]);

  const deletePhase = (id: string) => {
    if (id === activePhaseId) withViewTransition(() => setActivePhaseId(null));
    setPhases((ps) => ps.filter((p) => p.id !== id));
  };

  const movePhase = (id: string, direction: -1 | 1) =>
    setPhases((ps) => {
      const from = ps.findIndex((p) => p.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ps.length) return ps;
      const next = ps.slice();
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const active = phases.find((p) => p.id === activePhaseId) ?? null;

  // The last form people filled in before the open phase — what a Develop phase
  // offers to build its proposal form on.
  const activeIndex = phases.findIndex((p) => p.id === activePhaseId);
  const previousPhase =
    activeIndex > 0
      ? phases
          .slice(0, activeIndex)
          .reverse()
          .find((p) => p.phaseType === "Submissions" && p.fields.length > 0)
      : undefined;
  const previousForm = previousPhase
    ? { name: previousPhase.name || "the earlier form", fields: previousPhase.fields }
    : undefined;

  // The phase directly before the open one — what its dates have to follow.
  const priorPhase = activeIndex > 0 ? phases[activeIndex - 1] : undefined;

  return (
    <>
      <div className={active ? "hidden" : undefined}>
        <ProcessPage
          name={draft.name}
          phases={phases}
          entering={entering}
          onExit={onExit}
          onRename={onRename}
          onOpenPhase={openPhase}
          onAddPhase={addPhase}
          onDeletePhase={deletePhase}
          onMovePhase={movePhase}
        />
      </div>
      {active && (
        <PhaseSetup
          phase={active}
          otherPhases={phases.filter((p) => p.id !== active.id)}
          previousForm={previousForm}
          previousPhase={
            priorPhase ? { name: priorPhase.name, endDate: priorPhase.endDate } : undefined
          }
          processType={draft.type}
          onPatch={(patch) => patchPhase(active.id, patch)}
          onBack={closePhase}
          onDelete={() => deletePhase(active.id)}
          canDelete={phases.length > 1}
        />
      )}
    </>
  );
}
