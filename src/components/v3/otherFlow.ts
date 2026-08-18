import type { Piece } from "./pieces";

// ---------------------------------------------------------------------------
// The "other process" pathway — four plain-language questions instead of a
// free-text box. Each answer narrows what Common would actually build, so by
// the end there's a real phase mapping rather than a guess at one.
//
// Nothing here uses Common's internal vocabulary: people answer about their own
// process, and the mapping to submissions / review / develop / voting / results
// happens at the bottom of this file.
// ---------------------------------------------------------------------------

/** Q1 — what the process decides on. */
export type Subject = "funding" | "ideas" | "people" | "else";

/** Q2 — whether it runs to an end or stays open. */
export type Cadence = "timeline" | "ongoing";

/** Q3 — what arrives first. "none" means nothing is submitted. */
export type SubmitKey = "applications" | "proposals" | "rough" | "nominations" | "none";

/** Q4 — how the call gets made. */
export type Decision = "vote" | "review" | "both" | "agree";

export interface OtherAnswers {
  subjects: Subject[];
  /** Free text, only when "Something else" is one of the subjects. */
  elseText: string;
  /** Which subject to set up first, when more than one was picked. */
  focus: Subject | null;
  cadence: Cadence | null;
  submits: SubmitKey | null;
  decision: Decision | null;
}

export const EMPTY_OTHER: OtherAnswers = {
  subjects: [],
  elseText: "",
  focus: null,
  cadence: null,
  submits: null,
  decision: null,
};

export interface Choice<K extends string> {
  key: K;
  label: string;
  desc: string;
}

// --- Q1 -------------------------------------------------------------------

export const SUBJECT_OPTIONS: Choice<Subject>[] = [
  { key: "funding", label: "Funding", desc: "Money going to projects, organisations, or ideas" },
  { key: "ideas", label: "Ideas or priorities", desc: "What to focus on or do next" },
  { key: "people", label: "People", desc: "Electing or selecting someone for a role" },
  { key: "else", label: "Something else", desc: "Tell us in a few words" },
];

/** Short noun for a subject, for use inside a sentence. */
const SUBJECT_NOUN: Record<Subject, string> = {
  funding: "funding",
  ideas: "ideas and priorities",
  people: "people for a role",
  else: "this",
};

// --- Q2 -------------------------------------------------------------------

export const CADENCE_OPTIONS: Choice<Cadence>[] = [
  {
    key: "timeline",
    label: "It has a timeline",
    desc: "Opens, moves through stages, wraps up",
  },
  {
    key: "ongoing",
    label: "It's always open",
    desc: "Things come up and get decided as they go",
  },
];

export const ONGOING_NOTICE =
  "Common runs on stages, but plenty of groups do ongoing decision-making with a simple setup: " +
  "one intake that stays open, just for your group. Members post what they're proposing, and " +
  "others weigh in with comments and likes to show support. We'll set that up.";

// --- Q3 -------------------------------------------------------------------

/**
 * What comes in first, worded for what they're deciding on. The last option is
 * always "nothing" — some groups decide on something that already exists, and
 * that skips the intake entirely.
 */
export const SUBMIT_OPTIONS: Record<Subject, Choice<SubmitKey>[]> = {
  funding: [
    { key: "applications", label: "Full applications", desc: "Ready to assess as they arrive" },
    { key: "rough", label: "Rough ideas first", desc: "The strongest get worked up into full proposals later" },
    { key: "none", label: "Nothing is submitted", desc: "We're deciding on things that already exist" },
  ],
  ideas: [
    { key: "rough", label: "Rough ideas", desc: "The ones with support get worked up later" },
    { key: "proposals", label: "Worked-up proposals", desc: "Ready to weigh in on as they arrive" },
    { key: "none", label: "Nothing is submitted", desc: "We're deciding between options we already have" },
  ],
  people: [
    { key: "nominations", label: "Nominations", desc: "People put names forward, including their own" },
    { key: "applications", label: "Applications from candidates", desc: "Candidates make their own case" },
    { key: "none", label: "Nothing is submitted", desc: "The candidates are already set" },
  ],
  else: [
    { key: "proposals", label: "Written submissions", desc: "Ready to weigh in on as they arrive" },
    { key: "rough", label: "Rough ideas first", desc: "The strongest get worked up later" },
    { key: "none", label: "Nothing is submitted", desc: "We're deciding on something that already exists" },
  ],
};

/** The heading for Q3, worded for the subject. */
export const SUBMIT_HEADING: Record<Subject, string> = {
  funding: "What do people send in first?",
  ideas: "What do people put forward first?",
  people: "How do candidates come forward?",
  else: "What do people put forward first?",
};

// --- Q4 -------------------------------------------------------------------

export const DECISION_OPTIONS: Choice<Decision>[] = [
  { key: "vote", label: "Everyone votes", desc: "The whole group decides together" },
  {
    key: "review",
    label: "A smaller group reviews and decides",
    desc: "A panel or committee makes the call",
  },
  { key: "both", label: "Both", desc: "A review narrows it down, then it goes to a vote" },
  {
    key: "agree",
    label: "We discuss until we agree",
    desc: "No formal vote — support shows through comments and likes",
  },
];

// ---------------------------------------------------------------------------
// Answers → phases
// ---------------------------------------------------------------------------

/**
 * The subject driving the wording from here on. A timeline process has picked
 * one; an always-open space can cover several at once, and there's no single
 * subject to speak from — so it falls back to the general wording.
 */
export function activeSubject(a: OtherAnswers): Subject {
  if (a.focus) return a.focus;
  if (a.subjects.length === 1) return a.subjects[0];
  return "else";
}

/** How to name what's being decided, in a sentence. Lists them all when an
 * always-open space covers more than one. */
export function subjectPhrase(a: OtherAnswers): string {
  const named = (s: Subject) =>
    s === "else" && a.elseText.trim() ? a.elseText.trim() : SUBJECT_NOUN[s];
  if (a.focus) return named(a.focus);
  if (a.subjects.length === 1) return named(a.subjects[0]);
  if (a.subjects.length === 0) return SUBJECT_NOUN.else;
  const list = a.subjects.map(named);
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

const INTAKE_NAME: Record<SubmitKey, string> = {
  applications: "Collect applications",
  proposals: "Collect proposals",
  rough: "Collect ideas",
  nominations: "Collect nominations",
  none: "Collect submissions",
};

const INTAKE_DESC: Record<SubmitKey, string> = {
  applications: "Gather full applications from anyone taking part.",
  proposals: "Gather written proposals from anyone taking part.",
  rough: "Kept light so anyone can take part.",
  nominations: "Gather the names people put forward.",
  none: "Gather what people put forward.",
};

/**
 * Build the phase mapping from the answers. Order follows how these run in
 * practice: intake, then a review that narrows, then developing what survived,
 * then the decision, then publishing it.
 */
export function composeOtherPieces(a: OtherAnswers): Piece[] {
  const subject = activeSubject(a);
  const submits = a.submits ?? "none";
  const decision = a.decision ?? "vote";
  const discussionOnly = decision === "agree";

  // Always open — one intake that never closes, and support shown in the open.
  if (a.cadence === "ongoing") {
    return [
      {
        name: INTAKE_NAME[submits === "none" ? "proposals" : submits],
        phaseType: "Submissions",
        description: `Stays open. Members post ${subjectPhrase(a)} whenever it comes up.`,
        capabilities: [
          "Set your own questions",
          "Invite your group",
          "Let members comment and like to show support",
          ...(decision === "vote" || decision === "both"
            ? ["Run a vote on an item when you need one"]
            : []),
          "No closing date — it runs as long as you need",
        ],
        norm: "Most groups running this way keep it invite-only, so it stays their space.",
      },
    ];
  }

  const pieces: Piece[] = [];

  if (submits !== "none") {
    pieces.push({
      name: INTAKE_NAME[submits],
      phaseType: "Submissions",
      description: INTAKE_DESC[submits],
      capabilities: [
        "Set your own questions",
        "Open to all or invite-only",
        "Add a deadline",
        ...(discussionOnly ? ["Let people comment and like to show support"] : []),
      ],
    });
  }

  if (decision === "review" || decision === "both") {
    pieces.push({
      name: decision === "both" ? "Narrow it down" : "Review and decide",
      phaseType: "Review",
      description:
        decision === "both"
          ? "A smaller group scores what came in and picks what goes to the vote."
          : "A smaller group scores what came in and makes the call.",
      capabilities: [
        "Build a scoring rubric",
        "Invite the reviewers",
        "Score blind if you want to",
        "Choose what advances",
      ],
    });
  }

  if (submits === "rough") {
    pieces.push({
      name: "Work them up",
      phaseType: "Develop",
      description: "What advances gets built into something fuller.",
      capabilities: [
        "Build on what was already submitted",
        "Add questions for the fuller version",
        "Set a deadline",
      ],
    });
  }

  if (decision === "vote" || decision === "both") {
    pieces.push({
      name: subject === "people" ? "Hold the vote" : "Put it to a vote",
      phaseType: "Voting",
      description: "Everyone taking part decides together.",
      capabilities: [
        "Choose how people vote",
        "Combine ways of voting",
        "Decide who can vote",
        "Keep votes anonymous",
      ],
    });
  }

  pieces.push({
    name: "Share what was decided",
    phaseType: "Results",
    capabilities: [
      discussionOnly ? "Publish what the group landed on" : "Publish the outcome",
      "Show titles only, or the full entries",
      "Notify everyone who took part",
    ],
  });

  return pieces;
}

/** A plain-language recap, shown above the mapping on the walkthrough screen. */
export function describeOther(a: OtherAnswers): string {
  const noun = subjectPhrase(a);
  if (a.cadence === "ongoing") {
    return `Deciding on ${noun}, always open, just for your group — members post as things come up and support shows through comments and likes.`;
  }
  const intake =
    a.submits === "none"
      ? "nothing to collect first"
      : a.submits === "rough"
        ? "rough ideas first, worked up later"
        : a.submits === "nominations"
          ? "nominations first"
          : a.submits === "applications"
            ? "applications first"
            : "written submissions first";
  const call =
    a.decision === "vote"
      ? "everyone votes"
      : a.decision === "review"
        ? "a smaller group decides"
        : a.decision === "both"
          ? "a review narrows it down, then everyone votes"
          : "you discuss until you agree";
  return `Deciding on ${noun}, start to finish: ${intake}, and ${call}.`;
}
