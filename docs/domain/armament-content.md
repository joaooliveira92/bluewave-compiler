# Armament content model (ADR-0093 Step 2)

The first-class armament catalogue is authored under
`content/production/<scenario>/ship-building/armament/` and validated by the release gate. It is
**additive**: the legacy `components.yaml` / `naval-profiles.yaml` representations still drive the
runtime compile, construction and combat until the Step 3 ship-design cut-over.

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
  `components.yaml` / `naval-profiles.yaml`.

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

Mapped today: caliber, gun mass, shell mass, propellant charge, round volume, mechanical rate of
fire, mount base/per-gun mass, firing arc, introduction/retirement dates, supported mount types,
required technology, national access, penetration bias and shell type.

Unresolved (absent, never fabricated): barrel length, loading system, muzzle velocity, gun
reliability, top-weight, supported armour, traverse/elevation, crew protection, hull-space usage,
stability contribution, vulnerability, ammunition propellant interaction, explosive filler, bursting
and fire effects, storage hazard and ammunition cost. These remain recorded in
`ARMAMENT_ADAPTER_UNMAPPED_FIELDS` and are deferred to the ship-design and combat cut-overs.

## Migration boundary

- **Step 2 (this pass):** author and validate content. Legacy runtime paths still control ship design
  and combat.
- **Step 3:** ship design cuts over to `ResolvedArmament`; the compatibility adapter and the
  duplicated compatibility fields are retired.
- **Step 4:** combat cuts over.

Compatibility fields may not be removed before their consumers migrate.
