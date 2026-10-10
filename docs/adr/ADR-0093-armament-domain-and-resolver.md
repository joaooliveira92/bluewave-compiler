# ADR-0093: Authoritative armament domain and resolver (national armament integration, Step 1)

## Status

Accepted 2026-10-10. Extends ADR-0089 (national naval profiles) and ADR-0092 (national content
pipeline). This is Step 1 of the national armament integration plan: an **additive, production-ready**
armament domain and resolver with no gameplay behaviour change.

## Context

National armament is authored today in three places that do not share a type:

- `content/production/1880/ship-building/components.yaml` — shared gun/mount families (`ComponentDef`),
  with mount mass and gun attributes as formulas.
- `content/production/1880/ship-building/naval-profiles.yaml` — per-nation `GunModelDef` overlays,
  `AmmunitionPatternDef` patterns and `ComponentVariantDef` variants (`NationNavalProfile`).
- `packages/ship-design/src/componentVariants.ts` / `compileStages.ts` / `weapons.ts` — the compile
  path that merges the two into a `ComponentDef`, then into a `GunMount`/`WeaponsResult`.

Combat (`packages/combat/src/gunnery`) carries only abstract `gunDefinitionId`/`mountDefinitionId`
strings and an `AMMUNITION_TYPES` enum; it never sees the gun, mount or ammunition data. So gun/mount
and ammunition compatibility, dates, technology, national access and numeric ranges are enforced only
where they happen to be checked in the ship-design compile — never as a single authoritative contract.

The plan is to make one pure resolver authoritative for both consumers. Before this pass, the
inspection recorded:

- **Package boundaries.** `content-schema` (layer 2) owns the naval-profile Zod schema; `ship-design`
  (layer 3) owns `ComponentDef`/`NationNavalProfile` and the compile; `combat` (layer 6) depends on
  `contracts`, `deterministic`, `diagnostics`, `campaign`, `random`, `events` — **not** on
  `ship-design`. There is no neutral armament package. `contracts` (layer 0) is brands/checked
  arithmetic; `deterministic` (layer 1) is canonical serialisation and fixed-point math.
- **Current representations.** `GunModelDef` (id, familyId, designation, bounded `overrides`,
  `mounts: MountType[]`, introduction/obsolete months, provenance); `AmmunitionPatternDef` (id,
  pattern, `penetrationBiasBp`, provenance); `ComponentVariantDef`; `ComponentDef` gun fields as
  formula strings (`attributes.caliberUm`, `shellMassG`, `chargeBp`, `roundVolumeMl`, `rofBaseX100`,
  `beamArcDeg`, `maxFeedPermille`) and constants (`gun_kg`, `mount_per_barrel_kg`, `mount_fixed_kg`).
  There is no separate mount catalogue and no authored barrel length, muzzle velocity, gun
  reliability, traverse/elevation, top-weight, crew protection or ammunition effect data.
- **Arithmetic.** `@bluewave/contracts` brands `SafeInt` with explicit rounding; `@bluewave/ship-design`
  `units.ts` scales bp with a bigint intermediate and half-up rounding; `weapons.ts` uses bigint with
  a single ceiling. Combat's `rateOfFire.ts` retains an exact bigint rational and rounds once.
- **Provenance.** `Provenance` (`sourceStatus | confidence | kind | sources | derivation | note`) is
  defined in `ship-design`'s `nationProfile.ts` and mirrored in `content-schema`'s
  `naval-profile-vocab.ts`; `lintNavalArms` and `validateNavalProfiles` reject `PLACEHOLDER` and
  missing sources at release.

## Decision

1. **A new neutral package, `@bluewave/armament` (layer 1).** It depends only on `@bluewave/contracts`
   and carries no React, Electron, Node filesystem, campaign-state or persistence dependency. It is
   placed at layer 1 (below `content-schema`, `ship-design` and `combat`) so any of them may depend on
   it and none of them has to depend on another for armament resolution.

   Dependency direction:

   ```
   content-schema ─┐
   ship-design ────┼──► @bluewave/armament ──► @bluewave/contracts
   combat ─────────┘
   ```

2. **An additive domain model** (`ids.ts`, `provenance.ts`, `model.ts`): branded ids
   (`GunFamilyId`, `GunModelId`, `GunMountId`, `AmmunitionId`, `ArmamentTechnologyId`,
   `ArmamentNationId`); `GunFamily`, `GunModel`, `GunMountDef`, `AmmunitionPattern`,
   `ArmamentTechnologyContext`, `ArmamentAccessContext`, `ResolvedArmament`,
   `ArmamentResolutionFinding`, `ArmamentResolutionResult`. Every numeric field names its unit.
   Fields current content cannot populate are optional and carry no default: absent means **unknown**,
   never a plausible-looking historical value.

3. **One pure resolver** `resolveArmament(gunModel, mount, ammunition, technologyContext, accessContext)`.
   It verifies canonical ids and references, gun-family/mount compatibility, ammunition compatibility,
   introduction/retirement dates, required technology and national component access; validates numeric
   ranges; composes the mount and ammunition modifiers deterministically; and returns
   `ResolvedArmament` only when no `BLOCKING` finding exists. It contains no nation-id conditional:
   national difference enters only through the access context data.

4. **Deterministic integer arithmetic** (`arithmetic.ts`): basis points are integers with 10_000 = 1.0.
   Modifiers compose as an exact bigint product (`Π factors / 10_000^(n-1)`) rounded **once**, half up;
   the round's unit mass scales the same way. No float ever enters a resolved value. Findings are
   ordered by severity, rule code, entity, field and parameters, so repeated resolution is
   byte-equivalent.

5. **Expected-error vs invariant-error policy.** Expected invalid content or combinations (bad ids,
   unknown references, incompatibility, date/tech/access failures, out-of-range numbers) are returned
   as **structured findings**, never thrown. Exceptions are reserved for corrupt internal invariants
   only (e.g. arithmetic overflow in `composeBpMultipliers`). Finding severities: `BLOCKING` (the
   combination is not legal), `WARNING` (legal but notable, e.g. imported/captured access), `ADVISORY`
   (content quality, e.g. `PLACEHOLDER` provenance).

6. **A narrow compatibility adapter** (`packages/ship-design/src/armamentAdapter.ts`). It maps a shared
   `ComponentDef` family + a national `GunModelDef` + `AmmunitionPatternDef` + `NationNavalProfile`
   into the domain types and can resolve them (`resolveArmamentFromContent`). It preserves content
   unchanged, invents no defaults, changes no compile/construction/candidate/combat behaviour, and
   reports every domain field it cannot yet map in `ARMAMENT_ADAPTER_UNMAPPED_FIELDS`. It is a
   temporary bridge, not a second authoritative representation.

7. **This pass changes no gameplay behaviour.** It does not replace `compileWeaponSet`, alter design
   weights/costs/stability, change combat gunnery/penetration/damage/fires/reliability, modify
   candidate scoring, migrate the 18 starter designs, change Drawing Board behaviour or save formats,
   remove legacy gun/mount fields, update historical values, add nations or weaken validation. No
   runtime output, deterministic hash or campaign behaviour changes.

## Alternatives considered

- **Put the resolver in `ship-design`.** Rejected: `combat` does not depend on `ship-design`
  (ADR-0001), and the brief forbids making combat depend on ship-design merely for armament
  resolution. A shared package is the only boundary that lets both consume it independently.
- **Put the resolver in `contracts` or `deterministic`.** Rejected: `contracts` is the brands/checked-
  arithmetic root and `deterministic` is serialisation/fixed-point math; a full armament domain in
  either would bloat a leaf primitive. A narrowly scoped package keeps the layer map honest.
- **Put the resolver in `content-schema`.** Rejected: the resolver is domain logic, not schema
  validation, and `content-schema` is a schema-only layer that `ship-design` already depends on.
- **Reuse ship-design's `Provenance` type.** Rejected: it would invert the dependency direction
  (armament would import ship-design). The vocabulary is duplicated and pinned by a parity test in
  `ship-design`.
- **Invent the missing fields (barrel length, muzzle velocity, reliability, …).** Rejected: content is
  researched, not invented; the model supports the fields and the adapter reports them unmapped.

## Staged migration plan (subsequent work, not this pass)

1. **Content migration and armament lint gate** — author first-class armament content (mount
   catalogue, gun/ammunition fields) and add a release lint gate over the resolver's findings.
2. **Ship-design cut-over** — `compileWeaponSet`/`catalogueForNation` resolve through the armament
   domain; retire the compatibility adapter.
3. **Combat cut-over** — combat batteries consume `ResolvedArmament` instead of abstract ids.
4. **Starter and persistence migration** — starter designs and saved designs carry armament ids.
5. **Drawing Board integration** — the design UI presents armament resolution and findings.

## Consequences

- A new workspace package (`@bluewave/armament`) is added to the package-graph layer map, the
  ambient-input domain audit, and the root `tsconfig.json` references (ADR-0001).
- `ship-design` gains a runtime dependency on `@bluewave/armament`; `combat` gains a **devDependency**
  on it plus a contract test proving independent consumption. No other package changes.
- `pnpm-lock.yaml` changes; no save or wire format changes; no golden hash changes.
- Deferred (recorded, not dropped): every field listed in `ARMAMENT_ADAPTER_UNMAPPED_FIELDS`, and the
  five migration steps above.

---

## Addendum: Step 2 — content migration and armament lint gate (2026-10-10)

Step 2 is complete. It remains **additive**: the legacy ship-design and combat paths are untouched
and still authoritative for gameplay.

### Decision

1. **First-class authored armament content.** Four separately authored collections live under
   `content/production/1880/ship-building/armament/`:
   - `gun-families.yaml` — 25 shared physical/technical families, one record per `components.yaml`
     gun family (never duplicated per nation);
   - `gun-models.yaml` — national models that reference a shared family (the 16 legacy profile models
     plus thin availability models for families a nation fields directly);
   - `gun-mounts.yaml` — the mount catalogue, one form per required `(family, mount type)`;
   - `ammunition.yaml` — national shell patterns (British Palliser/CPC, French Melinite/APC, German
     Krupp AP/HE) as content, never runtime nation conditionals.

   The content-schema layer owns the Zod schemas (`packages/content-schema/src/armament.ts`). Every
   numeric field names its unit (`caliberUm`, `gunMassKg`, `shellMassG`, `...Bp`, `...KgM`,
   `...Litre`, `...Mm`, `...Deg`); each object is `.strict()`, so an ambiguous field (`weight`,
   `speed`, `rate`, `range`, `size`) is rejected. The model distinguishes VERIFIED, DERIVED,
   ESTIMATE, BALANCE_TARGET and PLACEHOLDER provenance; release content carries none of the last.

2. **One authoritative release validator, `lintArmament`.** It lives in the neutral package
   (`packages/armament/src/lint.ts`), is pure and deterministic, and validates canonical/unique ids,
   references, gun-family/model consistency, mount-family compatibility, ammunition compatibility,
   explicit units, safe numeric ranges, introduction/retirement ordering, technology references,
   national references, provenance completeness, no release PLACEHOLDER, duplicate contradictory
   values, and deterministic finding order. A release fails on any `BLOCKING` finding; `WARNING` and
   `ADVISORY` findings stay visible and are never promoted to blockers.

3. **A thin ship-design wrapper, `lintArmamentContent`.** It builds the domain catalogue, runs
   `lintArmament`, adds the **legacy-compatibility drift checks** while both representations
   coexist, and proves every armament combination used by the 18 opening reference designs resolves
   without a blocking finding. It is integrated into the national completeness release gate
   (`validateArmamentContent`, called by `validateAllNations`); only `BLOCKING` findings become
   completeness issues, so non-blocking findings remain visible without being promoted.

4. **Temporary compatibility fields and drift checks.** `components.yaml` and `naval-profiles.yaml`
   remain authoritative for runtime gameplay until the Step 3 cut-over. The release gate fails if the
   authored armament content drifts from them: a mount's base/per-gun mass must equal the family's
   `mount_fixed_kg`/`mount_per_barrel_kg`; a model's caliber/mass/charge/volume/rate and its shell
   mass (against the national overlay) must match; a mount's firing arc must match `beamArcDeg`; an
   ammunition pattern's shell type and penetration bias must match the legacy pattern. Legacy gun
   models with no first-class counterpart are recorded as `ADVISORY`, never silently dropped.

### Consequences

- New content files and schemas; no package dependency changes; no `pnpm-lock.yaml` change.
- No gameplay, compiled-ship, combat, persistence or golden-hash change. The new content is loaded
  and validated by the release gate, not by the runtime compile.
- The migration boundary is unchanged: **Step 3** cuts ship design over to `ResolvedArmament`
  (`compileWeaponSet`/`catalogueForNation`) and retires the compatibility adapter and the duplicated
  compatibility fields; **Step 4** cuts combat over. Compatibility fields may not be removed before
  their consumers migrate.
