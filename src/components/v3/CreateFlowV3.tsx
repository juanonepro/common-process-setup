import { useState } from "react";
import { EmptyStateV3 } from "./EmptyStateV3";
import { WizardV3, type WizardDraft } from "./WizardV3";
import { Workspace } from "./Workspace";

type Stage = "empty" | "wizard" | "workspace";

/**
 * V3 create-process flow — self-contained, end to end:
 *   empty state → 5-step intro wizard → process config page.
 *
 * The wizard collects the draft (type, shape, name, audience, submissions
 * privacy); the workspace turns it into an editable process and the config page.
 */
export function CreateFlowV3() {
  const [stage, setStage] = useState<Stage>("empty");
  const [draft, setDraft] = useState<WizardDraft | null>(null);

  const exit = () => {
    setDraft(null);
    setStage("empty");
  };

  if (stage === "empty") {
    return <EmptyStateV3 onNew={() => setStage("wizard")} />;
  }

  // The wizard is a full-screen flow.
  if (stage === "wizard") {
    return (
      <WizardV3
        onDone={(d) => {
          setDraft(d);
          setStage("workspace");
        }}
        onExit={() => setStage("empty")}
      />
    );
  }

  if (stage === "workspace" && draft) {
    return (
      <Workspace
        draft={draft}
        onExit={exit}
        onRename={(n) => setDraft((d) => (d ? { ...d, name: n } : d))}
      />
    );
  }

  // Defensive fallback — should not be reached.
  return <EmptyStateV3 onNew={() => setStage("wizard")} />;
}
