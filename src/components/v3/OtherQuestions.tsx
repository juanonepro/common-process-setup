import { Info } from "lucide-react";
import {
  CADENCE_OPTIONS,
  DECISION_OPTIONS,
  ONGOING_NOTICE,
  SUBJECT_OPTIONS,
  SUBMIT_HEADING,
  SUBMIT_OPTIONS,
  activeSubject,
  type OtherAnswers,
  type Subject,
} from "./otherFlow";
import { ChoiceCard, CheckCard, StepHeading } from "./WizardBits";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// The "other process" question sequence — four screens, plus an interstitial
// when someone is trying to run more than one thing at once.
// ---------------------------------------------------------------------------

export type OtherStep = "subjects" | "focus" | "cadence" | "submits" | "decision";

/**
 * Which screens this person sees. Picking several subjects only forces a choice
 * when the process has an end: a run with stages can only be about one thing at
 * a time, while an always-open space happily covers all of them at once — so
 * the focus screen sits after the timeline question, not before it.
 */
export function otherStepList(a: OtherAnswers): OtherStep[] {
  const needsFocus = a.subjects.length > 1 && a.cadence === "timeline";
  return [
    "subjects",
    "cadence",
    ...(needsFocus ? (["focus"] as OtherStep[]) : []),
    "submits",
    "decision",
  ];
}

/** Whether the current screen has enough of an answer to move on. */
export function otherCanContinue(step: OtherStep, a: OtherAnswers): boolean {
  switch (step) {
    case "subjects":
      return (
        a.subjects.length > 0 && (!a.subjects.includes("else") || a.elseText.trim().length > 0)
      );
    case "focus":
      return !!a.focus;
    case "cadence":
      return !!a.cadence;
    case "submits":
      return !!a.submits;
    case "decision":
      return !!a.decision;
  }
}

export function OtherStepView({
  step,
  answers,
  onChange,
}: {
  step: OtherStep;
  answers: OtherAnswers;
  onChange: (patch: Partial<OtherAnswers>) => void;
}) {
  if (step === "subjects") {
    const toggle = (k: Subject) => {
      const next = answers.subjects.includes(k)
        ? answers.subjects.filter((s) => s !== k)
        : [...answers.subjects, k];
      onChange({
        subjects: next,
        // Keep the follow-ups honest when the set changes underneath them.
        focus: next.includes(answers.focus as Subject) ? answers.focus : null,
        submits: null,
        elseText: next.includes("else") ? answers.elseText : "",
      });
    };
    return (
      <div>
        <StepHeading title="What are you deciding?" sub="Pick everything that applies." />
        <div className="mt-6 space-y-2.5">
          {SUBJECT_OPTIONS.map((o) => (
            <CheckCard
              key={o.key}
              selected={answers.subjects.includes(o.key)}
              onToggle={() => toggle(o.key)}
              title={o.label}
              desc={o.desc}
            >
              {o.key === "else" && (
                <Input
                  autoFocus
                  value={answers.elseText}
                  onChange={(e) => onChange({ elseText: e.target.value })}
                  placeholder="e.g. which venue we use next year"
                  aria-label="What are you deciding on?"
                />
              )}
            </CheckCard>
          ))}
        </div>
      </div>
    );
  }

  if (step === "focus") {
    const picked = SUBJECT_OPTIONS.filter((o) => answers.subjects.includes(o.key));
    return (
      <div>
        <StepHeading title="Common currently supports one decision per process. Which decision would you like to set up?" />
        <div className="mt-6 space-y-2.5">
          {picked.map((o) => (
            <ChoiceCard
              key={o.key}
              selected={answers.focus === o.key}
              onClick={() => onChange({ focus: o.key, submits: null })}
              title={o.key === "else" && answers.elseText.trim() ? answers.elseText.trim() : o.label}
              desc={o.key === "else" && answers.elseText.trim() ? undefined : o.desc}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === "cadence") {
    return (
      <div>
        <StepHeading title="Does this process have an end, or is it always open?" />
        <div className="mt-6 space-y-2.5">
          {CADENCE_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.key}
              selected={answers.cadence === o.key}
              /* An always-open space covers everything they picked, so there's
                 nothing to choose between — drop any focus already set. */
              onClick={() =>
                onChange({
                  cadence: o.key,
                  ...(o.key === "ongoing" ? { focus: null, submits: null } : {}),
                })
              }
              title={o.label}
              desc={o.desc}
            />
          ))}
        </div>
        {/* Always-open isn't a dead end — it's a different setup, described here
            so the rest of the questions make sense in that light. */}
        {answers.cadence === "ongoing" && (
          <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
            <p className="text-[13px] leading-relaxed text-[var(--color-foreground)]">
              {ONGOING_NOTICE}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (step === "submits") {
    const subject = activeSubject(answers);
    return (
      <div>
        <StepHeading
          title={SUBMIT_HEADING[subject]}
          sub={
            answers.cadence === "ongoing"
              ? "This is what members post when something comes up."
              : undefined
          }
        />
        <div className="mt-6 space-y-2.5">
          {SUBMIT_OPTIONS[subject].map((o) => (
            <ChoiceCard
              key={o.key}
              selected={answers.submits === o.key}
              onClick={() => onChange({ submits: o.key })}
              title={o.label}
              desc={o.desc}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeading
        title="How does the decision get made?"
        sub={
          answers.cadence === "ongoing"
            ? "For the things members post."
            : undefined
        }
      />
      <div className="mt-6 space-y-2.5">
        {DECISION_OPTIONS.map((o) => (
          <ChoiceCard
            key={o.key}
            selected={answers.decision === o.key}
            onClick={() => onChange({ decision: o.key })}
            title={o.label}
            desc={o.desc}
          />
        ))}
      </div>
    </div>
  );
}
