# INC-4 — Salvo / Event + Ordering + Reason Codes + Engine Wiring

**State:** READY_FOR_AGENT · **Blocked by:** INC-3
**Spec:** `.scratch/b3-m2-gunnery/spec.md` (AC-7..AC-9, AC-11..AC-13) · **ADR:** (recorded at INC-5)

## Acceptance criteria
- AC-7 **Ammunition count + atomic consume**: exact count by type tracked; a salvo
  reserves and consumes ammunition atomically (§28); when required ammo unavailable
  another permitted type is selected or it fails with `GUNNERY_AMMUNITION_UNAVAILABLE`.
  Proving test: `combat/test/gunnery/ammunition.test.ts`.
- AC-8 **GunneryEventRecord completeness**: every salvo/AA burst produces an immutable
  record carrying §30 fields (battle minute/substep; battery/shooter/target contact
  ids; command source; fire mode; ammunition; accuracy+rate factors; random decisions;
  impact/armor inputs (reserved this slice); outcome; damage-event refs (reserved);
  formula+ruleset versions; event hash). Proving test:
  `combat/test/gunnery/event-record.test.ts`.
- AC-9 **Canonical ordering**: gunnery events order by §31 (tactical sides → shooting
  ships by id → batteries → mounts → target contacts → shots/barrel → impacts → damage
  effects); DB/UI/rendering/wall-clock order MUST NOT affect outcomes; emitted via
  `BattleLedger`+`canonicalEventOrder`. Proving tests:
  `combat/test/gunnery/ordering.test.ts`, `combat/test/gunnery/ledger-order.test.ts`.
- AC-11 **Gunnery-in-minute-advance**: `resolveGunnery` runs as a pure engine stage
  after spotting (step 8) each minute, given B-2 `TacticalContact` tracks and the
  observing ships' batteries, emitting events via `BattleLedger`+`canonicalEventOrder`
  + a minute-state hash; `BattleResolver`/`StrengthCalculator` UNMODIFIED (verified by
  diff). Proving tests: `combat/test/gunnery/advance.test.ts`,
  `combat/test/gunnery/pipeline-order.test.ts`, `combat/test/gunnery/integration-boundary.test.ts`.
- AC-12 **Fog-of-war targeting**: a battery MUST NOT target a hidden authoritative
  asset; references a legal `TacticalContact` only; hidden true asset →
  `TACTICAL_FOG_OF_WAR_VIOLATION` (reuse `validateTargetOrder`). Proving test:
  `combat/test/gunnery/targeting-fog.test.ts`.
- AC-13 **Two-process determinism**: identical state+inputs produce identical per-minute
  hashes and events; verified by two separate child processes (node-spawn ×2,
  byte-compared). Proving test: `combat/test/gunnery/determinism.test.ts` +
  `@bluewave/cross-process-test` child ×2.

## Notes for implementator
Wire `resolveGunnery` into `simulation/engine.ts` after spotting using the same
deterministic event-id + ledger pattern as `evt()`. Use keyed domain-separated random
for hit/feed draws only. This INC adds the in-slice reason codes (see spec §1.4).
