# C-1 Spec — M3 Torpedoes: Torpedo Fire-Resolution (M3 Advanced Surface Warfare)

- **Sprint:** C-1 (`.ai/SPRINT-PLAN.md` Track C row 1)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the C-1 scoping sprint; C-1-IMPL executes it)
- **Governing docs:** DESIGN-40 (`docs/rules/torpedoes.md`) — **torpedo fire-resolution slice only** (model §1, launcher §2, ammunition §3 local, compatibility §4, launch eligibility §6, underwater-tube speed limit §7, above-water limits §8, fire solution §9–10, salvo §11, launch §12, track §13, hit §14, detonation §15, damage package §16, flotation §17, flooding creation §18, machinery §19, system shock §20, tube-hit hazard §21, chain reaction §22, oxygen §23, friendly-fire safety §24, records §27, ordering §28, reason codes §29); cross-refs DESIGN-38 (minute-advance, `BattleLedger`, `canonicalEventOrder`, reason-code catalog, `validateTargetOrder` fog-of-war), DESIGN-41 (damage pipeline — B-4 reuse seams), DESIGN-07 (integer arithmetic), DESIGN-55 §4 (M3 scope).
- **Baseline:** B-6-IMPL DONE (2026-08-15) — M2 COMPLETED. `@bluewave/combat` has the B-2 minute-advance engine, B-3 gunnery stage, B-4 damage pipeline, B-5 weather stage, B-6 `resolveBattleAuto`; versioned `*_v1` contracts + validate guards; per-module reason-code catalogs with set-equality tests; two-process determinism children. `BattleResolver`/`StrengthCalculator` unmodified.
- **Target:** torpedo fire-resolution reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (phase-pipeline/campaign integration deferred, same as B-3 gunnery's B-6 deferral); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes must remain unchanged (no ADR-0007 regeneration).

---

## 1. Scope

C-1 delivers a deterministic, pure, minute-advancing **torpedo fire-resolution**
engine stage (`resolveTorpedoes`) in `@bluewave/combat`, running after the damage
stage in the minute-advance simulation. It implements the DESIGN-40 slice listed
above, emitting immutable torpedo records through the existing `BattleLedger` +
`canonicalEventOrder`. It ships the torpedo versioned constants + in-slice reason
codes, a research-grounded `torpedo_models_v1` model/constant set, and the C-1 ADR.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-40 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **TorpedoModelDefinition** — immutable model with all §1 fields (id, owner/licensing, technology prereqs, production requirement, diameter/mass, warhead type + explosive-equivalent mass, propulsion, ordered speed/range settings, min arming distance, reliability bp, depth-keeping, guidance, compatible launcher families, oxygen state, tube-hit hazard policy, content version, content hash); missing/invalid field → `INVALID_TORPEDO_MODEL_DEFINITION`. | `combat/test/torpedo/model.test.ts` |
| AC-2 | **TorpedoLauncherState** — authoritative integer state with all §2 fields (launcherId, owner platform, family, mount position, mount type closed enum `ABOVE_WATER_FIXED`/`ABOVE_WATER_TRAINABLE`/`UNDERWATER_FIXED`/`UNDERWATER_TRAINABLE`/`SUBMARINE_INTERNAL`, tube count, loaded model per tube or `EMPTY`, reserve by model, reload state, training/bearing limits, underwater capability, fire-control connection, damage state, flooding-isolation state, active fire solution or `NONE`, ruleset/formula versions, state hash); non-integers rejected (`INVALID_TORPEDO_LAUNCHER_STATE`/`TORPEDO_STATE_INVARIANT_FAILED`). | `combat/test/torpedo/launcher-state.test.ts` |
| AC-3 | **Ammunition + atomic consume** — every launch consumes exactly one loaded torpedo per fired tube; reload reserves+consumes one compatible reserve + reload time; no creation/substitution/over-capacity; failure → `TORPEDO_AMMUNITION_UNAVAILABLE`/`TORPEDO_MODEL_INCOMPATIBLE`. | `combat/test/torpedo/ammunition.test.ts` |
| AC-4 | **Platform compatibility** — install/load only when diameter fits, mass within launcher+handling limits, propulsion/safety supported, fire-control supports the model, platform tech/adoption predicates pass, inventory available, treaty/scenario permit; supply/administrative action must NOT bypass mechanical compatibility; heavier newer model requires a refit (recorded deferred). | `combat/test/torpedo/compatibility.test.ts` |
| AC-5 | **Launch authority policy** — `torpedo_launch_authority_v1` contract defines `ADMIRAL`/`REAR_ADMIRAL`/`CAPTAIN`; ADMIRAL/REAR_ADMIRAL prohibit manual launch (`TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`), CAPTAIN permits it; AI + player use the same legality rules; authority guard fails closed (`TORPEDO_LAUNCH_AUTHORITY_DENIED`). | `combat/test/torpedo/authority.test.ts` |
| AC-6 | **Launch eligibility** — all §6 predicates enforced; target contact confidence ≥ `4_000` bp (after reused `validateTargetOrder` fog-of-war gate); not friendly; arc/bearing; range within setting; arming satisfiable; solution ≥ threshold; own-speed limits; maneuver/fire-control; sea state; friendly-fire safety; ammunition reservation; failure consumes NO torpedo + exactly one explicit reason code. | `combat/test/torpedo/eligibility.test.ts` |
| AC-7 | **Underwater-tube speed limit** — `UNDERWATER_FIXED`/`UNDERWATER_TRAINABLE` fire only when `currentSpeedMicrometresPerSecond <= 12_861_100` (25 kn legal, > illegal); checked at command validation AND firing substep; post-issuance acceleration → `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`, no torpedo consumed, command completed with failed-launch outcome. | `combat/test/torpedo/underwater-speed-limit.test.ts` |
| AC-8 | **Above-water launcher limits** — fixed tube `30` kn / trainable mount `35` kn defaults (exact), launcher MAY declare narrower; missing metadata → `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`. | `combat/test/torpedo/launch-speed-limit.test.ts` |
| AC-9 | **Fire-solution quality exactness** — `clamp(0,10_000,floor(baseSolutionBp * Π11 multiplierBp / 10_000^10))` with exact integer product retained through all 11 factors, rounded ONCE with `FLOOR`; factor manifest explicit + versioned; missing factor fails (never silent 10_000); solution uses only the firing side's knowledge estimates (§9). | `combat/test/torpedo/fire-solution.test.ts` |
| AC-10 | **Solution minimums** — automated `5_000`, Captain manual `4_000`, area/spread doctrine `3_000`, friendly-in-danger-sector `7_500` or prohibited; no mode below an explicit doctrine threshold; a player may accept lower quality only to the Captain minimum. | `combat/test/torpedo/fire-solution.test.ts` |
| AC-11 | **Salvo + atomic reservation** — salvo specifies exact tube ids, ≤ physical tube count, deterministic salvo policy (9 §11 factors as authored constants), manual+AI reserve ammunition atomically before any tube fires. | `combat/test/torpedo/salvo.test.ts` |
| AC-12 | **Launch timing/failure** — tubes fire in ascending tube-id order at declared firing substep; per-tube mechanical failure consumes no torpedo unless `TORPEDO_STUCK_IN_TUBE`; later tubes continue only per salvo policy; every result recorded separately; no random branch changes canonical tube order; base failure `100` bp before modifiers. | `combat/test/torpedo/launch-failure.test.ts` |
| AC-13 | **TorpedoTrack + hit resolution** — every launch creates an authoritative `TorpedoTrack` (§13 fields incl. track hash); a torpedo remains an authoritative entity until hit/detonation/dud/grounding/exhaustion/destruction/battle end; hit requires track∩target collision geometry, arming distance traveled, depth/draft compatible, no avoidance/decoy/interception/failure, legal target, valid impact substep; contact does NOT guarantee detonation. | `combat/test/torpedo/track.test.ts`, `combat/test/torpedo/hit-resolution.test.ts` |
| AC-14 | **Detonation outcomes** — closed set `DUD`/`PARTIAL_DETONATION`/`FULL_DETONATION`/`PREMATURE_DETONATION`/`MAGAZINE_OR_TUBE_CHAIN_REACTION`/`NO_CONTACT`, each via explicit deterministic predicate or keyed random decision; result records all inputs, probability, random decision, provenance. | `combat/test/torpedo/detonation.test.ts` |
| AC-15 | **TorpedoDamagePackage** — damaging detonation creates one package with all §16 fields + package hash; damage applies atomically through the tactical damage contract. | `combat/test/torpedo/damage-package.test.ts` |
| AC-16 | **Flotation + flooding creation** — §17 formula `floor(baseWarheadFlotationDamage * protectionLeakMultiplierBp * impactZoneMultiplierBp * existingDamageMultiplierBp / 10_000^3)` with exact shipped protection-leak + impact-zone tables; final flotation non-negative, never exceeds remaining reserve without SINKING/SUNK transition; §18 damaging underwater hit creates ≥0 `FloodingSource` records with computed `floodingRateKgMin` (§18 four-factor formula, isolation table `5_000/10_000/15_000`); creation-only (resolution → C-5). | `combat/test/torpedo/flotation.test.ts`, `combat/test/torpedo/flooding-creation.test.ts` |
| AC-17 | **Machinery + system shock** — §19 keyed weighted selection over severity weights (`1_000/4_000/3_000/1_500/500`, total exactly `10_000`), non-machinery reduced eligibility `2_500` bp; §20 shock base `3_000/1_000/0` bp by declared radius, keyed weighted selection from actual nearby systems in ascending stable-id order, never destroys an ineligible system. | `combat/test/torpedo/machinery.test.ts`, `combat/test/torpedo/system-shock.test.ts` |
| AC-18 | **Tube-hit hazard + chain reaction + oxygen** — §21 base `5_000` bp + exact four multiplier groups; severe result creates immediate flooding `5_000` bp of remaining reserve (capped), one extra source (rate multiplier `15_000`), launcher `DESTROYED`, §22 check, casualty+shock; §22 chain-reaction base `1_500`/`3_000`/`1_000` bp by propellant, creates separate explosion package + consumes affected torpedoes; §23 oxygen effects exactly `15_000`/`11_000`/`7_500`/`15_000`/`3_000` bp, gains only when compatible. | `combat/test/torpedo/tube-hazard.test.ts`, `combat/test/torpedo/chain-reaction.test.ts`, `combat/test/torpedo/oxygen.test.ts` |
| AC-19 | **Friendly-fire safety** — danger sector computed from legal contact estimate, uncertainty, spread, range, friendly tracks; prohibited when confirmed friendly ship inside sector below `1_000` m minimum predicted separation; unidentified/low-confidence contact raises minimum solution quality; manual launch does not waive it. | `combat/test/torpedo/friendly-fire.test.ts` |
| AC-20 | **Records + canonical ordering** — every launch/track/detection/detonation/hit/damage/flooding/machinery/shock/hazard/chain-reaction creates an immutable record with the §27 fields; §28 ordering (sides → firing ships → launchers → tubes → tracks by launch minute/substep/track id → contacts → damage packages → flooding sources → system effects) via `BattleLedger`+`canonicalEventOrder`; DB/UI/wall-clock order MUST NOT affect outcomes. | `combat/test/torpedo/records.test.ts`, `combat/test/torpedo/ordering.test.ts` |
| AC-21 | **Reason-code set-equality** — this slice ships exactly the DESIGN-40 §29 in-slice codes (see §1.4) plus reused catalog; `reason-codes-torpedoes.test.ts` partition (in-slice/deferred/catalog) prevents silent addition; every new code recorded in the C-1 ADR. | `combat/test/reason-codes-torpedoes.test.ts` |
| AC-22 | **Torpedo-in-minute-advance** — `resolveTorpedoes` runs as a pure engine stage after damage given torpedo launchers + legal launch inputs + contact tracks, emitting records via `BattleLedger`+`canonicalEventOrder` + a minute-state hash; strict no-op when no torpedo context (B-2…B-6 hashes unchanged); `BattleResolver`/`StrengthCalculator` UNMODIFIED (diff). | `combat/test/torpedo/advance.test.ts`, `combat/test/torpedo/integration-boundary.test.ts` |
| AC-23 | **Two-process determinism** — identical state+inputs produce identical per-minute hashes + torpedo events; two separate child processes (node-spawn ×2, byte-compared) via the `@bluewave/cross-process-test` pattern (new `run-torpedo-child.ts`). | `combat/test/torpedo/determinism.test.ts` |
| AC-24 | **Contracts + validate guards** — every new torpedo constant ships `*_v1` + `SHIPPED_TORPEDO_CONTRACT` (+ `SHIPPED_TORPEDO_LAUNCH_AUTHORITY_CONTRACT`, `SHIPPED_UNDERWATER_TUBE_HIT_HAZARD_CONTRACT`, `SHIPPED_TORPEDO_MODELS_CONTRACT` subsets as appropriate) + validate guards; pinning fails closed. | `combat/test/torpedo/contracts.test.ts` |
| AC-25 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 10/10; `BattleResolver`/`StrengthCalculator` unmodified (diff). | orchestrator gate |

### 1.2 In scope

1. **Model + launcher + ammunition + compatibility + reason codes + constants** (INC-1):
   `TorpedoModelDefinition` (§1) with content version + hash + `INVALID_TORPEDO_MODEL_DEFINITION`;
   authoritative integer `TorpedoLauncherState` (§2) + closed mount-type enum +
   `assertFixedPointTorpedo` guards; ammunition/inventory (loaded per tube or `EMPTY`,
   reserve by model, reload state) + atomic reserve/consume + `TORPEDO_AMMUNITION_UNAVAILABLE`/
   `TORPEDO_MODEL_INCOMPATIBLE` (§3); platform compatibility predicates (§4);
   in-slice reason codes + `torpedo_v1` contract seeds (AC-1..AC-4, AC-21, AC-24 seeds).
2. **Launch legality** (INC-2): `torpedo_launch_authority_v1` policy contract + mode
   legality guard (§5, AC-5); all §6 eligibility predicates + `4_000` bp contact gate
   after reused `validateTargetOrder` (AC-6); §7 underwater-tube speed limit with
   validation + firing-substep checks (AC-7); §8 above-water limits + missing-metadata
   failure (AC-8).
3. **Fire solution + salvo + friendly-fire** (INC-3): §10 11-factor manifest + exact
   integer product + one FLOOR + clamp + missing-factor failure + minimums table (AC-9,
   AC-10); §11 salvo exact tube ids + ≤ physical tubes + deterministic salvo policy +
   atomic reservation (AC-11); §24 friendly-fire danger sector + `1_000` m threshold
   (AC-19).
4. **Launch + track** (INC-4): §12 launch timing/failure per-tube ascending order +
   `100` bp base failure + `TORPEDO_STUCK_IN_TUBE` (AC-12); §13 `TorpedoTrack` entity
   with track hash threaded like `GunneryState` (AC-13 part 1).
5. **Hit + detonation** (INC-5): §14 hit-resolution predicates (geometry, arming,
   depth/draft, legality, ordering) + `TORPEDO_HIT_RESOLVED` (AC-13 part 2); §15
   detonation outcomes via deterministic predicate/keyed draw + `TORPEDO_DUD` + record
   provenance (AC-14).
6. **Damage package** (INC-6): §16 `TorpedoDamagePackage` + torpedo damage record +
   application through the B-4 damage seams (AC-15); §17 flotation (AC-16); §18 flooding
   **creation** with computed rates (AC-16); §19 machinery weighted selection (AC-17);
   §20 system shock (AC-17); §21 tube-hit hazard (AC-18); §22 chain reaction (AC-18);
   §23 oxygen effects (AC-18).
7. **Engine stage + records/ordering + determinism** (INC-7): `resolveTorpedoes` engine
   stage after damage, strict no-op, minute-state hash, threading (AC-22); §27 records +
   §28 ordering via `BattleLedger`+`canonicalEventOrder` (AC-20); two-process child
   `run-torpedo-child.ts` (AC-23).
8. **Contracts rollup + research constants + ADR + traceability** (INC-8): full
   `*_v1` rollup + `reason-codes-torpedoes.test.ts` set-equality (AC-21, AC-24);
   research-grounded `torpedo_models_v1` constant set from
   `docs/research/c1-m3-torpedoes.md`; C-1 scope/integration + reason-code/constant
   ADR (`ADR-0029`); PROGRESS/SPRINT-PLAN update; goldens unchanged (AC-25).

### 1.3 Content deliverable

The **torpedo model + launcher/hazard constant set** as engine versioned constants
(`torpedo_models_v1` + `torpedo_v1` + `torpedo_launch_authority_v1` +
`underwater_tube_hit_hazard_v1` + `SHIPPED_*_CONTRACT` + validate guards), grounded
in `docs/research/c1-m3-torpedoes.md`: ~6–8 historical models across 1880–1945
(Whitehead 14-in/18-in, 18-in Mk VIII, 21-in Mk 14, Type 93 oxygen, G7a wet-heater,
G7e electric) with physical/warhead/propulsion/speed-range/reliability/arming data,
plus protection-leak, impact-zone, isolation, machinery-weight, shock-radius,
loaded-tube, propulsion, tube-hit-hazard, and chain-reaction constants. BALANCE
TARGET items flagged per the research note. No production-pack YAML change
(`content/production/1880/` untouched; goldens unchanged).

### 1.4 Reason codes (DESIGN-40 §29 in-slice partition)

DESIGN-40 §29 is **authoritative for this subsystem**. This slice ships the §29
codes relevant to the fire-resolution surface; codes owned by deferred subsystems
are recorded, not dropped.

**In-slice (new, recorded in ADR-0029):** `INVALID_TORPEDO_MODEL_DEFINITION`,
`INVALID_TORPEDO_LAUNCHER_STATE`, `TORPEDO_MODEL_INCOMPATIBLE`,
`TORPEDO_AMMUNITION_UNAVAILABLE`, `TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`,
`TORPEDO_LAUNCH_AUTHORITY_DENIED`, `TORPEDO_TARGET_CONTACT_INSUFFICIENT`,
`TORPEDO_FIRE_SOLUTION_INSUFFICIENT`, `TORPEDO_LAUNCH_ARC_INVALID`,
`TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`, `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`,
`TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED`, `TORPEDO_LAUNCH_FAILURE`, `TORPEDO_DUD`,
`TORPEDO_HIT_RESOLVED`, `TORPEDO_PROGRESSIVE_FLOODING_CREATED`,
`TORPEDO_MACHINERY_DAMAGE_CREATED`, `TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED`,
`UNDERWATER_TUBE_SEVERE_FLOODING`, `TORPEDO_CHAIN_REACTION`,
`TORPEDO_STATE_INVARIANT_FAILED`. Plus documented in-slice markers:
`TORPEDO_FIRE_SOLUTION_FACTOR_MISSING` (§10 factor-missing failure, never a silent
10_000 fallback) and `TORPEDO_STUCK_IN_TUBE` (§12 mechanical-failure outcome that
consumes the torpedo, named in the §12 text; shipped as an authoritative outcome
code like the §10 marker). The INC-2 marker `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED`
is **retired** (INC-3 ships the real §24 friendly-fire family, so no shipped
predicate reports "DEFERRED" any more); its authoritative successor is
`TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED` and it is never re-added to the catalog
(verified by the AC-21 set-equality test).

**Reused existing combat catalog codes** (no new record needed):
`TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION` (target legality
via reused `validateTargetOrder`), `INVALID_TACTICAL_CLOCK`, damage-pipeline codes
(`DAMAGE_STATE_INVARIANT_FAILED`, `SHIP_SINKING`, `SHIP_FOUNDERED`), the B-4
`ComponentOutcome` vocabulary, `FIRE_SOURCE_CREATED`/`FLOODING_SOURCE_CREATED` for
creation records.

**Deferred §29 ownership (recorded, not dropped):** any submarine-launch-specific
speed/hazard codes (→ C-3), aerial-torpedo codes (→ D-track), production/
inventory-delivery + refit codes (→ supply/DESIGN-23 track), command-layer
manual-launch/division-order codes (→ command slice). A `reason-codes-torpedoes.test.ts`
set-equality check against §29 + the existing catalog prevents silent addition
(AC-21).

---

## 2. Increments (frontier-ordered implementation tickets, to-tickets output)

- **INC-1 — Model + launcher + ammunition + compatibility + reason codes + constants** (AC-1..AC-4, AC-21, AC-24 seeds).
- **INC-2 — Launch legality (authority + eligibility + speed limits)** (AC-5..AC-8).
- **INC-3 — Fire solution + salvo + friendly-fire safety** (AC-9..AC-11, AC-19).
- **INC-4 — Launch timing/failure + TorpedoTrack** (AC-12, AC-13 part 1).
- **INC-5 — Hit resolution + detonation outcomes** (AC-13 part 2, AC-14).
- **INC-6 — TorpedoDamagePackage (flotation, flooding creation, machinery, shock, tube hazard, chain reaction, oxygen)** (AC-15..AC-18).
- **INC-7 — Engine stage + records/ordering + two-process determinism** (AC-20, AC-22, AC-23).
- **INC-8 — Contracts rollup + research constants + ADR + traceability + gate** (AC-21, AC-24..AC-25).

Each increment passes its AC tests and the reviewer before the next. INC-1..INC-7
add no snapshot schema or phase change; INC-8 verifies goldens unchanged and records
the C-1 ADR.

---

## 3. Out of scope (deferred — enumerated, owning track)

- **Player command plumbing (§5.1–5.3)** — `ManualTorpedoLaunchCommand`,
  `DivisionTorpedoAttackOrder`, force/mission-level intent, tactical AI launcher
  selection (§5.4) — later command/AI slice. The `torpedo_launch_authority_v1`
  policy contract + legality guard ships in this slice.
- **Production/inventory delivery + local supply (§3)** and **refit under
  DESIGN-23 (§4)** — supply/DESIGN-23 track.
- **Progressive-flooding resolution + damage control (§18 resolution)** — C-5
  (DESIGN-41 remainder, reserved Stage 7).
- **Target evasion (§25)** — ship-maneuver track (evasion affects solution quality
  only through as-authored neutral constants until then).
- **Damage persistence into campaign (§26)** — later battle-results slice.
- **Submarine launch mechanics + `SUBMARINE_INTERNAL` model-specific limits (§7)** —
  C-3.
- **Mines (§35), coastal defense (§48), aerial torpedoes (§43–44)** — C-2/C-4/D-track.
- **Phase-engine wiring / `resolveBattleAuto` torpedo integration** — later
  battle-results slice (mirrors B-3 gunnery's B-6 deferral).
- **Production-pack YAML changes** (content tracked separately). **Golden
  regeneration** — none unless an authoritative cause is documented.

---

## 4. Testing and validation

- Unit tests per torpedo function (model, launcher state, ammunition, compatibility,
  authority, eligibility, speed limits, fire solution, salvo, launch failure, track,
  hit resolution, detonation, damage package, flotation, flooding creation, machinery,
  system shock, tube hazard, chain reaction, oxygen, friendly fire, event record,
  ordering) incl. invalid/boundary cases.
- Integration: `resolveTorpedoes` minute-advance order + strict no-op path (B-2…B-6
  hashes unchanged) + `BattleLedger`/`canonicalEventOrder` emission + fog-of-war
  target legality.
- Determinism: **two separate child processes** (node-spawn ×2, byte-compared) via
  the `@bluewave/cross-process-test` pattern (new `run-torpedo-child.ts`); **keyed**
  RNG draws only (`battle/torpedo/...` streams), no ambient randomness.
- Reason-code set-equality vs DESIGN-40 §29 + existing catalog.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs` (10/10),
  cross-process byte-identical; `BattleResolver`/`StrengthCalculator` unchanged (diff).
- Pre-existing unrelated failures documented (not newly caused): content-schema
  `nation.test.ts` broken import; desktop renderer/lint follow-ups are separate
  (recorded in SPRINT-PLAN).

---

## 5. Definition of done (C-1-IMPL)

- All AC-1..AC-25 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified 10/10); `BattleResolver`/`StrengthCalculator`
  unmodified (verified by diff); strict no-op path preserving B-2…B-6 hashes.
- Versioned contracts + reason codes + ADR-0029 landed; research note
  `docs/research/c1-m3-torpedoes.md` present.
- Traceability updated (SPRINT-PLAN C-1 row, PROGRESS, validation report
  `.ai/reports/c1-m3-torpedoes-impl.md`); Conventional Commits on `dev`; clean
  working tree.