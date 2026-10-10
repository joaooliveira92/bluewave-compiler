# ADR-0094: Combat caliber unit correction (armament-to-combat boundary)

## Status

Accepted 2026-10-10. Corrects a pre-existing unit-scale defect recorded as unresolved in ADR-0093
(Step 4, "Unresolved finding — penetration caliber unit scale") and in ADR-0021. Independent of, and
follows, the ADR-0093 staged armament migration.

## Context

The live auto-resolution penetration model (`packages/combat/src/battleResolution/damage.ts`,
`shellPenetrationUm`) derived the shell's penetration capability from the compiled design's main-gun
caliber. Caliber is authored in **micrometres** across the whole armament pipeline:

- first-class content: `caliberUm` (343 mm = `343000`);
- ship design: `CompiledDesignVersion.mainGunsCaliber` (µm; `toEngineDesign` copies the resolved
  `caliberUm` verbatim);
- combat projection: `DamageTargetContext.mainGunsCaliberUm` (µm);
- armor: `normalizedArmorUm` / `autoZonesForBelt` / `effectiveResistanceUm` (µm; the armor model's
  thick-armor threshold is `304_800` µm = 12 in).

The defect was a wrong conversion inside combat:

```ts
// before
const caliberMm = Math.floor(caliberUm / 1_000_000); // µm -> m, mislabelled "mm"
const penetrationMm = Math.floor((caliberMm * velocityMS) / 1_000);
return penetrationMm * 1_000_000;
```

`floor(343000 / 1_000_000) = 0`, so **every production gun recorded zero penetration capability**
against any armor, and every hit resolved `NO_EFFECT`. The defect was masked because the combat test
fixtures fed an inflated pseudo-caliber `343_000_000` (≈1000×), on which `floor(343_000_000 / 1e6) = 343`
and the model was non-degenerate. The same fixtures also inflated armor to `305_000_000` µm (≈1000×),
which made the two inflated scales "cancel" in the capability-vs-resistance comparison — except that
the armor thick-armor discount (an absolute `304_800` µm threshold) then discounted almost the whole
plate, so the inflated fixtures produced a *falsely favourable* `FULL_PENETRATION` ratio.

The prompt for this pass required production-authored guns to stop collapsing to zero penetration,
fixtures to stop requiring inflated pseudo-calibers, and deterministic exact arithmetic, **without**
introducing a new ballistics model.

## Decision

### 1. One canonical caliber unit across the armament-to-combat boundary: micrometres

`caliberUm`, `CompiledDesignVersion.mainGunsCaliber`, `CompiledArmamentMount.caliberUm`,
`DamageTargetContext.mainGunsCaliberUm` and the armor model are all micrometres. The boundary is
declared in code (`CALIBER_CANONICAL_UNIT = "micrometre"`, `MICROMETRES_PER_MILLIMETRE = 1_000`) and in
`docs/domain/armament-content.md`.

### 2. Exact, single-round conversion

The ADR-0021 formula reads caliber in millimetres. `caliberMm = caliberUm / 1_000` is an exact rational
(a caliber need not be a whole number of millimetres, e.g. `119_380` µm = `119.38` mm). Composing
`caliberMm * velocityMs / 1_000` mm of penetration and re-scaling mm → µm (×1 000) cancels the two
`1_000` factors, giving one exact integer expression:

```
capabilityUm = floor(caliberUm * velocityMs / 1_000)
```

- **Source unit:** micrometres. **Formula input unit:** the linear model's millimetres (exact rational).
- **Conversion:** one multiply, one divide, one floor — no intermediate millimetre floor.
- **Rounding direction:** floor, exactly once, at the end (`0..999` µm of fractional millimetre kept).
- **Safe range:** `caliberUm ∈ (0, 660_400]`, `velocityMs ∈ [0, ~1_000]`; product ≤ ~6.6e8, far inside
  `Number.MAX_SAFE_INTEGER`.
- **Overflow / invalid:** a non-finite or non-positive caliber or a non-finite/negative velocity throws
  `BATTLE_AUTO_RESOLUTION_FAILED` — it never silently floors to zero (the pre-fix defect). The
  auto-resolution damage seam guards an absent main-battery caliber (0) explicitly (no penetrating
  shell → capability 0) rather than calling the strict conversion.

This matches the independently written `protectionInteraction.ts::computePenetrationCapabilityUm`, so
the two combat penetration paths now agree on the canonical unit.

### 3. Fixture normalization

Every combat fixture that carried inflated pseudo-calibers (or inflated pseudo-armor) was replaced with
production-scale micrometre values (`343_000_000 -> 343_000`; `305_000_000 -> 305_000`; the unit
fixture's `305 * 25_400 -> 305_000`; the cross-process child harnesses likewise). Fixtures were
classified:

- **UNIT_CORRECTION** — every caliber/armor literal moved to production scale (combat fixture builders,
  cross-process child inputs, phase-engine/app battle fixtures, the armament-identity snapshot).
- **EXPECTED_BALANCE_CHANGE** — pinned battle baselines that moved (see §5).
- **ADDITIVE_IDENTITY_ONLY** — none: identity provenance was already covered by Step 4.
- **UNRELATED** — none altered.

Fixtures whose *purpose* is to exercise a full-penetration consequence (shell-started fire persistence,
torpedo/gunnery accumulation, decisive war score) were re-based on a thin (6 in / `152_400` µm, the
battleship family minimum) belt so the production shell still fully penetrates and breaches; this keeps
the mechanism under test without pretending the production belt is thin.

### 4. Reference cases

`packages/combat/test/battle-resolution/armament-reference-cases.test.ts` records production-scale
`UNIT_CORRECTION_REFERENCE` cases for a British heavy (343 mm), French heavy (305 mm), German heavy
(263 mm) and British secondary (152 mm) gun at 1/2/4/6 km against a 305 mm HARVEY belt. They are **not**
labelled historical: the ADR-0021 linear model has a single authored muzzle velocity and **no**
time-of-flight velocity decay, so every range resolves the identical capability. That range-invariance
is proven as a current model limitation and deferred to the future ballistics task (§6).

### 5. Latent fire-spread blow-up exposed and bounded

The correction weakens production-scale penetration from the legacy inflated-scale `FULL_PENETRATION`
to `PARTIAL_PENETRATION`, so the equal-fleet fixture no longer reaches the ADR-0073 withdrawal
threshold quickly and runs to the 360-minute cap. That longer battle exposed a **separate, pre-existing
latent defect** in `fireResolution.ts`: fire spread chains through synthetic `_adj` locations
(`BELT -> BELT_adj -> BELT_adj_adj -> ...`) without bound, so the active-fire set (and every
per-minute hash/serialisation that reads it) grows exponentially — a heap exhaustion reachable only
once battles run long enough. Fixed minimally by allowing spread only from fires not themselves created
by spread (one hop per originating fire), which bounds the active-fire set by the real compartments and
leaves the single-hop behaviour the fire-resolution unit tests pin unchanged. This is recorded as a
separate stability repair, **not** a rebalance.

### 6. Explicitly deferred realism

No muzzle velocity, velocity decay by range, shell mass/form, armor type/quality research, impact
angle, capped/uncapped projectiles, explosive filler, national gun bonuses or nation-id branches are
introduced. The ADR-0021 linear formula and all other combat assumptions are unchanged. A future,
historically grounded ballistics model is scoped separately in
`docs/research/ballistics-model-deferred.md`.

### 7. Gameplay impact (measured, not hidden)

- **Penetration events.** At production scale a 343 mm gun produces `261_366` µm capability against a
  `304_950` µm HARVEY 305 mm belt = `PARTIAL_PENETRATION` (was `FULL_PENETRATION` under the inflated
  fixtures).
- **Balance.** Equal 2×10-gun 30 kn fleets now run a ~321-minute mean (was ~48), end mostly by
  withdrawal/time_limit (70% / 30%), and typically sink **no** ships (`sinkMean = 0.00`; was sinkings
  before). Mean hp loss per ship ~75.7. The ADR-0053 length target (30–90 min) is **not** met after the
  correction. Torpedo battles still sink ships (their damage is unaffected by the caliber boundary).
- **Pinned baselines re-reviewed and updated:** `auto-resolve.test.ts` (time_limit, 360 min, new
  hashes), `ac6-damage-control-gate.test.ts` (time_limit, new result + minute hashes),
  `outcome.test.ts` (withdrawal proof moved to a seed that still withdraws), `gunnery-fidelity.test.ts`
  (10-gun/4-gun still orders correctly; the closing-rate signal survives on 2 of 5 seeds),
  `p1-balance-sweep.test.ts` (length tripwire records the corrected ~321 min and the unmet ADR-0053
  target), and the app/desktop fixtures.
- **No arbitrary rebalance is bundled.** Restoring the ADR-0053 length/lethality target is isolated for
  a separate balancing change: see `.scratch/p1-lethality-rebalance/`.

### 8. Persistence / compatibility

Compiled armament snapshots and saved designs already store caliber in micrometres, so **no save
migration is required**; the canonical unit is unchanged, only the combat conversion that *reads* it.
`CompiledDesignVersion.armament` (the immutable snapshot) is untouched; legacy designs without a
snapshot still project through the documented compatibility path and reach the same canonical-µm
`DamageTargetContext`. No approved ship changes identity, and no external mutable content is needed to
replay a battle. Ambiguous legacy values are not guessed: an absent main-battery caliber is an explicit
zero-capability branch, never a magnitude heuristic.

### 9. Rollback

Code-only revert of `shellPenetrationUm` and the fixture normalization; no save/wire format changed and
the fire-spread bound is independent. Reverting restores the pre-existing zero-penetration production
behaviour (not desirable) but is mechanically safe.

## Alternatives considered

- **Keep the inflated fixtures and only fix the unit test.** Rejected: production designs would still
  collapse to zero penetration, the stated acceptance failure.
- **Scale the whole auto-resolution damage model by 1 000 (armor and caliber).** Rejected: it would
  invent a non-canonical internal unit and leave the caliber/armor boundary ambiguous; the armor model
  authors µm and the armament content authors µm, so micrometres is the canonical unit.
- **Re-fit armor/damage constants to preserve the old balance.** Rejected by the brief: no arbitrary
  rebalance may be bundled with the unit correction.
- **Model fire spread without the depth bound.** Rejected: the unbounded `_adj` chain exhausts memory
  on legitimate long battles.

## Consequences

- Production-authored guns no longer floor to zero penetration; fixtures carry canonical values.
- Affected combat baselines were intentionally reviewed and updated; the measured balance shift is
  recorded and isolated.
- The complete gate passes, with the combat suite green.
- New tests: `caliber-unit-contract.test.ts`, `penetration-matrix.test.ts`,
  `armament-persistence.test.ts`, and the rewritten `armament-reference-cases.test.ts`.
- Deferred (recorded, not dropped): historically grounded ballistics
  (`docs/research/ballistics-model-deferred.md`) and the ADR-0053 balance restoration.
