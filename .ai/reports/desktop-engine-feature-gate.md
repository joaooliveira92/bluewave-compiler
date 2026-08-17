# Validation Report: Desktop Engine-Feature Gate (Research & Technology screen)

## Outcome

`PASS`

## Scope delivered

The desktop app (`apps/desktop`) gains its first engine-built research
surface (B10b was ACCEPTED in the engine; the desktop had no way to direct
`research_progress`):

- **Projection** `buildResearchScreenProjection` (`packages/campaign-engine/src/research.ts`)
  — a pure, read-only, one-to-one derivation over the compiled snapshot's
  `nation.research` (`researchBudget`, `fieldPriorities`, `discoveredTechIds`,
  `inProgressTechnologies`, `currentProjectTechId`). Re-exports the canonical
  DESIGN-20 field registry/weights from `@bluewave/content-schema` so the
  desktop's validation and edit controls share the engine-authoritative rule set.
- **Bridge** — two new `campaign:execute` commands (22 → 24):
  `inspectResearchScreen` (read projection) and `setResearchPriorityCommand`
  (queue a real `SetResearchPriorityCommand` envelope). Zod wire validation;
  shared `{ sessionId, expectedRevision, transportRequestId }` optimistic
  concurrency conventions.
- **Authority (spec D1)** — the desktop NEVER mutates `nation.research`. It
  builds one deterministic engine envelope (AiCommandGenerator scheme, issuer
  `PLAYER`) and queues it; the next `commitMonth` drains it into
  `MonthExecutor.execute(snapshot, [...commands], seed)` where the existing
  command_collection applies it. An in-code seam promotes the player's slot to
  `slots[0]` for the execute call (the engine authorizes human commands against
  `slots[0]` only — the desktop lets the player pick any playable nation) and
  restores the canonical slot order before persisting.
- **Renderer** — Resource screen (`apps/desktop/src/renderer/screens/research/`):
  budget / field-priority picker / in-progress tech work / discovered techs;
  honest copy ("applies on the next turn advance"); stale-revision refresh.
- **tests** — commands (11, incl. two-process determinism child), campaign-engine
  projection (6), renderer reducer + screen render (2+), bridge canary updated.

Explicitly deferred (recorded on the map, not dropped): Diplomacy & War screen
(B10c — next frontier in this gate), tactical battle-outcome surfacing (B-6
follow-up), design-template authoring UI.

## Requirements evidence

| AC | Deliverable | Proving tests |
| -- | ----------- | ------------- |
| AC-1 | projection renders real budget/progress/discovered/priorities | `researchCommands.test.ts:117`; `research-screen-projection.test.ts` |
| AC-2 | commitMonth applies queued priorities (engine-authoritative) | `researchCommands.test.ts:184–210` |
| AC-3 | invalid priorities rejected with engine code, session untouched | `researchCommands.test.ts:212–243, 245` (incl. `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`) |
| AC-4 | idempotent replay + revision mismatch, intact queue on failed commit | `researchCommands.test.ts:245–321` |
| AC-5 | same seed → same hash (incl. two-process child) | `researchCommands.test.ts:324–372` |
| AC-6 | canary updated; suite green | desktop 298/298, campaign-screen-registry test |
| AC-7 | deferred candidates recorded | `.scratch/desktop-engine-feature-gate/map.md` |

## Commands and observed results

```text
$ git status
  clean working tree on dev (this slice's changes are the only delta) — see commit section

$ pnpm -w turbo run build --force
18 tasks successful, 0 cached; desktop ✓ built

$ pnpm -w exec tsc -b
exit 0 (clean, no errors)

$ pnpm -w exec vp fmt --check apps/desktop/src/main apps/desktop/src/shared apps/desktop/src/renderer/screens/research packages/campaign-engine/src packages/campaign-engine/test
All matched files use the correct format. (repo-wide `vp fmt --check .` reports
only pre-existing drift in HEAD-unrelated files; this slice's files are clean)

$ cd apps/desktop && pnpm exec vitest run --no-watch
44 test files passed, 298 tests passed

$ cd packages/campaign-engine && pnpm exec vitest run --no-watch
6 test files passed, 40 tests passed

$ cd packages/cross-process-test && pnpm exec vitest run --no-watch
3 test files passed, 14 tests passed (two-process determinism)

$ node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference

$ pnpm -w turbo run test   # per-package, verified individually to avoid the known parallel EPIPE flake
packages individually green; the single repo-wide failure is the documented
pre-existing unrelated `packages/content-schema/test/nation.test.ts` broken
import (deleted `content/research/nations/1880/index.ts`, tracked separately
in PROGRESS / SPRINT-PLAN)

$ pnpm -w turbo run lint --filter=@bluewave/desktop
only the pre-existing `e2e/fixtures.ts` no-empty-pattern error remains (not in
this slice); this slice's files lint-clean
```

## Determinism evidence

- Two OS child-process runs of issue + commitMonth (`researchDeterminismChild.ts`)
  → byte-identical stdout (hash pair equal). In-test assertion + `execFileSync` proof.
- Guide runs in-process: same seed/payload → same envelopes, same closing hash.
- Cross-process determinism suite (two child runs of the authoritative chain): 14/14 green.
- Golden hashes: all 10 match reference (unchanged by this slice — the slice
  touches only desktop + campaign-engine, no authoritative engine/combat change).

## Canonical artifact changes

None. No golden artifact or authoritative hash changed. The slice is purely
load-bearing surface (desktop) + a projection package (`campaign-engine`),
which adds a new `@bluewave/content-schema` workspace dependency (leaf package;
no cycle).

## Tests added

- `apps/desktop/src/main/commands/researchCommands.test.ts` (11: projection,
  envelope pinning, engine-application, rejection with engine codes,
  idempotency, revision mismatch, queue intact on stale commit, two-process).
- `apps/desktop/src/main/commands/researchDeterminismChild.ts` (plain-Node child).
- `apps/desktop/src/renderer/screens/research/research-screen-state.test.ts` (reducer).
- `apps/desktop/src/renderer/screens/research/ResearchScreen.test.tsx` (2 render cases).
- `packages/campaign-engine/test/research-screen-projection.test.ts` (6).
- Updated: `campaignBridge.test.ts` (command-name-set canary), registry render test.

## Security and cancellation

- IPC requests Zod-validated at the `campaign:execute` boundary (both new
  commands); `fieldPriorities` record capped at the canonical field-set length.
- Renderer imports remain limited to `@bluewave/campaign-engine` constants +
  shared contract types (matches repo precedent); engine internals stay in the
  main process.
- No filesystem / network / ambient-clock / env access in the new code; the
  deterministic timestamp is pure UTC arithmetic (AI scheme).

## Performance observations

None significant; research issue/drain is a constant-size queue-handoff.

## Limitations and deferred

- `SaveStore` envelope hash doesn't cover Map-backed state (ADR-0024) — replay
  remains the strong integrity check, unchanged by this slice.
- The research queue is in-memory like the construction workspace; on a process
  restart, un-applied priorities are lost and the snapshot keeps the previous
  values (engine remains the single writer — nothing durable exists to
  reconstruct from). Recorded in `researchWorkspace.ts`.
- Pre-existing unrelated repo failures NOT introduced here: the parallel B-6
  sprint and the `content-schema/test/nation.test.ts` import break.

## Commits

See `git log` for the Conventional Commits on `dev` (this sprint's slice);
`BattleResolver`/`StrengthCalculator`/phase-engine untouched.