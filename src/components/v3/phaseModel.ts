import type { Piece, PhaseType } from "./pieces";
import { uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Phase-setup model — the editable per-phase state behind the setup page.
//
// A phase instance is seeded from a walkthrough piece but is fully editable
// (name, builder content, settings) and independent: grant:loi has two
// Submissions and two Review phases, each with its own state.
// ---------------------------------------------------------------------------

/** Which body shape a phase's setup page uses. */
export type BodyKind = "form" | "rubric" | "requirements" | "voting" | "results";

export function bodyKindFor(t: PhaseType): BodyKind {
  switch (t) {
    case "Submissions":
      return "form";
    case "Review":
      return "rubric";
    case "Develop":
      return "requirements";
    case "Voting":
      return "voting";
    case "Results":
      return "results";
  }
}

export const isBuilderKind = (k: BodyKind) =>
  k === "form" || k === "rubric" || k === "requirements";

export const ANSWER_FORMATS = [
  "Short text",
  "Long text",
  "Choice",
  "Amount",
  "Location",
  "File",
] as const;
export type AnswerFormat = (typeof ANSWER_FORMATS)[number];

export interface FormField {
  id: string;
  label: string;
  /** Optional guidance shown under the question. */
  description?: string;
  format: AnswerFormat;
  /** Default OFF = required. */
  optional: boolean;
  /** Pinned first, and nothing can be dropped onto it. */
  pinned?: boolean;
  /** Carried over from an earlier phase's form — shown, not edited. */
  locked?: boolean;
}

/** How a reviewer answers a criterion — the rubric's counterpart to a form's
 * answer format. */
export const RUBRIC_SCALES = ["Rating scale", "Yes / No", "Text"] as const;
export type RubricScale = (typeof RUBRIC_SCALES)[number];
export interface RubricCriterion {
  id: string;
  label: string;
  /** Optional guidance on what reviewers should look for. */
  description?: string;
  scale: RubricScale;
  /** Default OFF = every reviewer has to score it. */
  optional: boolean;
}

/** The most a field or criterion name can run to. */
export const NAME_LIMIT = 50;

/** What a results page shows of what won. */
export type ResultsDisplay = "titles" | "full";

/**
 * How a ballot works. More than one can run in the same phase — spreading a
 * budget and then ranking what's left is a real pattern — so a phase holds an
 * ordered list of them rather than a single choice.
 */
export const VOTE_METHODS = ["spread", "pick", "rank"] as const;
export type VoteMethod = (typeof VOTE_METHODS)[number];

export const VOTE_METHOD_META: Record<VoteMethod, { label: string; helper: string }> = {
  spread: {
    label: "Spread a budget",
    helper: "People split a set amount across the projects they want.",
  },
  pick: {
    label: "Pick a set number",
    helper: "People choose up to a fixed number of projects.",
  },
  rank: {
    label: "Rank them",
    helper: "People order the projects by preference.",
  },
};

export interface ToggleDef {
  key: string;
  title: string;
  helper: string;
}

export type Audience = "anyone" | "invite";

/** What the people taking part in a phase are called — the invite tab's name,
 * its CTA, and how the access toggle describes itself. */
export const INVITEE_LABEL: Record<PhaseType, { plural: string; lower: string }> = {
  Submissions: { plural: "Participants", lower: "participants" },
  Review: { plural: "Reviewers", lower: "reviewers" },
  Develop: { plural: "Participants", lower: "participants" },
  Voting: { plural: "Voters", lower: "voters" },
  Results: { plural: "Participants", lower: "participants" },
};

/**
 * An invitee moves invited → joined → done. What "done" means depends on the
 * phase (submitted, reviewed, voted); Results has no act to complete, so it
 * stops at joined.
 */
export type InviteeStatus = "invited" | "joined" | "done";

export interface Invitee {
  id: string;
  email: string;
  status: InviteeStatus;
  /** When the current status was reached. */
  at: number;
}

export const DONE_LABEL: Record<PhaseType, string | null> = {
  Submissions: "Submitted",
  Review: "Reviewed",
  Develop: "Submitted",
  Voting: "Voted",
  Results: null,
};

/**
 * Who a phase opens to before anyone edits it. Review is always a named group —
 * you don't crowdsource reviewing — so it starts invite-only regardless. Every
 * other phase inherits the answer given in the wizard.
 */
export function defaultAudience(t: PhaseType, fromWizard: Audience): Audience {
  return t === "Review" ? "invite" : fromWizard;
}

export interface PhaseInstance {
  id: string;
  name: string;
  /** Structural — never edited from the setup page. */
  phaseType: PhaseType;
  // builder content
  fields: FormField[]; // form / requirements
  criteria: RubricCriterion[]; // rubric
  // shared settings
  audience: Audience;
  /** Who's been invited to this phase — only meaningful when invite-only. */
  invitees: Invitee[];
  timing: "duration" | "dates";
  duration: string;
  startDate: string;
  endDate: string;
  toggles: Record<string, boolean>;
  // voting — one or more ways to vote, in the order people work through them
  voteMethods: VoteMethod[];
  budget: string;
  pickCount: string;
  /** Results — how much of what won is shown back to participants. */
  resultsDisplay: ResultsDisplay;
  /** Set once the phase has been saved from its setup page. */
  configured: boolean;
}

/** One-line "what this page does" for the hero, per body shape. */
export const PAGE_DESCRIPTION: Record<BodyKind, string> = {
  form: "Set the questions people answer when they submit.",
  rubric: "Define how reviewers score what comes in.",
  requirements: "Set the questions a full proposal answers.",
  voting: "Decide how people vote and who can take part.",
  results: "Choose what to publish and who to notify.",
};

export const TOGGLES: Record<BodyKind, ToggleDef[]> = {
  form: [
    { key: "showToAll", title: "Show submissions to everyone", helper: "On lets participants browse each other's submissions." },
    { key: "editAfter", title: "Let people edit after submitting", helper: "On lets authors revise until the phase closes." },
  ],
  rubric: [
    { key: "blind", title: "Blind review", helper: "On hides other reviewers' scores until each is done." },
    { key: "requestRevisions", title: "Let reviewers request revisions", helper: "On lets a reviewer send a submission back to its author for changes before scoring it." },
  ],
  requirements: [
    { key: "editAfter", title: "Let submitters keep editing", helper: "On lets authors refine their proposal during this phase." },
    { key: "assignHelper", title: "Assign a staff helper", helper: "On pairs each proposal with someone to support it." },
  ],
  voting: [
    { key: "anonymous", title: "Anonymous votes", helper: "On hides who voted for what." },
    { key: "runningTally", title: "Show a running tally", helper: "On shows totals as they come in; off reveals them at the close." },
    { key: "oneBallot", title: "One ballot per person", helper: "On prevents repeat voting." },
  ],
  results: [
    { key: "publishRanking", title: "Publish the full ranking", helper: "On shows every result; off shows only what advanced." },
    { key: "notify", title: "Notify participants", helper: "On emails participants when results are shared." },
    { key: "summary", title: "Share a summary page", helper: "On publishes a plain-language recap of the outcome." },
  ],
};

function defaultToggles(k: BodyKind): Record<string, boolean> {
  const on: Record<BodyKind, string[]> = {
    form: ["showToAll", "editAfter"],
    rubric: ["blind"],
    requirements: ["editAfter"],
    voting: ["anonymous", "oneBallot"],
    results: ["publishRanking", "notify", "summary"],
  };
  return Object.fromEntries(TOGGLES[k].map((t) => [t.key, on[k].includes(t.key)]));
}

/** What a phase added by hand is called before the admin renames it. */
export const NEW_PHASE_NAME: Record<PhaseType, string> = {
  Submissions: "Collect submissions",
  Review: "Review submissions",
  Develop: "Develop proposals",
  Voting: "Put it to a vote",
  Results: "Share results",
};

/** A single phase added from the edit-process modal. */
export function createPhase(
  phaseType: PhaseType,
  wizardAudience: Audience = "anyone",
): PhaseInstance {
  const k = bodyKindFor(phaseType);
  return {
    id: uid("phase"),
    name: NEW_PHASE_NAME[phaseType],
    phaseType,
    fields: [],
    criteria: [],
    audience: defaultAudience(phaseType, wizardAudience),
    invitees: [],
    timing: "duration",
    duration: "4 weeks",
    startDate: "",
    endDate: "",
    toggles: defaultToggles(k),
    voteMethods: ["spread"],
    budget: "",
    pickCount: "",
    resultsDisplay: "full",
    configured: false,
  };
}

/** Build editable phase instances from the walkthrough pieces. Builders start
 * empty — the admin adds questions/criteria from an empty-state CTA. */
export function makePhaseInstances(
  pieces: Piece[],
  wizardAudience: Audience = "anyone",
): PhaseInstance[] {
  return pieces.map((p) => {
    const k = bodyKindFor(p.phaseType);
    return {
      id: uid("phase"),
      name: p.name,
      phaseType: p.phaseType,
      fields: [],
      criteria: [],
      audience: defaultAudience(p.phaseType, wizardAudience),
      invitees: [],
      timing: "duration",
      duration: "4 weeks",
      startDate: "",
      endDate: "",
      toggles: defaultToggles(k),
      voteMethods: ["spread"],
      budget: "",
      pickCount: "",
      resultsDisplay: "full",
      configured: false,
    };
  });
}
