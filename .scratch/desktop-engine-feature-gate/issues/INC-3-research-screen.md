# INC-3 — Renderer Research & Technology screen

**Type:** task
**Status:** resolved
**Blocked by:** INC-2

## What to build

`apps/desktop/src/renderer/screens/research/`:

- `research-screen-state.ts` (pure reducer: loading / loaded / load-failed /
  submitting / priority-submit-success / priority-submit-rejected-with-revision),
  with `research-screen-state.test.ts`.
- `ResearchScreen.tsx`: on mount calls `inspectResearchScreen`; renders the
  research budget, per-field in-progress technologies (invested points), a
  discovered-techs list, and field-priority edit controls that submit a
  validated `fieldPriorities: Record<string, number>` via
  `setResearchPriorityCommand` using the shell's `expectedRevision` /
  `transportRequestId` optimistic-concurrency context (same pattern as the
  Construction screen). Honest copy: "applies on the next turn advance".
- Register in `campaign-screen-registry.tsx` ("Research & Technology") with a
  suitable icon; add to shell navigation (sidebar + header search targets).
- Reuse existing ui primitives (`card`, `badge`, `button`, `field`,
  `skeleton`, `alert`); match the Overview/Construction screen structure.

## Acceptance (spec AC-2..AC-4 renderer side)

- Screen renders real projection data or an honest error/empty state — never
  placeholder success copy.
- A priority submit applies the optimistic-concurrency envelope; a stale
  revision surfaces `REVISION_MISMATCH` and refreshes.
- Component/reducer tests green; no clock/env/random in the reducer.

## Validation

`pnpm -w turbo run test --filter=@bluewave/desktop` and a `tsc -b` clean.