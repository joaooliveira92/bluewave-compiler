# Decision 03: Phase/snapshot integration boundary

## Question

Does C-5 wire smoke or damage-control into the phase engine or campaign snapshot?

## Options

**A. No wiring.** Both smoke and damage-control are pure value models in `@bluewave/combat` only, following C-2 (mines), C-3 (submarines), C-4 (coastal defenses). Smoke clouds are computed per-minute in the tactical simulation context. Damage-control resolution operates within the existing per-minute damage pipeline. No phase-engine registration, no snapshot schema change. Golden hashes unchanged.

**B. Wire smoke into minute-advance now.** Add smoke to the tactical minute-advance engine's step list (after weather, before spotting — DESIGN-42 §9 line intersection affects spotting and gunnery).

**C. Wire both now.** Register smoke drift/decay and damage-control resolution as explicit steps in the minute-advance engine, plus add initial smoke-state fields to `BattleState` snapshot schema.

## Decision

**Option B.** Smoke drift/decay and line intersection must run every tactical minute to affect spotting and gunnery resolution — this is analogous to how `resolveGunnery` is wired into the minute-advance engine (step after spotting). Wire smoke drift/decay as an explicit engine stage (step 5.5 or after weather step 7.5) in the minute-advance simulation. However: the smoke module is pure and doesn't need snapshot schema changes (smoke clouds are derived per-battle). Damage-control extension extends the existing `resolveDamage` pipeline (already wired as step 8.5) — no new engine wiring needed. Golden hashes will change because smoke now runs per-minute; ADR-0007 regeneration is required. This is an exception to the "no wiring" pattern and should be documented in the ADR.