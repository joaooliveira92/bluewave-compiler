# Proposal: platforms, slots and parts — one representation for ships and their swappable parts

**Status:** proposal, revision 4.1 (design only; no code, content, save or visual-YAML changes)
**Date:** 2026-10-13

Revision history:

- **Rev 1:** options and recommendation.
- **Rev 2:** owner review 1. Option C; `mountCount` × `gunsPerMount`; ship types and
  torpedoes as content; the visual/compatibility split; the equivalence report.
- **Rev 3:** owner review 2. Old saves refused; torpedo translation; DQ-TORPEDO-001;
  `interfaces/1`; mass-application bases; the visual-trait proposal.
- **Rev 4** (this): owner review 3.
  - **D17 is approved as a battery-assembly translation.** The even/odd heuristic is
    rejected; DQ-ARMAMENT-001 is narrowed.
  - **The 35 cm/350 mm rule** is decided on structured data only.
  - **The D16 review gate** is applied; the trait definitions are revised to meet it.
  - **P1 is authorised.**
  - **The counts everywhere** are 91 designs, 823 placements, 28 torpedo-tube placements,
    9 central-battery placements and 15 national launcher variants.
  - **Two findings** from checking the rulings against the data:
    - The structured national torpedo diameters fix the DQ-TORPEDO-001 scope (§9.4).
    - The battery translation changes two mount-type identity strings while every
      number stays equal (D18, §9.2).
- **Rev 4.1:** owner sign-off of D18 with constraints, and confirmation of the
  DQ-TORPEDO-001 scope (5 waivered records, 9 entries). **All P2 design decisions are now
  closed**; only the D16 exact definitions (INC-4 gate) remain under review.

**Scope:** the authored ship-building YAML under `content/production/1880/ship-building/`;
its TypeScript model in `@bluewave/content-schema`, `@bluewave/ship-design` and
`@bluewave/armament`; the ship-type registry; the combat torpedo model; save compatibility;
and the `@bluewave/ship-visual` catalog keys.

**Contents:**

- §0 decision log
- §1 current state
- §2 options
- §3 model
- §4 slots and compatibility
- §5 time
- §6 invariants
- §7 boundaries
- §8 interface and visual contracts
- §9 migration phases and translation tables
- §10 equivalence strategy
- §11 decision status and P1 authorisation
- §12 implementation order
- §13 risks
- §14 draft ADR

---

## 0. Decision log

| # | Decision | Status |
| --- | --- | --- |
| D1 | Option C: a unified part catalogue with interfaces, platform slots, loadouts, lifecycle, revisions, supersession, compiled indexes and pure queries. | **Approved** (review 1) |
| D2 | `barrels` is retired. An entry's `mountCount` = installed units of its part. A gun mount part's `gunsPerMount` = guns in one mount. Total guns = `mountCount × gunsPerMount`, derived by the compiler. `barrels` exists only in migration tooling. | **Approved** (review 1) |
| D3 | Every quantity component declares an application basis: `PER_LOADOUT_ENTRY`, `PER_PART_UNIT` or `PER_CONTAINED_UNIT`. The legacy gun fixed installation mass migrates as `PER_LOADOUT_ENTRY`, a legacy-preservation basis that is not a claim of physical accuracy. Rev 2's `PER_FIT`/`PER_MOUNT` are draft aliases only. Safeguards S1–S8 (§3.8). | **Approved** (review 2) |
| D4 | Ship types are content records referencing closed, code-owned engine behaviour classes. | **Approved** (review 1) |
| D5 | Torpedoes are parts; launchers are assemblies; combat keeps every algorithm and reads `CompiledTorpedo`. | **Approved** (review 1) |
| D6 | Interfaces decide compatibility; visual traits decide rendering. Precedence: override → trait → interface family → missing-asset glyph. Visual metadata never influences simulation. | **Approved** (review 1) |
| D7 | INC-4 and the ship-visual YAML restructure stay paused until D16's exact definitions pass review. They are independent of P2. | **Approved**; tracker updated |
| D8 | Acceptance = structural and semantic equivalence over all 91 reference designs (823 placements), with a machine-readable report listing every compared value. | **Approved** (review 1) |
| D9 | Slot placement keeps `ZONE_IDS` and `ARMOUR_REGIONS`. | Default |
| D10 | National hard limits and platform constraints both apply; the stricter wins. | Default |
| D11 | `designs.yaml` fleet templates are untouched; deriving them is deferred. | Deferred |
| D12 | Old saves are refused, never translated (ADR-0113). The compatibility version is bumped at P2. Campaign snapshots (with `sourceDraft`) and `drawing-board-draft.json` are both covered. The offline, versioned dev-fixture tool never ships. | **Approved** (review 2) |
| D13 | Torpedo translation: `tubes: n` → `mountCount: n` of a single-tube launcher; an absent count → 1; no `tubesPerLauncher`; launcher quantities `PER_PART_UNIT`; no fixed installation. Safeguards T1–T6. Covers all **28** tube placements. | **Approved** (review 2) |
| D14 | DQ-TORPEDO-001: preserve inconsistent launcher-to-torpedo relationships through enumerated, record-scoped waivers, reported as inherited data-quality findings. The constraint is never weakened. | **Approved** (review 2); **scope fixed by D19** |
| D15 | `interfaces/1` (14 identifiers, §8.1) and its governance. | **Approved** (review 2) |
| D16 | `visual-traits/1`: seven traits with closed values, ownership (authored / compiler-derived / derived with override), source fields, defaults, contradiction rules V1–V12, the ADR-0148 translation map, and the casemate-family mapping for batteries. The rev 4 definitions are revised to meet the review gate (§8.2). | **Architecture approved** (review 3); **exact definitions awaiting review** (INC-4 gate only) |
| D17 | **Central-battery translation:** each of the nine placements becomes **one** battery-assembly entry: `mountCount: 1`, `gunsPerMount: <legacy barrels>`, a `gun_mount` part representing a grouped central-battery installation, the placement boundary kept, and the legacy fixed installation as `PER_LOADOUT_ENTRY`. The legacy TURRET/BARBETTE resolution survives only as migration provenance (`legacyResolvedMountType`, `translationDisposition: RECLASSIFIED_AS_CENTRAL_BATTERY`). DQ-ARMAMENT-001 is narrowed (§9.2). The even/odd twin/single heuristic is **rejected**. | **Approved** (review 3) |
| D18 | **Reclassification visibility.** The battery assembly's canonical mount type is `BROADSIDE_BATTERY`, so for the nine D17 entries the identity strings `mountType` and `mountId` change in the compiled weapon contract and in the engine design version, while every numeric result stays equal. The report gives these paths the status `reclassified`, allowed only for the nine enumerated entries and those identity paths, never for a numeric metric. | **Approved** (review 4), with constraints R1–R7 (§9.2) |
| D19 | **Diameter rule (35 cm, 350 mm, 356 mm).** Engineering dimensions come only from structured fields, never from display names. A launcher's canonical bore = its nation's structured `hardCapabilities.domesticTorpedoDiameterUm` (the only structured diameter that legacy launchers have). If it equals the loaded torpedo's diameter, a label difference is display-only and needs no waiver. If it differs, DQ-TORPEDO-001 applies. There is no tolerance. | **Approved rule** (review 3); **derived scope confirmed** (review 4): 5 waivered records, 9 entries, including France's "350 mm submerged" tube (its structured value is 380 mm) |

---

## 1. Current state

### 1.1 How ships and parts are expressed today

A ship design is a `DesignDraft` (`packages/ship-design/src/compileShared.ts`):

- a hull spec;
- one machinery plan;
- an armour block of regions;
- a flat list of `placements`.

Each placement has a component, a zone, a station, a side, parameters and a magazine link.
Parts come from seven differently shaped sources:

| Family | Authored in | Shape | Time fields |
| --- | --- | --- | --- |
| Guns (mass, cost, volume and footprint formulas; legacy ballistics) | `components.yaml` (34 of 45) | `ComponentDef` formulas over `parameters`/`constants` | `introduction`, `requires`, `upgradePath` |
| Guns, first-class (ADR-0093) | `armament/gun-families` (34), `gun-models` (26), `gun-mounts` (36), `ammunition` (6) | unit-suffixed numbers, per-record `provenance` | `introductionMonth`, `retirementMonth`, `requiredTechnologyIds` |
| National variants | `naval-profiles/*.yaml → gunModels, componentVariants` | an `overrides` map | `introductionMonth`, `obsoleteMonth` |
| Tubes and fittings | `components.yaml` (11) | `ComponentDef` | as guns |
| Torpedoes | `packages/combat/src/torpedoes/` | TypeScript constants | none |
| Plants | `plants.yaml` (4) | kg/kW, SFC curve | `introduction`, `requires` |
| Armour | `balance.yaml` (materials), the TS enum `ARMOUR_REGIONS`, the draft (thickness) | balance tables | `fromMonth`/`obsoleteMonth` in `balance.yaml` |
| Hull forms | `hull-forms.yaml` (5) | bounds, coefficients, one shared zone table | none |
| Ship types | `shipTypeData.ts` (14) | code | `availability.fromEra` |
| Fleet templates | `designs.yaml` | an abstract ship | `familyCreationMonth` |

The **91 reference designs** contain **823 placements**. Of these:

- **230 are guns**, with `barrels` of 1 (135), 2 (18), 3 (33), 4 (8), 5 (34) and 6 (2).
- **28 are torpedo tubes**.

These figures come from a full decode of the reference-design files and replace every earlier
figure (654 placements, 26 tube placements).

### 1.2 What already works

- **Catalogue entities and loadouts exist.** There are parameter ranges and structured
  findings.
- **Temporal gating exists.** Dates and technology prerequisites are checked, and a pure
  armament resolver handles dates, technology and access. ADR-0093 Steps 3–4 are complete:
  ship design and combat resolve weapons through it.
- **Gun, mount and ammunition are separated** in the armament domain.
- **Provenance is a schema field** (ADR-0147), with strict decoding.
- **The national layer only restricts** (ADR-0089).
- **Saves have a strict compatibility check** that refuses mismatches (ADR-0113).

### 1.3 Pain points

1. **There are no slots.** `allowedZones` exists but no content uses it.
2. **`barrels` is overloaded.** It is guns per mount for turrets and guns per battery for
   deck and casemate guns, and the legacy weight formula charges `mount_fixed_kg` once per
   placement.
3. **Mount type is not chosen.** Ship design takes the model's first `supportedMountTypes`.
   That is why nine central-battery placements resolve as TURRET or BARBETTE with 3–6
   barrels (§9.2).
4. **Guns are authored two or three times.**
5. **Time is encoded six ways,** and prerequisites are spelled two ways.
6. **`upgradePath` is never read.** Succession and re-ratings live in comments.
7. **Armour materials are balance keys.**
8. **Torpedoes and ship types live in code.**
9. **Formula strings hide meaning.**
10. **Zones are copied across forms.**

---

## 2. Options

Unchanged from rev 2:

| Option | Verdict |
| --- | --- |
| A. Evolved catalogues | Too shallow |
| B. Normalised id graph | Hard to author |
| **C. Platforms, slots, parts** | **Approved (D1)** |
| D. Small DSL | Off-constraint |

Option C derives B's queryable graph at compile time from self-contained records.

---

## 3. The model

### 3.1 Vocabulary

| Term | Meaning |
| --- | --- |
| **Part** | A fittable catalogue entity: one record, one stable id. |
| **Part family** | A closed discriminator fixing the spec shape: `gun`, `gun_mount`, `ammunition`, `torpedo_launcher`, `torpedo`, `propulsion_plant`, `armour_material`, `sensor`, `fitting`. |
| **Interface** | An exact, case-sensitive canonical token for what a part plugs into (§8.1). A part *provides* one; a slot *accepts* one or more. |
| **Constraint** | A closed-vocabulary predicate on a candidate part's resolved spec, declared on a slot. It refines an interface; it never replaces one. |
| **Platform** | A hull form as the root assembly. |
| **Slot** | A named mount point (or armour region) accepting interfaces, with `mountCount` bounds, placement, nominal arc and constraints. |
| **Assembly** | A part with its own slots. |
| **Battery assembly** | A `gun_mount` part representing a grouped central-battery installation (`mountCount: 1`, `gunsPerMount: n`); used by D17. It claims no rotating multi-gun mount. |
| **Translation disposition** | A migration-provenance label for a legacy placement whose category was corrected (e.g. `RECLASSIFIED_AS_CENTRAL_BATTERY`); never simulation-facing. |
| **Loadout entry** (fit) | One filled slot: slot, part, `mountCount`, parameters, placement, nested entries. |
| **`mountCount`** | Installed units of the entry's part. One meaning everywhere. |
| **`gunsPerMount`** | Guns in one gun mount (a `gun_mount` spec field). |
| **Contained units** | Compiler-derived units inside an entry. For a gun mount: `mountCount × gunsPerMount`. |
| **Application basis** | How a quantity component scales: `PER_LOADOUT_ENTRY`, `PER_PART_UNIT` or `PER_CONTAINED_UNIT` (§3.8). |
| **Lifecycle** | `availableFrom`, `availableUntil`, `requires`, `supersedes`. |
| **Revision** | A dated delta to the same part's spec. |
| **Prototype** | `extends`: a one-level, same-family inherited part. |
| **Ship type** | A content record classifying designs, referencing one engine behaviour class. |
| **Engine behaviour class** | A closed, code-owned enum (§3.5). |
| **Visual trait** | A closed presentation key read only by rendering (§8.2). |
| **Data-quality finding** | A named, enumerated inherited inconsistency, reported separately from migration differences (e.g. DQ-TORPEDO-001). |

### 3.2 Record envelope

```yaml
- id: <stable_snake_id>
  family: gun | gun_mount | ammunition | torpedo_launcher | torpedo | propulsion_plant | armour_material | sensor | fitting
  provides: <interface>            # interfaces/1 token
  name: "Display name"             # presentation only; never matched
  nation: uk                       # optional national model
  extends: <partId>                # optional; one level; same family; may not change provides/family/field meaning
  lifecycle: { availableFrom: 1885-01, availableUntil: null, requires: [...], supersedes: [...] }
  parameters: { ... }              # optional sizing ranges
  spec: { ... }                    # family-specific, unit-suffixed numbers
  quantities: [ ... ]              # quantity components, each with an explicit basis (section 3.8)
  slots: [ ... ]                   # optional: assembly
  revisions: [ ... ]               # optional dated deltas
  legacyExceptions: [ ... ]        # migration-only, enumerated codes (section 9.4)
  visual: { traits: { ... }, override: <assetKey> }   # rendering only
  provenance: { ... }
```

### 3.3 Platform with slots

```yaml
slotTemplates:
  - id: capital_ship_1880s
    slots:
      - id: fwd_main
        accepts: gun_mount
        constraints: { calibreInchesMin: 9, calibreInchesMax: 13 }   # calibre is a constraint, not an interface
        mountCount: { min: 0, max: 3 }
        stationPermille: { from: 80, to: 280 }
        side: CENTRE
        arcDeg: { centre: 0, width: 270 }
      - id: aft_main
        accepts: gun_mount
        constraints: { calibreInchesMin: 9, calibreInchesMax: 13 }
        mountCount: { min: 0, max: 2 }
        stationPermille: { from: 720, to: 920 }
        side: CENTRE
        arcDeg: { centre: 180, width: 270 }
      - id: secondary_port
        accepts: gun_mount
        constraints: { calibreInchesMax: 8 }
        mountCount: { min: 0, max: 8 }
        stationPermille: { from: 200, to: 800 }
        side: PORT
        arcDeg: { centre: 270, width: 120 }
      - { id: secondary_stbd, mirrors: secondary_port }
      - { id: torpedo, accepts: torpedo_launcher, mountCount: { min: 0, max: 6 } }
      - { id: propulsion, accepts: propulsion_plant, mountCount: { min: 1, max: 1 }, zone: CENTRAL_MACHINERY }
      - { id: armour.belt_main, accepts: armour_material, mountCount: { min: 0, max: 1 }, region: BELT_MAIN }
      - { id: magazine.fwd, accepts: magazine, zone: FWD_MAGAZINE, mountCount: { min: 0, max: 4 } }
      - { id: sensors, accepts: sensor, zone: SUPERSTRUCTURE, mountCount: { min: 0, max: 2 } }
```

The numeric bounds above are illustrative. The P2 migration emits **compatibility
templates** instead: one slot per zone and interface accepting everything allowed today,
so every reference design stays legal (§9).

### 3.4 One part from each family (today's values)

```yaml
- id: bl_12in_25
  family: gun
  provides: gun
  lifecycle: { availableFrom: 1885-01, requires: [gun_breech_rifled] }
  spec: { calibreUm: 305000, gunMassKg: 44500, shellMassG: 324000, propellantChargeBp: 4136,
          mechanicalRateOfFireRoundsPerMinuteX100: 40, roundVolumeMl: 229003, fireControlClass: heavy }
  quantities:
    - { id: gun_mass, kind: massKg, value: 44500, basis: PER_PART_UNIT }   # this part's units = contained guns
  provenance: { ... }

- id: bl_12in_barbette_twin
  family: gun_mount
  provides: gun_mount
  lifecycle: { availableFrom: 1885-01, requires: [gun_breech_rifled] }
  spec: { mountType: BARBETTE, gunsPerMount: 2, firingArcDeg: 120 }
  quantities:                                      # values from gun-mounts.yaml gun_bl_12in_25_barbette
    - { id: fixed_installation, kind: massKg, value: 20000, basis: PER_LOADOUT_ENTRY }   # legacy-preservation basis (D3)
    - { id: per_gun_installation, kind: massKg, value: 30000, basis: PER_CONTAINED_UNIT }
  slots:
    - { id: guns, accepts: gun, sameParts: true }  # count = gunsPerMount (implied)
    - { id: ammunition, accepts: ammunition, mountCount: { min: 1, max: 2 } }
  provenance: { ... }

- id: uk_ap_palliser
  family: ammunition
  provides: ammunition
  nation: uk
  lifecycle: { availableFrom: 1880-01 }
  spec: { shellType: AP, penetrationBiasBp: 9000 }
  provenance: { ... }

- id: whitehead_14in
  family: torpedo
  provides: torpedo
  lifecycle: { availableFrom: 1880-01, requires: [torp_whitehead_torpedo] }
  spec: { diameterUm: 356000, massKg: 300, warheadKg: 12, speedSettingsMilliKnots: [24000] }
  revisions:
    - { from: 1884-01, spec: { warheadKg: 26 }, provenance: { ... } }      # Mk IV re-rating
  provenance: { ... }

- id: tube_14in_above_water                         # legacy component id preserved
  family: torpedo_launcher
  provides: torpedo_launcher
  lifecycle: { availableFrom: 1880-01, requires: [torp_whitehead_torpedo] }
  spec: { launchType: ABOVE_WATER_TRAINABLE, boreDiameterUm: 356000, reloadsPerTube: 3 }
  quantities:                                       # legacy constants; every component per tube (D13)
    - { id: launcher_mass, kind: massKg, value: 1400, basis: PER_PART_UNIT }
    - { id: reload_mass, kind: massKg, value: 900, basis: PER_PART_UNIT }        # 3 × 300 kg torpedoes
    - { id: launcher_cost, kind: costMicro, value: 700000000, basis: PER_PART_UNIT }
    - { id: crew, kind: crew, value: 3, basis: PER_PART_UNIT }
  slots:
    - { id: torpedo, accepts: torpedo, constraints: { diameterUmEqualsBore: true } }
  provenance: { ... }

- id: triple_expansion_cylindrical
  family: propulsion_plant
  provides: propulsion_plant
  lifecycle: { availableFrom: 1885-01, requires: [mac_triple_expansion], supersedes: [compound_cylindrical] }
  parameters: { installedKw: { min: 500, max: 14000, step: 50 } }
  spec: { fuelType: COAL, weightMilliKgPerKw: 170000, volumeLitrePerKw: 150, sfcGramPerKwh: { points: [ ... ] } }
  provenance: { ... }

- id: nickel_steel
  family: armour_material
  provides: armour_material
  lifecycle: { availableFrom: 1889-01, requires: [hc_nickel_steel_armor], supersedes: [compound] }
  parameters: { thicknessUm: { min: 25000, max: 610000, step: 5000 } }
  spec: { efficiencyBp: 13500 }
  provenance: { ... }

- id: rangefinder_optical
  family: sensor
  provides: sensor
  lifecycle: { availableFrom: 1893-01, requires: [fc_basic_rangefinding] }
  spec: { accuracyBonusBp: 800, gunCapacity: 8, supportsFireControlClasses: [heavy, medium, light] }
  quantities: [{ id: mass, kind: massKg, value: 300, basis: PER_PART_UNIT }]
  provenance: { ... }

- id: magazine_heavy
  family: fitting
  provides: magazine
  lifecycle: { availableFrom: 1880-01 }
  spec: { magazineLitre: 120000, critical: true }
  quantities: [{ id: volume, kind: volumeLitre, value: 130000, basis: PER_PART_UNIT }, { id: cost, kind: costMicro, value: 3000000000, basis: PER_PART_UNIT }]
  provenance: { ... }
```

`armour_material` is not a plug-and-socket item. It is accepted by **armour-region slots**,
where the slot is a hull region and thickness is an entry parameter. No artificial
"armour mount" object exists (§8.1).

### 3.5 Ship types as content

```yaml
shipTypes:
  - id: B
    name: "Pre-dreadnought battleship"
    engineClass: capital_combatant
    displayCategory: CAPITAL_SHIP
    roles: [BATTLE_LINE, COASTAL_DEFENCE]
    availability: { fromMonth: 1880-01, requires: [] }
    classification:
      precedence: 90
      displacementKg: { min: 1500000 }
      requires: [{ slots: ["*_main"], interface: gun_mount, constraints: { calibreInchesMin: 9 }, mountCountMin: 1 }]
    torpedoPolicy: OPTIONAL
    presentation: { recommendedUse: "...", weaknesses: "..." }
    provenance: { ... }
```

The engine behaviour classes are closed and owned by code: `capital_combatant`, `cruiser`,
`torpedo_craft`, `colonial_vessel`, `merchant_auxiliary`, `aviation`, `submarine`. The
classification predicates are a closed vocabulary evaluated by a code-owned algorithm
(P3 design item).

### 3.6 A loadout with 0–3 forward mounts

```yaml
loadout:
  platform: pre_dreadnought_form
  entries:
    - slot: fwd_main
      part: bl_12in_barbette_twin        # gunsPerMount 2
      mountCount: 1                      # 0..3 legal; 4 is FIT_COUNT_EXCEEDED
      stationPermille: 210
      entries: { guns: { part: bl_12in_25 }, ammunition: [{ part: uk_ap_palliser }] }
    - slot: secondary_port
      part: qf_6in_casemate_single       # gunsPerMount 1
      mountCount: 6                      # six mounts; ONE entry => fixed installation applied once (S3)
      stationPermille: 360
      entries: { guns: { part: qf_6in_40 }, ammunition: [{ part: uk_ap_palliser }] }
    - slot: torpedo
      part: tube_14in_above_water
      mountCount: 2
      entries: { torpedo: { part: whitehead_14in } }
```

The findings are unchanged from rev 2: `FIT_COUNT_EXCEEDED`, `FIT_INTERFACE_MISMATCH`,
`FIT_CONSTRAINT_VIOLATED`, `FIT_NOT_YET_AVAILABLE`, `FIT_UNAVAILABLE` (with
`supersededBy`), `FIT_NATION_ACCESS`, and the ship-type `TYPE_REQUIRES_*`. An unknown
constraint or interface is a compile error.

### 3.7 Prototypes and numbers

- **Prototypes:** one level, same family, `spec` and `quantities` values only. A child
  cannot change `provides`, `family`, a quantity's `kind` or its `basis` (I-11). The
  compiler flattens them.
- **Numbers:** specs are numbers. The formula grammar survives only on `fitting` parts.

### 3.8 Application bases (D3)

**Normative text:**

> Every fixed or variable quantity component (mass, cost, crew, volume, deck footprint)
> declares an application basis. **`PER_LOADOUT_ENTRY`** applies the component once to the
> complete loadout entry, regardless of `mountCount`. **`PER_PART_UNIT`** multiplies it by
> `mountCount`. **`PER_CONTAINED_UNIT`** multiplies it by the compiler-derived number of
> contained units; for gun mounts that is `mountCount × gunsPerMount`. A nested entry's
> part units are its parent's contained units, so a gun part's `PER_PART_UNIT` mass scales
> with total guns.
>
> The migration assigns the legacy gun-placement fixed installation mass to
> `PER_LOADOUT_ENTRY`. This preserves the existing calculation and does not redefine
> `mountCount`, which continues to represent the number of installed part units. Loadout
> entries may not be merged or split as a normalisation operation when doing so changes the
> number of `PER_LOADOUT_ENTRY` applications; such a transformation is semantic and requires
> recalculation and, where reference designs are affected, an approved difference.

For a gun-mount entry `e`:

```text
entryMass = Σ fixed components (PER_LOADOUT_ENTRY)
          + mountCount × Σ per-unit components (PER_PART_UNIT)
          + mountCount × gunsPerMount × Σ per-contained-unit components (PER_CONTAINED_UNIT)
          + nested entries (guns at PER_PART_UNIT of their own units; ammunition per its rules)
```

**Safeguards:**

| # | Safeguard |
| --- | --- |
| S1 | The basis is **visible in the model**: a required field on every quantity component, carried into compiled output. There is no undocumented special case in a calculator. |
| S2 | **The translation preserves placement boundaries.** One legacy placement becomes exactly one loadout entry; it is never split into one entry per mount. |
| S3 | **No consolidation.** The compiler never merges two entries because they reference the same part. |
| S4 | **Splitting is semantic.** Editors and refactoring tools must treat splitting or merging entries as a recalculating change, never as formatting (the workspace shows the mass effect). |
| S5 | **The report exposes the rule.** For each entry it shows `mountCount`, `gunsPerMount`, total contained units, each component's value and basis, and the resulting contribution (§10.2). |
| S6 | **No inference from family.** A new calculation never assumes a basis from the part family; the compiled component states it. |
| S7 | **Changing a basis** (for example the legacy fixed installation to `PER_PART_UNIT`) is a balance/simulation change that requires an approved diff. |
| S8 | **Bases never alter quantity semantics.** `mountCount` and `gunsPerMount` keep their single meanings. |

**Vocabulary governance:** the set is closed at three values. A new basis needs a concrete
calculation and migration case. Speculative values (`PER_SLOT`, `PER_ZONE`, `PER_SHIP`) are
not added. `PER_FIT` and `PER_MOUNT` (rev 2 names) are documented draft aliases of
`PER_LOADOUT_ENTRY` and `PER_PART_UNIT`; they are accepted by no schema and never compiled.

### 3.9 Schema sketch (illustrative, not final code)

```ts
// packages/content-schema/src/ship-parts.ts — strict decode (onExcessProperty: "error")
export const INTERFACES = [
  "gun", "gun_mount", "ammunition", "torpedo", "torpedo_launcher", "propulsion_plant",
  "armour_material", "sensor", "magazine", "funnel", "electrical_plant", "accommodation",
  "damage_control", "ventilation",
] as const;                                               // interfaces/1 (D15)
export const APPLICATION_BASES = ["PER_LOADOUT_ENTRY", "PER_PART_UNIT", "PER_CONTAINED_UNIT"] as const;
export const QUANTITY_KINDS = ["massKg", "costMicro", "crew", "volumeLitre", "deckFootprintMm2"] as const;

export const QuantityComponentSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  kind: Schema.Literals(QUANTITY_KINDS),
  value: NonNegInt,
  basis: Schema.Literals(APPLICATION_BASES),              // required: S1, S6
});

export const SlotConstraintsSchema = Schema.Struct({       // CLOSED (I-9)
  calibreInchesMin: Schema.optional(NonNegInt),
  calibreInchesMax: Schema.optional(NonNegInt),
  mountTypes: Schema.optional(Schema.Array(Schema.Literals(ARMAMENT_MOUNT_TYPES))),
  gunsPerMount: Schema.optional(Schema.Array(PositiveInt)),
  diameterUmMin: Schema.optional(NonNegInt),
  diameterUmMax: Schema.optional(NonNegInt),
  diameterUmEqualsBore: Schema.optional(Schema.Literal(true)),
  launchTypes: Schema.optional(Schema.Array(Schema.Literals(TORPEDO_MOUNT_TYPE_VALUES))),
  massKgMax: Schema.optional(NonNegInt),
});

export const LEGACY_EXCEPTION_CODES = ["DQ-TORPEDO-001"] as const;   // closed; migration-only
export const LegacyExceptionSchema = Schema.Struct({
  code: Schema.Literals(LEGACY_EXCEPTION_CODES),
  waives: Schema.Literals(["diameterUmEqualsBore"]),     // the single constraint it may waive
  forPart: PartId,                                        // the exact counterpart (e.g. whitehead_14in)
  note: Schema.NonEmptyString,
});

export const LoadoutEntrySchema = Schema.Struct({
  slot: Schema.NonEmptyString,
  part: PartId,
  mountCount: Schema.optional(PositiveInt),               // default 1
  stationPermille: Schema.optional(Permille),
  side: Schema.optional(Side),
  units: Schema.optional(Schema.Array(UnitPlacementSchema)),
  params: Schema.optional(Schema.Record(Schema.String, Int)),
  entries: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),   // nested, recursive
  shape: Schema.optional(ArmourShapeSchema),
  feedsFrom: Schema.optional(Schema.NonEmptyString),
});
```

```ts
// compiled forms
export interface CompiledQuantity { readonly id: string; readonly kind: QuantityKind; readonly value: number;
  readonly basis: ApplicationBasis; readonly multiplier: number; readonly contribution: number; }
export interface CompiledEntry {
  readonly slot: string;
  readonly part: { readonly id: PartId; readonly revision: Month | "base"; readonly sourceFile: string };  // I-12
  readonly mountCount: number;
  readonly gunsPerMount?: number;
  readonly containedUnits?: number;                        // derived
  readonly quantities: readonly CompiledQuantity[];        // S1, S5
  readonly legacyExceptions: readonly LegacyExceptionCode[];
  readonly entries: Readonly<Record<string, readonly CompiledEntry[]>>;
}
```

The queries (`resolvePart`, `availableParts`, `partsForSlot`, `lineage`,
`validateLoadout`, `loadoutCost`) and `CompiledTorpedo` are unchanged from rev 2.

---

## 4. Slots and compatibility

- **A compatible pairing requires both conditions:** the interface matches **and** every
  applicable constraint passes. An interface match alone is insufficient (I-8).
- **Validation order:** slot exists → interface → `mountCount` bounds (nested included) →
  constraints on the resolved spec → lifecycle → national access and limits (stricter
  wins) → placement → existing stages. Steps up to placement complete before any derived
  calculation (I-10).
- **Refits** may swap a part for another that the same slot accepts and that passes the
  constraints; supersession never implies this (I-7).
- **Armour** uses region slots; **propulsion** uses one mandatory parametric slot with
  rooms as units.
- **Legacy exceptions** (§9.4) can waive exactly one named constraint for one enumerated
  part pair. They emit an ADVISORY data-quality finding, and an unregistered code fails
  decoding.

---

## 5. Time and technology

This is unchanged from rev 2:

- an availability window, technology `requires` and dated revisions (deterministic order,
  exactly one effective revision);
- `supersedes` for succession (informational, not refit compatibility);
- `upgradePath` is removed;
- revision versus new part: same designation re-rated → revision; new designation or
  mark → new part.

---

## 6. Canonical invariants

| # | Invariant | Enforced by |
| --- | --- | --- |
| I-1 | Every fitted item resolves to exactly one canonical part revision for the design month. | Compile; `CompiledEntry.part.revision` |
| I-2 | Revision selection is deterministic: ascending `from`, then declaration order; duplicate `from` on one part is an error. | Flatten; property test |
| I-3 | Inheritance is flattened at compilation; compiled output has no `extends`. | Flatten |
| I-4 | Inheritance depth ≤ 1, within the same family. | `PART_EXTENDS_DEPTH`, `PART_EXTENDS_FAMILY` |
| I-5 | Inheritance and supersession cycles are rejected. | `PART_EXTENDS_CYCLE`, `PART_SUPERSEDES_CYCLE` |
| I-6 | Interfaces are exact, case-sensitive canonical tokens from `interfaces/1`. Display names and localisation are independent. Unknown identifiers fail compilation. | Schema `Literals` |
| I-7 | Supersession does not imply refit compatibility. | Refit code reads slot acceptance only |
| I-8 | Compatibility = interface match **and** all applicable constraints. | `validateLoadout` |
| I-9 | Unknown constraint keys and unknown legacy-exception codes fail decoding or compilation. | Strict schema |
| I-10 | Slot and `mountCount` validation completes before derived calculations; blocking fit findings stop derivation. | Stage order |
| I-11 | National variants and prototypes cannot change `provides`, `family`, a field's meaning, a quantity's `kind`, or its `basis`. | `PART_VARIANT_INTERFACE`, `PART_VARIANT_BASIS` |
| I-12 | Compiled output records provenance to the source part, revision and file. | `CompiledEntry.part` |
| I-13 | Equivalence uses explicit per-metric tolerances (0 for integer metrics). | Tolerance manifest |
| I-14 | Visual metadata cannot influence simulation. | Test: visual-only change leaves every metric and simulation hash identical |
| I-15 | `mountCount` and `gunsPerMount` each have one meaning; contained units are derived; `barrels` is absent from schemas, normalised content and compiled output. | Schema; migration check |
| I-16 | Content identifiers select behaviour only through closed, code-owned enums (`engineClass`, interfaces, constraint keys, application bases). | Schema; review rule |
| I-17 | **Save compatibility is decided before campaign snapshots or drawing-board edit logs are deserialised into current domain models. A mismatch is rejected; it is never translated implicitly during loading.** The rejected file is left byte-identical. | `CompatibilityChecker` before decode; test |
| I-18 | Every quantity component declares exactly one application basis from the closed set; the compiled output carries it. | Schema (required field); compiled-output test |
| I-19 | Loadout-entry boundaries are semantic: no merge or split during normalisation, compilation or migration. One legacy placement = one entry. | Codemod test; compile never re-groups |
| I-20 | Aliases (legacy ids, `PER_FIT`, `PER_MOUNT`, `barrels`, legacy categories) are accepted only by migration tooling, never by production schemas. | Schema; tool boundary |
| I-21 | Interface governance: no `general_fitting`, `misc`, `other` or wildcard. Adding an interface needs a concrete provider–consumer use case. Removing or redefining one is a breaking contract change (`interfaces/2`). | Review rule; versioned vocabulary |
| I-22 | Legacy exceptions are enumerated and record-scoped: each waives one named constraint for one named counterpart and emits an ADVISORY data-quality finding. No general constraint is weakened. | Schema + compile |
| I-23 | Migration input validation: a zero, negative, fractional or non-numeric legacy count fails translation; an absent count translates explicitly to its documented default. | Codemod |
| I-24 | For every D17 entry: `legacy barrels = mountCount × gunsPerMount`, and the legacy fixed installation equals the translated `PER_LOADOUT_ENTRY` installation. | Gate (§10.3) |
| I-25 | Engineering dimensions (diameter, calibre, bore) come only from structured fields, never from display names; there are no compatibility tolerances. | Codemod; review rule |
| I-26 | Visual contradictions are evaluated on effective traits (after overrides) and fail `content:check`; an unmatched trait value at render time yields a fallback and a `VISUAL_TRAIT_UNMATCHED` diagnostic. | Visual compile stage; renderer test |
| I-27 | Migration provenance (`legacyResolvedMountType`, `translationDisposition`, original labels) lives in the report and the source-reference metadata, never in simulation-facing content; `reclassified` is allowed only on the enumerated D18 identity paths, never on numbers, always with `reason: DQ-ARMAMENT-001`; any other identity change fails. | Report schema; gate |

---

## 7. Boundaries

| Layer | Owns | Must not |
| --- | --- | --- |
| **Part content** | Parts, platforms, slot templates, ship types, lifecycle, revisions, quantities with bases, provenance, `visual` keys, enumerated legacy exceptions | Formulas outside `fitting`; `barrels`; aliases; behaviour names |
| **Content schema** | Closed vocabularies (families, `interfaces/1`, constraint keys, application bases, legacy-exception codes, `visual-traits/1`, engine classes); strict decode | Behaviour |
| **Compiled indexes** | Flattened parts, sorted revisions, `PartIndex`, lineage, ship types; quantities with explicit bases; artifact hash and lock | `extends`, aliases, unresolved references |
| **Ship-design code** | Validation, derivations by basis, classification algorithm, queries, refits | Read YAML; infer a basis from family (S6) |
| **Combat code** | Launch, hit, interception, reliability, damage, flooding, magazine/launcher interaction, AI employment, salvo resolution | Hold torpedo/gun performance constants; read anything but `CompiledTorpedo` / `ResolvedArmament` |
| **Visual assets** | Drawings keyed by visual traits, overrides, precedence | Feed anything into simulation, saves or hashes (I-14) |
| **Saves** | Campaign snapshots (with `sourceDraft`) and `drawing-board-draft.json` at one compatibility version | Be translated at load (I-17) |
| **Developer tooling** | The versioned codemod, the equivalence harness, the offline dev-fixture save migrator | Ship in production save loading |

---

## 8. Interface and visual contracts

### 8.1 `interfaces/1` (approved, D15)

| Interface | Semantics |
| --- | --- |
| `gun` | Ordnance fitted to a compatible gun mount. |
| `gun_mount` | A mounting assembly fitted to a platform slot and capable of containing compatible guns. |
| `ammunition` | Consumable ordnance accepted by a gun mount, magazine or other ammunition-bearing assembly. |
| `torpedo` | Torpedo ammunition accepted by a compatible torpedo launcher. |
| `torpedo_launcher` | A launching assembly fitted to a compatible platform slot. |
| `propulsion_plant` | A machinery assembly providing propulsive power. |
| `armour_material` | Protection material applied through an armour-region loadout entry. It is accepted by **armour-region slots**, not conventional mount points; there is no artificial "armour mount". |
| `sensor` | Detection, ranging, observation or fire-control equipment. |
| `magazine` | An ammunition-storage assembly. |
| `funnel` | An exhaust-handling fitting associated with compatible machinery requirements. |
| `electrical_plant` | Generation or distribution equipment providing electrical capability. |
| `accommodation` | A habitability or crew-capacity fitting. |
| `damage_control` | Equipment or an assembly providing damage-control capability. |
| `ventilation` | Air-handling or machinery-space ventilation equipment. |

**Governance:**

- Calibre, diameter, side, station, arc, enclosure, date, nation, quantity and visual form
  are constraints or metadata, never interface identity.
- A pairing needs an interface match **and** passing constraints.
- Tokens are exact and case-sensitive. Aliases exist only in migration tooling. Unknown
  tokens fail. There is no wildcard or catch-all.
- An addition needs a provider–consumer case; removal or redefinition is breaking (I-6,
  I-20, I-21).

**Coverage check:** all 45 legacy components map to exactly one interface:

| Interface | Legacy components |
| --- | --- |
| `gun` | 34 guns (plus a generated `gun_mount`, §9.2) |
| `torpedo_launcher` | 2 tubes |
| `magazine` | 3 magazines |
| `sensor` | 1 rangefinder |
| `electrical_plant` | 1 dynamo |
| `accommodation` | 1 quarters |
| `funnel` | 1 funnel |
| `damage_control` | 1 pumps |
| `ventilation` | 1 ventilation plant |

The other catalogues map as follows: 4 plants → `propulsion_plant`; 8 armour materials →
`armour_material`; 6 ammunition patterns → `ammunition`; 36 gun mounts → `gun_mount`;
combat torpedo models → `torpedo`.

### 8.2 `visual-traits/1` (D16: architecture approved; exact definitions awaiting review)

**Ownership.** Every trait has exactly one ownership class:

- **compiler-derived:** computed from named source fields; authoring it is a decode error.
- **derived with an allowed authored override:** computed by default; a part may author it
  on `visual.traits` with a `reason`.

No trait is purely authored. That keeps defaults total and deterministic.

**Isolation.**

- Traits are read only by the renderer and the visual compile stage.
- They never change fitting compatibility, mass, cost, crew, volume, footprint,
  availability, AI behaviour or combat (I-14).
- `gunsPerMount` stays the simulation authority for gun count. No trait duplicates it as a
  second authoritative quantity.

| Trait | Ownership | Closed values | Source fields → default (pure function; independent of catalogue order) |
| --- | --- | --- | --- |
| `presentation_form` | derived with override | `rotating_gunhouse`, `barbette`, `casemate`, `battery_port`, `pedestal`, `tube_carriage`, `funnel_stack` | `gun_mount` `spec.mountType`: TURRET → `rotating_gunhouse`; BARBETTE → `barbette`; CASEMATE → `casemate`; BROADSIDE_BATTERY → `battery_port`; DECK_SHIELDED, DECK_OPEN → `pedestal`. `torpedo_launcher` (any `launchType`) → `tube_carriage`. Interface `funnel` → `funnel_stack`. Other families: none (not drawn as parts). |
| `enclosure` | derived with override | `enclosed`, `hooded`, `shielded`, `open` | from `presentation_form` and `spec.mountType`: `rotating_gunhouse`, `casemate`, `battery_port` → `enclosed`; `barbette` → `open`; `pedestal` → `shielded` if DECK_SHIELDED, else `open`; `tube_carriage` → `open`; `funnel_stack` → none |
| `barrel_arrangement` | derived with override (rendering only) | `single`, `side_by_side`, `grouped` | from `gunsPerMount` (authority) and `presentation_form`: 1 → `single`; ≥ 2 with `casemate`/`battery_port` → `grouped` (separate ports or embrasures); ≥ 2 otherwise → `side_by_side`. An override changes only the drawing; it never changes `gunsPerMount` or the derived gun count, and it still passes V7. |
| `deck_relationship` | derived with override | `on_deck`, `in_hull_side`, `below_waterline` | from `presentation_form` and `spec.launchType`: `casemate`, `battery_port` → `in_hull_side`; `tube_carriage` with UNDERWATER_FIXED, UNDERWATER_TRAINABLE or SUBMARINE_INTERNAL → `below_waterline`; else → `on_deck` |
| `orientation` | compiler-derived | `forward`, `aft`, `port_beam`, `starboard_beam` | from the entry's `stationPermille`, `side` and `deck_relationship`: an `in_hull_side` unit, or a `tube_carriage` on a PORT/STBD entry → the beam of its `side`; otherwise station < 500‰ → `forward`, else `aft`. **Orientation is the at-rest training direction. `side` is the fitted side.** They are separate fields and never substitute for each other. |
| `size_class` | compiler-derived | `small`, `medium`, `large` | from the contained gun's `calibreUm`, in whole inches `floor((µm + 12 700) / 25 400)`: ≤ 5 small, 6–11 medium, ≥ 12 large. None for non-gun parts. |
| `elevation_style` | compiler-derived | `main_deck`, `superstructure_deck` | from the entry's zone/station and `deck_relationship`: an `on_deck` entry inside the SUPERSTRUCTURE zone → `superstructure_deck`, else `main_deck`. None for `in_hull_side` and `below_waterline`. |

**Not proposed (no content case):** `superimposed` arrangements, superfiring elevation, and
roof styles.

**Contradiction rules.** A violation fails the visual compile stage, which is part of
`content:check`, so it cannot ship. The renderer never selects an arbitrary drawing. The
rules are evaluated on the **effective** traits, after overrides, so an override never
suppresses validation.

| # | Rule |
| --- | --- |
| V1 | `rotating_gunhouse` requires `enclosed` or `hooded`. |
| V2 | `pedestal` requires `shielded` or `open`. |
| V3 | `casemate` and `battery_port` require `in_hull_side` and `enclosed`. |
| V4 | `in_hull_side` requires `casemate` or `battery_port`. |
| V5 | `below_waterline` requires `tube_carriage`. |
| V6 | `rotating_gunhouse`, `barbette`, `pedestal` and `funnel_stack` require `on_deck`. |
| V7 | `single` requires `gunsPerMount` = 1; `side_by_side` and `grouped` require `gunsPerMount` ≥ 2; `grouped` also requires `casemate` or `battery_port`. |
| V8 | `barrel_arrangement` is forbidden on `tube_carriage` and `funnel_stack`. |
| V9 | `enclosure` is forbidden on `funnel_stack`. |
| V10 | Authoring a compiler-derived trait is a decode error. |
| V11 | An authored override must carry a non-empty `reason`. |
| V12 | A trait or value outside `visual-traits/1` in content is a decode error. |

**Unknown values at render time.** If a compiled trait value has no drawing (for example a
`visual-traits/2` value reaching an older catalog), resolution falls through the
precedence to the interface-family fallback. It emits the diagnostic
`VISUAL_TRAIT_UNMATCHED { part, trait, value }`, and the missing-asset glyph is used if
the family fallback is also absent. A gap is never silent.

**Drawing key.** The key is (nation style, visual era, `presentation_form`, `enclosure`,
`size_class`, `barrel_arrangement`, `gunsPerMount`?).

- Nation style and era follow ADR-0148.
- `orientation`, `elevation_style` and `deck_relationship` drive placement and facing,
  not drawing choice.
- Catalog keys are unique (test-enforced), so selection never depends on file order.

**Precedence.** `visual.override` → trait match → interface-family fallback →
missing-asset glyph. Overrides need a `reason` (V11) and remain exceptional.

**ADR-0148 translation map (explicit):**

| Today | `visual-traits/1` key |
| --- | --- |
| `mountClass: TURRET` | `rotating_gunhouse` / `enclosed` |
| `mountClass: BARBETTE` | `barbette` / `open` |
| `mountClass: SHIELDED` | `pedestal` / `shielded` |
| `mountClass: OPEN` | `pedestal` / `open` |
| `mountClass: CASEMATE` | `casemate` / `enclosed`, **and** registered for `battery_port` / `enclosed` (the approved casemate-family mapping for broadside and central batteries, including the nine D17 assemblies) |
| `sizes` | `size_class` (same bands) |
| `guns` | `gunsPerMount`; `barrel_arrangement` is derived |

National variants stay keyed by nation style. A hooded British Victorian barbette drawing
is the British drawing for `barbette`/`open`; the data says open.

**Gate checklist (owner review 3), as met by these definitions:**

| Requirement | Met by |
| --- | --- |
| Closed value sets | Table above; V12 |
| One ownership class per trait | "Ownership" column; V10 |
| Source fields for derived traits | "Source fields" column |
| Order-independent defaults | Pure functions of fields; unique catalog keys |
| Contradictions fail visual compilation | V1–V9, evaluated in `content:check` |
| No compatibility or simulation effect | I-14 test |
| Broadside via an explicit casemate-family mapping | Translation map, CASEMATE row |
| Unknown future value → visible fallback and diagnostic | `VISUAL_TRAIT_UNMATCHED` |
| Overrides do not suppress validation | Rules run on effective traits; V11 |
| Orientation not conflated with side | `orientation` row |
| No second authoritative gun quantity | `barrel_arrangement` derived from `gunsPerMount`; override is rendering-only and V7-checked |

### 8.3 What resumes when D16's exact definitions are accepted

- The P6 key rename (by the map).
- The trait adapter over today's compiled data.
- The I-14 test.
- INC-4 (plan glyphs).

All of these are independent of P2.

---

## 9. Migration phases and translation tables

| Phase | Content | Gate |
| --- | --- | --- |
| **P0 — Contract** | This document and the ADR; the vocabularies `interfaces/1` (approved), application bases (approved), constraint keys, legacy-exception codes, engine classes; D17 (approved) | D18 sign-off before P2 (D16 only for INC-4; P1 already authorised) |
| **P1 — Read path** | New schemas, flatten, `PartIndex`, queries, fed by an adapter over today's content; equivalence harness and baseline report | 91/91 structural + semantic equivalence |
| **P2 — Content rewrite** | One-shot codemod (§9.1–9.4); **save compatibility version bump** (D12); offline dev-fixture migrator | Zero `changed` rows; DQ findings listed separately; recorded artifact re-pin |
| **P3 — Ship types** | `ship-types.yaml`, engine classes, classification parameters | Identical classification and campaign goldens |
| **P4 — Torpedoes** | Torpedo parts and launcher assemblies; combat reads `CompiledTorpedo` | Identical combat goldens and cross-process determinism |
| **P5 — Retire legacy** | Remove `ComponentDef` guns, `componentVariants`, profile `gunModels`, the adapter, `upgradePath`, and the combat torpedo constants | No reader left |
| **P6 — Visual alignment** | Trait rename, adapter, I-14 test; INC-4 resumes | D16 accepted |
| **P7 — Authored slots and basis changes** | Real mount-point slots; optional basis changes (S7) | Intended-diff report, approved per change |

### 9.1 Save handling (D12)

**At P2:**

- **Compatibility version bump.** `CURRENT_COMPATIBILITY_VERSION` moves from 1.2.0 to
  2.0.0. It is a major bump, because design data changes shape.
- **Campaign saves.** An incompatible campaign save is refused before decoding (I-17). The
  player sees the existing `PERSISTENCE_COMPATIBILITY_MISMATCH` path (ADR-0113 §2), with a
  message naming the unsupported data-model version.
- **Edit log.** An incompatible `drawing-board-draft.json` is not restored. The workspace
  starts from the default design and leaves the file untouched until the player saves a
  new draft. Before any such overwrite, the old file is preserved (renamed with its
  version suffix).
- **Developer fixtures.** These are migrated only by
  `tools/migrate-dev-saves --from 1.2.0 --to 2.0.0`, an explicitly versioned developer
  tool that is excluded from the desktop bundle and from save loading.

### 9.2 Gun translation (D2, D3, D17, D18)

**General rule** (230 gun placements):

- One placement → one entry (S2).
- The mount type is the one the compile resolves today: the national model's first
  supported type, else the family's.
- The legacy `mount_fixed_kg` → a `PER_LOADOUT_ENTRY` quantity.
- `mount_per_barrel_kg`, the per-barrel cost and the per-barrel crew → `PER_CONTAINED_UNIT`
  on the mount.
- `gun_kg` → `PER_PART_UNIT` on the gun.

| Resolved type | `barrels: n` | Translation |
| --- | --- | --- |
| CASEMATE, BROADSIDE_BATTERY, DECK_SHIELDED, DECK_OPEN | n ≥ 1 | `mountCount: n`, mount part with `gunsPerMount: 1` |
| TURRET, BARBETTE | n ∈ {1, 2} | `mountCount: 1`, mount part with `gunsPerMount: n` |
| TURRET, BARBETTE | n ≥ 3 | **D17 battery assembly** (the nine placements below) |

**D17 — central-battery assemblies (approved).** Each placement becomes one entry with
`mountCount: 1` and `gunsPerMount: <legacy barrels>`. Its part is a `gun_mount` (interface
`gun_mount`; no new interface) representing a **grouped central-battery installation**,
for example `gun_rml_10in_18ton_central_battery_6`:

- `spec.mountType: BROADSIDE_BATTERY` (the canonical category, D18) and
  `spec.gunsPerMount: n`.
- Its installation masses and `firingArcDeg` are copied from the legacy resolved mount
  record, with copy provenance, so every calculated result is preserved.
- Its visual traits default to `battery_port` / `enclosed` / `in_hull_side` / `grouped`,
  which draws with the casemate-family assets by the approved map.
- Its `guns` slot accepts the original gun part, and the placement boundary is kept.
- The legacy fixed installation is `PER_LOADOUT_ENTRY`.
- Total guns = `1 × n` = legacy barrels.
- It does **not** claim a triple, quadruple or sextuple rotating mount.

| # | Design | Placement | Gun part | `barrels` | `mountCount` | `gunsPerMount` | Total guns | `legacyResolvedMountType` | `translationDisposition` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `redoutable_1878` (fr) | `main_fwd` | `gun_bl_274mm_m1875` | 4 | 1 | 4 | 4 | BARBETTE | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 2 | `redoutable_1878` (fr) | `main_aft` | `gun_bl_274mm_m1875` | 4 | 1 | 4 | 4 | BARBETTE | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 3 | `kaiser_1875` (de) | `main_fwd` | `gun_bl_263mm_rkl20` | 4 | 1 | 4 | 4 | TURRET | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 4 | `kaiser_1875` (de) | `main_aft` | `gun_bl_263mm_rkl20` | 4 | 1 | 4 | 4 | TURRET | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 5 | `sachsen_1878` (de) | `main_fwd` | `gun_bl_263mm_rkl20` | 3 | 1 | 3 | 3 | TURRET | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 6 | `sachsen_1878` (de) | `main_aft` | `gun_bl_263mm_rkl20` | 3 | 1 | 3 | 3 | TURRET | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 7 | `mesudiye_1875` (ot) | `main_fwd` | `gun_rml_10in_18ton` | 6 | 1 | 6 | 6 | BARBETTE | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 8 | `mesudiye_1875` (ot) | `main_aft` | `gun_rml_10in_18ton` | 6 | 1 | 6 | 6 | BARBETTE | RECLASSIFIED_AS_CENTRAL_BATTERY |
| 9 | `mesudiye_1875` (ot) | `sec` | `gun_rml_7in_7ton` | 3 | 1 | 3 | 3 | BARBETTE | RECLASSIFIED_AS_CENTRAL_BATTERY |

- **Where the provenance lives.** `legacyResolvedMountType` and `translationDisposition`
  live in the **migration report** and the codemod's source-reference metadata. They are
  not in simulation-facing content.
- **How the table was computed.** It mirrors `armamentModelFor`. The P1 harness recomputes
  it with the real resolver and fails on any difference.
- **`gunsPerMount` range.** These assemblies need values up to 6, so `gun_mount`
  `gunsPerMount` is a positive integer validated by the part's own `guns` slot, not a
  1–4 literal. Rotating mounts in content stay at 1–2.

**DQ-ARMAMENT-001 (narrowed):**

> Nine legacy placements were resolved as turret or barbette installations because the
> legacy design path selected the gun model's first supported mount type. Migration
> represents each as one multi-gun central-battery assembly. The number of guns and all
> calculated results are preserved, but detailed historical subdivision into individual
> ports, casemates, battery sections, or mount groups remains unauthored.

A later historical pass may replace an assembly with authored mount points. If that
changes mass, cost, crew, arcs, damage behaviour, footprint or any calculated result, it
goes through approved diffs.

**D18 — reclassification visibility (approved, review 4).** Combat does not read gun mount
type (verified), and the rearmament rule reads the gun **family's** default mount type, so
it is unaffected. Two identity strings do change for these nine entries:

- `CompiledArmamentMount.mountType` and `mountId`;
- the engine design version's weapon `mountType` (`phase-engine/designVersion.ts` →
  campaign state).

The report marks exactly those paths for exactly those nine entries `reclassified`, with
the disposition attached. Any other `reclassified` row, or any numeric metric that is not
`equal`, fails the gate. If any of these designs feeds a campaign golden, the re-pin is
recorded with the report attached (ADR-0136/0145); P1 determines whether it does.

**D18 constraints (owner sign-off, review 4):**

| # | Constraint |
| --- | --- |
| R1 | For the nine D17 entries only: the canonical `mountType` becomes `BROADSIDE_BATTERY`; `mountId` changes consistently with the canonical battery assembly; and the engine design-version copy of `mountType` may change accordingly. |
| R2 | Only those enumerated identity paths may be marked `reclassified`. |
| R3 | `reclassified` never applies to a numeric value. |
| R4 | Every `reclassified` row carries the old value, the new value, the affected design and placement, and `reason: DQ-ARMAMENT-001`. |
| R5 | Any other identity change is a migration failure. |
| R6 | `reclassified` is never treated as `equal`, `orderingOnly`, or an approved numeric difference; it is its own status with its own gate. |
| R7 | A campaign golden re-pin is permitted only when **every** golden difference traces to an approved R1 reclassification, with the equivalence report attached. |

**D17 acceptance checks** (per placement, in the report, gate-enforced):

- **Reported fields:** source design; placement id; legacy `barrels`; `mountCount`;
  `gunsPerMount`; derived total guns; original fixed installation contribution;
  translated fixed installation contribution; total placement mass; cost; crew;
  `legacyResolvedMountType`; `translationDisposition`.
- **Gate:** `legacy barrels = translated total guns`, **and**
  `legacy fixed installation mass = translated PER_LOADOUT_ENTRY installation mass`.

### 9.3 Torpedo translation (D13)

**Rule:** a placement with `tubes: n` becomes `mountCount: n` of the single-tube launcher
part that keeps the legacy component's id (`tube_14in_above_water`,
`tube_14in_submerged`); an absent count becomes `mountCount: 1`. All quantities use
`PER_PART_UNIT`; there is no fixed installation mass. Stowed torpedo mass stays at
3 × 300 kg per tube, and the combat torpedo model is unchanged.

**Safeguards:**

| # | Safeguard |
| --- | --- |
| T1 | An absent `tubes` translates explicitly to `mountCount: 1` (and is recorded in the table). |
| T2 | A zero, negative, fractional or non-numeric count fails translation (I-23). |
| T3 | The equivalence report includes launcher count and total launcher mass per entry. |
| T4 | No multi-tube launcher is inferred from adjacent placements (for example `tubes_p` + `tubes_s`). |
| T5 | A future multi-tube launcher is a distinct part, introduced by an approved semantic change. |
| T6 | The table below records every reference-design tube placement. |

**All 28 tube placements.** None of them uses the implicit default:

| # | File | Design | Nation | Month | Instance | Component | Zone @ station | Side | `tubes` | `mountCount` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | austria_hungary/starters | starter_dd_austria_hungary_1880 | austria_hungary | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 2 | brazil/starters | starter_dd_brazil_1880 | brazil | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 3 | france/starters | starter_protected_cruiser_fr_1880 | france | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 590 | — | 2 | 2 |
| 4 | france/starters | starter_torpedo_gunboat_fr_1880 | france | 1880-01 | tubes_p | tube_14in_above_water | SUPERSTRUCTURE @ 560 | PORT | 2 | 2 |
| 5 | france/starters | starter_torpedo_gunboat_fr_1880 | france | 1880-01 | tubes_s | tube_14in_above_water | SUPERSTRUCTURE @ 560 | STBD | 2 | 2 |
| 6 | france/starters | starter_armed_liner_fr_1880 | france | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 590 | — | 2 | 2 |
| 7 | france/starters | redoutable_1878 | france | 1880-01 | tubes | tube_14in_above_water | QUARTERDECK @ 900 | — | 2 | 2 |
| 8 | germany/starters | starter_protected_cruiser_de_1880 | germany | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 590 | — | 2 | 2 |
| 9 | germany/starters | starter_torpedoboat_de_1880 | germany | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 10 | germany/starters | starter_armed_liner_de_1880 | germany | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 590 | — | 2 | 2 |
| 11 | italy/starters | starter_dd_italy_1880 | italy | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 12 | japan/starters | starter_dd_japan_1880 | japan | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 13 | netherlands/starters | starter_dd_netherlands_1880 | netherlands | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 14 | ottoman_empire/starters | starter_dd_ottoman_empire_1880 | ottoman_empire | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 15 | portugal/starters | starter_dd_portugal_1880 | portugal | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 16 | qing/starters | starter_b_qing_1880 | qing | 1880-01 | tubes | tube_14in_above_water | QUARTERDECK @ 900 | — | 4 | 4 |
| 17 | qing/starters | starter_dd_qing_1880 | qing | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 18 | russia/starters | starter_dd_russia_1880 | russia | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 19 | spain/starters | starter_dd_spain_1880 | spain | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 20 | uk/historical | torpedo_cruiser_1880 | uk | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 21 | uk/historical | devastator_1873 | uk | 1880-01 | tubes | tube_14in_above_water | QUARTERDECK @ 900 | — | 2 | 2 |
| 22 | uk/historical | dreadnought_1875 | uk | 1880-01 | tubes | tube_14in_above_water | QUARTERDECK @ 900 | — | 2 | 2 |
| 23 | uk/starters | havock_like | uk | 1895-06 | tubes | tube_14in_above_water | QUARTERDECK @ 920 | — | 2 | 2 |
| 24 | uk/starters | majestic_like | uk | 1896-01 | tubes_a | tube_14in_submerged | FWD_SERVICE @ 190 | — | 2 | 2 |
| 25 | uk/starters | majestic_like | uk | 1896-01 | tubes_b | tube_14in_submerged | AFT_SERVICE @ 700 | — | 3 | 3 |
| 26 | uk/starters | starter_torpedo_gunboat_1880 | uk | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |
| 27 | uk/starters | alexandra_1877 | uk | 1880-01 | tubes | tube_14in_above_water | QUARTERDECK @ 900 | — | 4 | 4 |
| 28 | usa/starters | starter_dd_usa_1880 | usa | 1880-01 | tubes | tube_14in_above_water | SUPERSTRUCTURE @ 580 | — | 4 | 4 |

Every placement loads `whitehead_14in` (356 mm). The tube counts are 1–4 totals.

### 9.4 DQ-TORPEDO-001 (D14, D19)

> Migration preserves existing launcher-to-torpedo relationships even where the authored
> launcher diameter and torpedo diameter appear inconsistent. These cases are reported as
> inherited data-quality findings and are not corrected during the zero-difference
> structural migration.

**The D19 rule, applied to the data.** Legacy launchers have no per-record diameter. The
only structured torpedo diameter is the nation's
`naval-profiles/<nation>.yaml → hardCapabilities.domesticTorpedoDiameterUm`. Display names
are never parsed.

| Nation | Structured diameter | National launcher variants (of the 15) | vs `whitehead_14in` 356 mm | Disposition |
| --- | --- | --- | --- | --- |
| austria_hungary | 356000 | `ah_tube_350_aw` ("35 cm") | equal | display-name variation; no waiver; label kept in migration provenance |
| italy | 356000 | `it_tube_350_aw` ("350 mm") | equal | display-name variation; no waiver |
| japan | 356000 | `jp_tube_350_aw` ("35 cm") | equal | display-name variation; no waiver |
| brazil, netherlands, ottoman_empire, portugal, qing | 356000 | `br_tube_356_aw`, `nl_tube_356_aw`, `ot_tube_356_aw`, `pt_tube_356_aw`, `qing_tube_356_aw` | equal | none |
| uk | 356000 | `uk_tube_14in_aw_mk4`, `uk_tube_14in_sub_mk4` | equal | none |
| **france** | **380000** | `fr_tube_380mm_aw`, `fr_tube_350mm_sub` ("350 mm" label, but the structured value is 380) | **differs** | **DQ-TORPEDO-001 waiver** |
| **germany** | **450000** | `de_tube_450_aw`, `de_tube_450_sub` | **differs** | **DQ-TORPEDO-001 waiver** |
| **russia** | **381000** | `ru_tube_381_aw` | **differs** | **DQ-TORPEDO-001 waiver** |
| spain, usa | 356000 | none (base launcher) | equal | none |

- **Waivers.** There are **5 waivered launcher records**, each with `boreDiameterUm` set
  to its nation's structured value and:

  ```yaml
  legacyExceptions:
    - { code: DQ-TORPEDO-001, waives: diameterUmEqualsBore, forPart: whitehead_14in,
        note: "Structured national diameter differs from the loaded 356 mm Whitehead; preserved from legacy content." }
  ```

  There are no tolerances: 350 ≠ 356 would also be a mismatch if it were a structured
  value.
- **Affected entries.** DQ-TORPEDO-001 occurs on the **9** tube entries of French,
  German and Russian designs, where `catalogueForNation` overlays the national variant
  today: France rows 3–7, Germany rows 8–10, and Russia row 18 of §9.3. The P1 harness
  verifies the overlay mapping.
- **Later correction** needs an approved diff covering availability, cost, mass,
  ammunition capacity, combat performance, the affected designs, and AI and order
  eligibility.

---

## 10. Equivalence-test strategy

### 10.1 Compared metrics

These are unchanged from rev 2: displacement and ledger, hull and classification,
machinery, armament (per weapon and the full `CompiledArmamentMount`), protection,
stability and systems, cost and construction, the findings multiset, and engine-facing
outputs.

### 10.2 Report (`ship-part-migration-equivalence/1`)

```json
{
  "schema": "ship-part-migration-equivalence/1",
  "phase": "P2",
  "baseline": { "pipeline": "legacy", "contentHash": "…" },
  "candidate": { "pipeline": "parts", "contentHash": "…" },
  "tolerances": "tolerances.json#v1",
  "coverage": { "designs": 91, "placements": 823, "gunPlacements": 230, "torpedoPlacements": 28,
                "centralBatteryPlacements": 9, "nationalLauncherVariants": 15, "legacyWaivers": 5 },
  "summary": { "metrics": 0, "equal": 0, "withinTolerance": 0, "orderingOnly": 0, "reclassified": 0, "changed": 0 },
  "designs": [
    {
      "id": "mesudiye_1875",
      "metrics": [
        { "path": "displacement.totalKg", "baseline": 0, "candidate": 0, "delta": 0, "tolerance": 0, "status": "equal" },
        { "path": "armament.main_fwd.mountType", "design": "mesudiye_1875", "placement": "main_fwd", "baseline": "BARBETTE", "candidate": "BROADSIDE_BATTERY", "status": "reclassified", "reason": "DQ-ARMAMENT-001", "disposition": "RECLASSIFIED_AS_CENTRAL_BATTERY" }
      ],
      "entries": [
        {
          "legacyPlacement": "main_fwd", "part": "gun_rml_10in_18ton_central_battery_6",
          "legacyBarrels": 6, "mountCount": 1, "gunsPerMount": 6, "containedUnits": 6,
          "legacyResolvedMountType": "BARBETTE", "translationDisposition": "RECLASSIFIED_AS_CENTRAL_BATTERY",
          "fixedInstallation": { "legacyKg": 0, "translatedKg": 0, "basis": "PER_LOADOUT_ENTRY" },
          "quantities": [
            { "id": "fixed_installation", "kind": "massKg", "value": 0, "basis": "PER_LOADOUT_ENTRY", "multiplier": 1, "contribution": 0 },
            { "id": "per_gun_installation", "kind": "massKg", "value": 0, "basis": "PER_CONTAINED_UNIT", "multiplier": 6, "contribution": 0 }
          ],
          "totals": { "massKg": 0, "costMicro": 0, "crew": 0 }
        }
      ]
    }
  ],
  "dataQuality": [
    { "code": "DQ-TORPEDO-001", "design": "starter_torpedoboat_de_1880", "entry": "tubes", "launcher": "de_tube_450_aw", "boreUm": 450000, "torpedo": "whitehead_14in", "torpedoUm": 356000, "status": "inherited" },
    { "code": "DQ-ARMAMENT-001", "design": "mesudiye_1875", "entry": "main_fwd", "status": "inherited" }
  ]
}
```

The zeros are placeholders for the shape only.

- **Every metric is listed,** including zero differences.
- **`entries`** expose S5. For launchers they expose launcher count and total launcher mass
  (T3); for the nine D17 entries, every field in §9.2.
- **`dataQuality`** is separate from differences.
- **`reclassified`** is valid only on the D18 identity paths of the nine D17 entries, never on
  a number, and each row carries old value, new value, design, placement and
  `reason: DQ-ARMAMENT-001` (R1–R6).
- **`orderingOnly`** is valid only on declared unordered paths, with multiset equality.
- **Tolerances** are 0 for integer metrics.

### 10.3 Gates

- **Structural:** 91/91 designs and 823/823 placements decode and compile; every one of the
  28 tube placements, 9 central-battery placements, 15 national launcher variants and
  5 waivers appears in the report (`coverage` must match exactly).
- **Semantic:**
  - `changed` = 0.
  - Every `reclassified` row is a D18 path of a D17 entry.
  - Every `orderingOnly` row is on a declared path.
  - The D17 equalities hold: `legacy barrels = total guns`, and the legacy fixed
    installation equals the translated `PER_LOADOUT_ENTRY` installation.
  - Every torpedo entry has `mountCount = legacy tubes`.
- **Determinism:** the report is byte-identical across runs and processes.
- **Campaign:** goldens are unchanged, or there is a recorded re-pin whose every difference
  traces to an approved R1 reclassification, with the report attached (R7).
- **Codemod property test:** generated legacy drafts satisfy `mountCount × gunsPerMount =
  barrels`, one entry per placement, and input validation (I-23).
- **Fixtures:** the P1/P2 test suite pins the coverage numbers above (91, 823, 230, 28, 9,
  15, 5). A content change that moves them fails until the fixture is deliberately updated.

### 10.4 Intended changes

P7 basis changes, authored slots and DQ corrections go through `approved-diffs.json` entries
with owner sign-off. Unmatched changes fail.

---

## 11. Decision status and P1 authorisation

| Item | Status | Blocks |
| --- | --- | --- |
| Option C, quantity semantics, bases S1–S8, `interfaces/1`, save policy, torpedo translation T1–T6, boundaries, sequencing | Approved | — |
| D17 battery-assembly translation; DQ-ARMAMENT-001 narrowed | Approved (review 3) | — |
| D19 diameter rule; DQ-TORPEDO-001 scope (5 waivered records, 9 affected entries) | Approved; scope confirmed (review 4) | — |
| D18 `reclassified` status for the nine D17 identity paths, with R1–R7 | Approved (review 4) | — |
| **D16 exact definitions (§8.2)** | **Architecture approved; definitions awaiting review** | **INC-4 and P6 only** |
| Constraint-key and legacy-exception vocabularies (§3.9) | Proposed | P1 schemas (closed; extendable by rule) |
| Engine behaviour classes and classification predicates | Proposed | P3 |
| `CompiledTorpedo` fields | Proposed | P4 |
| D9, D10 | Defaults | — |
| D11, basis changes, authored slots, DQ corrections | Deferred | P7 |

**P1 is authorised now (owner review 3).** Its scope:

- the new read path over current content;
- canonical compilation;
- indexes and pure queries;
- the equivalence harness;
- the baseline `migration-equivalence.json`;
- migration provenance and diagnostics;
- tests for the 91 reference designs.

**P1 must not:**

- rewrite production content;
- bump the save compatibility version;
- change save files;
- change visual YAML;
- alter simulation results;
- silently normalise questionable historical data.

**P2 runs only after** P1 establishes a passing baseline whose translation diagnostics
cover all 91 designs, 823 placements, 28 tube placements, 9 central-battery placements, 15
national launcher variants and the 5 enumerated waivers. **No design decision blocks P2.**

## 12. Recommended implementation order (no production code in this step)

1. **Owner:** review the exact D16 definitions (INC-4 gate only). D18 and the D19 scope are approved.
2. **`/to-spec`** on this revision, in the environment where the skill is available, to
   produce the implementation spec and tickets.
3. **P1** (authorised): schemas, flatten, `PartIndex`, queries, the adapter over current
   content, the equivalence harness, and the baseline report with full coverage.
4. **P6** after D16: trait rename, adapter, I-14 test, then INC-4.
5. **P2:** codemod (§9.2–9.4), save-version bump, offline dev migrator; gate as §10.3.
6. **P3** ship types, then **P4** torpedoes, each with its own report.
7. **P5** retire legacy.
8. **P7** authored slots, basis changes, DQ corrections; approved diffs.

---

## 13. Risks and trade-offs

- **Artifact hash churn.** The derived-metric report is the acceptance evidence, and the
  re-pin is recorded.
- **`PER_LOADOUT_ENTRY` is legacy preservation, not physics.** That is stated in the
  model, visible per entry and changeable only by approved diff (S7).
- **Entry boundaries matter to mass.** Tools must treat split and merge as semantic (S4).
  The workspace shows the mass effect before applying.
- **Players lose incompatible saves at P2** (D12). There is no released save today
  (ADR-0113); the bump is announced in the changelog.
- **Inherited data issues are carried, not fixed** (DQ-TORPEDO-001, DQ-ARMAMENT-001). They
  are visible in the report and corrected later by approved diff.
- **Closed vocabularies need schema changes to grow.** This is intended.
- **Shared-index commits on `dev`.** P2 is one large commit; stage it by explicit pathspec
  with an index guard.

---

## 14. Decision record (draft ADR, revision 4)

> File as `docs/adr/ADR-NNNN-platforms-slots-parts.md` with the P1 implementation spec (all P2 decisions are approved).

**Title:** One part model for ships: platforms declare slots, parts plug in through stable
interfaces, quantities and their application bases are explicit, time is a lifecycle with
revisions.

**Status:** Proposed.

- **Approved by the owner (2026-10-13):** the architecture; `interfaces/1`; application
  bases; the save policy; the torpedo translation; DQ-TORPEDO-001 and the D19 rule; the
  D17 battery translation; the D16 architecture.
- **Also approved (review 4):** D18 reclassification (R1–R7) and the DQ-TORPEDO-001 scope.
- **Pending:** the exact D16 definitions (visual work only).

**Context.**

- Ship parts are authored in seven shapes with six time encodings.
- Guns exist two or three times.
- Hull forms lack mount points.
- `barrels` has two meanings, and the fixed installation mass is charged per placement.
- Mount type cannot be chosen, so nine central-battery placements resolve as 3–6-gun
  turrets and barbettes.
- Armour materials are balance keys.
- Torpedoes and ship types live in code.
- Three nations' structured torpedo diameters (380, 450 and 381 mm) disagree with the
  356 mm torpedo their launchers fire.
- `upgradePath` is never read.

The 1880 content has 91 reference designs with 823 placements (230 guns, 28 torpedo
tubes).

**Decision.**

1. **Parts.** Every fittable thing is a part: one strictly decoded YAML record with a
   family, one provided interface from `interfaces/1` (14 exact tokens; attributes are
   constraints), a lifecycle, dated revisions, an optional one-level same-family
   prototype, nested slots, quantity components with explicit application bases, optional
   visual metadata, and provenance. Engineering dimensions come only from structured
   fields, never from display names.
2. **Platforms and slots.** Platforms declare slots: interfaces, `mountCount` bounds,
   placement, nominal arc, and closed constraints. Armour materials are accepted by
   armour-region slots.
3. **Loadouts and quantities.** A loadout of entries replaces placements, the plant id and
   armour materials. `mountCount` and `gunsPerMount` each have one meaning; contained units
   are derived; `barrels` is retired.
4. **Application bases.** Quantities apply `PER_LOADOUT_ENTRY`, `PER_PART_UNIT` or
   `PER_CONTAINED_UNIT`, always explicit. The legacy gun fixed installation is
   `PER_LOADOUT_ENTRY` (legacy preservation). Entry boundaries are semantic. Changing a
   basis needs an approved diff.
5. **Central batteries.** Legacy central-battery placements migrate as one grouped battery
   assembly each (`mountCount: 1`, `gunsPerMount: n`, canonical mount type
   `BROADSIDE_BATTERY`). The legacy turret/barbette resolution survives only as migration
   provenance, and the identity-string change is reported as `reclassified`.
6. **Time.** Availability, `requires`, revisions and `supersedes`. Refit compatibility
   comes only from slots and constraints.
7. **Ship types and torpedoes.** Ship types are content referencing closed engine classes.
   Torpedoes are parts with single-tube launchers. Combat keeps every algorithm.
8. **Rendering** uses `visual-traits/1` (derived traits with documented overrides; the
   contradictions fail the visual compile), with precedence override → trait → interface
   family → missing-asset glyph. Visual metadata never reaches simulation.
9. **Saves.** Compatibility is decided before deserialisation. Incompatible saves are
   refused, never translated. The version is bumped at P2.
10. **Migration** is phased (P0–P7) and accepted only on structural and semantic
    equivalence with full coverage. The report lists every value, every entry's bases, the
    D17 and D18 dispositions, and inherited data-quality findings (DQ-TORPEDO-001,
    DQ-ARMAMENT-001) separately from differences.

**Consequences.**

- One mechanism covers nine part families, platforms and ship types.
- Mass application is auditable.
- Legacy misclassifications and national data inconsistencies are visible, preserved and
  correctable later by approved diff.
- Old saves stop loading at P2.
- New code: flatten, revisions, fit validation, basis-driven derivations, the equivalence
  harness, the dev save migrator, the queries, `CompiledTorpedo`, and the visual compile
  stage.
- `ComponentDef`, `componentVariants`, the profile overrides, the adapter, `upgradePath`
  and the combat torpedo constants retire.
- ADR-0148 keys are renamed to visual traits by an explicit map.

**Glossary (proposed `CONTEXT.md` additions; not edited by this proposal):**

- Part
- Part family
- Interface
- Constraint
- Platform
- Slot
- Assembly
- Loadout entry
- `mountCount`
- `gunsPerMount`
- Contained units
- Application basis
- Battery assembly
- Lifecycle
- Revision
- Prototype
- Engine behaviour class
- Visual trait
- Data-quality finding
- Translation disposition

The definitions are as in §3.1. The additions are:

- **Battery assembly:** a `gun_mount` part representing a grouped central-battery
  installation.
- **Translation disposition:** a migration-provenance label for a reclassified legacy
  placement.
