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
    desc: "Describe it and we'll map it onto Common",
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

// ---------------------------------------------------------------------------
// "Other" pathway — a prototype fit assessment of a free-text description.
//
// There's no real NLP here: it keyword-matches the description against what
// Common actually does (collect → review → decide) to land on one of three
// verdicts, and sketches an adaptive phase mapping when it can.
// ---------------------------------------------------------------------------

export type Fit = "good" | "stretch" | "no";

export interface Assessment {
  fit: Fit;
  headline: string;
  body: string;
  /** For a stretch: what isn't supported yet. */
  roadmapNote?: string;
  /** The suggested mapping — empty when it isn't a fit. */
  pieces: Piece[];
}

// Signals that a description is a participatory decision process (Common's home turf).
const GOOD_SIGNALS = [
  "submit", "propose", "proposal", "apply", "application", "applicant", "review",
  "reviewer", "vote", "voting", "ballot", "fund", "grant", "budget", "idea",
  "select", "committee", "panel", "judge", "decide", "decision", "award",
  "nominat", "elect", "participant", "community", "member", "score", "rubric",
  "shortlist", "pitch", "entry", "entries", "contest", "competition", "residents",
];

// Signals of something Common can't do natively yet (still mappable as a stretch).
const STRETCH_SIGNALS: { keys: string[]; label: string }[] = [
  { keys: ["ranked choice", "ranked-choice", "instant runoff", "rank them", "ranking"], label: "Ranked-choice voting" },
  { keys: ["quadratic"], label: "Quadratic voting" },
  { keys: ["debate", "deliberat", "consensus", "town hall discussion"], label: "Live deliberation" },
  { keys: ["auction", "bidding", "bid on"], label: "Auctions and bidding" },
  { keys: ["tournament", "bracket", "head-to-head"], label: "Head-to-head brackets" },
  { keys: ["petition", "signature"], label: "Petitions and signatures" },
  { keys: ["real-time", "real time", "live vote", "continuous"], label: "Real-time participation" },
  { keys: ["negotiat"], label: "Multi-party negotiation" },
];

// Signals it's a different kind of product entirely.
const NO_SIGNALS = [
  "sell", "ecommerce", "e-commerce", "online store", "storefront", "inventory",
  "crm", "invoice", "payroll", "booking", "reservation", "appointment",
  "scheduling", "dating", "newsletter", "blog", "wiki", "helpdesk",
  "support ticket", "sprint", "kanban", "backlog", "checkout", "shopping cart",
  "lead generation", "recipe", "playlist",
];

function base(): Piece[] {
  return [
    {
      name: "Collect submissions",
      phaseType: "Submissions",
      description: "Gather what people put forward.",
      capabilities: ["Set your own questions", "Open to all or invite-only", "Add a deadline"],
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
  ];
}

/** Sketch an adaptive mapping — inserting Develop / Voting when the words fit. */
function mapPieces(desc: string): Piece[] {
  const d = desc.toLowerCase();
  const pieces = base();
  if (/develop|refine|shortlist|iterat|workshop|prototype/.test(d)) {
    pieces.push({
      name: "Develop what advances",
      phaseType: "Develop",
      description: "The strongest entries are worked up further.",
      capabilities: ["Choose who develops them", "Set what's required", "Add cost or budget details"],
    });
  }
  if (/vote|ballot|budget|fund|allocat|spend|elect|choose|winner|prize/.test(d)) {
    pieces.push({
      name: "Put it to a decision",
      phaseType: "Voting",
      description: "People decide together.",
      capabilities: ["Choose how people vote", "Set the limits", "Decide who can vote"],
    });
  }
  pieces.push({
    name: "Share results",
    phaseType: "Results",
    capabilities: ["Publish the outcome", "Notify participants", "Share a summary page"],
  });
  return pieces;
}

export function assessProcess(description: string): Assessment {
  const d = description.toLowerCase();
  const has = (arr: string[]) => arr.some((k) => d.includes(k));

  const goodSignal = has(GOOD_SIGNALS);
  const noSignal = has(NO_SIGNALS);
  const stretchHit = STRETCH_SIGNALS.find((s) => has(s.keys));

  // Clearly a different product, and none of the decision-process cues.
  if (noSignal && !goodSignal && !stretchHit) {
    return {
      fit: "no",
      headline: "This doesn't look like a fit for Common",
      body: "Common runs participatory decision processes — people submit something, a review happens, and a group decides together. What you described looks like a different kind of tool.",
      pieces: [],
    };
  }

  // Mappable, but leans on something Common doesn't do natively yet.
  if (stretchHit) {
    return {
      fit: "stretch",
      headline: "A bit of a stretch — but you can run it",
      body: "Common can handle most of what you described. Here's a way to set it up with today's features — you can adjust anything after.",
      roadmapNote: `${stretchHit.label} isn't in Common yet — it's on our roadmap. For now the mapping below approximates it.`,
      pieces: mapPieces(d),
    };
  }

  // Reads like a decision process → good fit.
  if (goodSignal) {
    return {
      fit: "good",
      headline: "This maps neatly onto Common",
      body: "What you described lines up with how Common works. Here's how it could run — adjust anything after.",
      pieces: mapPieces(d),
    };
  }

  // Ambiguous — no strong signals. Offer a starting point, framed as adjustable.
  return {
    fit: "stretch",
    headline: "Here's a starting point",
    body: "We couldn't tell exactly how your process works, so this is a general way to run it on Common. Treat it as a sketch and adjust each piece.",
    pieces: mapPieces(d),
  };
}
