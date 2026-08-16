# INC-7 — Engine Stage + Records/Ordering + Two-Process Determinism

**Type:** implementation
**Status:** done (2026-08-16, orchestrator pipeline, commit `db840c7`) — AC-20/22/23 green
(`records`/`ordering`/`advance`/`integration-boundary`/`determinism` tests, 504/504 torpedo,
simulation 19/19 no-op invariance); reviewer NEEDS_REWORK resolved (BLOCKER-1 chain id
uniqueness, BLOCKER-2 same-minute damage composition, HIGH-3 lint, HIGH-4 ADR-0031-11,
MEDIUM-5 battleLedger locale, MEDIUM-6 single-eval, LOW-8/9); report
`.ai/reports/c1-m3-torpedoes-inc7-engine-stage.md`; ADR-0031 entries 11–14.

## Acceptance (spec AC-20, AC-22, AC-23)

- §27 records: every launch/track/detection/detonation/hit/damage/flooding/machinery/
  shock/hazard/chain-reaction creates an immutable record with the §27 fields (battle
  minute/substep, source+target ids, command source, legal contact reference,
  model/launcher/setting, solution inputs+quality, speed-limit validation, ammunition
  changes, RNG decisions, damage+persistence effects, formula+ruleset versions, record
  hash) (`test/torpedo/records.test.ts`).
- §28 canonical ordering: sides → firing ships by id → launchers by id → tubes by id →
  tracks by launch minute/substep/track id → contacts by target id → damage packages by
  impact minute/substep/package id → flooding sources by compartment/source id → system
  effects by stable system id; DB/UI/wall-clock order MUST NOT affect outcomes
  (`test/torpedo/ordering.test.ts`).
- §engine stage: `resolveTorpedoes` runs after the damage stage in the minute-advance
  simulation; optional `torpedo` context in `AdvanceMinuteInput` with **absent → strict
  no-op** (zero events, byte-identical minute hash); thread `torpedoTracks`/`torpedoStates`
  across minutes like `gunneryStates`; `BattleResolver`/`StrengthCalculator` UNMODIFIED
  (`test/torpedo/advance.test.ts`, `test/torpedo/integration-boundary.test.ts`).
- Two-process determinism: new `simulation/run-torpedo-child.ts` (fixed seed, one
  canonical-serialized JSON line to stdout) + `test/torpedo/determinism.test.ts`
  (two node-spawn child processes, byte-compared) (`test/torpedo/determinism.test.ts`).

## Hints

Mirror `engine.ts` gunnery/damage/weather stage blocks (`engine.ts:205-315`), snapshot
(`317-346`), threading (`416-433`). Use `BattleLedger` + `canonicalEventOrder`
(`battleLedger.ts`). Child script pattern: `run-gunnery-child.ts`.