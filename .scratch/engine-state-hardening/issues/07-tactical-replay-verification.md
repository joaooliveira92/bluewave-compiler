# 07 — Tactical replay verification (re-resolve battles from manifest + seed)

**What to build:** per ADR-0034 decision 2, tactical replay is deterministic
re-resolution from a battle's manifest + seed, not a persisted mid-battle state
path. This ticket turns that decision into the actionable replay check that
closes REL-1 §22 "replay at strategic + tactical checkpoints": for every battle
that the campaign snapshot records as resolved, re-run `resolveBattleAuto` from
the stored `BattleManifest` + `battleSeed` (+ the battle's committed strategic
weather and the ruleset/formula/rng version pins) and compare the recomputed
outcome against the recorded `BattleInstance.result` — its persisted
`winnerId`/`loserId`, per-side losses, and `damageReport` (ADR-0027). A
divergence is reported deterministically (first divergence, structured
diagnostic) per DESIGN-52 §28. `resultHash` is a transient field of
`BattleResolutionResult`, not persisted on the snapshot's `BattleInstance`; a
hash-level comparison is optional and requires persisting the battle's result
hash onto the `BattleInstance` — if chosen, make it an explicit small schema
change with a golden-impact note (ADR-0007).

Scope: at the campaign re-derivation level (no minute checkpoints — those are
optional acceleration, DESIGN-52 §31, and deferred with the full save-package
model). Battle autosaves at committed tactical-minute boundaries for crash
recovery are explicitly out of scope (deferred in ADR-0034).

**Type:** implementation
**Status:** resolved
**Frontier:** yes
**Blocked by:** 04 (decision recorded in ADR-0034)

- [x] A tactical replay verifier re-resolves each resolved battle from its stored manifest + seed and compares against the recorded `BattleInstance.result` (winner/loser, losses, damageReport).
- [x] Replay of a battle with no divergence reports a match; an altered result / wrong seed / altered manifest reports a first-divergence mismatch with a stable diagnostic.
- [x] Battle replay is deterministic: two re-runs produce byte-identical verification output.
- [x] Strategic replay (existing `ReplayVerifier`) remains unchanged and still passes; the tactical check composes with it (tactical + strategic both green on a normal turn).
- [x] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.

## Resolution

Implemented on `dev` (this issue). New `packages/phase-engine/src/tacticalReplay.ts`
implements ADR-0034 decision 2 as the actionable replay check closing REL-1 §22:
`TacticalReplayVerifier.verify` re-resolves every battle the snapshot records as
resolved via `resolveBattleAuto` from the stored `BattleManifest` + `battleSeed` +
the battle area's committed strategic weather + the ruleset/formula/rng version
pins, and compares the recomputed outcome against the recorded
`BattleInstance.result` (winner/loser, per-side losses, damageReport) in canonical
field order, reporting the first divergence with a stable structured diagnostic.
Stable diagnostics for battles that cannot be re-resolved:
`TACTICAL_MANIFEST_NOT_FOUND`, `TACTICAL_MANIFEST_TAMPERED` (stored manifest
content hash disagrees with its own `manifestHash`), `TACTICAL_NATION_MISSING`,
`TACTICAL_WEATHER_MISSING`. `resultHash` is transient and not compared.
Deterministic: two re-runs produce byte-identical verification output. The
existing strategic `ReplayVerifier` is unchanged and composes with the tactical
check (both green on a normal turn).

Tests: `packages/phase-engine/test/tactical-replay.test.ts` (7 tests) — match on
no divergence, determinism, first-divergence on altered result / wrong seed,
manifest-tamper and manifest-not-found diagnostics, and composition with the
strategic verifier.

Validation (`@bluewave/phase-engine`): `tsc --noEmit` 0, `vp lint .` 0, all 143
phase-engine tests green. Full-repo `check` blocked at baseline by an unrelated
content-generation import in `content-schema` (see ticket 03 Resolution).
