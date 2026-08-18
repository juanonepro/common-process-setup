import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Waypoints, X } from "lucide-react";
import {
  GRANT_DECISION_QUESTION,
  SHAPE_QUESTION,
  TYPE_META,
  applyGrantDecision,
  piecesFor,
  type GrantDecision,
  type Piece,
  type ProcessType,
  type ShapeKey,
} from "./pieces";
import {
  EMPTY_OTHER,
  composeOtherPieces,
  describeOther,
  type OtherAnswers,
} from "./otherFlow";
import {
  OtherStepView,
  otherCanContinue,
  otherStepList,
  type OtherStep,
} from "./OtherQuestions";
import { ChoiceCard, StepHeading } from "./WizardBits";
import { Walkthrough } from "./Walkthrough";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export interface WizardDraft {
  type: ProcessType;
  shape: ShapeKey;
  name: string;
  audience: "anyone" | "invite";
  submissionsPrivate: boolean;
  /** The resolved phase mapping (from the shape, or the "other" assessment). */
  pieces: Piece[];
}

const TOTAL = 5;
const TYPE_ORDER: ProcessType[] = ["grant", "pb", "other"];

/**
 * The create-process intro wizard — a full-screen, five-step flow, each with
 * back navigation, ending by handing a complete draft to the config page.
 *   1 Intro · 2 Type · 3 Shape · 4 Walkthrough · 5 Name + access
 */
export function WizardV3({
  onDone,
  onExit,
}: {
  onDone: (d: WizardDraft) => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ProcessType | null>(null);
  const [shape, setShape] = useState<ShapeKey | null>(null);
  // Grantmaking asks who decides; "other" asks its own four questions. Both
  // live inside step 3 as a little sequence of their own.
  const [grantDecision, setGrantDecision] = useState<GrantDecision | null>(null);
  const [other, setOther] = useState<OtherAnswers>(EMPTY_OTHER);
  const [subIndex, setSubIndex] = useState(0);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<"anyone" | "invite">("anyone");
  const [submissionsPrivate, setSubmissionsPrivate] = useState(false);
  // Step-4 walkthrough — all pieces shown at once; this is which one is open.
  const [openIndex, setOpenIndex] = useState(0);

  const shapeQ = type ? SHAPE_QUESTION[type] : undefined;
  const isOther = type === "other";
  // "Other" composes its phases from the four answers; a grant set is reshaped
  // by who decides; everything else comes straight from the shape.
  const pieces = isOther
    ? composeOtherPieces(other)
    : type === "grant"
      ? applyGrantDecision(piecesFor(type, shape), grantDecision)
      : piecesFor(type, shape);

  // Step 3's screens, in order, for whichever pathway is running.
  const subSteps: string[] = isOther
    ? otherStepList(other)
    : type === "grant"
      ? ["shape", "grantDecision"]
      : ["shape"];
  const subStep = subSteps[Math.min(subIndex, subSteps.length - 1)];

  const pickType = (t: ProcessType) => {
    setType(t);
    setShape(t === "other" ? "custom" : null);
    setGrantDecision(null);
    setOther(EMPTY_OTHER);
    setSubIndex(0);
  };

  const patchOther = (patch: Partial<OtherAnswers>) => {
    setOther((o) => ({ ...o, ...patch }));
    // An always-open process is for a named group, so start it invite-only.
    if (patch.cadence === "ongoing") setAudience("invite");
  };

  const advance = () => {
    if (!canContinue) return;
    if (step === TOTAL) {
      if (type && shape) onDone({ type, shape, name, audience, submissionsPrivate, pieces });
      return;
    }
    // Step 3 can be a sequence of its own — work through it first.
    if (step === 3 && subIndex < subSteps.length - 1) {
      setSubIndex(subIndex + 1);
      return;
    }
    // Entering the walkthrough — open the first piece.
    if (step === 3) setOpenIndex(0);
    setStep(step + 1);
  };

  const back = () => {
    if (step === 3 && subIndex > 0) {
      setSubIndex(subIndex - 1);
      return;
    }
    // Coming back into step 3 lands on its last screen.
    if (step === 4) setSubIndex(subSteps.length - 1);
    setStep((s) => Math.max(1, s - 1));
  };

  const canContinue =
    step === 2
      ? !!type
      : step === 3
        ? isOther
          ? otherCanContinue(subStep as OtherStep, other)
          : subStep === "grantDecision"
            ? !!grantDecision
            : !!shape
        : true;

  const footerLabel = (() => {
    if (step === 1) return "Get started";
    if (step === 2 || step === 3 || step === 4) return "Continue";
    return "Set up my process";
  })();

  // Progress runs smoothly through the "other" sub-steps instead of sticking.
  const progress =
    step === 3
      ? ((2 + (subIndex + 1) / subSteps.length) / TOTAL) * 100
      : (step / TOTAL) * 100;

  return (
    <div className="flex h-screen flex-col bg-[var(--color-muted)]">
      {/* Top bar — close the wizard entirely. */}
      <div className="flex shrink-0 items-center px-6 py-4">
        <button
          onClick={onExit}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Content. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {step === 4 ? (
          <Step4
            type={type}
            recap={isOther ? describeOther(other) : null}
            pieces={pieces}
            openIndex={openIndex}
            onOpen={setOpenIndex}
          />
        ) : (
          <div className="mx-auto w-full max-w-lg px-6 pt-12 pb-10">
            {step === 1 && <IntroStep />}
            {step === 2 && <TypeStep type={type} onPick={pickType} />}
            {step === 3 &&
              (isOther ? (
                <OtherStepView step={subStep as OtherStep} answers={other} onChange={patchOther} />
              ) : subStep === "grantDecision" ? (
                <GrantDecisionStep value={grantDecision} onPick={setGrantDecision} />
              ) : (
                <ShapeStep shapeQ={shapeQ} shape={shape} onShape={setShape} />
              ))}
            {step === 5 && (
              <IntakeStep
                name={name}
                onName={setName}
                audience={audience}
                onAudience={setAudience}
                priv={submissionsPrivate}
                onPriv={setSubmissionsPrivate}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer — a progress fill line, then back + the primary action. */}
      <div className="shrink-0 bg-[var(--color-surface)]">
        <div className="h-1 w-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex w-full items-center justify-between gap-2 px-6 py-4">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="compact" onClick={back}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
            )}
          </div>
          <Button onClick={advance} disabled={!canContinue} className="min-w-32">
            {footerLabel}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Intro
// ---------------------------------------------------------------------------

function IntroStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="grid size-16 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Waypoints className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-[32px] font-semibold leading-tight tracking-tight text-balance">
        Map your process on Common
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
        Answer a couple of quick questions and we'll show you how your process runs on
        Common — then you'll set it up, piece by piece.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Process type
// ---------------------------------------------------------------------------

function TypeStep({
  type,
  onPick,
}: {
  type: ProcessType | null;
  onPick: (t: ProcessType) => void;
}) {
  return (
    <div>
      <StepHeading
        title="What kind of process are you running?"
        sub="We'll show you how it maps onto Common. You can change anything after."
      />
      <div className="mt-6 space-y-2.5">
        {TYPE_ORDER.map((t) => {
          const m = TYPE_META[t];
          const selected = type === t;
          return (
            <button
              key={t}
              onClick={() => onPick(t)}
              aria-pressed={selected}
              style={selected ? { borderColor: "var(--color-primary)" } : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius)] border-2 bg-[var(--color-surface)] p-3.5 text-left transition-colors",
                selected
                  ? "bg-[var(--color-primary-soft)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-[var(--radius)]",
                  selected
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                )}
              >
                <Icon name={m.icon} className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-tight">{m.label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                  {m.desc}
                </span>
              </span>
              {selected && <Check className="size-5 shrink-0 text-[var(--color-primary)]" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Shape. ("Other" answers its own sequence — see OtherQuestions.)
// ---------------------------------------------------------------------------

function ShapeStep({
  shapeQ,
  shape,
  onShape,
}: {
  shapeQ: (typeof SHAPE_QUESTION)[ProcessType] | undefined;
  shape: ShapeKey | null;
  onShape: (s: ShapeKey) => void;
}) {
  return (
    <div>
      <StepHeading title={shapeQ?.heading ?? "How does it work?"} />
      <div className="mt-6 space-y-2.5">
        {shapeQ?.options.map((o) => (
          <ChoiceCard
            key={o.key}
            selected={shape === o.key}
            onClick={() => onShape(o.key)}
            title={o.label}
            desc={o.desc}
          />
        ))}
      </div>
    </div>
  );
}

/** Grantmaking only — who makes the funding call. */
function GrantDecisionStep({
  value,
  onPick,
}: {
  value: GrantDecision | null;
  onPick: (d: GrantDecision) => void;
}) {
  return (
    <div>
      <StepHeading title={GRANT_DECISION_QUESTION.heading} />
      <div className="mt-6 space-y-2.5">
        {GRANT_DECISION_QUESTION.options.map((o) => (
          <ChoiceCard
            key={o.key}
            selected={value === o.key}
            onClick={() => onPick(o.key)}
            title={o.label}
            desc={o.desc}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Walkthrough (with a plain-language recap for the "other" pathway)
// ---------------------------------------------------------------------------

function Step4({
  type,
  recap,
  pieces,
  openIndex,
  onOpen,
}: {
  type: ProcessType | null;
  /** Set for "other": what we understood, in their words not ours. */
  recap: string | null;
  pieces: Piece[];
  openIndex: number;
  onOpen: (i: number) => void;
}) {
  return (
    <Walkthrough
      name=""
      type={(type ?? "pb") as ProcessType}
      pieces={pieces}
      revealed={pieces.length}
      openIndex={openIndex}
      settling={false}
      hideAdvance
      /* The recap sits under the title, right above what it describes. */
      banner={
        recap ? (
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] p-4">
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">Here's what we understood</p>
              <p className="mt-1 text-[13px] leading-snug text-[var(--color-muted-foreground)]">
                {recap} Change any of it with Back.
              </p>
            </div>
          </div>
        ) : undefined
      }
      onOpen={onOpen}
      onAdvance={() => {}}
      onConfigure={() => {}}
    />
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Name + who can submit
// ---------------------------------------------------------------------------

function IntakeStep({
  name,
  onName,
  audience,
  onAudience,
  priv,
  onPriv,
}: {
  name: string;
  onName: (v: string) => void;
  audience: "anyone" | "invite";
  onAudience: (v: "anyone" | "invite") => void;
  priv: boolean;
  onPriv: (v: boolean) => void;
}) {
  return (
    <div>
      <StepHeading title="Name it and set who can take part" />
      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="wiz-name" className="mb-1.5 block text-[14px] font-medium">
            Process name
          </label>
          <Input
            id="wiz-name"
            autoFocus
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="e.g. Neighborhood Grants 2026"
          />
        </div>

        <div>
          <p className="mb-2 text-[14px] font-medium">Who can submit?</p>
          <div className="space-y-2.5">
            <ChoiceCard
              selected={audience === "anyone"}
              onClick={() => onAudience("anyone")}
              title="Open to the public"
              desc="Anyone can take part, or anyone meeting eligibility rules you set."
            />
            <ChoiceCard
              selected={audience === "invite"}
              onClick={() => onAudience("invite")}
              title="Invite only"
              desc="Only people you invite. You'll add them before this opens."
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-tight">Make submissions private</p>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-muted-foreground)]">
              Only admins and reviewers can see submissions.
            </p>
          </div>
          <Switch checked={priv} onCheckedChange={onPriv} />
        </div>
      </div>
    </div>
  );
}
