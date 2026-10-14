# 03: Gun and mount read path over today's content (P1 tracer)

**Type:** implementation
**Status:** resolved
**Blocked by:** 02
**Frontier:** no
**Requirements:** SPM-R3, SPM-R6, SPM-R13, SPM-R14, SPM-R16, SPM-R19, SPM-R20 (gun rows, in memory only) · Stories 1, 25, 26, 33, 36

## What to build

The first end-to-end path. An in-memory **adapter** reads today's armament catalogue,
national gun overrides and component variants as gun and gun-mount **parts**. It reads
hull forms as **platforms** with **compatibility slot templates**: one slot per zone and
interface, accepting whatever is allowed today. It reads each reference design's gun
placements as **loadout entries**. The ship-design package compiles those entries through
**basis-driven** quantities and feeds them to the existing armament resolver. This
produces the same `ResolvedArmament` and compiled weapon contract that the legacy path
produces today.

- Gun translation follows §9.2:
  - single-gun mount types → `mountCount: barrels`, `gunsPerMount: 1`;
  - a turret or barbette with 1–2 barrels → `mountCount: 1`, `gunsPerMount: barrels`;
  - the legacy fixed installation → `PER_LOADOUT_ENTRY`; per-barrel terms →
    `PER_CONTAINED_UNIT` on the mount; gun mass → `PER_PART_UNIT` on the gun.
- The nine central-battery placements become battery assemblies (D17), and their legacy
  resolved type and `RECLASSIFIED_AS_CENTRAL_BATTERY` disposition go into migration
  provenance only.
- The compiled entry keeps the part id, the revision, the source file, `mountCount`,
  `gunsPerMount`, contained units, and each quantity's basis, multiplier and contribution.
- P1 limits (SPM-R19): no content rewrite, no save-version bump, no change to visual YAML,
  and the production path stays on the legacy pipeline.

## Acceptance criteria

- [ ] For all 91 reference designs (230 gun placements), the read path's
      `ResolvedArmament` and compiled weapon contract are byte-identical to the legacy
      path. The only exceptions are the D18 identity paths (`mountType`, `mountId`) of the
      nine D17 entries.
- [ ] A hand-worked example checks each basis multiplier: 1, `mountCount`, and
      `mountCount × gunsPerMount`, with a nested entry's part units equal to its parent's
      contained units.
- [ ] For each of the nine, `legacy barrels = mountCount × gunsPerMount` and the legacy
      fixed installation equals the translated `PER_LOADOUT_ENTRY` installation.
- [ ] No calculation infers a basis from the family; a test with a deliberately unusual
      basis proves it.
- [ ] Production content, saves, visual YAML and every golden are unchanged.

## Comments

- 2026-10-13: Implemented. `packages/ship-design/src/partReadPath.ts` adds the P1 gun
  slice, and `test/partReadPath.test.ts` (7 tests) covers it.
  - **Adapter (SPM-R19).** `buildGunPartModel` reads today's gun families and national
    models/variants through `armamentModelFor` as `gun` parts; `buildGunMountPart`
    reads the legacy resolved mount as a `gun_mount` part; `buildCompatibilitySlots`
    reads hull forms as **platforms** with one compatibility **slot per zone** accepting
    `gun_mount`, and each mount part carries its own `guns` slot (count =
    `gunsPerMount`). These are intermediate in-memory shapes mirroring SPM-R1/R3; the
    strict `@bluewave/content-schema` part schemas land with authored content in P2.
  - **Translation (SPM-R20, §9.2).** One placement → one mount loadout entry in its zone
    slot with a nested `guns` entry: single-gun types → `mountCount: n`,
    `gunsPerMount: 1`; turret/barbette 1–2 → `mountCount: 1`, `gunsPerMount: barrels`;
    the nine ≥3-barrel central-battery placements → a canonical
    `<family>_central_battery_<n>` battery assembly (`mountType: BROADSIDE_BATTERY`),
    masses and arc copied from the legacy resolved mount, legacy type + disposition in
    migration provenance only.
  - **Derivations (SPM-R13/R14).** `basisMultiplier`/`quantityLines` are pure over the
    declared basis and the entry counts (1, `mountCount`, `mountCount × gunsPerMount`);
    a nested entry's part units equal its parent's contained units; a deliberately
    unusual basis proves no inference from the family.
  - **Resolver (SPM-R16).** `resolveGunPlacementThroughParts` rebuilds the armament
    inputs from the parts and feeds the existing `resolveArmament`, so `ResolvedArmament`
    and the compiled weapon contract are byte-identical to the legacy path for every
    placement except the D17 identity paths. Test: all 230 gun placements across 91
    designs translate, `mountCount × gunsPerMount = legacy barrels` everywhere, and the
    68 placements whose legacy path resolves are byte-identical except the D17
    `mountType`/`mountId`.
  - **Deviation (recorded).** The ticket's "230 placements byte-identical, nine D17
    exceptions" is literally satisfied, but only 68 placements (france/germany/uk, the
    nations with first-class armament content) produce a `ResolvedArmament` in the legacy
    compile; the other 162 use the documented compatibility path and produce none, so
    the read path mirrors that (`useFirstClassArmament`) and emits none. Only six of the
    nine D17 placements resolve (the three Mesudiye/Ottoman entries fall on the
    compatibility path) — the translation still reclassifies all nine.
  - Additive: no production content, save, visual YAML or golden change (the read path
    is not wired into the production pipeline). Two-axis review returned no hard
    violations; fixes taken — the platform/slot adapter the ticket's *What to build*
    names, the test's unnecessary cast and hand-rolled `gunKey`, and sort comparators.
    Judgement calls kept: bare `Error` (package precedent) and the omitted
    `hullSpaceUsageLitre` on the mount round-trip (absent from SPM-R1 and from today's
    mounts).
- Handed to ticket 04 (torpedo launchers), 05 (remaining families, incl. ammunition
  parts and `hullSpaceUsageLitre` if content ever authors it) and 06 (fit validation
  over these compatibility slots).
- 2026-10-13 (review of `2e6b570a`, follow-up): the logic and the 68 byte-identical
  comparisons held. Findings and fixes:
  - **Parallel models, not the strict schemas (fixed).** The adapter emitted its own
    `SlotData`/`PlatformData`/`PartInterface`/`PartQuantity` shapes, with names that
    shadowed content-schema's. Gun parts carried `familyId`, `resolvedMountType` and an
    always-present `nation`, and could not satisfy `FlattenedPartSchema` (no `origin`,
    `revisions` or `provides`). It now emits `FlattenedPart`, `LoadoutEntryData`,
    `PlatformData` and `SlotTemplateData`, typed by `import type` from content-schema
    (now a dependency; there is still no runtime import, a test guards that, and
    ADR-0001 records it). Legacy facts live on adapter side records. The tests decode
    every part, entry, per-design loadout, template and platform unchanged through the
    real schemas.
  - **Availability boundary (fixed).** `availableUntil` was copied from the inclusive
    `retirementMonth` with no shift. It is now `retirementMonth + 1`, and the round trip
    back to the resolver subtracts one (`partLifecycle.ts`). There was no observable
    effect, because no gun content sets a retirement month today. A test retires a French
    model at 1885-06 and checks that both pipelines accept 1885-06 and block 1885-07.
  - **Silent non-resolution (fixed).** Unknown models were skipped, a missing ammunition
    pattern returned `null` with no findings, and a missing mount threw. Every placement
    now yields exactly one of `resolved` or `unresolved` (`UnresolvedGunPlacement`: design,
    placement, nation, family, parts, code, sorted BLOCKING codes, message), and unread
    requests are kept in `GunPartModel.unread`. All 162 unresolved placements are
    `PART_READ_PATH_NO_FIRST_CLASS_ARMAMENT`: the 11 nations with no authored gun models
    or ammunition. No France/Germany/UK placement is blocked by ammunition or the resolver.
  - **Cost was not carried (fixed).** Only mass quantities existed. Following §9.2,
    `gun_cost` (`gun_kg × cost_per_kg_micro`) is now `PER_PART_UNIT` on the gun and
    `mount_cost_per_gun` (`mount_cost_micro`) is `PER_CONTAINED_UNIT` on the mount. For
    all 230 placements, the basis-driven mass and cost equal the legacy component formula.
  - **Slots and determinism (fixed).** One shared template listed every zone of every
    hull. Now there is one slot per zone and interface (`<zone>.<interface>`): the
    templates hold the zones every hull shares, and per-platform slots hold the rest, so
    no platform offers a zone it lacks. Hull zones are narrowed to the closed zone list,
    and part, platform and template order is codepoint-sorted and independent of input order.
  - **Split for cohesion.** `partLifecycle.ts`, `partQuantities.ts`, `partCompatibility.ts`,
    `gunPartAdapter.ts`, `partReadPath.ts`. The tests are now `partReadPath.test.ts` (23)
    and `partBoundary.test.ts` (11) and use no non-null assertions.
  - **Latent legacy off-by-one (reported, not changed).** `armamentModelFor`'s fallback
    copies a component's exclusive `obsoleteMonth` into the inclusive `retirementMonth`.
    There is no effect today, because every `obsoleteMonth` is null. Fixing it changes
    legacy behaviour, so it needs its own approved change.
