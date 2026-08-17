import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleSlash,
  Map,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";
import {
  SHAPE_QUESTION,
  TYPE_META,
  assessProcess,
  piecesFor,
  type Assessment,
  type Piece,
  type ProcessType,
  type ShapeKey,
} from "./pieces";
import { Walkthrough } from "./Walkthrough";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<"anyone" | "invite">("anyone");
  const [submissionsPrivate, setSubmissionsPrivate] = useState(false);
  // Step-4 walkthrough — all pieces shown at once; this is which one is open.
  const [openIndex, setOpenIndex] = useState(0);

  const shapeQ = type ? SHAPE_QUESTION[type] : undefined;
  // For "other" we assess the free-text description; otherwise the shape picks the set.
  const assessment = type === "other" ? assessProcess(description) : null;
  const pieces = type === "other" ? (assessment?.pieces ?? []) : piecesFor(type, shape);

  const noFit = type === "other" && assessment?.fit === "no";

  const pickType = (t: ProcessType) => {
    setType(t);
    setShape(t === "other" ? "custom" : null);
    setDescription("");
  };

  const advance = () => {
    if (!canContinue) return;
    if (step === TOTAL) {
      if (type && shape) onDone({ type, shape, name, audience, submissionsPrivate, pieces });
      return;
    }
    // Entering the walkthrough — open the first piece.
    if (step === 3) setOpenIndex(0);
    setStep(step + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canContinue =
    step === 2
      ? !!type
      : step === 3
        ? type === "other"
          ? description.trim().length > 0
          : !!shape
        : step === 4
          ? !noFit
          : true;

  const footerLabel = (() => {
    if (step === 1) return "Get started";
    if (step === 2 || step === 3) return "Continue";
    if (step === 4) return noFit ? "Not a fit" : "Continue";
    return "Set up my process";
  })();

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
            assessment={assessment}
            pieces={pieces}
            openIndex={openIndex}
            onOpen={setOpenIndex}
            onChangeType={() => setStep(2)}
          />
        ) : (
          <div className="mx-auto w-full max-w-lg px-6 pt-12 pb-10">
            {step === 1 && <IntroStep />}
            {step === 2 && <TypeStep type={type} onPick={pickType} />}
            {step === 3 && (
              <ShapeStep
                type={type}
                shapeQ={shapeQ}
                shape={shape}
                onShape={setShape}
                description={description}
                onDescription={setDescription}
              />
            )}
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
            style={{ width: `${(step / TOTAL) * 100}%` }}
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
// Step 3 — Shape (or describe, for "other")
// ---------------------------------------------------------------------------

function ShapeStep({
  type,
  shapeQ,
  shape,
  onShape,
  description,
  onDescription,
}: {
  type: ProcessType | null;
  shapeQ: (typeof SHAPE_QUESTION)[ProcessType] | undefined;
  shape: ShapeKey | null;
  onShape: (s: ShapeKey) => void;
  description: string;
  onDescription: (v: string) => void;
}) {
  if (type === "other") {
    return (
      <div>
        <StepHeading
          title="Describe your process"
          sub="In a sentence or two — what are people deciding, and how?"
        />
        <Textarea
          autoFocus
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="e.g. Neighbors propose small projects, a committee reviews them, and we fund what fits the budget."
          className="mt-6 min-h-[120px]"
        />
      </div>
    );
  }
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

// ---------------------------------------------------------------------------
// Step 4 — Walkthrough (with the "other" fit assessment on top)
// ---------------------------------------------------------------------------

function Step4({
  type,
  assessment,
  pieces,
  openIndex,
  onOpen,
  onChangeType,
}: {
  type: ProcessType | null;
  assessment: Assessment | null;
  pieces: Piece[];
  openIndex: number;
  onOpen: (i: number) => void;
  onChangeType: () => void;
}) {
  // "Other" that isn't a fit — no walkthrough, just the verdict and an out.
  if (type === "other" && assessment?.fit === "no") {
    return (
      <div className="mx-auto w-full max-w-lg px-6 pt-12 pb-10">
        <FitBanner assessment={assessment} />
        <div className="mt-8 text-center">
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-[var(--color-muted-foreground)]">
            If we've got that wrong, edit your description with Back — or pick one of Common's
            process types.
          </p>
          <Button variant="outline" size="compact" onClick={onChangeType} className="mt-4">
            Pick a process type
          </Button>
        </div>
      </div>
    );
  }

  const walk = (
    <Walkthrough
      name=""
      type={(type ?? "pb") as ProcessType}
      pieces={pieces}
      revealed={pieces.length}
      openIndex={openIndex}
      settling={false}
      hideAdvance
      onOpen={onOpen}
      onAdvance={() => {}}
      onConfigure={() => {}}
    />
  );

  // "Other" that's a fit — a verdict banner above the walkthrough.
  if (type === "other" && assessment) {
    return (
      <div className="pt-6">
        <div className="mx-auto w-full max-w-[600px] px-6">
          <FitBanner assessment={assessment} />
        </div>
        {walk}
      </div>
    );
  }

  return walk;
}

const FIT_TONE = {
  good: {
    box: "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)]",
    fg: "text-[var(--color-primary)]",
    Icon: CheckCircle2,
  },
  stretch: {
    box: "border-[var(--color-pending)]/30 bg-[var(--color-pending-soft)]",
    fg: "text-[var(--color-pending)]",
    Icon: Sparkles,
  },
  no: {
    box: "border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]",
    fg: "text-[var(--color-danger)]",
    Icon: CircleSlash,
  },
} as const;

function FitBanner({ assessment }: { assessment: Assessment }) {
  const t = FIT_TONE[assessment.fit];
  return (
    <div className={cn("flex items-start gap-3 rounded-[var(--radius-lg)] border p-4", t.box)}>
      <t.Icon className={cn("mt-0.5 size-5 shrink-0", t.fg)} aria-hidden />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight">{assessment.headline}</p>
        <p className="mt-1 text-[13px] leading-snug text-[var(--color-muted-foreground)]">
          {assessment.body}
        </p>
        {assessment.roadmapNote && (
          <p className="mt-2 flex items-start gap-1.5 text-[12px] font-medium text-[var(--color-pending)]">
            <Map className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{assessment.roadmapNote}</span>
          </p>
        )}
      </div>
    </div>
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

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h1 className="font-serif text-[24px] font-semibold leading-tight tracking-tight text-balance">
        {title}
      </h1>
      {sub && (
        <p className="mx-auto mt-1.5 max-w-md text-[14px] text-[var(--color-muted-foreground)]">
          {sub}
        </p>
      )}
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
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
          "grid size-5 shrink-0 place-items-center rounded-full border-2",
          selected ? "border-[var(--color-primary)]" : "border-[var(--color-input)]",
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-[var(--color-primary)]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-muted-foreground)]">
          {desc}
        </span>
      </span>
    </button>
  );
}
