# 07 — Tactical replay verification (re-resolve battles from manifest + seed)

**What to build:** per ADR-0034 decision 2, tactical replay is deterministic
re-resolution from a battle's manifest + seed, not a persisted mid-battle state
path. This ticket turns that decision into the actionable replay check that
closes REL-1 §22 "replay at strategic + tactical checkpoints": for every battle
that the campaign snapshot records as resolved, re-run `resolveBattleAuto` from
the stored `BattleManifest` + `battleSeed` (+ the battle's committed strategic
weather and the ruleset/formula/rng version pins) and compare the recomputed
`BattleResolutionResult`/`resultHash` against the recorded
`BattleInstance.result`/`damageReport`. A divergence is reported
deterministically (first divergence, structured diagnostic) per DESIGN-52 §28.

Scope: at the campaign re-derivation level (no minute checkpoints — those are
optional acceleration, DESIGN-52 §31, and deferred with the full save-package
model). Battle autosaves at committed tactical-minute boundaries for crash
recovery are explicitly out of scope (deferred in ADR-0034).

**Type:** implementation
**Status:** open
**Frontier:** yes
**Blocked by:** None — can start immediately (ADR-0034 records the decision).

- [ ] A tactical replay verifier re-resolves each resolved battle from its stored manifest + seed and compares against the recorded result/resultHash.
- [ ] Replay of a battle with no divergence reports a match; an altered result / wrong seed / altered manifest reports a first-divergence mismatch with a stable diagnostic.
- [ ] Battle replay is deterministic: two re-runs produce byte-identical verification output.
- [ ] Strategic replay (existing `ReplayVerifier`) remains unchanged and still passes; the tactical check composes with it (tactical + strategic both green on a normal turn).
- [ ] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.
