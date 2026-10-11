# Armament content model (ADR-0093 Steps 2–4)

The first-class armament catalogue is authored under
`content/production/<scenario>/ship-building/armament/` and validated by the release gate. As of
**Step 3** the ship-design compile resolves every installed weapon through this content and
`resolveArmament` (`@bluewave/armament`). As of **Step 4** the compiled design persists an immutable
`CompiledArmamentMount` snapshot that combat consumes for its battery identity; the legacy
`components.yaml` / `naval-profiles/` representations remain the source only for the bounded
compatibility path (a nation with no armament content, or a design with no snapshot).

## The four collections

| File | Concept | Notes |
| --- | --- | --- |
| `gun-families.yaml` | `GunFamily` | One record per shared physical/technical family. Never duplicated per nation. |
| `gun-models.yaml` | `GunModel` | A national model that references a shared family. |
| `gun-mounts.yaml` | `GunMountDef` | The mount catalogue, kept separate from the gun model. |
| `ammunition.yaml` | `AmmunitionPattern` | National shell patterns. |

The Zod schemas live in `packages/content-schema/src/armament.ts`; the domain types live in
`packages/armament/src/model.ts`.

## Canonical units

Every numeric field names its unit; ambiguous names are rejected by `.strict()`.

| Field | Unit |
| --- | --- |
| `caliberUm` | micrometres |
| `barrelLengthCalibers` | calibres (unitless ratio) |
| `gunMassKg`, `shellMassG`, `explosiveFillerG`, `topWeightKg` | kilograms / grams |
| `nominalMuzzleVelocityUmPerSec` | micrometres per second |
| `mechanicalRateOfFireRoundsPerMinuteX100` | hundredths of a round per barrel per minute |
| `propellantChargeBp`, `penetrationBiasBp`, `...ModifierBp`, `...EffectBp` | basis points (10 000 = 1.0) |
| `roundVolumeMl`, `hullSpaceUsageLitre` | millilitres / litres |
| `supportedArmorMm` | millimetres |
| `traverseDeg`, `elevationMinDeg`, `elevationMaxDeg`, `firingArcDeg` | degrees |
| `ammunitionCostMicro` | budget micro-units |

## Shared families and national models

A `GunFamily` is shared: the British RML 64-pounder, the Nordenfelt 1-inch and the French 27 cm
mle 1875 each have **one** family. A `GunModel` references a family and carries only what the nation
varies (a shell mass, a date, mount support, technology). A nation that fields a family without a
national variant gets a thin availability model; the runtime resolver contains no nation-id branch —
national difference enters only through the national-access context data.

## Provenance and confidence

Every family, model, mount and ammunition pattern carries a provenance block
(`sourceStatus` / `confidence` / `kind` / `sources` / optional `derivation` / `note`). The release
gate rejects a PLACEHOLDER status, a missing source reference, a historical claim that is only a
BALANCE_TARGET, a balance adjustment claiming VERIFIED status, and a derivation with no conversion
explanation. The content distinguishes VERIFIED, DERIVED, ESTIMATE, BALANCE_TARGET and PLACEHOLDER.

## Compatibility

- A model's `supportedMountTypes` bounds the mounts it may use; a mount's `compatibleGunFamilies`
  bounds the families it accepts; an ammunition pattern's `compatibleGunFamilies` /
  `compatibleGunModelIds` bound the guns it fits. These are validated by `lintArmament` and, for the
  opening designs, by the coverage check.
- **Legacy drift.** While both representations coexist, the release gate fails (`ARMAMENT_COMPAT_DRIFT`)
  if the authored mount masses, model numbers (caliber, mass, charge, volume, rate, shell mass against
  the national overlay), firing arcs, or ammunition shell type / penetration bias differ from
  `components.yaml` / `naval-profiles/`.

## Release lint rules

`lintArmament` (neutral package) emits structured findings with a severity, a stable rule code, the
entity, the field, machine-readable parameters and a deterministic message, ordered by severity,
code, entity, field and parameters. It covers: canonical/unique ids, references, family/model
consistency, mount/ammunition compatibility, explicit units and ranges, date ordering, technology
and national references, provenance completeness, release PLACEHOLDER, and duplicate contradictory
values. The ship-design wrapper `lintArmamentContent` adds the legacy drift checks and the
opening-design coverage proof, and is integrated into the national completeness gate
(`validateArmamentContent`, called by `validateAllNations`). The gate fails on `BLOCKING` findings;
`WARNING` (e.g. an imported component) and `ADVISORY` (e.g. a PLACEHOLDER outside release, a legacy
model with no counterpart yet) stay visible and are never promoted to blockers.

## Mapped and unresolved values

Mapped and consumed by ship design after Step 3: caliber, gun mass, shell mass, propellant charge,
round volume, mechanical rate of fire, mount base/per-gun mass, firing arc, introduction/retirement
dates, supported mount types, required technology and national access. The compiled weapon contract
(`ComponentSummary.armament`) records the gun family/model/mount/ammunition ids, gun count, caliber,
shell mass, charge, rate of fire, gun mass, mount mass, total installation mass, ammunition unit mass,
firing arc, access status and applied modifiers.

Retained through the explicitly named legacy compatibility path (not yet owned by the first-class
model): the component's hull-space volume (`ComponentSummary.weightKg` and the arrangement volume) and
the component cost (`costMicro`) — both are read from the merged `ComponentDef` and proven equivalent
to the armament installation mass by the migration tests. They are not a generic fallback: the
component is the single owner of that authored value.

Unresolved (absent, never fabricated) and combat-only as of **Step 4**: barrel length, loading system,
muzzle velocity, gun reliability, top-weight, supported armour, traverse/elevation, crew protection,
stability contribution, vulnerability, ammunition propellant interaction, explosive filler, bursting
and fire effects, storage hazard and ammunition cost. Combat consumes none of them; the current combat
model reads only compiled-design caliber/count/armour and its own versioned combat constants. They remain
recorded in `ARMAMENT_ADAPTER_UNMAPPED_FIELDS`.

## Combat consumption (Step 4)

- **Persisted contract.** `toEngineDesign` maps the Step 3 per-placement resolutions into
  `CompiledArmamentMount` records (identity + grounded values, `instanceId`-ordered) and
  `buildDesignVersion` persists them as `CompiledDesignVersion.armament`. This is plain JSON, immutable
  per design version, deep-cloned by `snapshotClone`, and validated as a JSON record by the persistence
  schema. No save-schema version change; old saves (no `armament`) load through the compatibility path.
- **Combat projection.** `projectBattle` selects the main-battery installation (`mainArmamentOf`) and sets
  `GunneryState.gunDefinitionId`/`mountDefinitionId` to the gun-model/mount id plus optional
  `gunFamilyId`/`ammunitionPatternId`; a fired salvo event carries a `weaponIdentity`. Legacy designs keep
  the synthetic `` `${designVersionId}:MAIN` `` / `"MAIN-BATTERY"` ids.
- **Package boundary.** `@bluewave/combat` and `@bluewave/campaign` depend on `@bluewave/armament`;
  combat does **not** depend on ship-design. No nation-id branch is added to shared combat logic.

## Canonical caliber unit contract (ADR-0094)

`caliberUm` is the single canonical caliber unit across the armament-to-combat boundary, and it is
**micrometres** everywhere: first-class content (`caliberUm`), ship design
(`CompiledDesignVersion.mainGunsCaliber`), the persisted combat snapshot
(`CompiledArmamentMount.caliberUm`), tactical projection (`TacticalShipUnit.mainGunsCaliberUm`), and
the combat damage target (`DamageTargetContext.mainGunsCaliberUm`). The armor model
(`normalizedArmorUm`, `autoZonesForBelt`, `effectiveResistanceUm`) is also micrometres, with its
thick-armor threshold at `304_800` µm (12 in). No hop between these carries any other unit.

The ADR-0021 linear penetration formula reads caliber in millimetres, so combat converts exactly once
(`packages/combat/src/battleResolution/damage.ts`):

```
capabilityUm = floor(caliberUm * velocityMs / 1_000)
```

`caliberUm / 1_000` is an exact rational (a caliber need not be a whole number of millimetres); the
mm → µm re-scale cancels the two `1_000` factors, so the formula rounds exactly once, with `floor`,
and preserves fractional millimetres. `CALIBER_CANONICAL_UNIT = "micrometre"` and
`MICROMETRES_PER_MILLIMETRE = 1_000` are exported from combat. A non-finite or non-positive caliber
fails structurally (`BATTLE_AUTO_RESOLUTION_FAILED`) rather than flooring to zero. This supersedes the
pre-existing `floor(caliberUm / 1_000_000)` defect (ADR-0094).

## Migration boundary

- **Step 2:** author and validate content.
- **Step 3:** ship design resolves installed weapons through `resolveArmament`; errors map to structured
  ship-design findings; candidate generation selects only resolvable armament; new saves record a
  separate `armamentContentHash`. The legacy compile path is retained only as the bounded compatibility
  path for contexts (or nations) with no first-class armament content.
- **Step 4 (this pass):** combat consumes the persisted `CompiledArmamentMount` snapshot for its battery
  identity. Gameplay is unchanged — identity is additive provenance. The combat-only unresolved values
  above stay unauthored and unconsumed; the synthetic identity fallback is retained only for designs with
  no snapshot.
- **Step 5 (Drawing Board):** author the combat-only fields, migrate starter/saved designs so every design
  carries a snapshot, then retire the synthetic identity fallback and present resolution findings in the UI.

Compatibility fields may not be removed before their consumers migrate.
