# Validation Report: A-4 / B10d — AI Legality + Scenario Readiness

## Outcome

`PASS`.

## Scope delivered

- New package `@bluewave/ai` (`packages/ai/`): `AiCommandGenerator` (idempotency-key
  derived command ids; budget + `SetResearchPriority` envelopes), `AiPlanner`
  (legal-only enumeration + uniform random selection via keyed `RandomEngine`
  streams `ai/planning:<nationId>:budget_project` and
  `ai/planning:<nationId>:SetResearchPriority`), `AiPhaseExecutor` (runs each AI
  slot's commands through `CommandLifecycle.process`; no direct snapshot mutation).
- `AI_PLANNING` phase (order 1.5, `rngAllowed:true`) between `command_collection`
  and `appropriation`; `MonthExecutor` runs it for every `type:"ai"` slot and
  applies accepted commands through the same helpers as the human path.
- Scenario readiness: 3-nation fixture (GBR playable; FRA+GER AI) runs 24 months
  with zero human input and deterministic replay.
- `@bluewave/commands` reused (no new command types). `@bluewave/content-schema`
  unchanged.

## Requirements evidence

Acceptance criteria C1–C10 covered by `packages/ai/test/ai.test.ts` and
`packages/phase-engine/test/ai-scenario.test.ts` (24-month smoke, double-run replay
determinism, `turnNumber===24`, AI research/construction took effect).

## Commands and observed results

```text
pnpm -w turbo run build --force
> 17 successful, 17 total (clean, uncached)

pnpm exec vp test run packages/ai packages/phase-engine packages/commands
> 9 files, 103 tests passed

pnpm exec vp test run (full)
> 41 files, 409/410 passed; residual: content-schema/test/nation.test.ts
  (pre-existing broken import) + golden-hash (resolved below)

node packages/cross-process-test/dist/run-child.js (twice)
> two runs byte-identical

node scripts/verify-golden-hashes.cjs
> All 8 hashes match golden reference

pnpm exec vp test run packages/cross-process-test/test/cross-process.test.ts
> 1 file / 2 tests passed
```

## Determinism evidence

- Child process run twice → identical 8-hash output.
- New golden: only `closingSnapshotHash` (`bc7dfc2c…`→`ccd0f826…`) and
  `replayVerificationHash` (`105a503e…`→`1aa85ce2…`) changed (AI is runtime-only;
  content/initial/command/event/financial/random unchanged). Regenerated per ADR-0007.
- 24-month smoke asserts identical final hash across two full loops (same initial
  snapshot + deterministic per-month seeds).

## Canonical artifact changes

`golden/hashes.json`: closingSnapshotHash + replayVerificationHash only; cause =
AI planning executes in the turn pipeline; golden regen. No migration (runtime-only).

## Tests added

`packages/ai/test/ai.test.ts`; `packages/phase-engine/test/ai-scenario.test.ts`;
phase-order tests updated (12 phases incl. `ai_planning`; rng set now
`["ai_planning","resolve_research","battle_resolution"]`).

## ADRs and dependencies

No new ADR required (AI placement follows the B10c fractional-order precedent;
documented in SPRINT-PLAN). New workspace package `@bluewave/ai` (first post-core
package, justified by the brief and kept independent of the phase engine).

## Known limitations and deferred requirements

Per brief: strategic AI, DESIGN-50 components, traits/difficulty, fog of war,
battle-acceptance AI, diplomatic AI, design AI, learning/scripting, manifest
runtime enforcement, capability readiness machine, packaged smoke framework,
content-only isolation, release manifest. Recorded, not dropped.

## Changed files

`packages/ai/*` (new), `packages/phase-engine/src/{registry,month}.ts`,
`packages/phase-engine/package.json` + tsconfig (dep + project ref),
`packages/phase-engine/test/*` (phase-order + 24-mo smoke), `pnpm-lock.yaml`,
`golden/hashes.json`.

## Git and remote status

- Branch: `dev`; commit: B10d commit; working tree clean after commit; pushed to
  `origin/dev`; no self-merge.

## Secondary consistency check

Independent uncached rebuild (17/17); direct re-run of AI + smoke tests (9 pass);
child run twice byte-compared; verify-golden green; cross-process green — all
correlated with the worker report rather than trusted blindly.