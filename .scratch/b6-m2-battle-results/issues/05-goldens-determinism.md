- **Type:** task
- **Status:** resolved
# B-6: Goldens + Determinism — ADR-0007 regeneration, two-process proof

## Question

B-6 changes the campaign snapshot (strategic weather) and battle resolution
behavior. What is the determinism evidence and the golden-regeneration contract?

## Answer

**Locked.**
1. **Two-process determinism:** run the cross-process harness twice; the
   `golden/hashes.json` keys (content artifact, initial snapshot, closing
   snapshot, command/event/financial/random ledgers, replay verification, battle
   generation) must be byte-identical across child runs, including the new
   weather-bearing snapshot hash and a new tactical-battle-resolution key if
   added.
2. **Golden regeneration (ADR-0007):** old value → new value, documented
   authoritative cause (snapshot gains `strategicWeather`; battle_resolution now
   tactical), version impact (compatibility bump), migration assessment
   (old saves: rejected or explicitly migrated). A golden change caused *only*
   by adding a field no battle uses is still a documented change, not silent.
3. **`BattleResolver` / `StrengthCalculator` unmodified** — diff-checked at the
   gate (B-2..B-5 invariant preserved).
4. Child process must print the same JSON shape; new keys are added to
   `golden/hashes.json` knowingly.

**Acceptance evidence:** `scripts/verify-golden-hashes.cjs` must print
"All N hashes match golden reference" and pass twice with distinct runs.