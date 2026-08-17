# Common — "Create a process" prototype (V3)

A clickable design prototype of the process-creation experience for Common.
No backend, no global store — all state is local React state.

```bash
git clone https://github.com/juanonepro/common-process-setup.git
cd common-process-setup
npm install
npm run dev      # → http://localhost:5173
```

Requires Node 18 or newer. There's nothing to configure — no API keys, no database.

## What's in here

V3 starts as a copy of the V2 flow, carried over verbatim and renamed. Nothing
from V1 was brought across — the earlier generations stay in the sibling
`Process Setup V2` project for reference.

- `src/components/v3/` — the whole create-process flow, self-contained:
  empty state → create modal → full-screen transition → guided walkthrough →
  two-zone dashboard/workspace.
  - `CreateFlowV3.tsx` — the stage machine that ties the flow together.
  - `WizardV3.tsx`, `CreateModalV3.tsx`, `EmptyStateV3.tsx`, `TransitionV3.tsx`,
    `Walkthrough.tsx`, `Dashboard.tsx`, `Workspace.tsx`, `PhaseSetup.tsx`,
    `PhaseBuilders.tsx`, `PhaseRow.tsx`, `PhaseSettings.tsx`,
    `SettingsModalV3.tsx`.
  - `pieces.ts` — the content model (piece sets per type/shape, phase-type→icon
    map, type metadata). `phaseModel.ts` — phase state and helpers.
- `src/components/ui/` — shadcn-style primitives (button, card, dialog, input,
  misc, sheet, textarea).
- `src/components/Icon.tsx` — name-based lucide wrapper.
- `src/lib/utils.ts` — `cn()` class merging.
- `src/index.css` — design tokens: `--color-primary` #2f6f4f, Roboto +
  Roboto Serif, `--radius` 8px.

## Stack

Vite 6 + React 18 + TypeScript, Tailwind v4, lucide-react, CVA. `@/` resolves to
`src/`. Dev server on port 5173 (`.claude/launch.json`, config name `dev`).
