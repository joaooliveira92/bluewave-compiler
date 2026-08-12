# B-1 Spec — Battle Generation & Tactical Setup Scaffolding (M2 Surface Tactical Core)

- **Sprint:** B-1 (`.ai/SPRINT-PLAN.md` Track B row 1)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the scoping sprint)
- **Governing docs:** DESIGN-37 (`docs/rules/battle-generation.md`), DESIGN-26 (`docs/domain/divisions-and-formations.md`); DESIGN-38 (`docs/rules/tactical-combat.md`) for cross-references only.
- **Delivery contract:** DESIGN-55 §3 (§2 boundaries — M2 depends on accepted M1 campaign, battle-generation, persistence, auto-resolution boundaries); ENGINEERING-CONTRACT.md is binding.
- **Baseline:** M1 `COMPLETED` (A-5 gate, 2026-08-12). `@bluewave/campaign`, `@bluewave/combat` (incl. DESIGN-38 tactical scaffolding), `@bluewave/phase-engine` (battle_resolution at order 8), `@bluewave/persistence`, `@bluewave/content-schema`, production pack `content/production/1880` all ACCEPTED.
- **Target:** `@bluewave/combat` and `@bluewave/campaign` capabilities reach `INTEGRATED_NOT_ACCEPTED` (M2 acceptance gate is B-6).

---

## 1. Scope

B-1 delivers **battle generation** (generating a tactical battle from a strategic
contest) plus **tactical setup scaffolding**: the divisions/formations data model,
the promotion of campaign ship data into a reachable tactical format, the battle
manifest, and the deterministic pipeline that produces opportunities → forces →
manifest → seed → reservations, integrated into the monthly phase pipeline ahead
of the existing `battle_resolution` phase.

### 1.1 In scope

1. **Ship data promoted to a reachable tactical format** — a pure conversion from
   `Ship` + `CompiledDesignVersion` to `TacticalShipUnit` carrying armor (belt,
   µm), main guns (caliber µm + count), crew complement, displacement (kg),
   designed speed (µ·m/s), hit points, and canonical ship type. Content deliverable:
   every production-pack ship must promote deterministically; the design data the
   tactical layer needs (armor, guns, crew) is verified reachable.
2. **Permanent division data model** (campaign-authoritative, per DESIGN-26 §2):
   `PermanentDivision` aggregate + invariants (§29 items 1–15) + a validated
   command surface (`CreateDivisionCommand`, `AddShipToDivisionCommand`,
   `RemoveShipFromDivisionCommand`, `DissolveDivisionCommand`,
   `ChangeDivisionFlagshipCommand`) + experience/cohesion (initial values §10,
   penalties §12) + roles (§13–15) + formations (§17) + division effects formulas
   (§16).
3. **Battle generation pipeline** (DESIGN-37 §4): all 15 stages in exact order with
   `BattleGenerationStageRecord` emission, mission registry + priorities (§2–3),
   opportunity determination + ordering + monthly limits (§5–7), participating
   sides (§8), force requirements + mandatory roles (§9–10, §14), eligible-asset
   gathering + deterministic ordering (§11–12), permanent-division preservation
   (§13), optional-asset selection (`optional_asset_selection_v1`, §15), allied
   support limits/ordering (§16–17, structural only), reachability + legality
   (§26), repair (`battle_composition_repair_v1`, ≤3 passes, §27–28), rejection
   (§29), manifest canonicalization (§31), battle seed (§32), reservations (§41),
   auto-resolution proof (§42), and the monthly `BattleGenerationRecord` (§43).
4. **Tactical setup state** — `BattleManifest` (§30), `TacticalDivision` (DESIGN-26
   §19), tactical projection from permanent divisions (DESIGN-26 §20–22, §27),
   `CampaignAssetProvenance` / `TemporaryAssetProvenance` (DESIGN-26 §23–24), and a
   `TacticalBattleState` container (DESIGN-38 §8 scaffolding — sides, forces,
   divisions, units, objectives, weather/visibility placeholders, exit zones,
   battle event ledger). **No** movement/spotting/gunnery/armor/weather mechanics.
5. **Acceptance classes + decision boundary** (§34–40) — classification predicates
   and the deterministic resolution-mode policy for the headless pipeline
   (AUTO_RESOLVE default; see §1.2 and ADR B-1-4).
6. **Phase integration** — new `battle_generation` phase (order 7.5, `rngAllowed`
   true) in `@bluewave/phase-engine`; generated battles flow into the existing
   `battle_resolution` phase (order 8) unchanged.
7. **Reason codes** — DESIGN-37 §44 (24) and DESIGN-26 §28 (17) shipped constants
   with the exact names from the docs.
8. **Reachable mission subset + content isolation** — full 9-type registry is
   registered; only `FLEET_BATTLE` and `CRUISER_BATTLE` are reachable from current
   campaign state. All other missions are registered with complete definitions but
   their opportunity predicates reference input contracts with no owning mechanic
   yet → deterministic successful-empty stage records (DESIGN-55 §13/§14 pattern).
9. **Determinism, save/load, replay** — new snapshot fields participate in canonical
   serialization and hashing; goldens regenerated with a documented cause (ADR-0007).

### 1.2 Out of scope (deferred, not dropped)

| Deferred                                                                                                   | Owner                  | Reason                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Tactical movement, spotting, contact state                                                                 | B-2 (DESIGN-38 subset) | `TacticalBattleState` movement/contact fields are typed placeholders only                                                     |
| Gunnery                                                                                                    | B-3 (DESIGN-39)        | resolver unchanged                                                                                                            |
| Basic armor & damage                                                                                       | B-4 (DESIGN-41 subset) | resolver unchanged                                                                                                            |
| Tactical weather & visibility                                                                              | B-5 (DESIGN-42 subset) | `weather`/`visibility` on manifest = deterministic scenario/default records, no mechanics                                     |
| Battle results → campaign integration (provenance return, war-score via tactical result, M2 gate)          | B-6                    | `BattleResolver` stays M1 strength-based; manifests carry provenance but results still return via M1 `applyBattleResult`      |
| Torpedoes, mines, submarines, coastal defenses, smoke, detailed damage control                             | M3 (C-track)           | DESIGN-55 §4                                                                                                                  |
| Aircraft, carriers, squadrons, CAP, AA                                                                     | M4 (D-track)           | DESIGN-55 §5                                                                                                                  |
| Radar, missiles, EW, data links                                                                            | M5 (E-track)           | DESIGN-55 §6                                                                                                                  |
| Intelligence-limited estimate projection (fog of war)                                                      | DESIGN-29 (unassigned) | `BattleEstimateProjection` is a thin full-knowledge projection under a versioned policy; hidden-truth redaction deferred      |
| Allied AI conduct, allied withdrawal/result application                                                    | B-2/B-6                | B-1 ships eligibility + structural cap + ordering only                                                                        |
| `TransferShipBetweenDivisionsCommand`, `SplitDivisionCommand`, `MergeDivisionsCommand` (campaign commands) | later M2/B-6           | projection-time split (DESIGN-26 §22 step 4) IS in scope; campaign split/merge commands need movement-lock semantics          |
| Division training (`ScheduleDivisionTrainingCommand`), routine monthly experience drift (§11)              | later M2               | `TRAINING_DIVISION_BATTLE_INELIGIBLE` code shipped; training state excluded via invariant-checked absence                     |
| Institutional-confidence decline consequences                                                              | DESIGN-18 (unassigned) | decline applies war-score + objective-progress only                                                                           |
| Player-facing battle UI / accept-decline UI, realism-mode UI                                               | DESIGN-51 (unassigned) | command contract only                                                                                                         |
| Production-pack division YAML                                                                              | later M2               | B-1 keeps divisions empty in pack (ships = unattached assets, legal per DESIGN-37 §12); players create divisions via commands |

---

## 2. Acceptance criteria → requirement IDs → proving tests

All criteria reference the REQ-* catalog in `docs/requirements/REQUIREMENTS.md`
(IDs are per-design-contract statement indexes; new per-item IDs are assigned by
the compiler/index when briefs are generated, prefixed `REQ-DESIGN-37/26` per the
catalog convention).

| #     | Acceptance criterion (B-1)                                                                                                                                                                                                                                                                                                                         | Requirement IDs                                                                                                                                                             | Proving test                                                                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `TacticalShipUnit` is derived purely and deterministically from `Ship` + `CompiledDesignVersion`; carries armor/belt µm, main-guns caliber+count, crew, displacement, designed speed, HP, canonical ship type; a missing/invalid design reference fails loudly; under-construction ships are excluded.                                             | REQ-DESIGN-37-001 (working-up excluded), REQ-DESIGN-06-002 (tactical units map to campaign assets), REQ-DESIGN-08-001 (determinism), REQ-DESIGN-22-001/002 (classification) | `combat/test/tactical/unit.test.ts`; production-pack promotion test (every ship in `content/production/1880/fleets.yaml` promotes); child-process determinism |
| AC-2  | Permanent divisions enforce DESIGN-26 invariants: size 1..5 (DD 1..6); ship in ≤1 division; compatibility (identical types, BB/B mix, CA-in-BC per §5); co-location; first-in-order flagship; one commander or VACANT; role/formation legality; initial exp 20 / cohesion 30; exact penalties (§12).                                               | REQ-DESIGN-26-001, REQ-DESIGN-06-002, REQ-DESIGN-25-001                                                                                                                     | `campaign/test/division.test.ts` (§29 items 1–15)                                                                                                             |
| AC-3  | Division command surface is validated and atomic (ownership, commissioned/operational, co-location, type compatibility, size, flagship/commander/experience consequences); violations fail with the DESIGN-26 reason codes.                                                                                                                        | REQ-DESIGN-26-001, REQ-DESIGN-11-001                                                                                                                                        | `campaign/test/division.test.ts` + `commands/test` extension                                                                                                  |
| AC-4  | Mission registry contains exactly the 9 canonical mission types, unique exact priorities; unregistered type fails `BATTLE_MISSION_TYPE_UNREGISTERED`; priority dup fails `BATTLE_MISSION_PRIORITY_INVALID`.                                                                                                                                        | REQ-DESIGN-37-001, REQ-DESIGN-37-002                                                                                                                                        | `combat/test/generation/mission.test.ts`                                                                                                                      |
| AC-5  | Opportunity determination: only committed post-movement state used; ordering (warId → area/route → priority → opportunityId); monthly limits (1/area/month etc.) enforced with `BATTLE_MONTHLY_LIMIT_REACHED`; opportunities consume no seed/reservations before acceptance.                                                                       | REQ-DESIGN-37-001, REQ-DESIGN-08-002                                                                                                                                        | `combat/test/generation/opportunity.test.ts`                                                                                                                  |
| AC-6  | Eligible-asset gathering is deterministic and consumes no randomness; exclusion reasons assigned (working-up, already-reserved, ineligible); ordering per §12 (side → nation → complete division before unattached → divisionId → position → assetId).                                                                                             | REQ-DESIGN-37-001, REQ-DESIGN-08-002                                                                                                                                        | `combat/test/generation/eligibility.test.ts`                                                                                                                  |
| AC-7  | Complete eligible permanent divisions are preserved as one tactical division (DESIGN-26 §20); adjustments occur only for §21 reason codes; projection order per §22; tactical projection never mutates permanent membership; provenance unique.                                                                                                    | REQ-DESIGN-26-001/002, REQ-DESIGN-06-002                                                                                                                                    | `combat/test/tactical/projection.test.ts`                                                                                                                     |
| AC-8  | Mandatory roles fill deterministically by score/strength/readiness tie-break with no randomness; unfilled → `BATTLE_MANDATORY_ROLE_UNFILLED`. Optional assets use `optional_asset_selection_v1` with stream `battle_generation/month/war/area/mission/optional_asset` keyed by ordered candidate-set hash + role id; same inputs → same selection. | REQ-DESIGN-37-001, REQ-DESIGN-08-002                                                                                                                                        | `combat/test/generation/roles-optional.test.ts`                                                                                                               |
| AC-9  | Reachability/legality revalidated after composition; repair uses only permitted ops and ≤3 passes; irreparable → `BATTLE_COMPOSITION_IRREPARABLE` with no reservations/seed/tactical state/decline consequence.                                                                                                                                    | REQ-DESIGN-37-001, REQ-DESIGN-53-002                                                                                                                                        | `combat/test/generation/repair.test.ts`                                                                                                                       |
| AC-10 | Manifest canonicalization order per §31 occurs before seed derivation; battle seed uses key family `battle/battle_id/root` with the §32 components; identical manifest → identical seed; rejected opportunities never receive a seed.                                                                                                              | REQ-DESIGN-37-001, REQ-DESIGN-08-001                                                                                                                                        | `combat/test/generation/seed-manifest.test.ts`                                                                                                                |
| AC-11 | Accepted manifests reserve assets; max participation 1 ship/month; duplicate → `BATTLE_ASSET_RESERVATION_CONFLICT`; manifest carries an auto-resolution proof covering the resolver's declared surface.                                                                                                                                            | REQ-DESIGN-10-004, REQ-DESIGN-38-003, REQ-DESIGN-37-001                                                                                                                     | `combat/test/generation/reservation.test.ts`                                                                                                                  |
| AC-12 | `battle_generation` phase (order 7.5) runs in the month pipeline: generates BattleInstances + manifests for reachable missions, resolves nothing itself, feeds `battle_resolution`; no-war snapshots produce successful empty records and unchanged final-state hash.                                                                              | REQ-DESIGN-10-004, REQ-DESIGN-08-001, REQ-DESIGN-57-001                                                                                                                     | `phase-engine/test/battle-generation-phase.test.ts`; extend `integration.test.ts`                                                                             |
| AC-13 | Save/load + replay preserve generated manifests, divisions, reservations; same commands → same future outcomes; goldens regenerated only with documented old/new + cause (ADR-0007).                                                                                                                                                               | REQ-DESIGN-52-001, REQ-DESIGN-57-001                                                                                                                                        | `persistence/test` extension; `scripts/verify-golden-hashes.cjs`                                                                                              |
| AC-14 | Production-pack content reachability: every ship's design data promotes to a tactical unit; deferred mission types prove unreachable (empty records), so no `UNSUPPORTED_CONTENT_REACHABLE`.                                                                                                                                                       | REQ-DESIGN-55-001, REQ-DESIGN-37-001                                                                                                                                        | `apps/desktop/test/production-pack.test.ts` extension                                                                                                         |

---

## 3. Dependency-ordered plan (increments)

Each increment is a coherent, independently testable commit boundary. Implement in
order; do not merge an increment past the orchestrator validation gate.

1. **INC-1 — Tactical-unit promotion + classification.** Add `CanonicalShipType`
   classifier (DESIGN-22 predicates, versioned `ship_type_classifier_v1`),
   `TacticalShipUnit`, `promoteTacticalUnit`. Extend production-pack test. ADR B-1-1.
   _No snapshot schema change._
2. **INC-2 — Permanent division aggregate (campaign).** `PermanentDivision` +
   invariants + roles/formations/effects + commands + reason codes.
   _Snapshot schema change (per-nation `divisions`), clone in `month.ts`, hash
   impact; goldens regenerated._
3. **INC-3 — Battle-generation core (combat, pure).** Mission registry, stages
   1–9 (opportunities, sides, force requirements, eligible gathering, division
   preservation via INC-2 projection, mandatory roles, optional selection, allied
   structural, generated elements = none for reachable set).
4. **INC-4 — Composition validation, repair, rejection (stages 10–12), manifest,
   seed, reservations, auto-resolution proof (stages 13–15).**
5. **INC-5 — BattleGenerationRecord + reason codes + canonical ordering; `BattleGenerator`
   facade + `generateBattles` pure entry point; child-process determinism proof.**
6. **INC-6 — Phase integration.** `battle_generation` phase (order 7.5) in
   `@bluewave/phase-engine` registry + `month.ts`; decision-boundary policy
   (AC-12); full-turn integration + save/load + replay tests; goldens.
   **No-op hash clarification (reviewer follow-up):** AC-12's "no-war month yields an
   unchanged final-state hash" holds only if the no-op path leaves the new
   collections (`WarState.battleManifests`, `NationState.divisions`) **absent rather
   than canonically-serialized-empty** — confirm the canonical serializer omits empty
   collections, or assert the no-op closing hash equals the pre-B-1 golden with the
   intended cause recorded (ADR-0007). Pin this down in INC-6.

**Boundaries:** INC-2 must not touch resolver behavior. INC-3–5 must not touch the
phase pipeline. INC-6 is the only increment that edits `phase-engine`.
`BattleResolver` and `StrengthCalculator` are read-only for the whole sprint.

**Compatibility / hash / persistence impacts (flag to orchestrator):**

- `NationState.divisions` (INC-2) and `WarState.battleManifests` +
  `BattleInstance.manifestHash` (INC-4/6) change canonical snapshot serialization.
- New phase `battle_generation` changes the phase registry (ADR-0009 precedent:
  a new phase id with `rngAllowed` changes ledger/replay surface).
- Golden hashes (8/8) will change at INC-2 and INC-6 boundaries; each regen must
  record old/new + authoritative cause + migration assessment per ADR-0007. Save
  compatibility: B-1 is pre-release (private workspace packages), so an explicit
  migration is not required for existing saves, but the persistence schema version
  string must be bumped and recorded.

---

## 4. Symbols & files

### 4.1 `@bluewave/combat` (new modules; package exports extended via `src/index.ts`)

New files (package `@bluewave/combat`):

- `src/tactical/shipType.ts` — `CanonicalShipType` (union of DESIGN-22 classes),
  `classifyShip(design: CompiledDesignVersion): CanonicalShipType`,
  `SHIP_TYPE_CLASSIFIER_VERSION = "ship_type_classifier_v1"`, `InvalidShipType`
  error. Pure; no state.
- `src/tactical/unit.ts` — `TacticalShipUnit` (assetId, campaignShipId, sideId,
  divisionId?, name, className, designVersionId, shipType, displacementKg,
  designedSpeedUms, armorBeltUm, mainGunsCaliberUm, mainGunsCount, crewComplement,
  hitPoints, maxHitPoints, sourceStateHash, provenance), `promoteTacticalUnit(
ship: Ship, design: CompiledDesignVersion): TacticalShipUnit`.
- `src/tactical/division.ts` — `DivisionRole` (INDEPENDENT/CORE/SUPPORT/SCOUT/
  SCREEN/PATROL), `DivisionFormation` (LINE_AHEAD/LINE_ABREAST/SEARCH_LINE/SCREEN),
  `TacticalDivision` (DESIGN-26 §19 fields), `projectPermanentDivisions` (DESIGN-26
  §20–22 projection), `divisionEffectsV1` (§16 formulas, clamp 7_500..12_500),
  `formationLegality` (§17), `ddScoutThreshold` (§15, 1_500 t), role eligibility
  (§14), `DIVISION_ROLE_INELIGIBLE` etc.
- `src/tactical/provenance.ts` — `CampaignAssetProvenance`, `TemporaryAssetProvenance`,
  `assertProvenanceUnique`, `TACTICAL_PROVENANCE_INVALID`.
- `src/tactical/state.ts` — `TacticalBattleState` (DESIGN-38 §8 scaffolding: map,
  tactical sides, forces, tactical divisions, tactical units, contacts, objectives,
  weather/visibility placeholders, exit zones, battle event ledger). No mechanics.
- `src/tactical/reasonCodes.ts` — the 17 DESIGN-26 §28 reason codes as exported
  consts + `REASON_CODES` map (mirror `reasonCodes.ts` style).
- `src/generation/mission.ts` — `BattleMissionType` union (9), `MissionPriority`,
  `BattleMissionDefinition` (DESIGN-37 §2 fields), `MISSION_REGISTRY`, `getMission`,
  `BATTLE_MISSION_TYPE_UNREGISTERED`, `BATTLE_MISSION_PRIORITY_INVALID`.
- `src/generation/opportunity.ts` — `BattleMissionOpportunity` (§5 fields, status
  union), `OpportunityInputs`, `determineMissionOpportunities`, ordering (§7),
  `BATTLE_MONTHLY_LIMIT_REACHED`, `BATTLE_OPPORTUNITY_INELIGIBLE`.
- `src/generation/sides.ts` — `TacticalSideId` (ATTACKER/DEFENDER), `TacticalSideRecord`,
  `determineParticipatingSides`, `BATTLE_SIDE_INVALID`.
- `src/generation/force.ts` — `BattleForceRequirementPolicy` (§9),
  `createForceRequirements`, `MandatoryRole`, `assignMandatoryRoles`,
  `BATTLE_FORCE_REQUIREMENT_MISSING`, `BATTLE_MANDATORY_ROLE_UNFILLED`.
- `src/generation/eligibility.ts` — `gatherEligibleAssets`, per-asset exclusion
  reason, deterministic ordering (§12), `SHIP_WORKING_UP_BATTLE_INELIGIBLE`,
  `SHIP_ALREADY_RESERVED_FOR_BATTLE`, `FUEL_BATTLE_INELIGIBLE`, `BATTLE_RANGE_INELIGIBLE`.
- `src/generation/optional.ts` — `optionalAssetSelectionV1` (weight formula §15,
  explicit integers), stream `battle_generation/month/war/area/mission/optional_asset`
  keyed by `orderedCandidateSetHash + optionalRoleId`.
- `src/generation/allied.ts` — allied eligibility (§16), `maximumAlliedStrength`
  (§17, 5_000 bp), ordering (§17).
- `src/generation/repair.ts` — `battle_composition_repair_v1` (§27), ordering +
  ≤3 passes (§28), `BATTLE_COMPOSITION_IRREPARABLE`.
- `src/generation/reachability.ts` — `revalidateReachabilityAndLegality` (§26),
  `BATTLE_REACHABILITY_FAILED`.
- `src/generation/manifest.ts` — `BattleManifest` (§30), `canonicalizeManifest`
  (§31), `computeManifestHash` (pre-seed hash, ADR B-1-5), `BATTLE_MANIFEST_INVALID`.
- `src/generation/seed.ts` — `deriveBattleSeed` (key family `battle/battle_id/root`,
  §32 components, via `@bluewave/random` `splitSeed`/`RandomEngine.stream`).
- `src/generation/reservation.ts` — `reserveAssets`, `releaseProvisionalReservations`,
  `BATTLE_ASSET_RESERVATION_CONFLICT`.
- `src/generation/autoResolutionProof.ts` — `AutoResolutionProof`,
  `proveAutoResolvable(manifest, resolverCapabilities)`, reuses existing
  `assertAutoResolvable` from `src/autoResolution.ts`.
- `src/generation/acceptance.ts` — acceptance classes (§34) + mission classification
  (§39) + resolution-mode policy (AC-12; AUTO_RESOLVE default policy) +
  `DeclineBattleCommand` contract validation.
- `src/generation/pipeline.ts` — `BattleGenerator` facade + pure `generateBattles(
inputs): { records, manifests, instances, rejections }`; `BattleGenerationStageRecord`
  (§4) for all 15 stages; `BattleGenerationRecord` (§43); `BATTLE_GENERATION_INVARIANT_FAILED`.
- `src/generation/reasonCodes.ts` — the 24 DESIGN-37 §44 reason codes + `REASON_CODES`.
- `src/generation/index.ts` / `src/tactical/index.ts` — re-export bundles; update
  `src/index.ts` to `export * from "./generation/index.js"` and
  `export * from "./tactical/index.js"`.

### 4.2 `@bluewave/campaign` (permanent divisions — authoritative campaign state)

- `src/division.ts` — `PermanentDivision` (DESIGN-26 §2 fields: divisionId, nationId,
  shipOrder, flagshipShipId, commanderOfficerId | "VACANT", divisionRole,
  preferredFormation, experience, cohesion, locationAreaId, creationMonth,
  lastReorganizationMonth, provenanceRefs, rulesetVersion, aggregateHash),
  `DivisionType`, `assertDivisionInvariants` (§29 items 1–15), `applyDivisionCommand`
  (pure, atomic membership application with §12 penalties),
  `DIVISION_SIZE_LIMIT_EXCEEDED`, `DIVISION_SHIP_TYPE_INCOMPATIBLE`,
  `CA_BC_DIVISION_MIX_INELIGIBLE`, `DIVISION_LOCATION_CONFLICT`,
  `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`, `DIVISION_FLAGSHIP_INVALID`,
  `DIVISION_COMMANDER_INVALID`, `DIVISION_FORMATION_INELIGIBLE`,
  `DD_SCOUT_DISPLACEMENT_INELIGIBLE`, `DIVISION_STATE_INVARIANT_FAILED`.
- `src/commands/divisionCommands.ts` — `CreateDivisionCommand`,
  `AddShipToDivisionCommand`, `RemoveShipFromDivisionCommand`,
  `DissolveDivisionCommand`, `ChangeDivisionFlagshipCommand` (DESIGN-26 §7
  validation list); wire into the existing `@bluewave/commands` lifecycle
  (`lifecycle.ts` handler registration) with `DIVISION_*` outcomes.
- `src/state.ts` — add `divisions: PermanentDivision[]` to `NationState` (canonical
  order: by divisionId). No back-pointer on `Ship` (division owns ordered `shipOrder`;
  the at-most-one invariant is validated over the aggregate).
- `src/index.ts` — export `division.ts` + division commands.
- `src/compiler.ts` — materialize `divisions: []` (no division YAML in B-1; see
  scope), validate `shipOrder`/`flagshipShipId` references when present.

### 4.3 `@bluewave/phase-engine`

- `src/registry.ts` — add phase `{ id: "battle_generation", name: "Battle Generation",
order: 7.5, readPermissions: ["wars", "fleets", "politics"], writePermissions:
["wars"], rngAllowed: true }` (between resolve_research order 7 and
  battle_resolution order 8).
- `src/month.ts` — Phase 9.5: build `BattleGenerationInputs` from committed snapshot
  (post-construction state; no movement phase exists yet so presence = `locationAreaId`
  - `inBattleId`), call `generateBattles`, append pending `BattleInstance`s (with
    `manifestHash`) + manifests to `WarState`, apply reservations (`inBattleId`),
    record `BattleGenerationRecord`; no-op path returns empty record. Extend
    `cloneSnapshot` for `divisions`, `battleManifests`, `manifestHash`.
- `src/index.ts` — export the new phase surface as needed by engine/replay.

### 4.4 `@bluewave/persistence` / replay

- `src/` — extend canonical serialization fixtures with the new snapshot fields;
  bump the persistence schema version string; extend the replay verifier's
  snapshot-copy paths (mirror `replay.ts` / `run-child.ts` field lists).

### 4.5 `@bluewave/content-schema`

- No schema change required. Add `shipType` as an _optional, non-mechanical_
  authored field is **not** required — classification is derived (INC-1). Keep the
  schema as-is; add a test that `DesignTemplateSchema` provides everything
  `promoteTacticalUnit` needs.

### 4.6 Content (`content/production/1880/`)

- No YAML change required in B-1. The pack's ships/designs already carry armor,
  guns, and crew. Add a validation test that proves every compiled ship promotes
  (AC-14) and that the deferred mission types have no reachable opportunity.

### 4.7 Commands / AI

- `@bluewave/commands`: register the 5 division commands (INC-2).
- `@bluewave/ai`: no change (AI generates strategic commands; battle decision policy
  is engine-level, AC-12).

---

## 5. Test list

### 5.1 New test files

- `packages/combat/test/tactical/unit.test.ts` — AC-1 (promotion, purity,
  determinism, missing design failure, under-construction exclusion).
- `packages/combat/test/tactical/shipType.test.ts` — AC-1 (DESIGN-22 class
  predicates incl. borderline precedence, per REQ-DESIGN-22-001).
- `packages/combat/test/tactical/projection.test.ts` — AC-7 (preservation,
  adjustment reasons, split order preservation, no permanent mutation, provenance
  uniqueness, tactical canonical ordering §27).
- `packages/combat/test/generation/mission.test.ts` — AC-4.
- `packages/combat/test/generation/opportunity.test.ts` — AC-5.
- `packages/combat/test/generation/eligibility.test.ts` — AC-6.
- `packages/combat/test/generation/roles-optional.test.ts` — AC-8.
- `packages/combat/test/generation/repair.test.ts` — AC-9.
- `packages/combat/test/generation/seed-manifest.test.ts` — AC-10.
- `packages/combat/test/generation/reservation.test.ts` — AC-11.
- `packages/combat/test/generation/pipeline.test.ts` — stage ordering (§4), empty
  records, `BattleGenerationRecord` completeness, determinism across two engine
  instances.
- `packages/combat/test/fixtures/generation-fixture.ts` — two-nation active-war
  fixture (GBR/FRA, both fleets in one shared area, seeded designs) reused by the
  above; mirrors `phase-engine/test/diplomacy-war.test.ts` builders.
- `packages/campaign/test/division.test.ts` — AC-2/AC-3 (all §29 items 1–15 +
  commands + penalties + flagships + roles + formations).
- `packages/phase-engine/test/battle-generation-phase.test.ts` — AC-12 (full turn:
  war → generation phase → manifest → battle_resolution resolves; no-war snapshot
  empty; decision-boundary AUTO_RESOLVE policy; 24-month AI smoke still green).
- `packages/persistence/test/battle-generation-persistence.test.ts` — AC-13
  (save/load roundtrip with manifests/divisions/reservations; replay identical).

### 5.2 Extended existing suites

- `packages/combat/test/tatical-design.test.ts` — add DESIGN-26/37 constant checks
  that touch the same exported surface (unchanged assertions preserved).
- `packages/phase-engine/test/integration.test.ts` — add a generated-battle
  integration case (fixture creates war via commands, generation phase produces the
  battle).
- `packages/cross-process-test/src/run-child.ts` — copy the new snapshot fields;
  add a battle-generation scenario to the byte-identical determinism proof.
- `apps/desktop/test/production-pack.test.ts` — AC-14 (every production ship
  promotes; deferred mission types unreachable).
- `packages/commands/test/commands.test.ts` — division command lifecycle cases.

---

## 6. Validation commands

Focused (per package):

```
pnpm -w turbo run build test --filter=@bluewave/combat
pnpm -w turbo run build test --filter=@bluewave/campaign
pnpm -w turbo run build test --filter=@bluewave/phase-engine
pnpm -w turbo run build test --filter=@bluewave/persistence
pnpm -w turbo run build test --filter=@bluewave/commands
```

Full orchestrator gate (before any commit):

```
pnpm -w turbo run build --force          # clean uncached build
pnpm -w typecheck                         # turbo run typecheck (tsc -b per package)
pnpm lint
pnpm format
pnpm test:run                             # full suite (vp test run)
node scripts/verify-golden-hashes.cjs     # 8/8 goldens; regeneration only with ADR-0007 cause
pnpm test:cross-process                   # two child runs byte-identical (incl. generation scenario)
```

Golden regeneration procedure: run the verify script, record old/new hashes + cause
(+ migration assessment) in the sprint validation report, per ADR-0007, at the
INC-2 and INC-6 boundaries.

---

## 7. Definition of done (reviewer checklist)

- [ ] All 14 acceptance criteria (AC-1..AC-14) have passing, committed proof tests.
- [ ] No `OPEN DECISION` marker introduced; every flagged ambiguity resolved by an
      ADR (B-1-1..B-1-6) before merge; nothing resolved silently.
- [ ] `BattleResolver` / `StrengthCalculator` unmodified (M1 auto-resolution
      boundary untouched).
- [ ] All 15 generation stages emit `BattleGenerationStageRecord`s; unreachable
      mission types produce deterministic successful-empty records only.
- [ ] Manifest canonicalization precedes seed derivation; seed stream family is
      exactly `battle/battle_id/root`.
- [ ] DESIGN-26 §29 items 1–15 and DESIGN-37 §45 items applicable to B-1's scope
      are each proven by at least one test.
- [ ] Snapshot schema changes (`NationState.divisions`,
      `WarState.battleManifests`, `BattleInstance.manifestHash`) flow through
      `month.ts` clone, persistence, replay, and cross-process harness.
- [ ] Golden hashes regenerated with old/new + cause recorded; save/load + replay + cross-process determinism green.
- [ ] Production-pack test proves every ship promotes and deferred content is
      unreachable (no `UNSUPPORTED_CONTENT_REACHABLE`).
- [ ] 24-month AI zero-human smoke (`ai-scenario.test.ts`) remains green with the
      new phase.
- [ ] Out-of-scope items §1.2 are recorded in the sprint report (deferred, not
      dropped); traceability (PROGRESS.md, SPRINT-PLAN B-1 row) updated.
- [ ] Clean tree, Conventional Commits on `dev`, no self-merge, PR description
      prepared.

---

## 8. Decision triggers for the orchestrator

**No genuine canonical-contract ambiguity requires a human decision-request.** All
are routine design choices resolvable as versioned ruleset constants + ADRs
(AUTONOMOUS-AGENT.md). Proposed ADRs (orchestrator to author before each
increment merge):

- **ADR B-1-1 — Package boundary.** Permanent divisions live in `@bluewave/campaign`
  (campaign-authoritative state); battle generation + tactical setup live in
  `@bluewave/combat`. Rationale: ENGINEERING-CONTRACT "no speculative packages";
  divisions are strategic state (commands/construction month), generation consumes
  them.
- **ADR B-1-2 — Ship-type classifier.** `CanonicalShipType` derived deterministically
  from DESIGN-22 predicates over `CompiledDesignVersion` (`ship_type_classifier_v1`),
  not authored, not inferred at runtime. Changes to classification are a versioned
  ruleset change.
- **ADR B-1-3 — Reachable mission subset.** Only `FLEET_BATTLE` and `CRUISER_BATTLE`
  generate in B-1; the other seven are registered with complete definitions and
  proven-unreachable empty records until their owning mechanics (DESIGN-33/36/32/
  M3/M4) land. Prevents `UNSUPPORTED_CONTENT_REACHABLE`.
- **ADR B-1-4 — Battle decision boundary in headless sim.** Acceptance classes are
  classified per §34/§39; resolution mode is AUTO_RESOLVE when an automation policy
  exists (B10d precedent) and for AI-only battles; a player battle with no policy
  holds pending (skipped by `battle_resolution`, never silently declined/auto-resolved,
  §40). Player-facing UI/decline consequences beyond the command contract deferred.
  Decline applies war-score + objective-progress; confidence deferred (DESIGN-18).
- **ADR B-1-5 — Manifest hash / seed bootstrapping.** `computeManifestHash` is
  defined over the canonicalized pre-seed manifest; the derived seed is stored in a
  seed-envelope field and excluded from the manifest hash (`manifest_hash_v1`).
  Resolves the §30-vs-§32 circular reference deterministically without changing
  gameplay.
- **ADR B-1-6 — Auto-resolution proof scope.** `proveAutoResolvable` verifies the
  manifest only exercises the resolver's _declared_ surface (surface persistent
  ships, strength/damage/losses, provenance return, no withdrawal/surrender/
  objectives yet). Full proof for withdrawal/surrender/objectives ships in B-2/B-6.
  This closes the DESIGN-37 §42-vs-M1-resolver gap as a declared-capability contract,
  not a silent weakening.
- **ADR B-1-7 — Reachable opportunity predicate.** M1 state (`WarState`,
  `FleetState`) has no mission/operation/contact entity, yet DESIGN-37 §6 predicates
  FLEET_BATTLE / CRUISER_BATTLE opportunities on a "fleet/decisive-contact" or
  "contact/patrol opportunity" record. B-1 therefore defines the reachable predicate
  deterministically (versioned `opportunity_reachability_v1`): **an opportunity for a
  reachable mission arises from opposing active-war surface presence co-located in
  the same area post-movement** (presence = `locationAreaId`; no mission/contact
  record is created in B-1, since movement/spotting are B-2). This is a versioned
  ruleset decision, not invention, and must be authored before INC-3 so the
  implementator does not guess which manifests are authoritative.

**Escalation triggers (stop + decision-request) only if:** an implementator finds
DESIGN-37/26 statements that are internally contradictory _after_ the above ADRs
(e.g. two plausible readings of a mission's force-requirement contract that change
authoritative manifests), or a change to M1's accepted golden hashes that cannot be
caused-and-documented. Otherwise proceed continuously.
