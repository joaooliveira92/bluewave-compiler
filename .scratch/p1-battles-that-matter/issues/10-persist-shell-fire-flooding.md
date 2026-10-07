# 10 — Persist shell-created fire/flooding sources into ShipDamageState

**Spec:** ../spec.md — follow-up from ticket 09 (ADR-0049)

**Blocked by:** none

**Status:** ready-for-agent

**Frontier:** yes

## Problem (evidence)

`evaluateFireCreation` / `evaluateFloodingCreation` results are returned as
`createdFireSources` / `createdFloodingSources` on the damage event record only.
Nothing appends them to `ShipDamageState.fireRecords` / `floodingRecords`, so
the (now always-wired) step 8.6 damage-control stage has nothing to progress in
gunnery-only battles. Evidence: ticket 09 removed the gate and the unarmed
baselines stayed byte-identical.

## What to build

- Convert created sources into state records when a hit resolves in the
  auto-resolution damage path, deterministically and ledger-neutral.
- Re-pin affected unarmed baselines (auto-resolve #1, ac6-damage-control-gate #2)
  through the ADR-0007 process; record old/new hashes in a new ADR.
- Tests: a shell-started fire persists, progresses across minutes, and can
  contribute to terminal state; two-process determinism.
- Also carries ticket 09's deferred tests: seeded-fire progression in an
  unarmed battle, and the §32 battle-end decision still correct.
