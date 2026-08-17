import type { AnswerFormat, FormField, RubricCriterion, RubricScale } from "./phaseModel";
import { uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Question sets and rubrics carried over from processes this admin has run
// before. Setting up a form from nothing is the slowest part of setup, and most
// organisations ask near-identical things each round — so the empty state
// offers last time's set as a starting point, not a blank page.
//
// Prototype data: in the real product this is the org's own history.
// ---------------------------------------------------------------------------

export interface SavedSet<T> {
  id: string;
  /** What the set is. */
  name: string;
  /** Where it came from, shown so the admin recognises it. */
  source: string;
  items: T[];
}

type FormSeed = [label: string, format: AnswerFormat, optional?: boolean];
type RubricSeed = [label: string, scale: RubricScale];

const FORM_SEEDS: { id: string; name: string; source: string; items: FormSeed[] }[] = [
  {
    id: "set-idea",
    name: "Idea form",
    source: "Columbus Participatory Budgeting 2025",
    items: [
      ["What's your idea?", "Short text"],
      ["Describe it in a few sentences", "Long text"],
      ["Where would it happen?", "Location"],
      ["Roughly what would it cost?", "Amount", true],
    ],
  },
  {
    id: "set-proposal",
    name: "Full proposal form",
    source: "Neighborhood Grants 2024",
    items: [
      ["Project title", "Short text"],
      ["What problem does this solve?", "Long text"],
      ["Who benefits, and how many people?", "Long text"],
      ["Budget requested", "Amount"],
      ["Supporting documents", "File", true],
    ],
  },
  {
    id: "set-loi",
    name: "Letter of interest",
    source: "Climate Fund — Round 3",
    items: [
      ["Organisation name", "Short text"],
      ["Summary of the work", "Long text"],
      ["Amount requested", "Amount"],
      ["Have you applied before?", "Choice", true],
    ],
  },
];

const RUBRIC_SEEDS: { id: string; name: string; source: string; items: RubricSeed[] }[] = [
  {
    id: "rub-screen",
    name: "Eligibility screen",
    source: "Columbus Participatory Budgeting 2025",
    items: [
      ["Is it in scope?", "Yes / No"],
      ["Is it feasible in one year?", "Yes / No"],
      ["Is the cost within limits?", "Yes / No"],
    ],
  },
  {
    id: "rub-impact",
    name: "Impact scoring",
    source: "Neighborhood Grants 2024",
    items: [
      ["Community benefit", "Rating scale"],
      ["Feasibility", "Rating scale"],
      ["Value for money", "Rating scale"],
      ["Reaches people currently underserved", "Rating scale"],
    ],
  },
  {
    id: "rub-light",
    name: "Light-touch score",
    source: "Climate Fund — Round 3",
    items: [
      ["Strength of the idea", "Rating scale"],
      ["Readiness to start", "Rating scale"],
    ],
  },
];

/** Sets are cloned on use — fresh ids so editing one never touches the source. */
export const FORM_SETS: SavedSet<FormField>[] = FORM_SEEDS.map((s) => ({
  ...s,
  items: s.items.map(([label, format, optional]) => ({
    id: uid("fld"),
    label,
    format,
    optional: !!optional,
  })),
}));

export const RUBRIC_SETS: SavedSet<RubricCriterion>[] = RUBRIC_SEEDS.map((s) => ({
  ...s,
  items: s.items.map(([label, scale]) => ({ id: uid("crit"), label, scale, optional: false })),
}));

export function cloneSet<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((i) => ({ ...i, id: uid(prefix) }));
}
