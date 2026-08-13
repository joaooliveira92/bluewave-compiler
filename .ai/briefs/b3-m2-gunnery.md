# Milestone B-3 — M2 Gunnery: Core Surface Fire-Resolution (scoping + implementation)

## Objective

Land a milestone brief + implementation spec for **B-3**: the DESIGN-39
(`docs/rules/gunnery.md`) **core surface gunnery fire-resolution slice** of M2
Surface Tactical Core — a deterministic, pure, minute-advancing surface gunnery
resolution over the B-2 `TacticalContact` tracks (aim and fire at a contact,
recording auditable salvo events), plus a research-grounded naval gun ballistics
constant set — run through the normal orchestrator pipeline (spec → slice →
implement → review → gate).

## Canonical requirements

- DESIGN-39 (`docs/rules/gunnery.md`) — **core surface fire-resolution subset only**
  (§1 GunneryState, §2 fire modes, §3 accuracy, §4 rate-of-fire/reload, §5 gun
  quality, §28 ammunition, §30 event record, §31 canonical ordering, §32 reason
  codes, §33 validation items for the slice).
- DESIGN-38 (`docs/rules/tactical-combat.md`) — minute-advance, `BattleLedger` +
  `canonicalEventOrder`, reason-code catalog; contact legality (fog-of-war).
- DESIGN-07 — fixed-point authoritative arithmetic.
- DESIGN-55 §3 — M2 depends on accepted M1 + battle-generation (B-1) + movement/
  spotting/contact (B-2).
- ENGINEERING-CONTRACT binding. Golden hashes unchanged; no campaign snapshot schema
  change; `BattleResolver`/`StrengthCalculator` unmodified.

## Starting state

B-2-IMPL DONE (PASS). `@bluewave/combat` minute-advance engine (steps 4–8),
`BattleLedger`+`canonicalEventOrder`, versioned `*_v1` + `SHIPPED_*_CONTRACT` +
validate guards, reason-code catalog, `TacticalContact` tracks via
`contact/lifecycle.ts`. The orchestrator (and implementator) must verify rather
than assume these.

## In scope

- `GunneryState` + seven fire modes + guards + base constants (INC-1).
- Accuracy resolution — 17-factor manifest, exact integer product, one FLOOR,
  keyed hit-draw (INC-2).
- Rate-of-fire/reload + gun quality (INC-3).
- `resolveGunnery` engine stage + `GunneryEventRecord` + §31 ordering + reason
  codes + atomic ammunition + fog-of-war targeting + two-process determinism (INC-4).
- Versioned `gunnery_v1` contracts + reason-code set-equality; research-grounded
  ballistics constant set; ADR-0020; traceability (INC-5).

## Out of scope (deferred — recorded, owning track)

- Autoloaders (§6–10), dual-purpose (§11–15) — later dedicated gunnery slices.
- Armor zones/thickness/penetration (§16–24) — **B-4 armor-and-damage** track.
- Straddle registration (§25) + RAPID/AA eligibility predicates — later slice
  (modes defined, predicates deferred, never fabricated).
- Target allocation + manual orders (§26–27) — later gunnery slice.
- Damage effects on gunnery state (§29) — B-4 / DAMAGE track.
- Phase-pipeline wiring replacing `BattleResolver` (B-6), auto-resolution statistics
  validation (B-6/release), player battle UI. No production-pack YAML change; golden
  hashes unchanged; no campaign snapshot schema change.

## Required implementation

Public contracts (pure functions over `TacticalBattleState` + `TacticalContact` +
`RandomEngine`): gunnery state construction/guard, accuracy resolution, reload
advance, gun-quality table, ammunition reserve/consume, salvo resolution → immutable
`GunneryEventRecord`, canonical ordering via `BattleLedger`; a `resolveGunnery`
engine stage wired after spotting in the minute-advance simulation; versioned
`gunnery_v1` contracts + validate guards; the in-slice reason-code surface
(set-equality vs DESIGN-39 §32 + catalog); deterministic keyed random only. Tests:
unit (state/modes/accuracy/reload/gun-quality/ammo/event/ordering incl. invalid +
boundary), integration (pipeline order + events + fog-of-war), determinism (two
runs byte-identical + cross-process).

## Scoping-sprint deliverable (this sprint)

- wayfinder map `.scratch/b3-m2-gunnery/map.md` + decision tickets `issues/01..06`
  (resolved);
- implementation spec `.scratch/b3-m2-gunnery/spec.md` (AC-1..15, INC-1..5) +
  `.ai/specs/b3-m2-gunnery.md` pointer;
- research note `docs/research/b3-m2-gunnery.md` (naval gun ballistics);
- ADR-0020 (scope/integration boundary + reason-code/constant policy + surface
  fire-control-solution threshold constant);
- SPRINT-PLAN B-3 row → scoping DONE + pointer to B-3-IMPL; PROGRESS update;
- Conventional Commit(s) on `dev`; clean working tree.

Next sprint: **B-3-IMPL** executes spec INC-1..INC-5 via the pipeline with the
orchestrator validation gate.
