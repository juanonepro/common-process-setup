// ---------------------------------------------------------------------------
// V3 create-process flow — content model.
//
// The user answers two quick questions (type + shape); those pick a fixed set
// of "pieces" that the walkthrough reveals and the dashboard lists as phases.
// Pieces are Common's functionality for running this KIND of process — not a
// claim about the exact temporal sequence of the user's real-world process.
//
// This is intentionally self-contained (no store, no domain types from V1) so
// the whole V3 experience can be reasoned about in one place.
// ---------------------------------------------------------------------------

/** The things a user can say they're running. */
export type ProcessType = "grant" | "pb" | "election" | "other";

/** The shape follow-up answer. "custom" is the free-described "other" path. */
export type ShapeKey = "single" | "loi" | "ideas" | "proposals" | "custom";

/** The underlying phase categories a piece can belong to. */
export type PhaseType = "Submissions" | "Review" | "Develop" | "Voting" | "Results";

export interface Piece {
  /** Friendly, action verb-phrase name, e.g. "Screen the ideas". */
  name: string;
  phaseType: PhaseType;
  /** One-line description — only present when it adds beyond the name. */
  description?: string;
  /** The "You can" list — short verb-phrases. */
  capabilities: string[];
  /** Optional "most people do X" nudge. */
  norm?: string;
}

// ---------------------------------------------------------------------------
// Phase-type → icon. One icon per phase type, used in BOTH the walkthrough and
// the dashboard so a piece reads as the same thing across the hand-off.
// ---------------------------------------------------------------------------
export const PHASE_TYPE_ICON: Record<PhaseType, string> = {
  Submissions: "Inbox",
  Review: "ClipboardCheck",
  Develop: "PenTool",
  Voting: "Vote",
  Results: "Trophy",
};

// ---------------------------------------------------------------------------
// Type metadata — drives the modal cards, the transition, and dashboard titles.
// ---------------------------------------------------------------------------
export interface TypeMeta {
  /** Sentence-case label, e.g. "Participatory budgeting". */
  label: string;
  /** Lower-case label for inline use: "a participatory budgeting process". */
  labelLower: string;
  /** One-line description on the type card. */
  desc: string;
  icon: string;
  /** Only grant + pb are fully wired to a walkthrough + dashboard. */
  wired: boolean;
}

export const TYPE_META: Record<ProcessType, TypeMeta> = {
  grant: {
    label: "Participatory grantmaking",
    labelLower: "participatory grantmaking",
    desc: "Awarding funds to applicants",
    icon: "HandCoins",
    wired: true,
  },
  pb: {
    label: "Participatory budgeting",
    labelLower: "participatory budgeting",
    desc: "A group decides how to spend a budget",
    icon: "Users",
    wired: true,
  },
  election: {
    label: "An election or nomination",
    labelLower: "election",
    desc: "Choosing people for roles or seats",
    icon: "Vote",
    wired: false,
  },
  other: {
    label: "Other process type",
    labelLower: "custom",
    desc: "Answer a few questions and we'll map it onto Common",
    icon: "Shapes",
    wired: true,
  },
};

// ---------------------------------------------------------------------------
// Shape follow-up — the one shape question, per wired type.
// ---------------------------------------------------------------------------
export interface ShapeOption {
  key: ShapeKey;
  label: string;
  desc: string;
}
export interface ShapeQuestion {
  heading: string;
  options: ShapeOption[];
}

export const SHAPE_QUESTION: Partial<Record<ProcessType, ShapeQuestion>> = {
  grant: {
    heading: "How do applications come in?",
    options: [
      { key: "single", label: "One full application", desc: "Submitted once, reviewed as is" },
      { key: "loi", label: "A letter of intent first", desc: "Then a full application if they advance" },
    ],
  },
  pb: {
    heading: "What do people submit first?",
    options: [
      { key: "ideas", label: "Rough ideas", desc: "The strongest get developed into full proposals later" },
      { key: "proposals", label: "Complete proposals", desc: "Ready to review as they are" },
    ],
  },
};

// ---------------------------------------------------------------------------
// The piece sets — one per (type, shape) combination that's wired.
// Keyed "type:shape".
// ---------------------------------------------------------------------------
export const PIECE_SETS: Record<string, Piece[]> = {
  // Participatory budgeting — rough ideas first.
  "pb:ideas": [
    {
      name: "Collect ideas",
      phaseType: "Submissions",
      description: "Kept light so anyone can take part.",
      capabilities: [
        "Set your own questions",
        "Open to all or invite-only",
        "Add a deadline or run on a timer",
      ],
    },
    {
      name: "Screen the ideas",
      phaseType: "Review",
      description: "Your team's first pass over what came in.",
      capabilities: [
        "Check eligibility and feasibility",
        "Merge or group duplicates",
        "Add questions for reviewers",
        "Run more than one round of review",
      ],
    },
    {
      name: "Build proposals",
      phaseType: "Develop",
      description: "The strongest ideas become full, costed proposals.",
      capabilities: [
        "Choose who develops them",
        "Set what a proposal must include",
        "Add cost or budget details",
      ],
    },
    {
      name: "Put it to a vote",
      phaseType: "Voting",
      capabilities: [
        "Choose how people vote",
        "Set the budget and limits",
        "Decide who can vote",
      ],
      norm: "Most PB lets people spread a budget across projects.",
    },
    {
      name: "Share results",
      phaseType: "Results",
      capabilities: [
        "Publish what got funded",
        "Notify participants",
        "Share a summary page",
      ],
    },
  ],

  // Participatory budgeting — complete proposals from the start.
  "pb:proposals": [
    {
      name: "Collect proposals",
      phaseType: "Submissions",
      description: "People submit complete proposals, ready to review.",
      capabilities: [
        "Set your own questions",
        "Open to all or invite-only",
        "Add a deadline or run on a timer",
      ],
    },
    {
      name: "Screen the proposals",
      phaseType: "Review",
      capabilities: [
        "Check eligibility and feasibility",
        "Add questions for reviewers",
        "Run more than one round of review",
      ],
    },
    {
      name: "Put it to a vote",
      phaseType: "Voting",
      capabilities: [
        "Choose how people vote",
        "Set the budget and limits",
        "Decide who can vote",
      ],
      norm: "Most PB lets people spread a budget across projects.",
    },
    {
      name: "Share results",
      phaseType: "Results",
      capabilities: [
        "Publish what got funded",
        "Notify participants",
        "Share a summary page",
      ],
    },
  ],

  // Grantmaking — a letter of intent first, then full applications.
  "grant:loi": [
    {
      name: "Collect letters of intent",
      phaseType: "Submissions",
      description: "A short letter first — the gist, nothing exhaustive.",
      capabilities: [
        "Set what the letter should cover",
        "Open to all or invite-only",
        "Add a deadline",
      ],
    },
    {
      name: "Pick a shortlist",
      phaseType: "Review",
      description: "A panel reviews the letters and invites a shortlist.",
      capabilities: [
        "Build a scoring rubric",
        "Add questions for reviewers",
        "Invite reviewers",
        "Choose what advances",
      ],
    },
    {
      name: "Collect full applications",
      // A process collects once. The full application isn't a second intake —
      // it's the shortlist developing what they already sent in.
      phaseType: "Develop",
      description: "The shortlist develops their letter into a full application.",
      capabilities: [
        "Build on what the letter asked",
        "Add questions for the full application",
        "Add a deadline",
      ],
    },
    {
      name: "Choose who's funded",
      phaseType: "Review",
      description: "The panel reviews full applications and decides.",
      capabilities: [
        "Build a scoring rubric",
        "Invite reviewers",
        "Run more than one round of review",
        "Choose what advances",
      ],
    },
    {
      name: "Share the awards",
      phaseType: "Results",
      capabilities: [
        "Publish the awards",
        "Notify applicants",
        "Share a summary page",
      ],
    },
  ],

  // Grantmaking — one full application, reviewed as is.
  "grant:single": [
    {
      name: "Collect applications",
      phaseType: "Submissions",
      capabilities: [
        "Set what the application asks",
        "Open to all or invite-only",
        "Add a deadline",
      ],
    },
    {
      name: "Choose who's funded",
      phaseType: "Review",
      description: "A panel reviews applications and decides.",
      capabilities: [
        "Build a scoring rubric",
        "Add questions for reviewers",
        "Invite reviewers",
        "Choose what advances",
      ],
    },
    {
      name: "Share the awards",
      phaseType: "Results",
      capabilities: [
        "Publish the awards",
        "Notify applicants",
        "Share a summary page",
      ],
    },
  ],

  // Other — a neutral, adjustable spine for a described process.
  "other:custom": [
    {
      name: "Collect submissions",
      phaseType: "Submissions",
      description: "Gather whatever people put forward.",
      capabilities: [
        "Set your own questions",
        "Open to all or invite-only",
        "Add a deadline",
      ],
    },
    {
      name: "Review submissions",
      phaseType: "Review",
      capabilities: [
        "Build a scoring rubric",
        "Add questions for reviewers",
        "Invite reviewers",
        "Choose what advances",
      ],
    },
    {
      name: "Share results",
      phaseType: "Results",
      capabilities: [
        "Publish the outcome",
        "Notify participants",
        "Share a summary page",
      ],
    },
  ],
};

/** The pieces for a chosen (type, shape). Empty if not a wired combination. */
export function piecesFor(type: ProcessType | null, shape: ShapeKey | null): Piece[] {
  if (!type || !shape) return [];
  return PIECE_SETS[`${type}:${shape}`] ?? [];
}

// ---------------------------------------------------------------------------
// Grantmaking — who actually makes the call.
//
// A panel scoring against a rubric is the common case but not the only one:
// plenty of funds hand the decision to the applicants themselves, or use a
// panel to shortlist and then vote. That changes the phases, so it's a
// question rather than an assumption.
// ---------------------------------------------------------------------------

export type GrantDecision = "rubric" | "applicants" | "hybrid";

export const GRANT_DECISION_QUESTION: {
  heading: string;
  options: { key: GrantDecision; label: string; desc: string }[];
} = {
  heading: "Who decides what gets funded?",
  options: [
    {
      key: "rubric",
      label: "Reviewers score against a rubric",
      desc: "A panel assesses each application and makes the call",
    },
    {
      key: "applicants",
      label: "The applicants vote",
      desc: "Everyone who applied helps decide where the money goes",
    },
    {
      key: "hybrid",
      label: "Reviewers shortlist, then a vote decides",
      desc: "A panel narrows the field, then it goes to a vote",
    },
  ],
};

const GRANT_VOTE_PIECE: Piece = {
  name: "Put it to a vote",
  phaseType: "Voting",
  description: "The people invited to vote decide where the money goes.",
  capabilities: [
    "Choose how people vote",
    "Combine ways of voting",
    "Decide who can vote",
    "Keep votes anonymous",
  ],
};

/**
 * Reshape a grantmaking set around who decides. Only the *last* review changes:
 * in a letter-of-intent process the earlier review picks who advances, which
 * happens either way.
 */
export function applyGrantDecision(pieces: Piece[], decision: GrantDecision | null): Piece[] {
  if (!decision || decision === "rubric" || pieces.length === 0) return pieces;

  const lastReview = pieces.map((p) => p.phaseType).lastIndexOf("Review");
  if (lastReview < 0) return pieces;

  if (decision === "applicants") {
    // No deciding panel at all — the applicants vote instead.
    return pieces.map((p, i) => (i === lastReview ? GRANT_VOTE_PIECE : p));
  }

  // Hybrid — the panel narrows the field, then the vote settles it.
  const narrowed: Piece = {
    ...pieces[lastReview],
    name: "Narrow the field",
    description: "Reviewers score what came in and pick the finalists.",
  };
  return [
    ...pieces.slice(0, lastReview),
    narrowed,
    GRANT_VOTE_PIECE,
    ...pieces.slice(lastReview + 1),
  ];
}

/** The subject of the "Here's how ___ could run on Common" headline. */
export function processSubject(name: string, type: ProcessType | null): string {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  const meta = type ? TYPE_META[type] : null;
  return meta ? `a ${meta.labelLower} process` : "your process";
}

/** The dashboard title. */
export function dashboardTitle(name: string, type: ProcessType | null): string {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  const meta = type ? TYPE_META[type] : null;
  return meta ? `Untitled ${meta.labelLower} process` : "Untitled process";
}
